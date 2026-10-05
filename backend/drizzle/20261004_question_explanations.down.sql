-- Optional rollback of the additive AI explanation cache migration.
-- This deletes cache/report/audit data created by the feature, but does not alter existing CBT tables.
-- Prefer disabling CBT_EXPLANATION_CACHE_ENABLED first; run this only when removal of cache data is intended.
DROP TABLE IF EXISTS ai_usage_counters;
DROP TABLE IF EXISTS ai_call_logs;
DROP TABLE IF EXISTS question_explanation_events;
DROP TABLE IF EXISTS question_explanation_reports;
DROP TABLE IF EXISTS question_explanation_history;
DROP TABLE IF EXISTS question_explanations;
