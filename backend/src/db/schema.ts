import { sql } from 'drizzle-orm';
import { pgTable, text, integer, real, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  aurikrex_id: text('aurikrex_id').unique(),
  cbt_key: text('cbt_key').unique(),
  cbt_key_hash: text('cbt_key_hash').unique(),
  jamb_reg_no: text('jamb_reg_no').unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('student'),
  mfa_secret: text('mfa_secret'),
  mfa_enabled: boolean('mfa_enabled').default(false),
  profile_photo_url: text('profile_photo_url'),
  verification_code: text('verification_code'),
  verification_code_expires: timestamp('verification_code_expires'),
  password_reset_code: text('password_reset_code'),
  password_reset_expires: timestamp('password_reset_expires'),
  state: text('state'),
  lga: text('lga'),
  school: text('school'),
  exam_subject_combination: jsonb('exam_subject_combination'),
  accessibility_preferences: jsonb('accessibility_preferences'),
  account_status: text('account_status').default('pending_verification'),
  failed_login_attempts: integer('failed_login_attempts').default(0),
  lockout_until: timestamp('lockout_until'),
  device_fingerprints: jsonb('device_fingerprints'),
  last_login: timestamp('last_login'),
  last_login_ip: text('last_login_ip'),
  xp_points: integer('xp_points').default(0),
  level: integer('level').default(1),
  streak_count: integer('streak_count').default(0),
  subscription_tier: text('subscription_tier').default('max'),
  ai_messages_remaining: integer('ai_messages_remaining').default(20),
  ai_messages_last_reset: timestamp('ai_messages_last_reset'),
  auri_coins_balance: integer('auri_coins_balance').default(5000),
  auri_coins_last_reset: timestamp('auri_coins_last_reset').defaultNow(),
  auri_coins_monthly_allowance: integer('auri_coins_monthly_allowance').default(5000),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  subject: text('subject').notNull(),
  topic: text('topic').notNull(),
  topicId: text('topic_id'),
  conceptId: text('concept_id'),
  subtopic: text('subtopic'),
  year_sourced: integer('year_sourced'),
  question_text: text('question_text').notNull(),
  options: jsonb('options').notNull(),
  correct_option: text('correct_option').notNull(),
  explanation: text('explanation'),
  question_type: text('question_type').notNull(),
  difficulty_level: integer('difficulty_level').notNull(),
  irt_difficulty: real('irt_difficulty').default(0),
  irt_discrimination: real('irt_discrimination').default(1),
  irt_guessing: real('irt_guessing').default(0.25),
  bloom_level: text('bloom_level'),
  estimated_solve_time_seconds: integer('estimated_solve_time_seconds').default(60),
  media: jsonb('media'),
  language: text('language').default('en'),
  status: text('status').default('draft'),
  created_by: text('created_by').notNull(),
  reviewed_by: text('reviewed_by'),
  approved_by: text('approved_by'),
  approved_at: timestamp('approved_at'),
  is_bonus: boolean('is_bonus').default(false),
  versions: jsonb('versions'),
  use_count: integer('use_count').default(0),
  avg_response_time_ms: integer('avg_response_time_ms').default(0),
  correct_count: integer('correct_count').default(0),
  attempt_count: integer('attempt_count').default(0),
  tags: jsonb('tags'),
  embedding_vector: jsonb('embedding_vector'),
  has_diagram: boolean('has_diagram').default(false),
  diagram_svg: text('diagram_svg'),
  latex: text('latex'),
  import_batch_id: text('import_batch_id'),
  source: text('source').default('manual'),
  question_source_type: text('question_source_type').default('new_text'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const exam_sessions = pgTable('exam_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  subjects: jsonb('subjects').notNull(),
  questions: jsonb('questions').notNull(),
  answers: jsonb('answers'),
  timeRemaining: integer('time_remaining').notNull(),
  status: text('status').default('active'),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  warnings: jsonb('warnings'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const exam_results = pgTable('exam_results', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  subjectScores: jsonb('subject_scores').notNull(),
  totalScore: real('total_score').notNull(),
  timeSpentSeconds: integer('time_spent_seconds').notNull(),
  answers: jsonb('answers'),
  questionsSnapshot: jsonb('questions_snapshot').notNull(),
  completedAt: timestamp('completed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const syllabus_trackers = pgTable('syllabus_trackers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  subject: text('subject').notNull(),
  completedTopics: jsonb('completed_topics'),
  progress: real('progress').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const timetables = pgTable('timetables', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  sessions: jsonb('sessions'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const payment_logs = pgTable('payment_logs', {
  reference: text('reference').primaryKey(),
  userId: text('user_id').notNull(),
  planCode: text('plan_code').notNull(),
  amount: real('amount').notNull(),
  email: text('email').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const chat_sessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  messages: jsonb('messages'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const handoffs = pgTable('handoffs', {
  jti: text('jti').primaryKey(),
  userId: text('user_id').notNull(),
  audience: text('audience').notNull(),
  scope: jsonb('scope').notNull(),
  returnUrl: text('return_url').notNull(),
  nextPath: text('next_path').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  exchanged: boolean('exchanged').default(false),
  state: text('state').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const integration_learning_events = pgTable('integration_learning_events', {
  eventId: text('event_id').primaryKey(),
  userId: text('user_id').notNull(),
  occurredAt: timestamp('occurred_at'),
  createdAt: timestamp('created_at').defaultNow(),
  idempotencyKey: text('idempotency_key').notNull(),
  type: text('type'),
  data: jsonb('data'),
});

export const system_settings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updated_by: text('updated_by'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ssoClients = pgTable('sso_clients', {
  id: text('id').primaryKey(),
  client_id: text('client_id').notNull().unique(),
  client_name: text('client_name').notNull(),
  client_secret_hash: text('client_secret_hash'),
  redirect_uris: jsonb('redirect_uris').notNull(),
  allowed_scopes: jsonb('allowed_scopes').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const ssoCodes = pgTable('sso_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  client_id: text('client_id').notNull(),
  aurikrex_id: text('aurikrex_id').notNull(),
  code_challenge: text('code_challenge'),
  code_challenge_method: text('code_challenge_method'),
  redirect_uri: text('redirect_uri').notNull(),
  scope: text('scope'),
  expires_at: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const auriCoinLedger = pgTable('auri_coin_ledger', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  app_id: text('app_id').notNull(),
  feature_name: text('feature_name').notNull(),
  amount: integer('amount').notNull(),
  balance_after: integer('balance_after').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const questionExplanations = pgTable('question_explanations', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull(),
  contentHash: text('content_hash').notNull(),
  promptVersion: text('prompt_version').notNull(),
  explanationText: text('explanation_text').notNull(),
  modelUsed: text('model_used').notNull(),
  status: text('status').notNull().default('active'),
  reportCount: integer('report_count').notNull().default(0),
  hitCount: integer('hit_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastServedAt: timestamp('last_served_at'),
}, (table) => ({
  questionPromptUnique: uniqueIndex('question_explanations_question_prompt_uq').on(table.questionId, table.promptVersion),
  statusIdx: index('question_explanations_status_idx').on(table.status),
}));

export const questionExplanationHistory = pgTable('question_explanation_history', {
  id: text('id').primaryKey(),
  explanationId: text('explanation_id').notNull(),
  questionId: text('question_id').notNull(),
  promptVersion: text('prompt_version').notNull(),
  contentHash: text('content_hash').notNull(),
  explanationText: text('explanation_text').notNull(),
  modelUsed: text('model_used').notNull(),
  status: text('status').notNull(),
  archivedAt: timestamp('archived_at').defaultNow(),
}, (table) => ({
  questionPromptIdx: index('question_explanation_history_question_prompt_idx').on(table.questionId, table.promptVersion),
  archivedIdx: index('question_explanation_history_archived_idx').on(table.archivedAt),
}));

export const questionExplanationReports = pgTable('question_explanation_reports', {
  id: text('id').primaryKey(),
  explanationId: text('explanation_id').notNull(),
  questionId: text('question_id').notNull(),
  promptVersion: text('prompt_version').notNull(),
  contentHash: text('content_hash').notNull(),
  reporterHash: text('reporter_hash').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  explanationIdx: index('question_explanation_reports_explanation_idx').on(table.explanationId),
  reporterUnique: uniqueIndex('question_explanation_reports_reporter_uq').on(table.explanationId, table.reporterHash),
  createdIdx: index('question_explanation_reports_created_idx').on(table.createdAt),
}));

export const questionExplanationEvents = pgTable('question_explanation_events', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull(),
  eventType: text('event_type').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  createdTypeIdx: index('question_explanation_events_created_type_idx').on(table.createdAt, table.eventType),
  questionIdx: index('question_explanation_events_question_idx').on(table.questionId),
}));

export const aiCallLogs = pgTable('ai_call_logs', {
  id: text('id').primaryKey(),
  questionId: text('question_id'),
  callType: text('call_type').notNull(),
  modelUsed: text('model_used'),
  keyAlias: text('key_alias'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  success: boolean('success').notNull(),
  errorCode: text('error_code'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  createdIdx: index('ai_call_logs_created_idx').on(table.createdAt),
  callTypeIdx: index('ai_call_logs_call_type_idx').on(table.callType),
}));

export const aiUsageCounters = pgTable('ai_usage_counters', {
  id: text('id').primaryKey(),
  scopeType: text('scope_type').notNull(),
  scopeKey: text('scope_key').notNull(),
  bucketType: text('bucket_type').notNull(),
  bucketStart: timestamp('bucket_start').notNull(),
  count: integer('count').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  scopeBucketUnique: uniqueIndex('ai_usage_counters_scope_bucket_uq').on(table.scopeType, table.scopeKey, table.bucketType, table.bucketStart),
  bucketIdx: index('ai_usage_counters_bucket_idx').on(table.bucketType, table.bucketStart),
}));
