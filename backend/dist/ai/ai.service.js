"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../db/database.module");
const schema = __importStar(require("../db/schema"));
const postgres_js_1 = require("drizzle-orm/postgres-js");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const questions_service_1 = require("../questions/questions.service");
const coins_service_1 = require("../coins/coins.service");
const central_service_1 = require("../central/central.service");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("@nestjs/config");
const explanation_cache_service_1 = require("./explanation-cache.service");
const ai_key_manager_service_1 = require("./ai-key-manager.service");
let AiService = AiService_1 = class AiService {
    constructor(db, questionsService, coinsService, centralService, config, explanationCache, keyManager) {
        this.db = db;
        this.questionsService = questionsService;
        this.coinsService = coinsService;
        this.centralService = centralService;
        this.config = config;
        this.explanationCache = explanationCache;
        this.keyManager = keyManager;
        this.logger = new common_1.Logger(AiService_1.name);
        this.apiUrl = 'https://seekai.cc/v1/chat/completions';
        this.model = 'deepseek-v4-pro';
    }
    async fetchAvailableModels() {
        const apiKey = this.keyManager.getSeekAiKey();
        if (!apiKey)
            return ['deepseek-chat', 'deepseek-v4-flash', 'grok-4.6'];
        try {
            const res = await axios_1.default.get('https://seekai.cc/v1/models', {
                headers: { Authorization: `Bearer ${apiKey}` }
            });
            if (res.data?.data && res.data.data.length > 0) {
                const safeModels = res.data.data.filter((m) => {
                    const id = m.id.toLowerCase();
                    if (id.includes('gpt') || id.includes('claude') || id.includes('opus') || id.includes('sonnet'))
                        return false;
                    return id.includes('deepseek') || id.includes('grok') || id.includes('llama') || id.includes('qwen') || id.includes('mistral') || id.includes('mixtral');
                });
                if (safeModels.length > 0) {
                    return safeModels.map((m) => m.id).sort((a, b) => {
                        if (a.includes('deepseek') && !b.includes('deepseek'))
                            return -1;
                        if (!a.includes('deepseek') && b.includes('deepseek'))
                            return 1;
                        return 0;
                    });
                }
            }
        }
        catch (e) { }
        return ['deepseek-chat', 'deepseek-v4-flash', 'grok-4.6'];
    }
    async callMistralApi(messages, maxTokens = 1000, callType = 'follow_up', questionId) {
        try {
            const completion = await this.callMistralApiWithMetadata(messages, maxTokens, callType, questionId);
            return completion.text;
        }
        catch {
            try {
                return await this.callDigitalOceanApi(messages, maxTokens, callType, questionId);
            }
            catch {
                throw new common_1.BadRequestException('AI help is resting, back tomorrow. Please try again tomorrow.');
            }
        }
    }
    async callMistralApiWithMetadata(messages, maxTokens, callType, questionId, audit = true, transaction) {
        let lastError;
        for (const entry of this.keyManager.getMistralKeys()) {
            const configuredRetries = Number(this.config.get('AI_PROVIDER_RETRIES', '2'));
            const retries = Number.isFinite(configuredRetries) ? Math.max(0, Math.min(2, Math.floor(configuredRetries))) : 2;
            const baseDelayMs = positiveConfigInt(this.config.get('AI_RETRY_BASE_MS'), 250);
            for (let attempt = 0; attempt <= retries; attempt += 1) {
                if (!(await this.keyManager.reserveDailyKeyUse(entry.alias, transaction)))
                    break;
                try {
                    const response = await axios_1.default.post('https://api.mistral.ai/v1/chat/completions', { model: 'mistral-small-latest', messages, max_tokens: maxTokens, temperature: 0.3 }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${entry.key}` }, timeout: positiveConfigInt(this.config.get('AI_PROVIDER_TIMEOUT_MS'), 20000) });
                    const text = response.data?.choices?.[0]?.message?.content;
                    if (!text)
                        throw new Error('empty_provider_response');
                    const completion = {
                        text,
                        modelUsed: response.data?.model || 'mistral-small-latest',
                        keyAlias: entry.alias,
                        inputTokens: response.data?.usage?.prompt_tokens ?? null,
                        outputTokens: response.data?.usage?.completion_tokens ?? null,
                    };
                    if (audit)
                        await this.logAiCall({ ...completion, questionId, callType, success: true });
                    return completion;
                }
                catch (error) {
                    lastError = error;
                    const status = Number(error?.response?.status || 0);
                    const quota = status === 429 || /quota|rate.?limit|insufficient/i.test(String(error?.response?.data?.error?.code || error?.response?.data?.error?.message || ''));
                    this.logger.warn(`Mistral attempt via key alias ${entry.alias} failed (${status || 'provider_error'}).`);
                    if (audit)
                        await this.logAiCall({ questionId, callType, modelUsed: 'mistral-small-latest', keyAlias: entry.alias, success: false, errorCode: status ? `http_${status}` : 'provider_error' });
                    if (quota || !isTransientProviderFailure(error) || attempt === retries)
                        break;
                    await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (2 ** attempt)));
                }
            }
        }
        if (!this.keyManager.getMistralKeys().length)
            throw new Error('no_mistral_keys_configured');
        throw lastError || new Error('all_mistral_keys_exhausted');
    }
    async logAiCall(params) {
        try {
            await this.db.insert(schema.aiCallLogs).values({
                id: (0, crypto_1.randomUUID)(), questionId: params.questionId ?? null, callType: params.callType,
                modelUsed: params.modelUsed ?? null, keyAlias: params.keyAlias ?? null,
                inputTokens: params.inputTokens ?? null, outputTokens: params.outputTokens ?? null,
                success: params.success, errorCode: params.errorCode ?? null, createdAt: new Date(),
            });
        }
        catch (error) {
            this.logger.warn(`Could not write AI call log (${error?.code || error?.name || 'db_error'}).`);
        }
    }
    async callDigitalOceanApi(messages, maxTokens = 500, callType = 'follow_up', questionId, audit = true, transaction) {
        const cfProxyUrl = process.env.CLOUDFLARE_AI_PROXY_URL || process.env.CLOUDFLARE_AI_GATEWAY_URL;
        if (cfProxyUrl) {
            try {
                this.logger.log('Routing AI completion request to configured Cloudflare AI Proxy.');
                const cfResponse = await axios_1.default.post(`${cfProxyUrl}/v1/chat/completions`, {
                    messages,
                    max_tokens: maxTokens,
                    temperature: 0.3,
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000,
                });
                if (cfResponse.data?.choices?.[0]?.message?.content) {
                    this.logger.log(`Cloudflare AI Proxy successfully served request via model: ${cfResponse.data.model || 'edge-fallback'}`);
                    if (audit)
                        await this.logAiCall({ questionId, callType, modelUsed: cfResponse.data.model || 'edge-fallback', keyAlias: 'cloudflare-proxy', inputTokens: cfResponse.data?.usage?.prompt_tokens, outputTokens: cfResponse.data?.usage?.completion_tokens, success: true });
                    return cfResponse.data.choices[0].message.content;
                }
            }
            catch (cfError) {
                this.logger.warn(`Cloudflare AI Proxy call failed or timed out (${cfError?.response?.status || cfError?.code || 'provider_error'}). Falling back to secondary provider...`);
                if (audit)
                    await this.logAiCall({ questionId, callType, modelUsed: 'edge-fallback', keyAlias: 'cloudflare-proxy', success: false, errorCode: cfError?.response?.status ? `http_${cfError.response.status}` : 'provider_error' });
            }
        }
        const geminiKeys = this.keyManager.getGeminiKeys();
        if (geminiKeys.length) {
            const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
            const userMsg = messages.filter((m) => m.role !== 'system').map((m) => `${m.role}: ${m.content}`).join('\n');
            const prompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;
            for (const { alias: keyAlias, key } of geminiKeys) {
                if (!(await this.keyManager.reserveDailyKeyUse(keyAlias, transaction)))
                    continue;
                try {
                    const res = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
                    }, { headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key }, timeout: 15000 });
                    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        this.logger.log('AI response generated successfully via Google Gemini.');
                        if (audit)
                            await this.logAiCall({ questionId, callType, modelUsed: 'gemini-flash-latest', keyAlias, inputTokens: res.data?.usageMetadata?.promptTokenCount, outputTokens: res.data?.usageMetadata?.candidatesTokenCount, success: true });
                        return text;
                    }
                }
                catch (gErr) {
                    this.logger.warn(`Direct Gemini call failed (${gErr?.response?.status || gErr?.code || 'provider_error'}).`);
                    if (audit)
                        await this.logAiCall({ questionId, callType, modelUsed: 'gemini-flash-latest', keyAlias, success: false, errorCode: gErr?.response?.status ? `http_${gErr.response.status}` : 'provider_error' });
                }
            }
        }
        const cfAccountId = this.keyManager.getCloudflareAccountId();
        const workerKeys = this.keyManager.getCloudflareWorkerKeys();
        if (cfAccountId && workerKeys.length) {
            const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
            const userMsg = messages.filter((m) => m.role !== 'system').map((m) => `${m.role}: ${m.content}`).join('\n');
            const prompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;
            const cfModels = ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3-8b-instruct', '@cf/mistral/mistral-7b-instruct-v0.1'];
            for (const { alias: keyAlias, key: token } of workerKeys) {
                if (!(await this.keyManager.reserveDailyKeyUse(keyAlias, transaction)))
                    continue;
                for (const cfModel of cfModels) {
                    try {
                        const cfRes = await axios_1.default.post(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`, { messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 15000 });
                        const text = cfRes.data?.result?.response || cfRes.data?.result?.description;
                        if (text) {
                            this.logger.log(`AI response generated successfully via Cloudflare Workers AI (${cfModel}).`);
                            if (audit)
                                await this.logAiCall({ questionId, callType, modelUsed: cfModel, keyAlias, success: true });
                            return text;
                        }
                    }
                    catch (cfErr) {
                        this.logger.warn(`Direct Cloudflare Workers AI call (${cfModel}) failed (${cfErr?.response?.status || cfErr?.code || 'provider_error'}).`);
                        if (audit)
                            await this.logAiCall({ questionId, callType, modelUsed: cfModel, keyAlias, success: false, errorCode: cfErr?.response?.status ? `http_${cfErr.response.status}` : 'provider_error' });
                    }
                }
            }
        }
        const seekAiKey = this.keyManager.getSeekAiKey();
        try {
            if (!seekAiKey)
                throw new common_1.InternalServerErrorException('No configured AI provider key is available.');
            if (!(await this.keyManager.reserveDailyKeyUse('seekai-primary', transaction))) {
                throw new common_1.InternalServerErrorException('The configured AI provider key has reached its daily cap.');
            }
            const response = await axios_1.default.post(this.apiUrl, {
                model: this.model,
                messages,
                max_tokens: maxTokens,
                temperature: 0.3,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${seekAiKey}`,
                },
            });
            const text = response.data.choices[0].message.content;
            if (audit)
                await this.logAiCall({ questionId, callType, modelUsed: this.model, keyAlias: 'seekai-primary', inputTokens: response.data?.usage?.prompt_tokens, outputTokens: response.data?.usage?.completion_tokens, success: true });
            return text;
        }
        catch (error) {
            const isRateLimit = error?.response?.status === 429 || error?.response?.data?.error?.message?.includes('rate limit') || error?.response?.data?.error?.message?.includes('1');
            if (error?.response?.data?.error?.code === 'model_not_found' ||
                error?.response?.data?.error?.message?.includes('No available channel') ||
                isRateLimit) {
                this.logger.warn(`Model ${this.model} is dead or rate-limited. Finding fallbacks...`);
                const fallbackModels = await this.fetchAvailableModels();
                let lastError = error;
                for (const fallbackModel of fallbackModels) {
                    if (fallbackModel === this.model)
                        continue;
                    if (!(await this.keyManager.reserveDailyKeyUse('seekai-primary', transaction)))
                        break;
                    try {
                        this.logger.log(`Attempting fallback with model: ${fallbackModel}`);
                        const retryResponse = await axios_1.default.post(this.apiUrl, { model: fallbackModel, messages, max_tokens: maxTokens, temperature: 0.3 }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seekAiKey}` } });
                        this.model = fallbackModel;
                        const text = retryResponse.data.choices[0].message.content;
                        if (audit)
                            await this.logAiCall({ questionId, callType, modelUsed: fallbackModel, keyAlias: 'seekai-primary', inputTokens: retryResponse.data?.usage?.prompt_tokens, outputTokens: retryResponse.data?.usage?.completion_tokens, success: true });
                        return text;
                    }
                    catch (retryError) {
                        this.logger.warn(`Fallback model ${fallbackModel} failed (${retryError?.response?.status || retryError?.code || 'provider_error'}).`);
                        lastError = retryError;
                    }
                }
                const isRetryRateLimit = lastError?.response?.status === 429 || lastError?.response?.data?.error?.message?.includes('rate limit');
                if (isRetryRateLimit) {
                    throw new common_1.InternalServerErrorException('AI Tutor is currently busy. Please wait a minute and try again (Rate Limit Exceeded).');
                }
                throw new common_1.InternalServerErrorException('Failed to generate AI response after model rotation.');
            }
            if (error?.response?.data?.error?.code === 'insufficient_user_quota' || error?.response?.data?.error?.message?.includes('insufficient_quota') || error?.response?.data?.error?.message?.includes('Out of funds')) {
                throw new common_1.InternalServerErrorException('Your AI API key has run out of funds. Please top up your SeekAI account or update the SEEKAI_KEY in your Render environment variables.');
            }
            this.logger.error(`Error calling AI API (${error?.response?.status || error?.code || 'provider_error'}).`);
            if (audit)
                await this.logAiCall({ questionId, callType, modelUsed: this.model, keyAlias: 'seekai-primary', success: false, errorCode: error?.response?.status ? `http_${error.response.status}` : 'provider_error' });
            throw new common_1.InternalServerErrorException('Failed to generate AI response. The AI provider is temporarily unavailable.');
        }
    }
    async verifyAiAccess(userId, isChat, limitsAlreadyApplied = false) {
        if (!limitsAlreadyApplied)
            await this.explanationCache.enforceLiveLimits(userId);
        const featureName = isChat ? 'ai_tutor_chat' : 'essay_grading';
        const idempotencyKey = `cbt_${featureName}_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        let targetUserId = userId;
        try {
            const [u] = await this.db
                .select({ aurikrex_id: schema.users.aurikrex_id, email: schema.users.email })
                .from(schema.users)
                .where((0, drizzle_orm_1.eq)(schema.users.id, userId))
                .limit(1);
            if (u?.aurikrex_id)
                targetUserId = u.aurikrex_id;
            else if (u?.email)
                targetUserId = u.email;
        }
        catch { }
        try {
            const centralResult = await this.centralService.deductCoins({
                userId: targetUserId,
                featureName,
                idempotencyKey,
            });
            const remainingCoins = centralResult.remainingCoins ?? centralResult.balance;
            if (typeof remainingCoins === 'number') {
                try {
                    await this.db
                        .update(schema.users)
                        .set({ auri_coins_balance: remainingCoins })
                        .where((0, drizzle_orm_1.eq)(schema.users.id, userId));
                }
                catch { }
            }
            return {
                remainingCoins,
                nextResetDate: centralResult.nextResetDate,
                idempotencyKey,
            };
        }
        catch (err) {
            this.logger.warn(`Central coin deduction fallback to local coin balance: ${err?.message || err}`);
            return this.coinsService.deductCoins(userId, 'cbt', featureName, 5);
        }
    }
    async generateDiagram(questionId) {
        const question = await this.questionsService.getQuestionById(questionId);
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        if (question.diagram_svg) {
            return question.diagram_svg;
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
        svgContent = svgContent.replace(/```xml/gi, '').replace(/```svg/gi, '').replace(/```/g, '').trim();
        await this.questionsService.saveDiagramSVG(questionId, svgContent);
        return svgContent;
    }
    async generateExplanation(userId, questionText, correctAnswer, studentAnswer, questionId) {
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
        if (questionId && explanation.includes('```json')) {
            try {
                const jsonMatch = explanation.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch && jsonMatch[1]) {
                    const parsed = JSON.parse(jsonMatch[1]);
                    if (parsed.vettedError && parsed.trueCorrectOptionText) {
                        this.logger.warn(`AI vetted an error in Question ${questionId}. System said ${correctAnswer}, AI says ${parsed.trueCorrectOptionText}`);
                        explanation = explanation.replace(/```json\n[\s\S]*?\n```/, '').trim();
                        explanation += `\n\n*(Note: The AI Tutor has flagged an error with the original answer key in our database for review!)*`;
                    }
                }
            }
            catch (e) {
                this.logger.error('Failed to parse vetting JSON', e);
            }
        }
        return { explanation, remainingCoins: coinResult.remainingCoins, nextResetDate: coinResult.nextResetDate };
    }
    async generateCachedStandardExplanation(userId, questionId) {
        const [question] = await this.db.select().from(schema.questions)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId)).limit(1);
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        const [user] = await this.db.select({ id: schema.users.id, role: schema.users.role })
            .from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        if (user.role === 'student' && question.status !== 'published') {
            throw new common_1.ForbiddenException('Only published questions are visible to students.');
        }
        const wallet = await this.coinsService.getCoinsBalance(userId);
        let coinResult = null;
        const result = await this.explanationCache.explain({
            userId,
            question,
            remaining: null,
            generate: async (messages, transaction) => {
                coinResult = await this.verifyAiAccess(userId, false, true);
                let completion;
                try {
                    completion = await this.callMistralApiWithMetadata(messages, 500, 'explanation', questionId, false, transaction);
                }
                catch {
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
    async reportExplanation(userId, questionId, reason) {
        const [user] = await this.db.select({ role: schema.users.role }).from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const [question] = await this.db.select({ status: schema.questions.status }).from(schema.questions).where((0, drizzle_orm_1.eq)(schema.questions.id, questionId)).limit(1);
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        if (user.role === 'student' && question.status !== 'published') {
            throw new common_1.ForbiddenException('Only published questions are visible to students.');
        }
        return this.explanationCache.report({ userId, questionId, reason });
    }
    async prewarmExplanation(questionId) {
        const [question] = await this.db.select().from(schema.questions)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId)).limit(1);
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        return this.explanationCache.prewarm(question, async (messages, transaction) => {
            try {
                return await this.callMistralApiWithMetadata(messages, 500, 'prewarm', questionId, false, transaction);
            }
            catch {
                const text = await this.callDigitalOceanApi(messages, 500, 'prewarm', questionId, false, transaction);
                return { text, modelUsed: 'configured-fallback-provider', keyAlias: 'fallback-provider-chain' };
            }
        });
    }
    async getChatSessions(userId) {
        return this.db.select({
            id: schema.chat_sessions.id,
            userId: schema.chat_sessions.userId,
            title: schema.chat_sessions.title,
            createdAt: schema.chat_sessions.createdAt,
            updatedAt: schema.chat_sessions.updatedAt,
        })
            .from(schema.chat_sessions)
            .where((0, drizzle_orm_1.eq)(schema.chat_sessions.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema.chat_sessions.updatedAt));
    }
    async getChatSession(userId, sessionId) {
        const sessions = await this.db.select()
            .from(schema.chat_sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.chat_sessions.id, sessionId), (0, drizzle_orm_1.eq)(schema.chat_sessions.userId, userId)))
            .limit(1);
        const session = sessions[0];
        if (!session)
            throw new common_1.NotFoundException('Chat session not found');
        if (typeof session.messages === 'string') {
            try {
                session.messages = JSON.parse(session.messages);
            }
            catch (e) {
                session.messages = [];
            }
        }
        return session;
    }
    async createChatSession(userId, title) {
        const sessions = await this.db.insert(schema.chat_sessions).values({
            id: (0, crypto_1.randomUUID)(),
            userId,
            title,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();
        return sessions[0];
    }
    async deleteChatSession(userId, sessionId) {
        const result = await this.db.delete(schema.chat_sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.chat_sessions.id, sessionId), (0, drizzle_orm_1.eq)(schema.chat_sessions.userId, userId)))
            .returning();
        if (result.length === 0)
            throw new common_1.NotFoundException('Chat session not found');
        return { success: true };
    }
    async chatWithTutor(userId, userMessage, chatHistory, contextPayload, sessionId) {
        const coinResult = await this.verifyAiAccess(userId, true);
        let session = null;
        if (sessionId) {
            const sessions = await this.db.select()
                .from(schema.chat_sessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.chat_sessions.id, sessionId), (0, drizzle_orm_1.eq)(schema.chat_sessions.userId, userId)))
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
                }
                else if (Array.isArray(session.messages)) {
                    parsedMessages = session.messages;
                }
            }
            catch (e) {
                parsedMessages = [];
            }
            const messagesArr = parsedMessages;
            messagesArr.push({ role: 'user', content: userMessage, timestamp: new Date() });
            messagesArr.push({ role: 'assistant', content: reply, timestamp: new Date() });
            await this.db.update(schema.chat_sessions)
                .set({ messages: messagesArr, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema.chat_sessions.id, session.id));
        }
        return { reply, remainingCoins: coinResult.remainingCoins, nextResetDate: coinResult.nextResetDate };
    }
    async generateQuestionsBatch(subject, count, topic) {
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
            const rawResponse = await this.callDigitalOceanApi(messages, 4000, 'question_generation');
            let jsonStr = rawResponse.trim();
            const match = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (match) {
                jsonStr = match[0];
            }
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to generate questions batch for ${subject}`, error.message);
            return [];
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase,
        questions_service_1.QuestionsService,
        coins_service_1.CoinsService,
        central_service_1.CentralService,
        config_1.ConfigService,
        explanation_cache_service_1.ExplanationCacheService,
        ai_key_manager_service_1.AiKeyManagerService])
], AiService);
function positiveConfigInt(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
function isTransientProviderFailure(error) {
    const status = Number(error?.response?.status || 0);
    const code = String(error?.code || '').toUpperCase();
    return status === 408 || status === 425 || status >= 500 || ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN'].includes(code);
}
//# sourceMappingURL=ai.service.js.map