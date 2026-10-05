import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, asc, eq, gt } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as schema from '../src/db/schema';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../src/ai/ai.service';
import { ExplanationCacheService } from '../src/ai/explanation-cache.service';
import { AiKeyManagerService } from '../src/ai/ai-key-manager.service';
import { hashQuestionContent, validateExplanationOutput } from '../src/ai/explanation-cache.utils';

dotenv.config();
if (!process.env.DATABASE_URL) dotenv.config({ path: path.resolve(__dirname, '../../.env') });

type Args = { subject?: string; exam?: string; limit?: number; dryRun: boolean; help: boolean };
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log('Usage: npm run ai:cache:prewarm -- [--subject Biology] [--exam JAMB] [--limit 100] [--dry-run]');
  console.log('--exam is reserved but unsupported until question data defines exam membership.');
} else if (args.exam) {
  console.error(`Unsupported --exam filter: the questions table and bundled question data do not define exam membership. No questions were pre-warmed. Value received: ${args.exam}`);
  process.exitCode = 2;
} else {
  main(args).catch((error) => {
    console.error(`Pre-warm failed (${error?.code || error?.name || 'runtime_error'}). No credentials were printed.`);
    process.exitCode = 1;
  });
}

async function main(options: Args): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL must be configured.');

  const client = postgres(databaseUrl, { ssl: 'require', max: 10 });
  const db = drizzle(client, { schema });
  const config = new ConfigService(process.env as Record<string, any>);
  const cache = new ExplanationCacheService(db, config);
  const keyManager = new AiKeyManagerService(db, config);
  const ai = new AiService(db, {} as any, {} as any, config, cache, keyManager);
  const promptVersion = cache.getPromptVersion();
  const rpm = positiveInt(process.env.PREWARM_REQUESTS_PER_MINUTE, 10);
  const requestIntervalMs = Math.ceil(60_000 / rpm);
  const costPerRequest = positiveNumber(process.env.AI_COST_PER_REQUEST_ESTIMATE, 0.00035);
  let nextRequestAt = 0;
  let cursor = '';
  let scanned = 0;
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let retried = 0;
  let candidates = 0;
  const failedIds: string[] = [];
  const batchSize = 100;
  const maxCandidates = options.limit ?? Number.POSITIVE_INFINITY;

  async function pauseForRateLimit() {
    const waitMs = nextRequestAt - Date.now();
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    nextRequestAt = Date.now() + requestIntervalMs;
  }

  async function processQuestion(question: typeof schema.questions.$inferSelect, retry = false): Promise<boolean> {
    await pauseForRateLimit();
    try {
      const result = await ai.prewarmExplanation(question.id);
      if (result.cached) {
        skipped += 1;
        return true;
      }
      if (!validateExplanationOutput(result.explanation).valid) {
        console.warn(`[prewarm] ${retry ? 'retry ' : ''}failed question_id=${question.id}: provider returned no cacheable explanation`);
        return false;
      }
      generated += 1;
      if (retry) retried += 1;
      console.log(`[prewarm] success question_id=${question.id} subject=${question.subject}`);
      return true;
    } catch (error: any) {
      console.warn(`[prewarm] ${retry ? 'retry ' : ''}failed question_id=${question.id} code=${error?.response?.status || error?.code || error?.name || 'provider_error'}`);
      return false;
    }
  }

  try {
    while (candidates < maxCandidates) {
      const filters = [gt(schema.questions.id, cursor), eq(schema.questions.status, 'published')];
      if (options.subject) filters.push(eq(schema.questions.subject, options.subject));
      const page = await db.select().from(schema.questions).where(and(...filters)).orderBy(asc(schema.questions.id)).limit(batchSize);
      if (!page.length) break;
      cursor = page[page.length - 1].id;
      for (const question of page) {
        scanned += 1;
        const currentHash = hashQuestionContent(question as unknown as Parameters<typeof hashQuestionContent>[0]);
        const [currentCache] = await db.select({ id: schema.questionExplanations.id, contentHash: schema.questionExplanations.contentHash })
          .from(schema.questionExplanations)
          .where(and(
            eq(schema.questionExplanations.questionId, question.id),
            eq(schema.questionExplanations.promptVersion, promptVersion),
            eq(schema.questionExplanations.status, 'active'),
          )).limit(1);
        if (currentCache?.contentHash === currentHash) {
          skipped += 1;
        } else {
          if (candidates >= maxCandidates) break;
          candidates += 1;
          if (!options.dryRun && !(await processQuestion(question))) failedIds.push(question.id);
        }
        if (scanned % 100 === 0) {
          console.log(`[prewarm] progress scanned=${scanned} uncached_candidates=${candidates} generated=${generated} skipped=${skipped} failed=${failedIds.length}`);
        }
        if (candidates >= maxCandidates) break;
      }
      if (page.length < batchSize || candidates >= maxCandidates) break;
    }

    if (options.dryRun) {
      console.log(JSON.stringify({ mode: 'dry-run', scanned, uncachedCandidates: candidates, alreadyCached: skipped, estimatedCostUsd: Number((candidates * costPerRequest).toFixed(6)), promptVersion, subject: options.subject ?? null }, null, 2));
      return;
    }

    const retryIds = failedIds.splice(0);
    for (const id of retryIds) {
      const [question] = await db.select().from(schema.questions).where(eq(schema.questions.id, id)).limit(1);
      if (question && !(await processQuestion(question, true))) failedIds.push(id);
    }
    failed = failedIds.length;
    const estimatedCostUsd = Number(((generated + failed) * costPerRequest).toFixed(6));
    console.log(JSON.stringify({ mode: 'prewarm', scanned, candidates, generated, skipped, failed, retried, failedQuestionIds: failedIds, estimatedCostUsd, promptVersion, subject: options.subject ?? null }, null, 2));
  } finally {
    await client.end({ timeout: 5 });
  }
}

function parseArgs(argv: string[]): Args {
  const result: Args = { dryRun: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--help' || arg === '-h') result.help = true;
    else if (arg === '--subject' || arg === '--exam' || arg === '--limit') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value.`);
      i += 1;
      if (arg === '--subject') result.subject = value;
      if (arg === '--exam') result.exam = value;
      if (arg === '--limit') {
        const limit = Number(value);
        if (!Number.isInteger(limit) || limit < 1) throw new Error('--limit must be a positive integer.');
        result.limit = limit;
      }
    } else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
