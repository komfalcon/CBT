import { BadRequestException, HttpException, Injectable, Logger, ServiceUnavailableException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createHmac, randomUUID } from 'crypto';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { buildStandardExplanationMessages, hashQuestionContent, singleFlight, validateExplanationOutput } from './explanation-cache.utils';

export type CanonicalQuestion = typeof schema.questions.$inferSelect;
export type GeneratedExplanation = {
  text: string;
  modelUsed: string;
  keyAlias?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  remaining?: number | null;
};
export type ExplanationResult = { explanation: string; remaining: number | null; cached: boolean; reportable?: boolean };

const PROMPT_VERSION = process.env.PROMPT_VERSION || 'expl-v1';
const FAILURE_FALLBACK = 'AI explanations are temporarily unavailable. Please try again shortly.';
const GLOBAL_RESTING_MESSAGE = 'AI help is resting, back tomorrow. Please try again tomorrow.';
const USER_DAILY_MESSAGE = "You've used today's AI help. It resets tomorrow.";
const USER_MINUTE_MESSAGE = "You've made several AI requests recently. Please wait a minute and try again.";

@Injectable()
export class ExplanationCacheService {
  private readonly logger = new Logger(ExplanationCacheService.name);
  private readonly inFlight = new Map<string, Promise<ExplanationResult>>();

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly config: ConfigService,
  ) {}

  isEnabled(): boolean {
    return this.config.get<string>('CBT_EXPLANATION_CACHE_ENABLED', 'false').toLowerCase() === 'true';
  }

  getPromptVersion(): string {
    return this.config.get<string>('PROMPT_VERSION', PROMPT_VERSION);
  }

  async explain(params: {
    userId: string;
    question: CanonicalQuestion;
    remaining: number | null;
    generate: (messages: ReturnType<typeof buildStandardExplanationMessages>, transaction?: any) => Promise<GeneratedExplanation>;
    prewarm?: boolean;
  }): Promise<ExplanationResult> {
    const questionId = params.question.id;
    const promptVersion = this.getPromptVersion();
    const contentHash = hashQuestionContent(params.question as unknown as Parameters<typeof hashQuestionContent>[0]);
    const lockKey = `${questionId}:${promptVersion}`;

    const cached = await this.readCurrent(questionId, promptVersion);
    if (cached?.status === 'active' && cached.contentHash === contentHash) {
      const hit = await this.serveHit(cached, params.remaining);
      if (hit) return hit;
    }

    const pending = this.inFlight.get(lockKey);
    if (pending) {
      const generated = await pending;
      const reusable = await this.readCurrent(questionId, promptVersion);
      if (reusable?.status === 'active' && reusable.contentHash === contentHash) {
        const hit = await this.serveHit(reusable, params.remaining);
        if (hit) return hit;
      }
      const unavailable = isUnavailableExplanation(generated.explanation);
      if (reusable) {
        // A stale or concurrently flagged revision must be rechecked under the cross-replica lock.
        if (unavailable) return generated;
        await Promise.resolve();
        return singleFlight(this.inFlight, lockKey, () => this.generateWithLock({
          ...params,
          questionId,
          promptVersion,
          contentHash,
        }));
      }
      return generated;
    }

    return singleFlight(this.inFlight, lockKey, () => this.generateWithLock({
      ...params,
      questionId,
      promptVersion,
      contentHash,
    }));
  }

  private async readCurrent(questionId: string, promptVersion: string) {
    const [row] = await this.db.select().from(schema.questionExplanations)
      .where(and(eq(schema.questionExplanations.questionId, questionId), eq(schema.questionExplanations.promptVersion, promptVersion)))
      .limit(1);
    return row;
  }

  private async serveHit(row: typeof schema.questionExplanations.$inferSelect, remaining: number | null): Promise<ExplanationResult | null> {
    const updated = await this.db.update(schema.questionExplanations)
      .set({ hitCount: sql`${schema.questionExplanations.hitCount} + 1`, lastServedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.questionExplanations.id, row.id), eq(schema.questionExplanations.status, 'active')))
      .returning({ id: schema.questionExplanations.id });
    if (!updated.length) return null;
    await this.recordCacheEvent(row.questionId, 'hit');
    return { explanation: row.explanationText, remaining, cached: true, reportable: true };
  }

  private async generateWithLock(params: {
    userId: string;
    question: CanonicalQuestion;
    remaining: number | null;
    generate: (messages: ReturnType<typeof buildStandardExplanationMessages>, transaction?: any) => Promise<GeneratedExplanation>;
    prewarm?: boolean;
    questionId: string;
    promptVersion: string;
    contentHash: string;
  }): Promise<ExplanationResult> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const lockKey = `${params.questionId}:${params.promptVersion}`;
        // A transaction-scoped PostgreSQL lock coordinates separate app replicas and is released on every exit path.
        const lockTimeout = positiveInt(this.config.get<string>('CBT_CACHE_LOCK_TIMEOUT_MS'), 30000);
        await tx.execute(sql`SELECT set_config('lock_timeout', ${`${lockTimeout}ms`}, true)`);
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
        let [existing] = await tx.select().from(schema.questionExplanations)
          .where(and(eq(schema.questionExplanations.questionId, params.questionId), eq(schema.questionExplanations.promptVersion, params.promptVersion)))
          .limit(1);

        if (existing?.status === 'active' && existing.contentHash === params.contentHash) {
          const hitUpdate = await tx.update(schema.questionExplanations)
            .set({ hitCount: sql`${schema.questionExplanations.hitCount} + 1`, lastServedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(schema.questionExplanations.id, existing.id), eq(schema.questionExplanations.status, 'active')))
            .returning({ id: schema.questionExplanations.id });
          if (hitUpdate.length) {
            await tx.insert(schema.questionExplanationEvents).values({ id: randomUUID(), questionId: params.questionId, eventType: 'hit', createdAt: new Date() });
            return { result: { explanation: existing.explanationText, remaining: params.remaining, cached: true, reportable: true } as ExplanationResult };
          }
          [existing] = await tx.select().from(schema.questionExplanations)
            .where(and(eq(schema.questionExplanations.questionId, params.questionId), eq(schema.questionExplanations.promptVersion, params.promptVersion)))
            .limit(1);
        }

        await tx.insert(schema.questionExplanationEvents).values({ id: randomUUID(), questionId: params.questionId, eventType: 'miss', createdAt: new Date() });

        if (!params.prewarm) {
          const minuteCount = await this.incrementCounter(tx, 'user', params.userId, 'minute', utcBucket('minute'), positiveInt(this.config.get<string>('CBT_USER_PER_MINUTE_LIMIT'), 3));
          if (!minuteCount) {
            return { result: { explanation: USER_MINUTE_MESSAGE, remaining: params.remaining, cached: false } as ExplanationResult };
          }
          const dayCount = await this.incrementCounter(tx, 'user', params.userId, 'day', utcBucket('day'), positiveInt(this.config.get<string>('CBT_USER_DAILY_AI_LIMIT'), 20));
          if (!dayCount) {
            return { result: { explanation: USER_DAILY_MESSAGE, remaining: params.remaining, cached: false } as ExplanationResult };
          }
        }

        const globalCap = positiveInt(this.config.get<string>('CBT_GLOBAL_DAILY_AI_CAP'), 0);
        if (!globalCap) {
          this.logger.error('CBT_GLOBAL_DAILY_AI_CAP must be configured before uncached explanation generation is enabled.');
          return { result: { explanation: GLOBAL_RESTING_MESSAGE, remaining: params.remaining, cached: false } as ExplanationResult };
        }
        const globalCount = await this.incrementCounter(tx, 'global', 'cbt', 'day', utcBucket('day'), globalCap);
        if (!globalCount) {
          return { result: { explanation: GLOBAL_RESTING_MESSAGE, remaining: params.remaining, cached: false } as ExplanationResult };
        }

        const messages = buildStandardExplanationMessages(params.question as unknown as Parameters<typeof buildStandardExplanationMessages>[0]);
        let generated: GeneratedExplanation;
        try {
          generated = await params.generate(messages, tx);
        } catch (error: any) {
          if (error instanceof BadRequestException) {
            const response = error.getResponse() as any;
            const message = typeof response === 'string' ? response : Array.isArray(response?.message) ? response.message.join(' ') : response?.message;
            return { result: { explanation: message || error.message, remaining: params.remaining, cached: false } as ExplanationResult };
          }
          if (error instanceof HttpException) throw error;
          await this.writeCallLog({ questionId: params.questionId, callType: params.prewarm ? 'prewarm' : 'explanation', success: false, errorCode: safeErrorCode(error) }, tx);
          this.logger.warn(`Explanation generation failed for question ${params.questionId}: ${safeErrorCode(error)}`);
          return { result: { explanation: FAILURE_FALLBACK, remaining: params.remaining, cached: false } as ExplanationResult };
        }

        const validation = validateExplanationOutput(generated.text);
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
          return { result: { explanation: FAILURE_FALLBACK, remaining: params.remaining, cached: false } as ExplanationResult };
        }

        if (existing) {
          await tx.insert(schema.questionExplanationHistory).values({
            id: randomUUID(), explanationId: existing.id, questionId: existing.questionId, promptVersion: existing.promptVersion,
            contentHash: existing.contentHash, explanationText: existing.explanationText,
            modelUsed: existing.modelUsed,
            status: existing.status === 'active' && existing.contentHash !== params.contentHash ? 'superseded' : existing.status,
            archivedAt: new Date(),
          });
        }

        const now = new Date();
        await tx.insert(schema.questionExplanations).values({
          id: randomUUID(), questionId: params.questionId, contentHash: params.contentHash,
          promptVersion: params.promptVersion, explanationText: generated.text.trim(),
          modelUsed: generated.modelUsed || 'unknown', status: 'active', reportCount: 0,
          hitCount: 0, createdAt: now, updatedAt: now, lastServedAt: now,
        }).onConflictDoUpdate({
          target: [schema.questionExplanations.questionId, schema.questionExplanations.promptVersion],
          set: {
            id: randomUUID(), contentHash: params.contentHash, explanationText: generated.text.trim(),
            modelUsed: generated.modelUsed || 'unknown', status: 'active', reportCount: 0,
            hitCount: 0, updatedAt: now, lastServedAt: now,
          },
        });

        await tx.insert(schema.aiCallLogs).values({
          id: randomUUID(), questionId: params.questionId,
          callType: params.prewarm ? 'prewarm' : 'explanation', modelUsed: generated.modelUsed,
          keyAlias: generated.keyAlias ?? null, inputTokens: generated.inputTokens ?? null,
          outputTokens: generated.outputTokens ?? null, success: true, createdAt: now,
        });
        return { result: { explanation: generated.text.trim(), remaining: generated.remaining ?? params.remaining, cached: false, reportable: true } as ExplanationResult };
      }, { isolationLevel: 'read committed' });
      return result.result;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Cache generation transaction failed for question ${params.questionId}: ${safeErrorCode(error)}`);
      return { explanation: FAILURE_FALLBACK, remaining: params.remaining, cached: false };
    }
  }

  private async incrementCounter(tx: any, scopeType: string, scopeKey: string, bucketType: string, bucketStart: Date, cap?: number): Promise<number> {
    try {
      const bucketStartIso = bucketStart.toISOString();
      const result: any = await tx.execute(sql`
        INSERT INTO ai_usage_counters (id, scope_type, scope_key, bucket_type, bucket_start, count, updated_at)
        VALUES (${randomUUID()}, ${scopeType}, ${scopeKey}, ${bucketType}, ${bucketStartIso}::timestamp, 1, now())
        ON CONFLICT (scope_type, scope_key, bucket_type, bucket_start)
        DO UPDATE SET count = ai_usage_counters.count + 1, updated_at = now()
        ${cap ? sql`WHERE ai_usage_counters.count < ${cap}` : sql``}
        RETURNING count
      `);
      const rows = Array.isArray(result) ? result : result.rows;
      return rows && rows.length > 0 ? Number(rows[0].count) : 0;
    } catch (err: any) {
      this.logger.warn(`ai_usage_counters counter bypass: ${err?.message || err}`);
      return 1;
    }
  }

  async enforceLiveLimits(userId: string): Promise<void> {
    const outcome = await this.db.transaction(async (tx) => {
      const minute = await this.incrementCounter(tx, 'user', userId, 'minute', utcBucket('minute'), positiveInt(this.config.get<string>('CBT_USER_PER_MINUTE_LIMIT'), 3));
      if (!minute) return 'minute';
      const day = await this.incrementCounter(tx, 'user', userId, 'day', utcBucket('day'), positiveInt(this.config.get<string>('CBT_USER_DAILY_AI_LIMIT'), 20));
      if (!day) return 'day';
      const globalCap = positiveInt(this.config.get<string>('CBT_GLOBAL_DAILY_AI_CAP'), 0);
      if (!globalCap) return 'global';
      const global = await this.incrementCounter(tx, 'global', 'cbt', 'day', utcBucket('day'), globalCap);
      return global ? null : 'global';
    });
    if (outcome === 'minute') throw new BadRequestException(USER_MINUTE_MESSAGE);
    if (outcome === 'day') throw new BadRequestException(USER_DAILY_MESSAGE);
    if (outcome === 'global') throw new BadRequestException(GLOBAL_RESTING_MESSAGE);
  }

  async enforceGlobalLiveLimit(): Promise<void> {
    const cap = positiveInt(this.config.get<string>('CBT_GLOBAL_DAILY_AI_CAP'), 0);
    if (!cap) throw new BadRequestException(GLOBAL_RESTING_MESSAGE);
    const count = await this.db.transaction((tx) => this.incrementCounter(tx, 'global', 'cbt', 'day', utcBucket('day'), cap));
    if (!count) throw new BadRequestException(GLOBAL_RESTING_MESSAGE);
  }

  private async writeCallLog(params: {
    questionId?: string;
    callType: string;
    modelUsed?: string;
    keyAlias?: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    success: boolean;
    errorCode?: string;
  }, executor: any = this.db): Promise<void> {
    try {
      await executor.insert(schema.aiCallLogs).values({
        id: randomUUID(), questionId: params.questionId ?? null, callType: params.callType,
        modelUsed: params.modelUsed ?? null, keyAlias: params.keyAlias ?? null,
        inputTokens: params.inputTokens ?? null, outputTokens: params.outputTokens ?? null,
        success: params.success, errorCode: params.errorCode?.slice(0, 120) ?? null,
        createdAt: new Date(),
      });
    } catch (error: any) {
      this.logger.warn(`Could not write AI call audit row (${safeErrorCode(error)}).`);
    }
  }

  private async recordCacheEvent(questionId: string, eventType: 'hit' | 'miss'): Promise<void> {
    try {
      await this.db.insert(schema.questionExplanationEvents).values({ id: randomUUID(), questionId, eventType, createdAt: new Date() });
    } catch (error: any) {
      this.logger.warn(`Could not write cache event (${safeErrorCode(error)}).`);
    }
  }

  async report(params: { userId: string; questionId: string; reason?: string }): Promise<{ reported: boolean; flagged: boolean; reportCount: number }> {
    const promptVersion = this.getPromptVersion();
    const [current] = await this.db.select().from(schema.questionExplanations)
      .where(and(eq(schema.questionExplanations.questionId, params.questionId), eq(schema.questionExplanations.promptVersion, promptVersion)))
      .limit(1);
    if (!current || current.status !== 'active') throw new ServiceUnavailableException('This explanation is not available to report.');

    const hashSecret = this.config.get<string>('CBT_REPORT_HASH_SECRET') || this.config.get<string>('JWT_PRIVATE_KEY');
    if (!hashSecret) throw new ServiceUnavailableException('Explanation reporting is not configured.');
    const reporterHash = createHmac('sha256', hashSecret)
      .update(params.userId).digest('hex');
    const reportLimit = positiveInt(this.config.get<string>('CBT_USER_DAILY_EXPLANATION_REPORT_LIMIT'), 5);
    const reason = params.reason?.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 500) || null;
    const threshold = positiveInt(this.config.get<string>('REPORT_FLAG_THRESHOLD'), 3);
    return this.db.transaction(async (tx) => {
      const [duplicate] = await tx.select().from(schema.questionExplanationReports)
        .where(and(
          eq(schema.questionExplanationReports.explanationId, current.id),
          eq(schema.questionExplanationReports.reporterHash, reporterHash),
        )).limit(1);
      if (duplicate) return { reported: false, flagged: false, reportCount: current.reportCount };

      const reportCountToday = await this.incrementCounter(tx, 'reporter', reporterHash, 'report_day', utcBucket('day'), reportLimit);
      if (!reportCountToday) throw new BadRequestException('You have reached today’s explanation-report limit. Please try again tomorrow.');
      const inserted = await tx.insert(schema.questionExplanationReports).values({
        id: randomUUID(), explanationId: current.id, questionId: params.questionId, promptVersion,
        contentHash: current.contentHash, reporterHash, reason, createdAt: new Date(),
      }).onConflictDoNothing().returning({ id: schema.questionExplanationReports.id });
      if (!inserted.length) return { reported: false, flagged: false, reportCount: current.reportCount };

      const updated = await tx.update(schema.questionExplanations)
        .set({ reportCount: sql`${schema.questionExplanations.reportCount} + 1`, updatedAt: new Date() })
        .where(and(eq(schema.questionExplanations.id, current.id), eq(schema.questionExplanations.status, 'active')))
        .returning({ reportCount: schema.questionExplanations.reportCount });
      const reportCount = Number(updated[0]?.reportCount ?? current.reportCount);
      const flagged = reportCount >= threshold;
      if (flagged) {
        await tx.update(schema.questionExplanations)
          .set({ status: 'flagged', updatedAt: new Date() })
          .where(eq(schema.questionExplanations.id, current.id));
      }
      return { reported: true, flagged, reportCount };
    });
  }

  async prewarm(question: CanonicalQuestion, generate: (messages: ReturnType<typeof buildStandardExplanationMessages>, transaction?: any) => Promise<GeneratedExplanation>): Promise<ExplanationResult> {
    return this.explain({ userId: 'prewarm', question, remaining: null, generate, prewarm: true });
  }
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

function utcBucket(period: 'minute' | 'day'): Date {
  const now = new Date();
  if (period === 'day') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes()));
}

function safeErrorCode(error: any): string {
  const code = error?.response?.status ?? error?.code ?? error?.name ?? 'provider_error';
  return String(code).replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 80) || 'provider_error';
}

function isUnavailableExplanation(text: string): boolean {
  return text === FAILURE_FALLBACK || text === GLOBAL_RESTING_MESSAGE || text === USER_DAILY_MESSAGE ||
    text === USER_MINUTE_MESSAGE || /reached your daily beta limit/i.test(text);
}
