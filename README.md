# Falke AI CBT Exam Arena

Production-grade Computer-Based Test platform for Nigerian JAMB UTME.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

## Run locally

1. **Start the backend API** (in a terminal):
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
2. **Start the frontend UI** (in another terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   
Your backend will run at http://localhost:3000 and your frontend at http://localhost:5173.

## Verify health check

Run:

```bash
curl http://localhost:80/api/health
```

Expected shape:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "rabbitmq": "connected",
    "elasticsearch": "connected"
  }
}
```

`services` values will return `disconnected` when dependencies are unavailable.

## Project layout

- `/frontend` — React + Vite + Tailwind scaffold
- `/backend` — NestJS scaffold + `/health`
- `/.do/app.yaml` — DigitalOcean App Platform spec
- `/frontend/wrangler.toml` — Cloudflare Pages config


## Shared AI explanation cache

Standard explanations can be shared across students, keyed by the normalized question content and `PROMPT_VERSION`. The personalized chat/follow-up path remains live and is never cached.

The existing `{ explanation, remainingCoins, nextResetDate }` wallet response fields are retained. The cache-enabled path adds `reportable: true` only when a reusable explanation is available; the frontend uses it to hide report controls for personalized or uncacheable fallback text. Cache hits do not deduct Auri Coins; an uncached generation uses the existing five-coin explanation charge once.

1. Load the canonical question from the existing PostgreSQL database and SHA-256 hash its text, ordered options, answer key, and media/diagram/math references.
2. Read `(question_id, PROMPT_VERSION)`. A matching active hash returns the shared explanation and updates its hit counters; no AI provider is called and no Auri Coins are deducted.
3. On a miss, a process-local single-flight promise and a PostgreSQL transaction advisory lock ensure one generation across workers. Validate before caching; archive replaced text as `superseded`.
4. Student reports are deduplicated with an HMAC fingerprint. At the configured threshold, the explanation is flagged and not served; the next request regenerates it.

This feature uses the backend's existing `DATABASE_URL` PostgreSQL connection. It does not use legacy SQLite/Turso or MongoDB for cache data. The flag defaults off:

```dotenv
CBT_EXPLANATION_CACHE_ENABLED=false
PROMPT_VERSION=expl-v1
CBT_USER_DAILY_AI_LIMIT=20
CBT_USER_PER_MINUTE_LIMIT=3
CBT_GLOBAL_DAILY_AI_CAP=0   # fail closed; replace only with an owner-approved positive cap
AI_API_KEYS=                 # optional comma-separated Mistral-compatible keys; secret, never commit
PER_KEY_DAILY_CAP=0          # 0 disables the per-key cap; use a positive value to cap each key
AI_PROVIDER_RETRIES=2
AI_RETRY_BASE_MS=250
AI_PROVIDER_TIMEOUT_MS=20000
CBT_CACHE_LOCK_TIMEOUT_MS=30000
REPORT_FLAG_THRESHOLD=3
CBT_USER_DAILY_EXPLANATION_REPORT_LIMIT=5
CBT_REPORT_HASH_SECRET=         # set a high-entropy secret; otherwise JWT_PRIVATE_KEY is used
PREWARM_REQUESTS_PER_MINUTE=10
AI_COST_PER_1K_TOKENS=0.0005
AI_COST_PER_REQUEST_ESTIMATE=0.00035
```

The existing `MISTRAL_CHAT_API_KEY`, `MISTRAL_API_KEY_CHAT`, `MISTRAL_API_KEY`, and numbered `MISTRAL_API_KEY_2..4` aliases remain supported. `AI_API_KEYS` should contain only Mistral-compatible keys. Provider code stores/logs aliases and token counts, never key values. Set `CBT_REPORT_HASH_SECRET` to a high-entropy secret; if omitted, the backend uses its existing `JWT_PRIVATE_KEY` to HMAC reporter IDs. Set an owner-approved positive `CBT_GLOBAL_DAILY_AI_CAP` **before deploying code that enforces live-call limits**; zero fails closed for uncached or live AI calls, including while the cache flag is off, while valid cached explanations still serve.

### Migration and rollout

The cache schema migration is additive and does not modify existing question or user records. Review the SQL and confirm the environment's `DATABASE_URL` before applying:

```bash
cd backend
npm run ai:cache:migrate -- --apply
```

The migration command is a dry run unless `--apply` is explicitly supplied. Apply it to staging first, then deploy the code with `CBT_EXPLANATION_CACHE_ENABLED=false`, verify health and AI calls, pre-warm in small batches, and enable the flag for standard explanations only. Do not point it at Turso/SQLite; the active backend database is PostgreSQL.

### Pre-warm the published question bank

The pre-warm CLI uses keyset pagination (100 rows at a time), skips active entries whose hash and prompt version already match, and spaces requests according to `PREWARM_REQUESTS_PER_MINUTE`. It runs outside the web server and needs the local operator to provide `DATABASE_URL` and AI provider configuration.

```bash
cd backend
npm run ai:cache:prewarm -- --dry-run
npm run ai:cache:prewarm -- --subject Biology --limit 50
npm run ai:cache:prewarm -- --limit 100
```

`--dry-run` reports uncached candidates and estimates cost with `AI_COST_PER_REQUEST_ESTIMATE`; it makes no provider calls. Failures are retried once at the end and included in the final summary. `--exam VALUE` is recognized but intentionally stops with an unsupported-filter message: neither the `questions` table nor the bundled question JSON defines exam membership. The CLI will not guess that `tags`, `source`, or `year_sourced` means JAMB/WAEC/NECO/JUPEB. Use `--subject` and `--limit` until the data model establishes that mapping.

### Cost and admin review

Run the local admin report using an administrator-controlled database environment:

```bash
cd backend
npm run ai:cache:report
```

The JSON report includes daily and seven-day hit rates, today's provider-call counts by type, an estimated cost, the 20 most-missed questions over the last seven days, and flagged explanations with question text, explanation, reasons, and report counts. Reporter hashes/identities are not included. Costs use token counts where providers return them (`AI_COST_PER_1K_TOKENS`) and estimate calls without token metadata using `AI_COST_PER_REQUEST_ESTIMATE` (default about `$0.00035/request`). These are configurable estimates, not provider invoices.

### Prompt changes and rollback

Change `PROMPT_VERSION` (for example, to `expl-v2`) when the standard prompt changes. Existing entries are left intact; questions regenerate lazily on their next request (or during an optional pre-warm run). To roll back cache behavior, set `CBT_EXPLANATION_CACHE_ENABLED=false`; standard explanations return to the existing live, personalized endpoint. Keep the new tables while this code is deployed because durable request and key counters use them. The optional `backend/drizzle/20261004_question_explanations.down.sql` deletes cache, report, event, and usage data; use it only after disabling/rolling back the code and when that data loss is intentional.
