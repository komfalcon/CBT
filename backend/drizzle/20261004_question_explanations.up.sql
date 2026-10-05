-- Additive PostgreSQL migration for the AI explanation cache.
-- This migration is intentionally separate from legacy Turso/SQLite tooling.
CREATE TABLE IF NOT EXISTS question_explanations (
  id text PRIMARY KEY,
  question_id text NOT NULL,
  content_hash text NOT NULL,
  prompt_version text NOT NULL,
  explanation_text text NOT NULL,
  model_used text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'superseded')),
  report_count integer NOT NULL DEFAULT 0,
  hit_count integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  last_served_at timestamp
);
CREATE UNIQUE INDEX IF NOT EXISTS question_explanations_question_prompt_uq ON question_explanations (question_id, prompt_version);
CREATE INDEX IF NOT EXISTS question_explanations_status_idx ON question_explanations (status);

CREATE TABLE IF NOT EXISTS question_explanation_history (
  id text PRIMARY KEY,
  explanation_id text NOT NULL,
  question_id text NOT NULL,
  prompt_version text NOT NULL,
  content_hash text NOT NULL,
  explanation_text text NOT NULL,
  model_used text NOT NULL,
  status text NOT NULL,
  archived_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS question_explanation_history_question_prompt_idx ON question_explanation_history (question_id, prompt_version);
CREATE INDEX IF NOT EXISTS question_explanation_history_archived_idx ON question_explanation_history (archived_at);

CREATE TABLE IF NOT EXISTS question_explanation_reports (
  id text PRIMARY KEY,
  explanation_id text NOT NULL,
  question_id text NOT NULL,
  prompt_version text NOT NULL,
  content_hash text NOT NULL,
  reporter_hash text NOT NULL,
  reason text,
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS question_explanation_reports_explanation_idx ON question_explanation_reports (explanation_id);
CREATE UNIQUE INDEX IF NOT EXISTS question_explanation_reports_reporter_uq ON question_explanation_reports (explanation_id, reporter_hash);
CREATE INDEX IF NOT EXISTS question_explanation_reports_created_idx ON question_explanation_reports (created_at);

CREATE TABLE IF NOT EXISTS ai_call_logs (
  id text PRIMARY KEY,
  question_id text,
  call_type text NOT NULL,
  model_used text,
  key_alias text,
  input_tokens integer,
  output_tokens integer,
  success boolean NOT NULL,
  error_code text,
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_call_logs_created_idx ON ai_call_logs (created_at);
CREATE INDEX IF NOT EXISTS ai_call_logs_call_type_idx ON ai_call_logs (call_type);

CREATE TABLE IF NOT EXISTS ai_usage_counters (
  id text PRIMARY KEY,
  scope_type text NOT NULL,
  scope_key text NOT NULL,
  bucket_type text NOT NULL,
  bucket_start timestamp NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_counters_scope_bucket_uq ON ai_usage_counters (scope_type, scope_key, bucket_type, bucket_start);
CREATE INDEX IF NOT EXISTS ai_usage_counters_bucket_idx ON ai_usage_counters (bucket_type, bucket_start);

CREATE TABLE IF NOT EXISTS question_explanation_events (
  id text PRIMARY KEY,
  question_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('hit', 'miss')),
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS question_explanation_events_created_type_idx ON question_explanation_events (created_at, event_type);
CREATE INDEX IF NOT EXISTS question_explanation_events_question_idx ON question_explanation_events (question_id);
