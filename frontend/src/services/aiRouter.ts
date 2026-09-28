/**
 * Aurikrex Universal Multi-LLM Router & Anti-Truncation Engine
 * 
 * Solves output token truncation, text break-offs, rate limits, and service downtime
 * by seamlessly routing between free high-output models with automatic fallbacks.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface RouterConfig {
  mistralKey?: string;
  orcaKey?: string;
  nvidiaKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  provider: string;
  model: string;
  content: string;
  reasoning?: string;
  usage?: Record<string, number>;
  finishReason?: string;
}

const DEFAULT_KEYS = {
  mistral: (import.meta as any).env?.VITE_MISTRAL_API_KEY || '',
  orca: (import.meta as any).env?.VITE_ORCAROUTER_API_KEY || '',
  nvidia: (import.meta as any).env?.VITE_NVIDIA_API_KEY || '',
};

export class AIRouter {
  private mistralKey: string;
  private orcaKey: string;
  private nvidiaKey: string;

  constructor(config?: RouterConfig) {
    this.mistralKey = config?.mistralKey || DEFAULT_KEYS.mistral;
    this.orcaKey = config?.orcaKey || DEFAULT_KEYS.orca;
    this.nvidiaKey = config?.nvidiaKey || DEFAULT_KEYS.nvidia;
  }

  /**
   * Primary entry point: Generates completions without text cutoffs.
   * Auto-routes and falls back across providers if rate limits or errors occur.
   */
  async generateCompletion(
    messages: ChatMessage[],
    options?: {
      taskType?: 'fast_chat' | 'deep_reasoning' | 'vision' | 'ultra_long';
      maxTokens?: number;
      temperature?: number;
      onChunk?: (text: string) => void;
    }
  ): Promise<LLMResponse> {
    const task = options?.taskType || 'fast_chat';
    const targetMaxTokens = options?.maxTokens || 16384;

    // Define provider fallback cascade based on task requirements
    const executionPlan = this.getExecutionPlan(task);

    let lastError: Error | null = null;

    for (const step of executionPlan) {
      try {
        const response = await this.executeStep(step, messages, targetMaxTokens, options?.temperature ?? 0.7, options?.onChunk);
        
        // Anti-truncation auto-continuation check:
        if (response.finishReason === 'length') {
          const continuedContent = await this.autoContinue(step, messages, response.content, targetMaxTokens);
          response.content += continuedContent;
        }

        return response;
      } catch (err: unknown) {
        console.warn(`[AIRouter] Provider ${step.provider} (${step.model}) failed. Falling back to next...`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error('All AI Providers failed to generate response.');
  }

  private getExecutionPlan(taskType: string) {
    switch (taskType) {
      case 'deep_reasoning':
        return [
          { provider: 'orca', model: 'deepseek/deepseek-v4-flash-free', url: 'https://api.orcarouter.ai/v1', key: this.orcaKey },
          { provider: 'mistral', model: 'ministral-3b-latest', url: 'https://api.mistral.ai/v1', key: this.mistralKey },
          { provider: 'nvidia', model: 'nvidia/nemotron-3-ultra-550b-a55b', url: 'https://integrate.api.nvidia.com/v1', key: this.nvidiaKey }
        ];
      case 'vision':
        return [
          { provider: 'nvidia', model: 'moonshotai/kimi-k3', url: 'https://integrate.api.nvidia.com/v1', key: this.nvidiaKey }
        ];
      case 'ultra_long':
        return [
          { provider: 'mistral', model: 'ministral-3b-latest', url: 'https://api.mistral.ai/v1', key: this.mistralKey },
          { provider: 'orca', model: 'deepseek/deepseek-v4-flash-free', url: 'https://api.orcarouter.ai/v1', key: this.orcaKey },
          { provider: 'nvidia', model: 'nvidia/nemotron-3-ultra-550b-a55b', url: 'https://integrate.api.nvidia.com/v1', key: this.nvidiaKey }
        ];
      case 'fast_chat':
      default:
        return [
          { provider: 'mistral', model: 'ministral-3b-latest', url: 'https://api.mistral.ai/v1', key: this.mistralKey },
          { provider: 'mistral', model: 'open-mistral-7b', url: 'https://api.mistral.ai/v1', key: this.mistralKey },
          { provider: 'orca', model: 'deepseek/deepseek-v4-flash-free', url: 'https://api.orcarouter.ai/v1', key: this.orcaKey }
        ];
    }
  }

  private async executeStep(
    step: { provider: string; model: string; url: string; key: string },
    messages: ChatMessage[],
    maxTokens: number,
    temperature: number,
    onChunk?: (text: string) => void
  ): Promise<LLMResponse> {
    const isStream = Boolean(onChunk);
    
    const response = await fetch(`${step.url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${step.key}`,
        'Content-Type': 'application/json',
        'Accept': isStream ? 'text/event-stream' : 'application/json'
      },
      body: JSON.stringify({
        model: step.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: isStream
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} from ${step.provider}: ${errText.slice(0, 200)}`);
    }

    if (isStream && response.body) {
      return this.handleStreamResponse(response.body, step, onChunk!);
    } else {
      const data = await response.json();
      const choice = data.choices?.[0] || {};
      return {
        provider: step.provider,
        model: step.model,
        content: choice.message?.content || '',
        reasoning: choice.message?.reasoning_content || '',
        usage: data.usage,
        finishReason: choice.finish_reason
      };
    }
  }

  private async handleStreamResponse(
    stream: ReadableStream<Uint8Array>,
    step: { provider: string; model: string },
    onChunk: (text: string) => void
  ): Promise<LLMResponse> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let content = '';
    let reasoning = '';
    let finishReason = 'stop';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n').filter(line => line.trim().startsWith('data: '));

      for (const line of lines) {
        const payload = line.replace(/^data:\s*/, '').trim();
        if (payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          const choice = parsed.choices?.[0];
          if (choice?.delta?.content) {
            content += choice.delta.content;
            onChunk(choice.delta.content);
          }
          if (choice?.delta?.reasoning_content) {
            reasoning += choice.delta.reasoning_content;
          }
          if (choice?.finish_reason) {
            finishReason = choice.finish_reason;
          }
        } catch {
          // Ignore partial stream line parse issues
        }
      }
    }

    return {
      provider: step.provider,
      model: step.model,
      content,
      reasoning,
      finishReason
    };
  }

  /**
   * Handles automatic continuation if a response gets cut off mid-output.
   */
  private async autoContinue(
    step: { provider: string; model: string; url: string; key: string },
    originalMessages: ChatMessage[],
    partialContent: string,
    maxTokens: number
  ): Promise<string> {
    console.log(`[AIRouter] Output cut off (finish_reason: length). Issuing automatic continuation...`);
    
    const continuationMessages: ChatMessage[] = [
      ...originalMessages,
      { role: 'assistant', content: partialContent },
      { role: 'user', content: 'Continue exactly where you left off without repeating previous text.' }
    ];

    const nextResponse = await this.executeStep(step, continuationMessages, maxTokens, 0.7);
    return nextResponse.content;
  }
}

export const aiRouter = new AIRouter();
