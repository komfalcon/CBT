import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be configured.');
const db = postgres(databaseUrl, { ssl: 'require', max: 2 });

async function main() {
  const costPerThousandTokens = numberSetting('AI_COST_PER_1K_TOKENS', 0.0005);
  const estimatedCostPerRequest = numberSetting('AI_COST_PER_REQUEST_ESTIMATE', 0.00035);
  const [hits] = await db`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()) AND event_type = 'hit')::int AS hits_today,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()) AND event_type = 'miss')::int AS misses_today,
      COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days' AND event_type = 'hit')::int AS hits_7d,
      COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days' AND event_type = 'miss')::int AS misses_7d
    FROM question_explanation_events
  `;
  const calls = await db`
    SELECT call_type, COUNT(*)::int AS calls,
      COUNT(*) FILTER (WHERE success)::int AS successful,
      COUNT(*) FILTER (WHERE NOT success)::int AS failed,
      COALESCE(SUM(COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)), 0)::int AS known_tokens,
      COUNT(*) FILTER (WHERE input_tokens IS NULL AND output_tokens IS NULL)::int AS tokenless_calls
    FROM ai_call_logs WHERE created_at >= date_trunc('day', now())
    GROUP BY call_type ORDER BY call_type
  `;
  const [totalCalls] = await db`
    SELECT COUNT(*)::int AS calls,
      COALESCE(SUM(COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)), 0)::int AS known_tokens,
      COUNT(*) FILTER (WHERE input_tokens IS NULL AND output_tokens IS NULL)::int AS tokenless_calls
    FROM ai_call_logs WHERE created_at >= date_trunc('day', now())
  `;
  const estimatedCost = Number(totalCalls.known_tokens) / 1000 * costPerThousandTokens + Number(totalCalls.tokenless_calls) * estimatedCostPerRequest;
  const uncached = await db`
    SELECT e.question_id, q.question_text, COUNT(*)::int AS miss_count
    FROM question_explanation_events e
    LEFT JOIN questions q ON q.id = e.question_id
    WHERE e.event_type = 'miss' AND e.created_at >= now() - interval '7 days'
    GROUP BY e.question_id, q.question_text
    ORDER BY miss_count DESC LIMIT 20
  `;
  const flagged = await db`
    WITH flagged AS (
      SELECT e.id AS explanation_id, e.question_id, e.prompt_version, e.content_hash,
        e.explanation_text, e.report_count, e.updated_at
      FROM question_explanations e WHERE e.status = 'flagged'
      UNION ALL
      SELECT h.explanation_id, h.question_id, h.prompt_version, h.content_hash,
        h.explanation_text,
        (SELECT COUNT(*)::int FROM question_explanation_reports rr WHERE rr.explanation_id = h.explanation_id) AS report_count,
        h.archived_at AS updated_at
      FROM question_explanation_history h WHERE h.status = 'flagged'
    )
    SELECT f.question_id, q.question_text, f.prompt_version, f.content_hash,
      f.explanation_text, f.report_count,
      COALESCE(json_agg(r.reason) FILTER (WHERE r.reason IS NOT NULL), '[]'::json) AS reasons
    FROM flagged f
    LEFT JOIN questions q ON q.id = f.question_id
    LEFT JOIN question_explanation_reports r ON r.explanation_id = f.explanation_id
    GROUP BY f.explanation_id, f.question_id, q.question_text, f.prompt_version, f.content_hash, f.explanation_text, f.report_count, f.updated_at
    ORDER BY f.report_count DESC, f.updated_at DESC
  `;

  const rate = (hitCount: number, missCount: number) => hitCount + missCount === 0 ? 0 : Number((hitCount / (hitCount + missCount)).toFixed(4));
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    cache: {
      today: { hits: Number(hits.hits_today), misses: Number(hits.misses_today), hitRate: rate(Number(hits.hits_today), Number(hits.misses_today)) },
      last7Days: { hits: Number(hits.hits_7d), misses: Number(hits.misses_7d), hitRate: rate(Number(hits.hits_7d), Number(hits.misses_7d)) },
    },
    aiCallsToday: calls,
    estimatedCostTodayUsd: Number(estimatedCost.toFixed(6)),
    costAssumptions: { costPer1kTokensUsd: costPerThousandTokens, tokenlessRequestUsd: estimatedCostPerRequest },
    top20UncachedQuestionsLast7Days: uncached,
    flaggedExplanations: flagged,
    flaggedCount: flagged.length,
  }, null, 2));
}

function numberSetting(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

main().catch((error) => {
  console.error(`Explanation report failed (${error?.code || error?.name || 'database_error'}).`);
  process.exitCode = 1;
}).finally(async () => {
  await db.end({ timeout: 5 });
});
