import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, notInArray, sql, count, gte } from 'drizzle-orm';
import {
  sanitizeQuestionText,
  cleanOptionText,
  sanitizeExplanation,
  isIncompleteQuestion,
} from '../questions/utils/question-sanitizer';

@Injectable()
export class ExamService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>
  ) { }

  async createSession(
    userId: string,
    type: 'mock' | 'drill',
    subject?: string,
    subjects?: string[],
    subjectConfigs?: Record<string, { mode: 'random' | 'specific'; topics: string[] }>,
    questionCount?: number,
    difficultyLevel?: string,
    topics?: string[]
  ): Promise<any> {
    let subjectsList: string[] = [];
    const questionsList: any[] = [];
    const sessionWarnings: string[] = [];
    let timeRemaining = 7200; // default 2 hours (120 mins) for mock

    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (type === 'mock') {
      const tier = user.subscription_tier || 'max';
      // In Public Beta, all candidates enjoy full Max-tier privileges (10 full mocks per day)
      let limit = 10;
      if (tier === 'plus') {
        limit = 3;
      } else if (tier === 'pro') {
        limit = 5;
      } else {
        limit = 10;
      }

      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);

      const mockCountResult = await this.db.select({ value: count() }).from(schema.exam_sessions)
        .where(and(
          eq(schema.exam_sessions.userId, userId),
          eq(schema.exam_sessions.type, 'mock'),
          gte(schema.exam_sessions.startedAt, startOfToday)
        ));
        
      const mockCount = mockCountResult[0].value;

      if (mockCount >= limit) {
        throw new BadRequestException(`You have reached your daily limit of ${limit} mock exams for today. Please return tomorrow for more practice!`);
      }

      // Use custom subjects if provided, otherwise use user's default combination
      if (subjects && subjects.length > 0) {
        subjectsList = subjects;
      } else {
        const combination = (user.exam_subject_combination as string[]) || [];
        if (combination.length !== 4 || !combination.includes('english')) {
          throw new BadRequestException('Configure a valid 4-subject combination including English first.');
        }
        subjectsList = combination;
      }

      // Fetch questions: English (60), other 3 subjects (40 each)
      for (const sub of subjectsList) {
        const targetCount = sub === 'english' ? 60 : 40;

        // Check if there's a specific config for this subject
        const config = subjectConfigs?.[sub];
        let topicsToUse = topics;

        if (config?.mode === 'specific' && config.topics.length > 0) {
          topicsToUse = config.topics;
        } else if (config?.mode === 'random' || !config) {
          topicsToUse = undefined; // No topic filter
        }

        const { questions: subQuestions, warnings } = await this.getUniqueQuestionsForSubject(sub, targetCount, difficultyLevel, topicsToUse);
        questionsList.push(...subQuestions);
        sessionWarnings.push(...warnings);
      }
    } else {
      // Drill
      if (!subject) {
        throw new BadRequestException('Subject is required for individual drills.');
      }
      const finalCount = questionCount && [10, 20, 40].includes(questionCount) ? questionCount : 20;
      subjectsList = [subject];
      timeRemaining = finalCount * 60; // 1 minute per question

      const { questions: subQuestions, warnings } = await this.getUniqueQuestionsForSubject(subject, finalCount, difficultyLevel, topics);

      if (subQuestions.length === 0) {
        throw new BadRequestException(`No published questions found for subject: ${subject}`);
      }

      questionsList.push(...subQuestions);
      sessionWarnings.push(...warnings);
    }

    const [session] = await this.db.insert(schema.exam_sessions).values({
      id: uuidv4(),
      userId,
      type,
      subjects: subjectsList,
      questions: questionsList,
      answers: {},
      timeRemaining,
      status: 'active',
      startedAt: new Date(),
      warnings: sessionWarnings,
    }).returning();

    return session;
  }

  async getSession(sessionId: string, userId: string): Promise<any> {
    const [session] = await this.db.select().from(schema.exam_sessions)
      .where(and(
        eq(schema.exam_sessions.id, sessionId), 
        eq(schema.exam_sessions.userId, userId)
      )).limit(1);
      
    if (!session) {
      throw new NotFoundException('Exam session not found.');
    }

    if (session.status !== 'active') {
      const [existingResult] = await this.db.select({ id: schema.exam_results.id })
        .from(schema.exam_results)
        .where(eq(schema.exam_results.sessionId, session.id))
        .limit(1);
      return {
        ...this.sanitizeSession(session),
        resultId: existingResult?.id,
        isExpired: true,
      };
    }

    const sessionQuestions = (session.questions as any[]) || [];
    const durationLimit = session.type === 'mock' ? 7200 : sessionQuestions.length * 60;
    const startedAtTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtTime) / 1000));

    // If time exceeded duration limit or already elapsed, auto-submit and complete session
    if (elapsedSeconds >= durationLimit || session.timeRemaining <= 0) {
      const submitted = await this.submitSession(sessionId, userId, 'time_expired');
      return {
        ...this.sanitizeSession(session),
        status: 'completed',
        timeRemaining: 0,
        resultId: submitted.resultId || submitted.id,
        isExpired: true,
      };
    }

    // Recalculate true time remaining based on absolute server clock
    const trueTimeRemaining = Math.max(0, durationLimit - elapsedSeconds);
    if (trueTimeRemaining !== session.timeRemaining) {
      await this.db.update(schema.exam_sessions).set({
        timeRemaining: trueTimeRemaining,
        updatedAt: new Date()
      }).where(eq(schema.exam_sessions.id, session.id));
      session.timeRemaining = trueTimeRemaining;
    }

    return this.sanitizeSession(session);
  }

  async saveAnswers(
    sessionId: string,
    userId: string,
    answers: Record<string, string>,
    timeRemaining: number,
  ): Promise<any> {
    const [session] = await this.db.select().from(schema.exam_sessions)
      .where(and(
        eq(schema.exam_sessions.id, sessionId), 
        eq(schema.exam_sessions.userId, userId),
      )).limit(1);
      
    if (!session) {
      throw new NotFoundException('Exam session not found.');
    }

    if (session.status !== 'active') {
      const [existingResult] = await this.db.select({ id: schema.exam_results.id })
        .from(schema.exam_results)
        .where(eq(schema.exam_results.sessionId, session.id))
        .limit(1);
      return {
        ...this.sanitizeSession(session),
        resultId: existingResult?.id,
        isExpired: true,
      };
    }

    const sessionQuestions = (session.questions as any[]) || [];
    const durationLimit = session.type === 'mock' ? 7200 : sessionQuestions.length * 60;
    const startedAtTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtTime) / 1000));

    // If user attempted to save answers after time has fully elapsed, auto-submit immediately
    if (elapsedSeconds >= durationLimit) {
      const submitted = await this.submitSession(sessionId, userId, 'time_expired');
      return {
        ...session,
        status: 'completed',
        timeRemaining: 0,
        resultId: submitted.resultId || submitted.id,
        isExpired: true,
      };
    }

    // Update time remaining based on server clock bounded by client report
    const trueTimeRemaining = Math.max(0, Math.min(timeRemaining, durationLimit - elapsedSeconds));
    let newAnswers: Record<string, string> = (session.answers as Record<string, string>) || {};

    // Update answers
    if (answers) {
      const answersMap: Record<string, string> = {};
      Object.entries(answers).forEach(([qId, val]) => {
        if (val) {
          answersMap[qId] = val;
        }
      });
      newAnswers = answersMap;
    }

    const [updatedSession] = await this.db.update(schema.exam_sessions).set({
      timeRemaining: trueTimeRemaining,
      answers: newAnswers,
      updatedAt: new Date()
    }).where(eq(schema.exam_sessions.id, session.id)).returning();

    return updatedSession;
  }

  async submitSession(
    sessionId: string,
    userId: string,
    terminationReason?: 'time_expired' | 'tab_switch' | 'cheating_disqualification' | 'user_submitted'
  ): Promise<any> {
    const [session] = await this.db.select().from(schema.exam_sessions)
      .where(and(
        eq(schema.exam_sessions.id, sessionId), 
        eq(schema.exam_sessions.userId, userId),
      )).limit(1);
      
    if (!session) {
      throw new NotFoundException('Exam session not found.');
    }

    if (session.status !== 'active') {
      const [existingResult] = await this.db.select({ id: schema.exam_results.id })
        .from(schema.exam_results)
        .where(eq(schema.exam_results.sessionId, session.id))
        .limit(1);
      return {
        resultId: existingResult?.id,
        id: existingResult?.id,
        status: session.status,
      };
    }
    
    const sessionQuestions = session.questions as any[];
    const sessionSubjects = session.subjects as string[];
    const sessionAnswers = (session.answers as Record<string, string>) || {};

    const durationLimit = session.type === 'mock' ? 7200 : sessionQuestions.length * 60;
    const timeSpentSeconds = Math.max(0, durationLimit - session.timeRemaining);

    const subjectScoresList: Array<{
      subject: string;
      score: number;
      correctCount: number;
      incorrectCount: number;
      unansweredCount: number;
      disqualified?: boolean;
      note?: string;
    }> = [];

    const isDisqualifiedCheating = terminationReason === 'cheating_disqualification';

    // Calculate score per subject
    for (const sub of sessionSubjects) {
      const subQuestions = sessionQuestions.filter((q: any) => q.subject === sub);
      const totalInSub = subQuestions.length;

      let correct = 0;
      let incorrect = 0;
      let unanswered = 0;

      for (const question of subQuestions) {
        const qId = question.id || question.questionId;
        const userChoice = sessionAnswers[qId];
        if (!userChoice) {
          unanswered += 1;
        } else if (userChoice.toUpperCase() === question.correct_option.toUpperCase()) {
          correct += 1;
        } else {
          incorrect += 1;
        }
      }

      // JAMB standard mock score is standardized out of 100 points
      // If disqualified for cheating, score is 0
      const standardizedScore = isDisqualifiedCheating
        ? 0
        : totalInSub > 0
        ? Math.round((correct / totalInSub) * 100)
        : 0;

      subjectScoresList.push({
        subject: sub,
        score: standardizedScore,
        correctCount: isDisqualifiedCheating ? 0 : correct,
        incorrectCount: isDisqualifiedCheating ? totalInSub : incorrect,
        unansweredCount: isDisqualifiedCheating ? 0 : unanswered,
        ...(isDisqualifiedCheating ? { disqualified: true, note: 'Disqualified for malpractice (3 strikes)' } : {}),
      });
    }

    // Overall Score
    let totalScore = 0;
    if (isDisqualifiedCheating) {
      totalScore = 0; // Immediate failure
    } else if (session.type === 'mock') {
      // Mock score is sum of standardized subject scores (0 - 400 scale)
      totalScore = subjectScoresList.reduce((acc, val) => acc + val.score, 0);
    } else {
      // Drill score is out of 100
      totalScore = subjectScoresList[0]?.score || 0;
    }

    // Determine final session status
    let finalStatus = 'completed';
    if (terminationReason === 'cheating_disqualification') {
      finalStatus = 'terminated_cheating';
    } else if (terminationReason === 'tab_switch') {
      finalStatus = 'terminated_tab_switch';
    }

    // Create Result Snapshot
    const [result] = await this.db.insert(schema.exam_results).values({
      id: uuidv4(),
      sessionId: session.id,
      userId: session.userId,
      type: session.type,
      subjectScores: subjectScoresList,
      totalScore,
      timeSpentSeconds,
      answers: sessionAnswers,
      questionsSnapshot: sessionQuestions,
      completedAt: new Date(),
    }).returning();

    // Close session
    const currentWarnings = Array.isArray(session.warnings) ? (session.warnings as any[]) : [];
    if (terminationReason === 'cheating_disqualification') {
      currentWarnings.push('Candidate disqualified: 3 proctoring strikes recorded for malpractice.');
    } else if (terminationReason === 'tab_switch') {
      currentWarnings.push('Exam terminated immediately: Candidate switched away from the exam tab/window.');
    }

    await this.db.update(schema.exam_sessions).set({
      status: finalStatus,
      warnings: currentWarnings,
      completedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(schema.exam_sessions.id, session.id));

    // Award progression points to Candidate (Zero XP for cheating or tab switch termination)
    if (finalStatus === 'completed') {
      const xpReward = session.type === 'mock' ? 150 : 35;
      const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      
      if (user) {
        let currentXp = (user.xp_points || 0) + xpReward;
        let currentLevel = user.level || 1;
        let currentStreak = (user.streak_count || 0) + 1;

        // Simple levelling formula
        while (currentXp >= currentLevel * 400) {
          currentLevel += 1;
        }
        
        await this.db.update(schema.users).set({
          xp_points: currentXp,
          level: currentLevel,
          streak_count: currentStreak,
          updatedAt: new Date()
        }).where(eq(schema.users.id, user.id));
      }
    }

    return { ...result, resultId: result.id, status: finalStatus };
  }

  /**
   * Feature 2: Proctor Violation & Strike Tracking
   * Strike 1: Warning 1
   * Strike 2: Final Warning 2
   * Strike 3: Automatic Immediate Disqualification & Failure
   */
  async recordProctorViolation(
    sessionId: string,
    userId: string,
    reasons: string[]
  ): Promise<{ strikes: number; disqualified: boolean; message: string; resultId?: string }> {
    const [session] = await this.db.select().from(schema.exam_sessions)
      .where(and(
        eq(schema.exam_sessions.id, sessionId),
        eq(schema.exam_sessions.userId, userId),
      )).limit(1);

    if (!session) {
      throw new NotFoundException('Exam session not found.');
    }

    const existingWarnings = Array.isArray(session.warnings) ? (session.warnings as any[]) : [];
    const proctorStrikes = existingWarnings.filter((w: any) =>
      typeof w === 'object' ? w.type === 'proctor_violation' : typeof w === 'string' && w.includes('Proctor Strike')
    ).length;

    const currentStrike = proctorStrikes + 1;
    const strikeEntry = {
      type: 'proctor_violation',
      strike: currentStrike,
      reasons,
      timestamp: new Date().toISOString(),
    };

    const updatedWarnings = [...existingWarnings, strikeEntry];

    if (currentStrike >= 3) {
      // 3 strikes: Disqualify and fail exam immediately!
      await this.db.update(schema.exam_sessions).set({
        warnings: updatedWarnings,
        updatedAt: new Date(),
      }).where(eq(schema.exam_sessions.id, sessionId));

      const submitted = await this.submitSession(sessionId, userId, 'cheating_disqualification');
      return {
        strikes: 3,
        disqualified: true,
        message: 'Disqualified: You have received 3 proctoring strikes for suspected malpractice. Your exam has ended and failed.',
        resultId: submitted.resultId || submitted.id,
      };
    }

    // 1 or 2 strikes: Record warning
    await this.db.update(schema.exam_sessions).set({
      warnings: updatedWarnings,
      updatedAt: new Date(),
    }).where(eq(schema.exam_sessions.id, sessionId));

    return {
      strikes: currentStrike,
      disqualified: false,
      message: currentStrike === 1
        ? `Warning 1 of 3: Suspicious activity detected (${reasons.join(', ')}). Please face your screen alone with no unauthorized devices.`
        : `FINAL WARNING (Strike 2 of 3): Suspicious activity detected (${reasons.join(', ')}). One more violation will immediately fail and terminate your exam!`,
    };
  }

  async getSessionStrikes(sessionId: string, userId: string): Promise<number> {
    const [session] = await this.db.select().from(schema.exam_sessions)
      .where(and(
        eq(schema.exam_sessions.id, sessionId),
        eq(schema.exam_sessions.userId, userId),
      )).limit(1);

    if (!session || !Array.isArray(session.warnings)) return 0;
    return (session.warnings as any[]).filter((w: any) =>
      typeof w === 'object' ? w.type === 'proctor_violation' : typeof w === 'string' && w.includes('Proctor Strike')
    ).length;
  }

  sanitizeSession(session: any) {
    const plain = { ...session };
    if (plain.questions && Array.isArray(plain.questions)) {
      plain.questions = plain.questions.map((q: any) => {
        const { correct_option, explanation, embedding_vector, versions, ...rest } = q;
        const sanitizedStem = sanitizeQuestionText(rest.question_text);
        const cleanedOptions = Array.isArray(rest.options)
          ? rest.options.map((opt: any) => ({
              ...opt,
              text: cleanOptionText(opt.text),
            }))
          : rest.options;
        return {
          ...rest,
          question_text: sanitizedStem,
          options: cleanedOptions,
        };
      });
    }
    return plain;
  }

  private async getUniqueQuestionsForSubject(subject: string, targetCount: number, difficultyLevel?: string, topics?: string[]): Promise<{ questions: any[]; warnings: string[] }> {
    const conditions = [
      eq(schema.questions.subject, subject),
      eq(schema.questions.status, 'published')
    ];
    
    const warnings: string[] = [];

    if (difficultyLevel && difficultyLevel !== 'any') {
      conditions.push(eq(schema.questions.difficulty_level, Number(difficultyLevel)));
    }

    if (topics && topics.length > 0) {
      conditions.push(inArray(schema.questions.topic, topics));
    }

    const candidates = await this.db.select().from(schema.questions)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(targetCount * 3);

    const seenTexts = new Set<string>();
    let result: any[] = [];
    for (const q of candidates) {
      if (isIncompleteQuestion(q.question_text)) continue;
      const sanitizedText = sanitizeQuestionText(q.question_text);
      if (!sanitizedText || sanitizedText.length < 10) continue;
      const normalized = sanitizedText.trim().toLowerCase();
      if (!seenTexts.has(normalized)) {
        seenTexts.add(normalized);
        const cleanedOptions = Array.isArray(q.options)
          ? q.options.map((opt: any) => ({
              ...opt,
              text: cleanOptionText(opt.text),
            }))
          : q.options;
        result.push({
          ...q,
          question_text: sanitizedText,
          options: cleanedOptions,
          explanation: q.explanation ? sanitizeExplanation(q.explanation) : null,
        });
        if (result.length >= targetCount) break;
      }
    }

    // Graceful Fallback (Option A)
    if (topics && topics.length > 0 && result.length < targetCount) {
      const remainingCount = targetCount - result.length;
      const fetchedIds = result.map(q => q.id);

      const fallbackConditions = [
        eq(schema.questions.subject, subject),
        eq(schema.questions.status, 'published')
      ];

      if (fetchedIds.length > 0) {
        fallbackConditions.push(notInArray(schema.questions.id, fetchedIds));
      }

      if (difficultyLevel && difficultyLevel !== 'any') {
        fallbackConditions.push(eq(schema.questions.difficulty_level, Number(difficultyLevel)));
      }

      const fallbackCandidates = await this.db.select().from(schema.questions)
        .where(and(...fallbackConditions))
        .orderBy(sql`RANDOM()`)
        .limit(remainingCount * 3);

      const fallbackQuestions: any[] = [];
      for (const q of fallbackCandidates) {
        if (isIncompleteQuestion(q.question_text)) continue;
        const sanitizedText = sanitizeQuestionText(q.question_text);
        if (!sanitizedText || sanitizedText.length < 10) continue;
        const normalized = sanitizedText.trim().toLowerCase();
        if (!seenTexts.has(normalized)) {
          seenTexts.add(normalized);
          const cleanedOptions = Array.isArray(q.options)
            ? q.options.map((opt: any) => ({
                ...opt,
                text: cleanOptionText(opt.text),
              }))
            : q.options;
          fallbackQuestions.push({
            ...q,
            question_text: sanitizedText,
            options: cleanedOptions,
            explanation: q.explanation ? sanitizeExplanation(q.explanation) : null,
          });
          if (fallbackQuestions.length >= remainingCount) break;
        }
      }

      if (fallbackQuestions.length > 0) {
        warnings.push(`${subject} only has ${result.length} questions for the selected topics, filled the remaining ${fallbackQuestions.length} with random ${subject} questions.`);
        result = [...result, ...fallbackQuestions];
      }
    }

    if (result.length === 0) {
      return { questions: [], warnings };
    }

    if (result.length < targetCount) {
      // Repeat questions up to 3 times to fill to targetCount
      const repeated: any[] = [];
      for (let r = 0; r < 3 && repeated.length < targetCount; r++) {
        // Shuffle each pass to mix up order
        const pass = [...result].sort(() => Math.random() - 0.5);
        repeated.push(...pass);
      }
      result = repeated.slice(0, targetCount);
    }
    return { questions: result, warnings };
  }
}
