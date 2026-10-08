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
var ExplanationCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplanationCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_orm_1 = require("drizzle-orm");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const crypto_1 = require("crypto");
const database_module_1 = require("../db/database.module");
const schema = __importStar(require("../db/schema"));
const explanation_cache_utils_1 = require("./explanation-cache.utils");
const PROMPT_VERSION = process.env.PROMPT_VERSION || 'expl-v1';
const FAILURE_FALLBACK = 'AI explanations are temporarily unavailable. Please try again shortly.';
const GLOBAL_RESTING_MESSAGE = 'AI help is resting, back tomorrow. Please try again tomorrow.';
const USER_DAILY_MESSAGE = "You've used today's AI help. It resets tomorrow.";
const USER_MINUTE_MESSAGE = "You've made several AI requests recently. Please wait a minute and try again.";
let ExplanationCacheService = ExplanationCacheService_1 = class ExplanationCacheService {
    constructor(db, config) {
        this.db = db;
        this.config = config;
        this.logger = new common_1.Logger(ExplanationCacheService_1.name);
        this.inFlight = new Map();
    }
    isEnabled() {
        return this.config.get('CBT_EXPLANATION_CACHE_ENABLED', 'false').toLowerCase() === 'true';
    }
    getPromptVersion() {
        return this.config.get('PROMPT_VERSION', PROMPT_VERSION);
    }
    async explain(params) {
        const questionId = params.question.id;
        const promptVersion = this.getPromptVersion();
        const contentHash = (0, explanation_cache_utils_1.hashQuestionContent)(params.question);
        const lockKey = `${questionId}:${promptVersion}`;
        const cached = await this.readCurrent(questionId, promptVersion);
        if (cached?.status === 'active' && cached.contentHash === contentHash) {
            const hit = await this.serveHit(cached, params.remaining);
            if (hit)
                return hit;
        }
        const pending = this.inFlight.get(lockKey);
        if (pending) {
            const generated = await pending;
            const reusable = await this.readCurrent(questionId, promptVersion);
            if (reusable?.status === 'active' && reusable.contentHash === contentHash) {
                const hit = await this.serveHit(reusable, params.remaining);
                if (hit)
                    return hit;
            }
            const unavailable = isUnavailableExplanation(generated.explanation);
            if (reusable) {
                if (unavailable)
                    return generated;
                await Promise.resolve();
                return (0, explanation_cache_utils_1.singleFlight)(this.inFlight, lockKey, () => this.generateWithLock({
                    ...params,
                    questionId,
                    promptVersion,
                    contentHash,
                }));
            }
            return generated;
        }
        return (0, explanation_cache_utils_1.singleFlight)(this.inFlight, lockKey, () => this.generateWithLock({
            ...params,
            questionId,
            promptVersion,
            contentHash,
        }));
    }
    async readCurrent(questionId, promptVersion) {
        const [row] = await this.db.select().from(schema.questionExplanations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questionExplanations.questionId, questionId), (0, drizzle_orm_1.eq)(schema.questionExplanations.promptVersion, promptVersion)))
            .limit(1);
        return row;
    }
    async serveHit(row, remaining) {
        const updated = await this.db.update(schema.questionExplanations)
            .set({ hitCount: (0, drizzle_orm_1.sql) `${schema.questionExplanations.hitCount} + 1`, lastServedAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questionExplanations.id, row.id), (0, drizzle_orm_1.eq)(schema.questionExplanations.status, 'active')))
            .returning({ id: schema.questionExplanations.id });
        if (!updated.length)
            return null;
        await this.recordCacheEvent(row.questionId, 'hit');
        return { explanation: row.explanationText, remaining, cached: true, reportable: true };
    }
    async generateWithLock(params) {
        try {
            const result = await this.db.transaction(async (tx) => {
                const lockKey = `${params.questionId}:${params.promptVersion}`;
                const lockTimeout = positiveInt(this.config.get('CBT_CACHE_LOCK_TIMEOUT_MS'), 30000);
                await tx.execute((0, drizzle_orm_1.sql) `SELECT set_config('lock_timeout', ${`${lockTimeout}ms`}, true)`);
                await tx.execute((0, drizzle_orm_1.sql) `SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
                let [existing] = await tx.select().from(schema.questionExplanations)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questionExplanations.questionId, params.questionId), (0, drizzle_orm_1.eq)(schema.questionExplanations.promptVersion, params.promptVersion)))
                    .limit(1);
                if (existing?.status === 'active' && existing.contentHash === params.contentHash) {
                    const hitUpdate = await tx.update(schema.questionExplanations)
                        .set({ hitCount: (0, drizzle_orm_1.sql) `${schema.questionExplanations.hitCount} + 1`, lastServedAt: new Date(), updatedAt: new Date() })
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questionExplanations.id, existing.id), (0, drizzle_orm_1.eq)(schema.questionExplanations.status, 'active')))
                        .returning({ id: schema.questionExplanations.id });
                    if (hitUpdate.length) {
                        await tx.insert(schema.questionExplanationEvents).values({ id: (0, crypto_1.randomUUID)(), questionId: params.questionId, eventType: 'hit', createdAt: new Date() });
                        return { result: { explanation: existing.explanationText, remaining: params.remaining, cached: true, reportable: true } };
                    }
                    [existing] = await tx.select().from(schema.questionExplanations)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questionExplanations.questionId, params.questionId), (0, drizzle_orm_1.eq)(schema.questionExplanations.promptVersion, params.promptVersion)))
                        .limit(1);
                }
                await tx.insert(schema.questionExplanationEvents).values({ id: (0, crypto_1.randomUUID)(), questionId: params.questionId, eventType: 'miss', createdAt: new Date() });
                if (!params.prewarm) {
                    const minuteCount = await this.incrementCounter(tx, 'user', params.userId, 'minute', utcBucket('minute'), positiveInt(this.config.get('CBT_USER_PER_MINUTE_LIMIT'), 3));
                    if (!minuteCount) {
                        return { result: { explanation: USER_MINUTE_MESSAGE, remaining: params.remaining, cached: false } };
                    }
                    const dayCount = await this.incrementCounter(tx, 'user', params.userId, 'day', utcBucket('day'), positiveInt(this.config.get('CBT_USER_DAILY_AI_LIMIT'), 20));
                    if (!dayCount) {
                        return { result: { explanation: USER_DAILY_MESSAGE, remaining: params.remaining, cached: false } };
                    }
                }
                const globalCap = positiveInt(this.config.get('CBT_GLOBAL_DAILY_AI_CAP'), 10000);
                if (!globalCap) {
                    this.logger.error('CBT_GLOBAL_DAILY_AI_CAP must be configured before uncached explanation generation is enabled.');
                    return { result: { explanation: GLOBAL_RESTING_MESSAGE, remaining: params.remaining, cached: false } };
                }
                const globalCount = await this.incrementCounter(tx, 'global', 'cbt', 'day', utcBucket('day'), globalCap);
                if (!globalCount) {
                    return { result: { explanation: GLOBAL_RESTING_MESSAGE, remaining: params.remaining, cached: false } };
                }
                const messages = (0, explanation_cache_utils_1.buildStandardExplanationMessages)(params.question);
                let generated;
                try {
                    generated = await params.generate(messages, tx);
                }
                catch (error) {
                    if (error instanceof common_1.BadRequestException) {
                        const response = error.getResponse();
                        const message = typeof response === 'string' ? response : Array.isArray(response?.message) ? response.message.join(' ') : response?.message;
                        return { result: { explanation: message || error.message, remaining: params.remaining, cached: false } };
                    }
                    if (error instanceof common_1.HttpException)
                        throw error;
                    await this.writeCallLog({ questionId: params.questionId, callType: params.prewarm ? 'prewarm' : 'explanation', success: false, errorCode: safeErrorCode(error) }, tx);
                    this.logger.warn(`Explanation generation failed for question ${params.questionId}: ${safeErrorCode(error)}`);
                    return { result: { explanation: FAILURE_FALLBACK, remaining: params.remaining, cached: false } };
                }
                const validation = (0, explanation_cache_utils_1.validateExplanationOutput)(generated.text);
                if (!validation.valid) {
                    await this.writeCallLog({
                        questionId: params.questionId,
                        callType: params.prewarm ? 'prewarm' : 'explanation',
                        modelUsed: generated.modelUsed,
                        keyAlias: generated.keyAlias,
                        inputTokens: generated.inputTokens,
                        outputTokens: generated.outputTokens,
                        success: false,
                        errorCode: `invalid_output:${validation.reason}`,
                    }, tx);
                    this.logger.warn(`Rejected invalid explanation output for question ${params.questionId}: ${validation.reason}`);
                    return { result: { explanation: FAILURE_FALLBACK, remaining: params.remaining, cached: false } };
                }
                if (existing) {
                    await tx.insert(schema.questionExplanationHistory).values({
                        id: (0, crypto_1.randomUUID)(), explanationId: existing.id, questionId: existing.questionId, promptVersion: existing.promptVersion,
                        contentHash: existing.contentHash, explanationText: existing.explanationText,
                        modelUsed: existing.modelUsed,
                        status: existing.status === 'active' && existing.contentHash !== params.contentHash ? 'superseded' : existing.status,
                        archivedAt: new Date(),
                    });
                }
                const now = new Date();
                await tx.insert(schema.questionExplanations).values({
                    id: (0, crypto_1.randomUUID)(), questionId: params.questionId, contentHash: params.contentHash,
                    promptVersion: params.promptVersion, explanationText: generated.text.trim(),
                    modelUsed: generated.modelUsed || 'unknown', status: 'active', reportCount: 0,
                    hitCount: 0, createdAt: now, updatedAt: now, lastServedAt: now,
                }).onConflictDoUpdate({
                    target: [schema.questionExplanations.questionId, schema.questionExplanations.promptVersion],
                    set: {
                        id: (0, crypto_1.randomUUID)(), contentHash: params.contentHash, explanationText: generated.text.trim(),
                        modelUsed: generated.modelUsed || 'unknown', status: 'active', reportCount: 0,
                        hitCount: 0, updatedAt: now, lastServedAt: now,
                    },
                });
                await tx.insert(schema.aiCallLogs).values({
                    id: (0, crypto_1.randomUUID)(), questionId: params.questionId,
                    callType: params.prewarm ? 'prewarm' : 'explanation', modelUsed: generated.modelUsed,
                    keyAlias: generated.keyAlias ?? null, inputTokens: generated.inputTokens ?? null,
                    outputTokens: generated.outputTokens ?? null, success: true, createdAt: now,
                });
                return { result: { explanation: generated.text.trim(), remaining: generated.remaining ?? params.remaining, cached: false, reportable: true } };
            }, { isolationLevel: 'read committed' });
            return result.result;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Cache generation transaction failed for question ${params.questionId}: ${safeErrorCode(error)}`);
            return { explanation: FAILURE_FALLBACK, remaining: params.remaining, cached: false };
        }
    }
    async incrementCounter(tx, scopeType, scopeKey, bucketType, bucketStart, cap) {
        try {
            const bucketStartIso = bucketStart.toISOString();
            const result = await tx.execute((0, drizzle_orm_1.sql) `
        INSERT INTO ai_usage_counters (id, scope_type, scope_key, bucket_type, bucket_start, count, updated_at)
        VALUES (${(0, crypto_1.randomUUID)()}, ${scopeType}, ${scopeKey}, ${bucketType}, ${bucketStartIso}::timestamp, 1, now())
        ON CONFLICT (scope_type, scope_key, bucket_type, bucket_start)
        DO UPDATE SET count = ai_usage_counters.count + 1, updated_at = now()
        ${cap ? (0, drizzle_orm_1.sql) `WHERE ai_usage_counters.count < ${cap}` : (0, drizzle_orm_1.sql) ``}
        RETURNING count
      `);
            const rows = Array.isArray(result) ? result : result.rows;
            return rows && rows.length > 0 ? Number(rows[0].count) : 0;
        }
        catch (err) {
            this.logger.warn(`ai_usage_counters counter bypass: ${err?.message || err}`);
            return 1;
        }
    }
    async enforceLiveLimits(userId) {
        const outcome = await this.db.transaction(async (tx) => {
            const minute = await this.incrementCounter(tx, 'user', userId, 'minute', utcBucket('minute'), positiveInt(this.config.get('CBT_USER_PER_MINUTE_LIMIT'), 3));
            if (!minute)
                return 'minute';
            const day = await this.incrementCounter(tx, 'user', userId, 'day', utcBucket('day'), positiveInt(this.config.get('CBT_USER_DAILY_AI_LIMIT'), 20));
            if (!day)
                return 'day';
            const globalCap = positiveInt(this.config.get('CBT_GLOBAL_DAILY_AI_CAP'), 10000);
            if (!globalCap)
                return 'global';
            const global = await this.incrementCounter(tx, 'global', 'cbt', 'day', utcBucket('day'), globalCap);
            return global ? null : 'global';
        });
        if (outcome === 'minute')
            throw new common_1.BadRequestException(USER_MINUTE_MESSAGE);
        if (outcome === 'day')
            throw new common_1.BadRequestException(USER_DAILY_MESSAGE);
        if (outcome === 'global')
            throw new common_1.BadRequestException(GLOBAL_RESTING_MESSAGE);
    }
    async enforceGlobalLiveLimit() {
        const cap = positiveInt(this.config.get('CBT_GLOBAL_DAILY_AI_CAP'), 10000);
        if (!cap)
            throw new common_1.BadRequestException(GLOBAL_RESTING_MESSAGE);
        const count = await this.db.transaction((tx) => this.incrementCounter(tx, 'global', 'cbt', 'day', utcBucket('day'), cap));
        if (!count)
            throw new common_1.BadRequestException(GLOBAL_RESTING_MESSAGE);
    }
    async writeCallLog(params, executor = this.db) {
        try {
            await executor.insert(schema.aiCallLogs).values({
                id: (0, crypto_1.randomUUID)(), questionId: params.questionId ?? null, callType: params.callType,
                modelUsed: params.modelUsed ?? null, keyAlias: params.keyAlias ?? null,
                inputTokens: params.inputTokens ?? null, outputTokens: params.outputTokens ?? null,
                success: params.success, errorCode: params.errorCode?.slice(0, 120) ?? null,
                createdAt: new Date(),
            });
        }
        catch (error) {
            this.logger.warn(`Could not write AI call audit row (${safeErrorCode(error)}).`);
        }
    }
    async recordCacheEvent(questionId, eventType) {
        try {
            await this.db.insert(schema.questionExplanationEvents).values({ id: (0, crypto_1.randomUUID)(), questionId, eventType, createdAt: new Date() });
        }
        catch (error) {
            this.logger.warn(`Could not write cache event (${safeErrorCode(error)}).`);
        }
    }
    async report(params) {
        const promptVersion = this.getPromptVersion();
        const [current] = await this.db.select().from(schema.questionExplanations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questionExplanations.questionId, params.questionId), (0, drizzle_orm_1.eq)(schema.questionExplanations.promptVersion, promptVersion)))
            .limit(1);
        if (!current || current.status !== 'active')
            throw new common_1.ServiceUnavailableException('This explanation is not available to report.');
        const hashSecret = this.config.get('CBT_REPORT_HASH_SECRET') || this.config.get('JWT_PRIVATE_KEY');
        if (!hashSecret)
            throw new common_1.ServiceUnavailableException('Explanation reporting is not configured.');
        const reporterHash = (0, crypto_1.createHmac)('sha256', hashSecret)
            .update(params.userId).digest('hex');
        const reportLimit = positiveInt(this.config.get('CBT_USER_DAILY_EXPLANATION_REPORT_LIMIT'), 5);
        const reason = params.reason?.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 500) || null;
        const threshold = positiveInt(this.config.get('REPORT_FLAG_THRESHOLD'), 3);
        return this.db.transaction(async (tx) => {
            const [duplicate] = await tx.select().from(schema.questionExplanationReports)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questionExplanationReports.explanationId, current.id), (0, drizzle_orm_1.eq)(schema.questionExplanationReports.reporterHash, reporterHash))).limit(1);
            if (duplicate)
                return { reported: false, flagged: false, reportCount: current.reportCount };
            const reportCountToday = await this.incrementCounter(tx, 'reporter', reporterHash, 'report_day', utcBucket('day'), reportLimit);
            if (!reportCountToday)
                throw new common_1.BadRequestException('You have reached today’s explanation-report limit. Please try again tomorrow.');
            const inserted = await tx.insert(schema.questionExplanationReports).values({
                id: (0, crypto_1.randomUUID)(), explanationId: current.id, questionId: params.questionId, promptVersion,
                contentHash: current.contentHash, reporterHash, reason, createdAt: new Date(),
            }).onConflictDoNothing().returning({ id: schema.questionExplanationReports.id });
            if (!inserted.length)
                return { reported: false, flagged: false, reportCount: current.reportCount };
            const updated = await tx.update(schema.questionExplanations)
                .set({ reportCount: (0, drizzle_orm_1.sql) `${schema.questionExplanations.reportCount} + 1`, updatedAt: new Date() })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questionExplanations.id, current.id), (0, drizzle_orm_1.eq)(schema.questionExplanations.status, 'active')))
                .returning({ reportCount: schema.questionExplanations.reportCount });
            const reportCount = Number(updated[0]?.reportCount ?? current.reportCount);
            const flagged = reportCount >= threshold;
            if (flagged) {
                await tx.update(schema.questionExplanations)
                    .set({ status: 'flagged', updatedAt: new Date() })
                    .where((0, drizzle_orm_1.eq)(schema.questionExplanations.id, current.id));
            }
            return { reported: true, flagged, reportCount };
        });
    }
    async prewarm(question, generate) {
        return this.explain({ userId: 'prewarm', question, remaining: null, generate, prewarm: true });
    }
};
exports.ExplanationCacheService = ExplanationCacheService;
exports.ExplanationCacheService = ExplanationCacheService = ExplanationCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase,
        config_1.ConfigService])
], ExplanationCacheService);
function positiveInt(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}
function utcBucket(period) {
    const now = new Date();
    if (period === 'day')
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes()));
}
function safeErrorCode(error) {
    const code = error?.response?.status ?? error?.code ?? error?.name ?? 'provider_error';
    return String(code).replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 80) || 'provider_error';
}
function isUnavailableExplanation(text) {
    return text === FAILURE_FALLBACK || text === GLOBAL_RESTING_MESSAGE || text === USER_DAILY_MESSAGE ||
        text === USER_MINUTE_MESSAGE || /reached your daily beta limit/i.test(text);
}
//# sourceMappingURL=explanation-cache.service.js.map