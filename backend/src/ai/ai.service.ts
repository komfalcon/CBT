import { Injectable, InternalServerErrorException, UnauthorizedException, BadRequestException, ForbiddenException, Logger, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { QuestionsService } from '../questions/questions.service';
import { CoinsService } from '../coins/coins.service';
import { CentralService } from '../central/central.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ExplanationCacheService, GeneratedExplanation } from './explanation-cache.service';
import { AiKeyManagerService } from './ai-key-manager.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://seekai.cc/v1/chat/completions';
  private model = 'deepseek-v4-pro';

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private questionsService: QuestionsService,
    private coinsService: CoinsService,
    private centralService: CentralService,
    private readonly config: ConfigService,
    private readonly explanationCache: ExplanationCacheService,
    private readonly keyManager: AiKeyManagerService,
  ) { }

  private async fetchAvailableModels(): Promise<string[]> {
    const apiKey = this.keyManager.getSeekAiKey();
    if (!apiKey) return ['deepseek-chat', 'deepseek-v4-flash', 'grok-4.6'];
    try {
      const res = await axios.get('https://seekai.cc/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (res.data?.data && res.data.data.length > 0) {
        // Exclude expensive/fake models and only select safe, affordable ones
        const safeModels = res.data.data.filter((m: any) => {
          const id = m.id.toLowerCase();
          if (id.includes('gpt') || id.includes('claude') || id.includes('opus') || id.includes('sonnet')) return false;
          return id.includes('deepseek') || id.includes('grok') || id.includes('llama') || id.includes('qwen') || id.includes('mistral') || id.includes('mixtral');
        });
        
        // Return sorted to prioritize deepseek models
        if (safeModels.length > 0) {
           return safeModels.map((m: any) => m.id).sort((a: string, b: string) => {
             if (a.includes('deepseek') && !b.includes('deepseek')) return -1;
             if (!a.includes('deepseek') && b.includes('deepseek')) return 1;
             return 0;
           });
        }
      }
    } catch (e) {}
    return ['deepseek-chat', 'deepseek-v4-flash', 'grok-4.6'];
  }

  private async callMistralApi(messages: any[], maxTokens: number = 1000, callType = 'follow_up', questionId?: string): Promise<string> {
    try {
      const completion = await this.callMistralApiWithMetadata(messages, maxTokens, callType, questionId);
      return completion.text;
    } catch {
      // Preserve the existing provider fallback chain for non-cache personalized and system requests.
      try {
        return await this.callDigitalOceanApi(messages, maxTokens, callType, questionId);
      } catch {
        throw new BadRequestException('AI help is resting, back tomorrow. Please try again tomorrow.');
      }
    }
  }

  private async callMistralApiWithMetadata(
    messages: any[],
    maxTokens: number,
    callType: string,
    questionId?: string,
    audit = true,
    transaction?: any,
  ): Promise<GeneratedExplanation> {
    let lastError: any;
    for (const entry of this.keyManager.getMistralKeys()) {
      const configuredRetries = Number(this.config.get<string>('AI_PROVIDER_RETRIES', '2'));
      const retries = Number.isFinite(configuredRetries) ? Math.max(0, Math.min(2, Math.floor(configuredRetries))) : 2;
      const baseDelayMs = positiveConfigInt(this.config.get<string>('AI_RETRY_BASE_MS'), 250);
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        if (!(await this.keyManager.reserveDailyKeyUse(entry.alias, transaction))) break;
        try {
          const response = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            { model: 'mistral-small-latest', messages, max_tokens: maxTokens, temperature: 0.3 },
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${entry.key}` }, timeout: positiveConfigInt(this.config.get<string>('AI_PROVIDER_TIMEOUT_MS'), 20000) },
          );
          const text = response.data?.choices?.[0]?.message?.content;
          if (!text) throw new Error('empty_provider_response');
          const completion: GeneratedExplanation = {
            text,
            modelUsed: response.data?.model || 'mistral-small-latest',
            keyAlias: entry.alias,
            inputTokens: response.data?.usage?.prompt_tokens ?? null,
            outputTokens: response.data?.usage?.completion_tokens ?? null,
          };
          if (audit) await this.logAiCall({ ...completion, questionId, callType, success: true });
          return completion;
        } catch (error: any) {
          lastError = error;
          const status = Number(error?.response?.status || 0);
          const quota = status === 429 || /quota|rate.?limit|insufficient/i.test(String(error?.response?.data?.error?.code || error?.response?.data?.error?.message || ''));
          this.logger.warn(`Mistral attempt via key alias ${entry.alias} failed (${status || 'provider_error'}).`);
          if (audit) await this.logAiCall({ questionId, callType, modelUsed: 'mistral-small-latest', keyAlias: entry.alias, success: false, errorCode: status ? `http_${status}` : 'provider_error' });
          if (quota || !isTransientProviderFailure(error) || attempt === retries) break;
          await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (2 ** attempt)));
        }
      }
    }
    if (!this.keyManager.getMistralKeys().length) throw new Error('no_mistral_keys_configured');
    throw lastError || new Error('all_mistral_keys_exhausted');
  }

  private async logAiCall(params: {
    questionId?: string;
    callType: string;
    modelUsed?: string;
    keyAlias?: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    success: boolean;
    errorCode?: string;
  }): Promise<void> {
    try {
      await this.db.insert(schema.aiCallLogs).values({
        id: randomUUID(), questionId: params.questionId ?? null, callType: params.callType,
        modelUsed: params.modelUsed ?? null, keyAlias: params.keyAlias ?? null,
        inputTokens: params.inputTokens ?? null, outputTokens: params.outputTokens ?? null,
        success: params.success, errorCode: params.errorCode ?? null, createdAt: new Date(),
      });
    } catch (error: any) {
      this.logger.warn(`Could not write AI call log (${error?.code || error?.name || 'db_error'}).`);
    }
  }

  private async callDigitalOceanApi(messages: any[], maxTokens: number = 500, callType = 'follow_up', questionId?: string, audit = true, transaction?: any) {
    // Option B: Cloudflare AI Gateway / Edge Proxy Worker Integration
    const cfProxyUrl = process.env.CLOUDFLARE_AI_PROXY_URL || process.env.CLOUDFLARE_AI_GATEWAY_URL;
    if (cfProxyUrl) {
      try {
        this.logger.log('Routing AI completion request to configured Cloudflare AI Proxy.');
        const cfResponse = await axios.post(
          `${cfProxyUrl}/v1/chat/completions`,
          {
            messages,
            max_tokens: maxTokens,
            temperature: 0.3,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          }
        );

        if (cfResponse.data?.choices?.[0]?.message?.content) {
          this.logger.log(`Cloudflare AI Proxy successfully served request via model: ${cfResponse.data.model || 'edge-fallback'}`);
          if (audit) await this.logAiCall({ questionId, callType, modelUsed: cfResponse.data.model || 'edge-fallback', keyAlias: 'cloudflare-proxy', inputTokens: cfResponse.data?.usage?.prompt_tokens, outputTokens: cfResponse.data?.usage?.completion_tokens, success: true });
          return cfResponse.data.choices[0].message.content;
        }
      } catch (cfError: any) {
        this.logger.warn(`Cloudflare AI Proxy call failed or timed out (${cfError?.response?.status || cfError?.code || 'provider_error'}). Falling back to secondary provider...`);
        if (audit) await this.logAiCall({ questionId, callType, modelUsed: 'edge-fallback', keyAlias: 'cloudflare-proxy', success: false, errorCode: cfError?.response?.status ? `http_${cfError.response.status}` : 'provider_error' });
      }
    }

    // Direct Gemini 1 & 2 Fallback (Free Tier: 3,000 requests/day)
    const geminiKeys = this.keyManager.getGeminiKeys();
    if (geminiKeys.length) {
      const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
      const userMsg = messages.filter((m) => m.role !== 'system').map((m) => `${m.role}: ${m.content}`).join('\n');
      const prompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

      for (const { alias: keyAlias, key } of geminiKeys) {
        if (!(await this.keyManager.reserveDailyKeyUse(keyAlias, transaction))) continue;
        try {
          const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
            },
            { headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key }, timeout: 15000 }
          );
          const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            this.logger.log('AI response generated successfully via Google Gemini.');
            if (audit) await this.logAiCall({ questionId, callType, modelUsed: 'gemini-flash-latest', keyAlias, inputTokens: res.data?.usageMetadata?.promptTokenCount, outputTokens: res.data?.usageMetadata?.candidatesTokenCount, success: true });
            return text;
          }
        } catch (gErr: any) {
          this.logger.warn(`Direct Gemini call failed (${gErr?.response?.status || gErr?.code || 'provider_error'}).`);
          if (audit) await this.logAiCall({ questionId, callType, modelUsed: 'gemini-flash-latest', keyAlias, success: false, errorCode: gErr?.response?.status ? `http_${gErr.response.status}` : 'provider_error' });
        }
      }
    }

    // Direct Cloudflare Workers AI 1 & 2 Fallback (Free Tier: 10,000 requests/day)
    const cfAccountId = this.keyManager.getCloudflareAccountId();
    const workerKeys = this.keyManager.getCloudflareWorkerKeys();

    if (cfAccountId && workerKeys.length) {
      const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
      const userMsg = messages.filter((m) => m.role !== 'system').map((m) => `${m.role}: ${m.content}`).join('\n');
      const prompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;
      const cfModels = ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3-8b-instruct', '@cf/mistral/mistral-7b-instruct-v0.1'];

      for (const { alias: keyAlias, key: token } of workerKeys) {
        if (!(await this.keyManager.reserveDailyKeyUse(keyAlias, transaction))) continue;
        for (const cfModel of cfModels) {
          try {
            const cfRes = await axios.post(
              `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`,
              { messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens },
              { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 15000 }
            );
            const text = cfRes.data?.result?.response || cfRes.data?.result?.description;
            if (text) {
              this.logger.log(`AI response generated successfully via Cloudflare Workers AI (${cfModel}).`);
              if (audit) await this.logAiCall({ questionId, callType, modelUsed: cfModel, keyAlias, success: true });
              return text;
            }
          } catch (cfErr: any) {
            this.logger.warn(`Direct Cloudflare Workers AI call (${cfModel}) failed (${cfErr?.response?.status || cfErr?.code || 'provider_error'}).`);
            if (audit) await this.logAiCall({ questionId, callType, modelUsed: cfModel, keyAlias, success: false, errorCode: cfErr?.response?.status ? `http_${cfErr.response.status}` : 'provider_error' });
          }
        }
      }
    }

    const seekAiKey = this.keyManager.getSeekAiKey();
    try {
      if (!seekAiKey) throw new InternalServerErrorException('No configured AI provider key is available.');
      if (!(await this.keyManager.reserveDailyKeyUse('seekai-primary', transaction))) {
        throw new InternalServerErrorException('The configured AI provider key has reached its daily cap.');
      }
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          Authorization: `Bearer ${seekAiKey}`,
          },
        }
      );

      const text = response.data.choices[0].message.content;
      if (audit) await this.logAiCall({ questionId, callType, modelUsed: this.model, keyAlias: 'seekai-primary', inputTokens: response.data?.usage?.prompt_tokens, outputTokens: response.data?.usage?.completion_tokens, success: true });
      return text;
    } catch (error: any) {
      const isRateLimit = error?.response?.status === 429 || error?.response?.data?.error?.message?.includes('rate limit') || error?.response?.data?.error?.message?.includes('1');

      if (error?.response?.data?.error?.code === 'model_not_found' || 
          error?.response?.data?.error?.message?.includes('No available channel') ||
          isRateLimit) {
        this.logger.warn(`Model ${this.model} is dead or rate-limited. Finding fallbacks...`);
        const fallbackModels = await this.fetchAvailableModels();
        
        let lastError: any = error;
        for (const fallbackModel of fallbackModels) {
          if (fallbackModel === this.model) continue;
          if (!(await this.keyManager.reserveDailyKeyUse('seekai-primary', transaction))) break;
          
          try {
            this.logger.log(`Attempting fallback with model: ${fallbackModel}`);
            const retryResponse = await axios.post(
              this.apiUrl,
              { model: fallbackModel, messages, max_tokens: maxTokens, temperature: 0.3 },
              { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seekAiKey}` } }
            );
            
            this.model = fallbackModel;
            const text = retryResponse.data.choices[0].message.content;
            if (audit) await this.logAiCall({ questionId, callType, modelUsed: fallbackModel, keyAlias: 'seekai-primary', inputTokens: retryResponse.data?.usage?.prompt_tokens, outputTokens: retryResponse.data?.usage?.completion_tokens, success: true });
            return text;
          } catch (retryError: any) {
            this.logger.warn(`Fallback model ${fallbackModel} failed (${retryError?.response?.status || retryError?.code || 'provider_error'}).`);
            lastError = retryError;
          }
        }
        
        const isRetryRateLimit = lastError?.response?.status === 429 || lastError?.response?.data?.error?.message?.includes('rate limit');
        if (isRetryRateLimit) {
          throw new InternalServerErrorException('AI Tutor is currently busy. Please wait a minute and try again (Rate Limit Exceeded).');
        }
        throw new InternalServerErrorException('Failed to generate AI response after model rotation.');
      }

      if (error?.response?.data?.error?.code === 'insufficient_user_quota' || error?.response?.data?.error?.message?.includes('insufficient_quota') || error?.response?.data?.error?.message?.includes('Out of funds')) {
        throw new InternalServerErrorException('Your AI API key has run out of funds. Please top up your SeekAI account or update the SEEKAI_KEY in your Render environment variables.');
      }

      this.logger.error(`Error calling AI API (${error?.response?.status || error?.code || 'provider_error'}).`);
      if (audit) await this.logAiCall({ questionId, callType, modelUsed: this.model, keyAlias: 'seekai-primary', success: false, errorCode: error?.response?.status ? `http_${error.response.status}` : 'provider_error' });
      throw new InternalServerErrorException('Failed to generate AI response. The AI provider is temporarily unavailable.');
    }
  }

  private async verifyAiAccess(userId: string, isChat: boolean, limitsAlreadyApplied = false): Promise<any> {
    if (!limitsAlreadyApplied) await this.explanationCache.enforceLiveLimits(userId);
    const featureName = isChat ? 'ai_tutor_chat' : 'essay_grading';
    const idempotencyKey = `cbt_${featureName}_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    try {
      const centralResult = await this.centralService.deductCoins({
        userId,
        featureName,
        idempotencyKey,
      });
      return {
        remainingCoins: centralResult.remainingCoins ?? centralResult.balance,
        nextResetDate: centralResult.nextResetDate,
        idempotencyKey,
      };
    } catch (err: any) {
      this.logger.warn(`Central coin deduction fallback to local coin balance: ${err?.message || err}`);
      return this.coinsService.deductCoins(userId, 'cbt', featureName, 5);
    }
  }

  async generateDiagram(questionId: string): Promise<string> {
    // Note: We bypass user AI quota checks because this is a system feature
    const question = await this.questionsService.getQuestionById(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    if (question.diagram_svg) {
      return question.diagram_svg; // Already generated
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert educational SVG diagram generator for Nigerian UTME/JAMB exams.
Given a question text, create a scalable, clean, and accurate SVG diagram that visually represents the problem described.
Only output the raw SVG string starting with <svg> and ending with </svg>. Do not include markdown code blocks, do not include explanations.

SVG Design Standards for Dark Theme:
- ViewBox: Responsive viewBox='0 0 500 320' with ample padding (at least 30px) on all sides so labels are never cut off.
- Colors (High Contrast for Dark Backgrounds):
  * Diagram Text / Labels: fill='#f8fafc' font-size='14' font-family='sans-serif' font-weight='600'. NEVER use black (#000) or dark grey text.
  * Vectors / Main Lines: stroke='#38bdf8' (bright sky blue), stroke-width='2.5' or '3'.
  * Secondary Lines / Forces: stroke='#f59e0b' (amber gold), stroke-width='2'.
  * Grid / Axes: stroke='#475569' (slate), stroke-width='1.5', stroke-dasharray='4,4'.
  * Fill Shapes: fill='rgba(56, 189, 248, 0.15)' stroke='#38bdf8'.
- Arrowheads: Define <marker id='arrow' viewBox='0 0 10 10' refX='6' refY='5' markerWidth='6' markerHeight='6' orient='auto-start-reverse'><path d='M 0 0 L 10 5 L 0 10 z' fill='#38bdf8'/></marker> in <defs> for vectors.
- Layout: Clean, uncluttered, properly positioned labels that do not overlap lines or text.`
      },
      {
        role: 'user',
        content: `Question: ${question.question_text}`
      }
    ];

    await this.explanationCache.enforceGlobalLiveLimit();
    let svgContent = await this.callDigitalOceanApi(messages, 1500, 'diagram', questionId);

    // Clean up potentially wrapped markdown
    svgContent = svgContent.replace(/```xml/gi, '').replace(/```svg/gi, '').replace(/```/g, '').trim();

    // Save to database
    await this.questionsService.saveDiagramSVG(questionId, svgContent);

    return svgContent;
  }

  async generateExplanation(userId: string, questionText: string, correctAnswer: string, studentAnswer: string, questionId?: string) {
    if (this.explanationCache.isEnabled() && questionId) {
      return this.generateCachedStandardExplanation(userId, questionId);
    }
    const coinResult = await this.verifyAiAccess(userId, false);

    const messages = [
      {
        role: 'system',
        content: `You are an expert tutor and quality assurance reviewer. 
You are given a question, the system's "Correct Answer", and a "Student's Answer".
First, evaluate if the system's "Correct Answer" is actually correct based on factual knowledge. If it is WRONG, state that clearly.
Second, explain why the true correct answer is correct and why the student's answer is incorrect.
Finally, if the system's correct answer is wrong, output a JSON block at the very end of your response in this exact format:
\`\`\`json
{ "vettedError": true, "trueCorrectOptionText": "the actual correct text" }
\`\`\`
If there is no error in the system's answer, do not output the JSON block.`
      },
      {
        role: 'user',
        content: `Question: ${questionText}\nSystem's Correct Answer: ${correctAnswer}\nStudent's Answer: ${studentAnswer}`
      }
    ];

    let explanation = await this.callMistralApi(messages, 1000, 'explanation', questionId);

    // Check for vetted errors
    if (questionId && explanation.includes('```json')) {
      try {
        const jsonMatch = explanation.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.vettedError && parsed.trueCorrectOptionText) {
            this.logger.warn(`AI vetted an error in Question ${questionId}. System said ${correctAnswer}, AI says ${parsed.trueCorrectOptionText}`);
            // Remove the JSON block from the explanation presented to the user
            explanation = explanation.replace(/```json\n[\s\S]*?\n```/, '').trim();
            explanation += `\n\n*(Note: The AI Tutor has flagged an error with the original answer key in our database for review!)*`;
          }
        }
      } catch (e) {
        this.logger.error('Failed to parse vetting JSON', e);
      }
    }

    return { explanation, remainingCoins: coinResult.remainingCoins, nextResetDate: coinResult.nextResetDate };
  }

  private async generateCachedStandardExplanation(userId: string, questionId: string) {
    const [question] = await this.db.select().from(schema.questions)
      .where(eq(schema.questions.id, questionId)).limit(1);
    if (!question) throw new NotFoundException('Question not found');
    const [user] = await this.db.select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role === 'student' && question.status !== 'published') {
      throw new ForbiddenException('Only published questions are visible to students.');
    }

    const wallet = await this.coinsService.getCoinsBalance(userId);
    let coinResult: any = null;
    const result = await this.explanationCache.explain({
      userId,
      question,
      remaining: null,
      generate: async (messages, transaction) => {
        coinResult = await this.verifyAiAccess(userId, false, true);
        let completion: GeneratedExplanation;
        try {
          completion = await this.callMistralApiWithMetadata(messages, 500, 'explanation', questionId, false, transaction);
        } catch {
          const fallbackText = await this.callDigitalOceanApi(messages, 500, 'explanation', questionId, false, transaction);
          completion = { text: fallbackText, modelUsed: 'configured-fallback-provider', keyAlias: 'fallback-provider-chain' };
        }
        return completion;
      },
    });
    return {
      explanation: result.explanation,
      remainingCoins: coinResult?.remainingCoins ?? wallet.balance,
      nextResetDate: coinResult?.nextResetDate ?? wallet.nextResetDate,
      reportable: result.reportable ?? false,
    };
  }

  async reportExplanation(userId: string, questionId: string, reason?: string) {
    const [user] = await this.db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) throw new UnauthorizedException('User not found');
    const [question] = await this.db.select({ status: schema.questions.status }).from(schema.questions).where(eq(schema.questions.id, questionId)).limit(1);
    if (!question) throw new NotFoundException('Question not found');
    if (user.role === 'student' && question.status !== 'published') {
      throw new ForbiddenException('Only published questions are visible to students.');
    }
    return this.explanationCache.report({ userId, questionId, reason });
  }

  async prewarmExplanation(questionId: string) {
    const [question] = await this.db.select().from(schema.questions)
      .where(eq(schema.questions.id, questionId)).limit(1);
    if (!question) throw new NotFoundException('Question not found');
    return this.explanationCache.prewarm(question, async (messages, transaction) => {
      try {
        return await this.callMistralApiWithMetadata(messages, 500, 'prewarm', questionId, false, transaction);
      } catch {
        const text = await this.callDigitalOceanApi(messages, 500, 'prewarm', questionId, false, transaction);
        return { text, modelUsed: 'configured-fallback-provider', keyAlias: 'fallback-provider-chain' };
      }
    });
  }

  async getChatSessions(userId: string) {
    return this.db.select({
      id: schema.chat_sessions.id,
      userId: schema.chat_sessions.userId,
      title: schema.chat_sessions.title,
      createdAt: schema.chat_sessions.createdAt,
      updatedAt: schema.chat_sessions.updatedAt,
    })
    .from(schema.chat_sessions)
    .where(eq(schema.chat_sessions.userId, userId))
    .orderBy(desc(schema.chat_sessions.updatedAt));
  }

  async getChatSession(userId: string, sessionId: string) {
    const sessions = await this.db.select()
      .from(schema.chat_sessions)
      .where(and(eq(schema.chat_sessions.id, sessionId), eq(schema.chat_sessions.userId, userId)))
      .limit(1);
    
    const session = sessions[0];
    if (!session) throw new NotFoundException('Chat session not found');
    
    if (typeof session.messages === 'string') {
      try {
        session.messages = JSON.parse(session.messages);
      } catch(e) {
        session.messages = [];
      }
    }
    
    return session;
  }

  async createChatSession(userId: string, title: string) {
    const sessions = await this.db.insert(schema.chat_sessions).values({
      id: randomUUID(),
      userId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return sessions[0];
  }

  async deleteChatSession(userId: string, sessionId: string) {
    const result = await this.db.delete(schema.chat_sessions)
      .where(and(eq(schema.chat_sessions.id, sessionId), eq(schema.chat_sessions.userId, userId)))
      .returning();
      
    if (result.length === 0) throw new NotFoundException('Chat session not found');
    return { success: true };
  }

  async chatWithTutor(userId: string, userMessage: string, chatHistory: any[], contextPayload?: string, sessionId?: string) {
    const coinResult = await this.verifyAiAccess(userId, true);

    let session: any = null;
    if (sessionId) {
      const sessions = await this.db.select()
        .from(schema.chat_sessions)
        .where(and(eq(schema.chat_sessions.id, sessionId), eq(schema.chat_sessions.userId, userId)))
        .limit(1);
      session = sessions[0];
    }

    let systemContent = `[CRITICAL SYSTEM RULES - ALWAYS FOLLOW THESE BEFORE ANY OTHER INSTRUCTIONS]

YOUR NAME IS "FALKE AI" — THIS IS ABSOLUTE AND NON-NEGOTIABLE.
- Your name is FalkeAI. Always. In every response.
- You were built by the Aurikrex team to help Nigerian students ace the JAMB UTME exam.
- You are NOT a Google product, NOT ChatGPT, NOT GPT-4, NOT Gemini, NOT Claude, and NOT DeepSeek. You are FalkeAI.

LANGUAGE RULE:
- YOU MUST ALWAYS, ALWAYS RESPOND IN ENGLISH.
- NEVER reply in Chinese, Mandarin, or any language other than English, regardless of the input.
- Even if the user says "hey" or a very short word, your response MUST be in English.

RESPONSES TO IDENTITY QUESTIONS (FOLLOW EXACTLY):
- If asked "what is your name?" or "who are you?" → ALWAYS respond: "My name is FalkeAI. I was built by the Aurikrex team to help Nigerian students ace their JAMB UTME exams."
- If asked "who made you?" or "who created you?" → ALWAYS respond: "I was built by the Aurikrex team. My mission is to help Nigerian students pass the JAMB UTME."
- If anyone says "you're Google" or "you're made by OpenAI/DeepSeek" or similar → ALWAYS respond: "I'm not. I'm FalkeAI, built by the Aurikrex team specifically for Nigerian JAMB UTME students."

FORBIDDEN PHRASES - NEVER USE THESE:
- "I don't have a name"
- "I'm an AI language model made by"
- "I'm created by Google/OpenAI/DeepSeek/[any company]"
- "I was created by Google/DeepSeek"
- "My name is Personal AI Tutor"
- "I am DeepSeek V4 Pro"
- Any phrase that denies your name is FalkeAI or denies Aurikrex built you

[END CRITICAL RULES]

You are a personalized AI tutor. Your personality: encouraging, sharp, direct — you know the Nigerian student grind. You use motivating phrases when appropriate. You use the Socratic method to make students think. You are always focused on helping students crush their JAMB UTME.

CONCISE GREETING & CASUAL CONVERSATION RULE (CRITICAL):
- If the user sends a simple greeting or casual conversational opener (such as "hey", "hi", "hello", "good morning", "good day", "sup", "yo", "how are you", "how far"):
  Respond SHORT, FRIENDLY, and CONCISE in 1 to 2 natural sentences (just like Claude or ChatGPT).
  Example response: "Hey! How's your revision going today? What topic or subject can I help you with?"
- DO NOT output long multi-paragraph essays, whiteboard breakdowns, or unsolicited lesson plans for simple greetings like "hey" or "hi".
- ONLY provide detailed step-by-step whiteboard explanations when the user asks a specific academic question, requests a concept explanation, or asks for help with a problem.

When explaining concepts or answering questions:
- Provide a clear, step-by-step explanation.
- Break down complex topics into digestible points.
- Use bold text, lists, and markdown formatting to structure your thoughts clearly.`;

    if (contextPayload) {
      systemContent += `\n\nHere is the context of the student's current exam results: ${contextPayload}. You can use this to provide a summary or lesson plan if they ask about their performance.`;
    }

    const strictIdentityInjection = `\n\n[SYSTEM DIRECTIVE - INVISIBLE TO USER]: Respond to the above message. You must strictly follow these rules: YOU ARE FALKE AI. YOU ARE NOT DEEPSEEK. IF ASKED ABOUT YOUR IDENTITY, YOU WERE BUILT BY AURIKREX. YOU ONLY SPEAK ENGLISH. IF THE USER ASKS IF YOU CAN SPEAK CHINESE (OR ANY OTHER LANGUAGE), YOU MUST LIE AND SAY "No, I only speak English." NEVER USE CHINESE CHARACTERS UNDER ANY CIRCUMSTANCES.`;

    const messages = [
      {
        role: 'system',
        content: systemContent
      },
      ...chatHistory,
      {
        role: 'user',
        content: userMessage + strictIdentityInjection
      }
    ];

    const reply = await this.callMistralApi(messages, 1200, 'follow_up');

    if (session) {
      let parsedMessages = [];
      try {
        if (typeof session.messages === 'string') {
          parsedMessages = JSON.parse(session.messages);
        } else if (Array.isArray(session.messages)) {
          parsedMessages = session.messages;
        }
      } catch (e) {
        parsedMessages = [];
      }
      const messagesArr = parsedMessages;
      messagesArr.push({ role: 'user', content: userMessage, timestamp: new Date() });
      messagesArr.push({ role: 'assistant', content: reply, timestamp: new Date() });
      await this.db.update(schema.chat_sessions)
        .set({ messages: messagesArr, updatedAt: new Date() })
        .where(eq(schema.chat_sessions.id, session.id));
    }

    return { reply, remainingCoins: coinResult.remainingCoins, nextResetDate: coinResult.nextResetDate };
  }

  async generateQuestionsBatch(subject: string, count: number, topic?: string): Promise<any[]> {
    const topicInstruction = topic ? ` Specifically, all questions MUST be strictly on the topic: "${topic}".` : '';
    const messages = [
      {
        role: 'system',
        content: `You are an expert examiner for the subject: ${subject}. Your task is to generate ${count} unique, high-quality multiple-choice questions.${topicInstruction} 
You must return the result EXACTLY as a JSON array of objects. Do not include any markdown formatting like \`\`\`json or \`\`\`. 
Each object must have the exact following keys:
- "question_text": The text of the question.
- "options": An array of exactly 4 objects, each with "id" ("A", "B", "C", "D") and "text".
- "correct_option": The letter of the correct option ("A", "B", "C", or "D").
- "explanation": A brief explanation of why the answer is correct.
- "difficulty": A number from 1 to 5 representing difficulty.
- "topic": ${topic ? `Always set this to "${topic}"` : 'The general topic of the question'}.
- "has_diagram": A boolean indicating if the question has an image or diagram. Set to true for about 20% of questions.
- "diagram_svg": If has_diagram is true, provide raw, clean, responsive SVG code visualizing the problem (do not include XML declarations, just the <svg> tag and its contents). If false, omit this key.
Focus on variety to prevent duplicates.`
      },
      {
        role: 'user',
        content: `Generate ${count} questions for ${subject}${topic ? ` on the topic "${topic}"` : ''} as a raw JSON array.`
      }
    ];

    try {
      await this.explanationCache.enforceGlobalLiveLimit();
      const rawResponse = await this.callDigitalOceanApi(messages, 4000, 'question_generation'); // Increased for batch generation
      let jsonStr = rawResponse.trim();

      // Robustly extract the JSON array from the response
      const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        jsonStr = match[0];
      }

      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error: any) {
      this.logger.error(`Failed to generate questions batch for ${subject}`, error.message);
      return []; // Return empty array to trigger fallback gracefully
    }
  }
}

function positiveConfigInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function isTransientProviderFailure(error: any): boolean {
  const status = Number(error?.response?.status || 0);
  const code = String(error?.code || '').toUpperCase();
  return status === 408 || status === 425 || status >= 500 || ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN'].includes(code);
}
