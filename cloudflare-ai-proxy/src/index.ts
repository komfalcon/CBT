export interface Env {
  GEMINI_API_KEY_1?: string;
  GEMINI_API_KEY_2?: string;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN_1?: string;
  CF_API_TOKEN_2?: string;
  GROK_API_KEY_1?: string;
  GROK_API_KEY_2?: string;
  AI?: any; // Native Cloudflare Workers AI binding if available
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/v1/chat/completions' && url.pathname !== '/') {
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const body: ChatRequest = await request.json();
      const messages = body.messages || [];
      const maxTokens = body.max_tokens || 500;
      const temperature = body.temperature ?? 0.3;

      // Extract system instruction and user prompt
      const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
      const userMsg = messages.filter((m) => m.role !== 'system').map((m) => `${m.role}: ${m.content}`).join('\n');
      const combinedPrompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

      // Tier 1: Gemini API (Key 1 -> Key 2)
      const geminiKeys = [env.GEMINI_API_KEY_1, env.GEMINI_API_KEY_2].filter(Boolean) as string[];
      for (const [index, key] of geminiKeys.entries()) {
        try {
          const res = await callGemini(key, combinedPrompt, maxTokens, temperature);
          if (res) return createOpenAiResponse(res, `gemini-key-${index + 1}`);
        } catch (e: any) {
          console.warn(`[AI Proxy] Gemini Key ${index + 1} failed: ${e.message}`);
        }
      }

      // Tier 2: Cloudflare Workers AI (Token 1 -> Token 2 or Native Binding)
      if (env.AI) {
        try {
          const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [{ role: 'user', content: combinedPrompt }],
            max_tokens: maxTokens,
          });
          if (response?.response) return createOpenAiResponse(response.response, 'cf-workers-ai-native');
        } catch (e: any) {
          console.warn(`[AI Proxy] Native CF Workers AI failed: ${e.message}`);
        }
      }

      const cfTokens = [env.CF_API_TOKEN_1, env.CF_API_TOKEN_2].filter(Boolean) as string[];
      const accountId = env.CF_ACCOUNT_ID;
      if (accountId && cfTokens.length > 0) {
        for (const [index, token] of cfTokens.entries()) {
          try {
            const res = await callCloudflareWorkersAiRest(accountId, token, combinedPrompt, maxTokens);
            if (res) return createOpenAiResponse(res, `cf-workers-ai-token-${index + 1}`);
          } catch (e: any) {
            console.warn(`[AI Proxy] Cloudflare Workers AI Token ${index + 1} failed: ${e.message}`);
          }
        }
      }

      // Tier 3: Grok (xAI) API (Key 1 -> Key 2)
      const grokKeys = [env.GROK_API_KEY_1, env.GROK_API_KEY_2].filter(Boolean) as string[];
      for (const [index, key] of grokKeys.entries()) {
        try {
          const res = await callGrok(key, messages, maxTokens, temperature);
          if (res) return createOpenAiResponse(res, `grok-key-${index + 1}`);
        } catch (e: any) {
          console.warn(`[AI Proxy] Grok Key ${index + 1} failed: ${e.message}`);
        }
      }

      return new Response(
        JSON.stringify({ error: { message: 'All 3 AI provider tiers (Gemini, Cloudflare Workers AI, Grok) failed or rate-limited.' } }),
        { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: { message: err.message || 'Invalid request payload' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};

// Helper: Call Google Gemini API
async function callGemini(apiKey: string, prompt: string, maxTokens: number, temperature: number, model: string = 'gemini-flash-latest'): Promise<string | null> {
  const modelsToTry = [model, 'gemini-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];
  let lastError: Error | null = null;

  for (const m of Array.from(new Set(modelsToTry))) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini (${m}) HTTP ${response.status}: ${errorText}`);
      }

      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Proxy] Gemini model ${m} failed: ${err.message}`);
    }
  }

  if (lastError) throw lastError;
  return null;
}

// Helper: Call Cloudflare Workers AI REST API
async function callCloudflareWorkersAiRest(accountId: string, token: string, prompt: string, maxTokens: number): Promise<string | null> {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CF Workers AI HTTP ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  return data.result?.response || null;
}

// Helper: Call Grok (xAI) API
async function callGrok(apiKey: string, messages: ChatMessage[], maxTokens: number, temperature: number): Promise<string | null> {
  const endpoint = 'https://api.x.ai/v1/chat/completions';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok HTTP ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

// Helper: Create OpenAI-compatible JSON Response
function createOpenAiResponse(content: string, modelUsed: string): Response {
  return new Response(
    JSON.stringify({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: modelUsed,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        },
      ],
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
