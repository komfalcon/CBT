import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // uuid
  cbt_key: text('cbt_key').unique(),
  cbt_key_hash: text('cbt_key_hash').unique(),
  jamb_reg_no: text('jamb_reg_no').unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('student'),
  mfa_secret: text('mfa_secret'),
  mfa_enabled: integer('mfa_enabled', { mode: 'boolean' }).default(false),
  profile_photo_url: text('profile_photo_url'),
  verification_code: text('verification_code'),
  verification_code_expires: integer('verification_code_expires', { mode: 'timestamp' }),
  password_reset_code: text('password_reset_code'),
  password_reset_expires: integer('password_reset_expires', { mode: 'timestamp' }),
  state: text('state'),
  lga: text('lga'),
  school: text('school'),
  exam_subject_combination: text('exam_subject_combination', { mode: 'json' }), // string[]
  accessibility_preferences: text('accessibility_preferences', { mode: 'json' }), // Record
  account_status: text('account_status').default('pending_verification'),
  failed_login_attempts: integer('failed_login_attempts').default(0),
  lockout_until: integer('lockout_until', { mode: 'timestamp' }),
  device_fingerprints: text('device_fingerprints', { mode: 'json' }), // string[]
  last_login: integer('last_login', { mode: 'timestamp' }),
  last_login_ip: text('last_login_ip'),
  xp_points: integer('xp_points').default(0),
  level: integer('level').default(1),
  streak_count: integer('streak_count').default(0),
  subscription_tier: text('subscription_tier').default('max'),
  ai_messages_remaining: integer('ai_messages_remaining').default(0),
  ai_messages_last_reset: integer('ai_messages_last_reset', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(), // Maps to questionId or _id as UUID
  subject: text('subject').notNull(),
  topic: text('topic').notNull(),
  topicId: text('topic_id'),
  conceptId: text('concept_id'),
  subtopic: text('subtopic'),
  year_sourced: integer('year_sourced'),
  question_text: text('question_text').notNull(),
  options: text('options', { mode: 'json' }).notNull(), // QuestionOption[]
  correct_option: text('correct_option').notNull(),
  explanation: text('explanation'),
  question_type: text('question_type').notNull(),
  difficulty_level: integer('difficulty_level').notNull(),
  irt_difficulty: real('irt_difficulty').default(0),
  irt_discrimination: real('irt_discrimination').default(1),
  irt_guessing: real('irt_guessing').default(0.25),
  bloom_level: text('bloom_level'),
  estimated_solve_time_seconds: integer('estimated_solve_time_seconds').default(60),
  media: text('media', { mode: 'json' }), // QuestionMedia[]
  language: text('language').default('en'),
  status: text('status').default('draft'),
  created_by: text('created_by').notNull(),
  reviewed_by: text('reviewed_by'),
  approved_by: text('approved_by'),
  approved_at: integer('approved_at', { mode: 'timestamp' }),
  is_bonus: integer('is_bonus', { mode: 'boolean' }).default(false),
  versions: text('versions', { mode: 'json' }), // QuestionVersion[]
  use_count: integer('use_count').default(0),
  avg_response_time_ms: integer('avg_response_time_ms').default(0),
  correct_count: integer('correct_count').default(0),
  attempt_count: integer('attempt_count').default(0),
  tags: text('tags', { mode: 'json' }), // string[]
  embedding_vector: text('embedding_vector', { mode: 'json' }), // number[]
  has_diagram: integer('has_diagram', { mode: 'boolean' }).default(false),
  diagram_svg: text('diagram_svg'),
  latex: text('latex'),
  import_batch_id: text('import_batch_id'),
  source: text('source').default('manual'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const exam_sessions = sqliteTable('exam_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'mock' | 'drill'
  subjects: text('subjects', { mode: 'json' }).notNull(), // string[]
  questions: text('questions', { mode: 'json' }).notNull(), // Record<string, any>[]
  answers: text('answers', { mode: 'json' }), // Record<string, string>
  timeRemaining: integer('time_remaining').notNull(),
  status: text('status').default('active'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  warnings: text('warnings', { mode: 'json' }), // string[]
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const exam_results = sqliteTable('exam_results', {
  id: text('id').primaryKey(), // resultId
  sessionId: text('session_id').notNull(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'mock' | 'drill'
  subjectScores: text('subject_scores', { mode: 'json' }).notNull(), // SubjectScore[]
  totalScore: real('total_score').notNull(),
  timeSpentSeconds: integer('time_spent_seconds').notNull(),
  answers: text('answers', { mode: 'json' }), // Record<string, string>
  questionsSnapshot: text('questions_snapshot', { mode: 'json' }).notNull(), // Record<string, any>[]
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const syllabus_trackers = sqliteTable('syllabus_trackers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  subject: text('subject').notNull(),
  completedTopics: text('completed_topics', { mode: 'json' }), // string[]
  progress: real('progress').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const timetables = sqliteTable('timetables', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  sessions: text('sessions', { mode: 'json' }), // StudySession[]
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const payment_logs = sqliteTable('payment_logs', {
  reference: text('reference').primaryKey(), // Used as unique primary key
  userId: text('user_id').notNull(),
  planCode: text('plan_code').notNull(),
  amount: real('amount').notNull(),
  email: text('email').notNull(),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const chat_sessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  messages: text('messages', { mode: 'json' }), // ChatMessage[]
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const handoffs = sqliteTable('handoffs', {
  jti: text('jti').primaryKey(), // using jti as PK since it's unique
  userId: text('user_id').notNull(),
  audience: text('audience').notNull(),
  scope: text('scope', { mode: 'json' }).notNull(), // string[]
  returnUrl: text('return_url').notNull(),
  nextPath: text('next_path').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  exchanged: integer('exchanged', { mode: 'boolean' }).default(false),
  state: text('state').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const integration_learning_events = sqliteTable('integration_learning_events', {
  eventId: text('event_id').primaryKey(),
  userId: text('user_id').notNull(),
  occurredAt: text('occurred_at'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  idempotencyKey: text('idempotency_key').notNull(),
  type: text('type'),
  data: text('data', { mode: 'json' }),
});
