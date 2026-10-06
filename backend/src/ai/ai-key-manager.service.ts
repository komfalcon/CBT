import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { randomUUID } from 'crypto';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';

type ProviderKey = { alias: string; key: string };

@Injectable()
export class AiKeyManagerService {
  private readonly logger = new Logger(AiKeyManagerService.name);
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly config: ConfigService,
  ) {}

  /** Keys are returned as opaque records so callers can log only the alias. */
  getMistralKeys(): ProviderKey[] {
    const configured: Array<[string, string | undefined]> = [
      ['mistral-chat-primary', this.config.get<string>('MISTRAL_CHAT_API_KEY')],
      ['mistral-chat-alt', this.config.get<string>('MISTRAL_API_KEY_CHAT')],
      ['mistral-primary', this.config.get<string>('MISTRAL_API_KEY')],
      ['mistral-2', this.config.get<string>('MISTRAL_API_KEY_2')],
      ['mistral-3', this.config.get<string>('MISTRAL_API_KEY_3')],
      ['mistral-4', this.config.get<string>('MISTRAL_API_KEY_4')],
    ];
    const keys = configured.filter((entry): entry is [string, string] => Boolean(entry[1])).map(([alias, key]) => ({ alias, key }));
    const generic = this.config.get<string>('AI_API_KEYS', '').split(',').map((key) => key.trim()).filter(Boolean);
    for (const [index, key] of generic.entries()) {
      if (!keys.some((entry) => entry.key === key)) keys.push({ alias: `ai-key-${index + 1}`, key });
    }
    return keys;
  }

  getGeminiKeys(): ProviderKey[] {
    return [
      { alias: 'gemini-1', key: this.config.get<string>('GEMINI_API_KEY_1') || '' },
      { alias: 'gemini-2', key: this.config.get<string>('GEMINI_API_KEY_2') || '' },
    ].filter((entry) => Boolean(entry.key));
  }

  getCloudflareWorkerKeys(): ProviderKey[] {
    return [
      { alias: 'cloudflare-worker-1', key: this.config.get<string>('CF_API_TOKEN_1') || '' },
      { alias: 'cloudflare-worker-2', key: this.config.get<string>('CF_API_TOKEN_2') || '' },
    ].filter((entry) => Boolean(entry.key));
  }

  getCloudflareAccountId(): string {
    return this.config.get<string>('CF_ACCOUNT_ID', '');
  }

  getSeekAiKey(): string {
    return this.config.get<string>('SEEKAI_KEY', '');
  }

  async reserveDailyKeyUse(alias: string, transaction?: any): Promise<boolean> {
    try {
      const cap = Number(this.config.get<string>('PER_KEY_DAILY_CAP', '0'));
      const bucketStartIso = utcDay().toISOString();
      const capValue = Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : null;
      const executor = transaction ?? this.db;
      const result: any = await executor.execute(sql`
        INSERT INTO ai_usage_counters (id, scope_type, scope_key, bucket_type, bucket_start, count, updated_at)
        VALUES (${randomUUID()}, 'key', ${alias}, 'day', ${bucketStartIso}::timestamp, 1, now())
        ON CONFLICT (scope_type, scope_key, bucket_type, bucket_start)
        DO UPDATE SET count = ai_usage_counters.count + 1, updated_at = now()
        ${capValue ? sql`WHERE ai_usage_counters.count < ${capValue}` : sql``}
        RETURNING count
      `);
      const rows = Array.isArray(result) ? result : result.rows;
      if (rows?.length) return true;
      this.logger.warn(`Daily AI request cap reached for key alias ${alias}.`);
      return false;
    } catch (err: any) {
      this.logger.warn(`reserveDailyKeyUse bypass for key ${alias}: ${err?.message || err}`);
      return true;
    }
  }
}

function utcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
