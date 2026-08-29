import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import * as mongoose from 'mongoose';
import { 
  users, questions, exam_sessions, exam_results, 
  syllabus_trackers, timetables, payment_logs, 
  chat_sessions, handoffs 
} from './schema';

import * as dotenv from 'dotenv';
dotenv.config();

async function migrateData() {
  console.log('Starting migration from MongoDB to Turso...');
  
  // Connect to MongoDB using mongoose directly
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurikex_cbt';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  const { drizzle } = await import('drizzle-orm/libsql');
  const { createClient } = await import('@libsql/client');

  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const drizzleDb = drizzle(tursoClient);

  console.log('Connected to Turso via Drizzle');

  // 1. Users
  console.log('Migrating Users...');
  const mongoUsers = await db.collection('users').find({}).toArray();
  for (const user of mongoUsers) {
    await drizzleDb.insert(users).values({
      id: user._id.toString(),
      cbt_key: user.cbt_key,
      cbt_key_hash: user.cbt_key_hash,
      jamb_reg_no: user.jamb_reg_no,
      fullName: user.fullName || user.full_name,
      email: user.email,
      phone: user.phone,
      passwordHash: user.passwordHash || user.password_hash,
      role: user.role,
      mfa_secret: user.mfa_secret,
      mfa_enabled: user.mfa_enabled,
      profile_photo_url: user.profile_photo_url,
      verification_code: user.verification_code,
      verification_code_expires: user.verification_code_expires ? new Date(user.verification_code_expires) : null,
      password_reset_code: user.password_reset_code,
      password_reset_expires: user.password_reset_expires ? new Date(user.password_reset_expires) : null,
      state: user.state,
      lga: user.lga,
      school: user.school,
      exam_subject_combination: user.exam_subject_combination || [],
      accessibility_preferences: user.accessibility_preferences || {},
      account_status: user.account_status,
      failed_login_attempts: user.failed_login_attempts,
      lockout_until: user.lockout_until ? new Date(user.lockout_until) : null,
      device_fingerprints: user.device_fingerprints || [],
      last_login: user.last_login ? new Date(user.last_login) : null,
      last_login_ip: user.last_login_ip,
      xp_points: user.xp_points,
      level: user.level,
      streak_count: user.streak_count,
      subscription_tier: user.subscription_tier,
      ai_messages_remaining: user.ai_messages_remaining,
      ai_messages_last_reset: user.ai_messages_last_reset ? new Date(user.ai_messages_last_reset) : null,
      createdAt: user.created_at || user.createdAt || new Date(),
      updatedAt: user.updated_at || user.updatedAt || new Date(),
    }).onConflictDoNothing();
  }

  // 2. Questions
  console.log('Migrating Questions...');
  const mongoQuestions = await db.collection('questions').find({}).toArray();
  for (const q of mongoQuestions) {
    await drizzleDb.insert(questions).values({
      id: q.questionId || q._id.toString(),
      subject: q.subject,
      topic: q.topic,
      topicId: q.topicId,
      conceptId: q.conceptId,
      subtopic: q.subtopic,
      year_sourced: q.year_sourced,
      question_text: q.question_text,
      options: q.options || [],
      correct_option: q.correct_option,
      explanation: q.explanation,
      question_type: q.question_type,
      difficulty_level: q.difficulty_level,
      irt_difficulty: q.irt_difficulty,
      irt_discrimination: q.irt_discrimination,
      irt_guessing: q.irt_guessing,
      bloom_level: q.bloom_level,
      estimated_solve_time_seconds: q.estimated_solve_time_seconds,
      media: q.media || [],
      language: q.language,
      status: q.status,
      created_by: q.created_by,
      reviewed_by: q.reviewed_by,
      approved_by: q.approved_by,
      approved_at: q.approved_at ? new Date(q.approved_at) : null,
      is_bonus: q.is_bonus,
      versions: q.versions || [],
      use_count: q.use_count,
      avg_response_time_ms: q.avg_response_time_ms,
      correct_count: q.correct_count,
      attempt_count: q.attempt_count,
      tags: q.tags || [],
      embedding_vector: q.embedding_vector || [],
      has_diagram: q.has_diagram,
      diagram_svg: q.diagram_svg,
      latex: q.latex,
      import_batch_id: q.import_batch_id,
      source: q.source,
      createdAt: q.created_at || q.createdAt || new Date(),
      updatedAt: q.updated_at || q.updatedAt || new Date(),
    }).onConflictDoNothing();
  }
  
  // 3. Exam Sessions
  console.log('Migrating Exam Sessions...');
  const mongoSessions = await db.collection('examsessions').find({}).toArray();
  for (const s of mongoSessions) {
    await drizzleDb.insert(exam_sessions).values({
      id: s.sessionId || s._id.toString(),
      userId: s.userId,
      type: s.type,
      subjects: s.subjects || [],
      questions: s.questions || [],
      answers: s.answers || {},
      timeRemaining: s.timeRemaining,
      status: s.status,
      startedAt: s.startedAt ? new Date(s.startedAt) : new Date(),
      completedAt: s.completedAt ? new Date(s.completedAt) : null,
      warnings: s.warnings || [],
      createdAt: s.created_at || s.createdAt || new Date(),
      updatedAt: s.updated_at || s.updatedAt || new Date(),
    }).onConflictDoNothing();
  }

  // 4. Exam Results
  console.log('Migrating Exam Results...');
  const mongoResults = await db.collection('examresults').find({}).toArray();
  for (const r of mongoResults) {
    await drizzleDb.insert(exam_results).values({
      id: r.resultId || r._id.toString(),
      sessionId: r.sessionId,
      userId: r.userId,
      type: r.type,
      subjectScores: r.subjectScores || [],
      totalScore: r.totalScore,
      timeSpentSeconds: r.timeSpentSeconds,
      answers: r.answers || {},
      questionsSnapshot: r.questionsSnapshot || [],
      completedAt: r.completedAt ? new Date(r.completedAt) : new Date(),
      createdAt: r.created_at || r.createdAt || new Date(),
      updatedAt: r.updated_at || r.updatedAt || new Date(),
    }).onConflictDoNothing();
  }

  // 5. Syllabus Trackers
  console.log('Migrating Syllabus...');
  const mongoSyllabus = await db.collection('syllabustrackers').find({}).toArray();
  for (const s of mongoSyllabus) {
    await drizzleDb.insert(syllabus_trackers).values({
      id: s._id.toString(),
      userId: s.user.toString(),
      subject: s.subject,
      completedTopics: s.completedTopics || [],
      progress: s.progress,
      createdAt: s.createdAt || new Date(),
      updatedAt: s.updatedAt || new Date(),
    }).onConflictDoNothing();
  }

  // 6. Timetables
  console.log('Migrating Timetables...');
  const mongoTimetables = await db.collection('timetables').find({}).toArray();
  for (const t of mongoTimetables) {
    await drizzleDb.insert(timetables).values({
      id: t._id.toString(),
      userId: t.user.toString(),
      sessions: t.sessions || [],
      createdAt: t.createdAt || new Date(),
      updatedAt: t.updatedAt || new Date(),
    }).onConflictDoNothing();
  }

  // 7. Payment Logs
  console.log('Migrating Payments...');
  const mongoPayments = await db.collection('paymentlogs').find({}).toArray();
  for (const p of mongoPayments) {
    await drizzleDb.insert(payment_logs).values({
      reference: p.reference || p._id.toString(),
      userId: p.userId,
      planCode: p.planCode,
      amount: p.amount,
      email: p.email,
      verifiedAt: p.verifiedAt ? new Date(p.verifiedAt) : null,
      createdAt: p.created_at || p.createdAt || new Date(),
      updatedAt: p.updated_at || p.updatedAt || new Date(),
    }).onConflictDoNothing();
  }

  // 8. Chat Sessions
  console.log('Migrating Chat Sessions...');
  const mongoChatSessions = await db.collection('chatsessions').find({}).toArray();
  for (const cs of mongoChatSessions) {
    await drizzleDb.insert(chat_sessions).values({
      id: cs._id.toString(),
      userId: cs.userId,
      title: cs.title,
      messages: cs.messages || [],
      createdAt: cs.createdAt || new Date(),
      updatedAt: cs.updatedAt || new Date(),
    }).onConflictDoNothing();
  }

  // 9. Handoffs
  console.log('Migrating Handoffs...');
  const mongoHandoffs = await db.collection('integration_handoffs').find({}).toArray();
  for (const h of mongoHandoffs) {
    await drizzleDb.insert(handoffs).values({
      jti: h.jti || h._id.toString(),
      userId: h.userId,
      audience: h.audience,
      scope: h.scope || [],
      returnUrl: h.returnUrl,
      nextPath: h.nextPath,
      expiresAt: h.expiresAt ? new Date(h.expiresAt) : new Date(),
      exchanged: h.exchanged,
      state: h.state,
      createdAt: h.createdAt || new Date(),
      updatedAt: h.updatedAt || new Date(),
    }).onConflictDoNothing();
  }

  console.log('Migration completed successfully!');
  process.exit(0);
}

migrateData().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
