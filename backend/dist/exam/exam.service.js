"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const database_module_1 = require("../db/database.module");
const schema = __importStar(require("../db/schema"));
const postgres_js_1 = require("drizzle-orm/postgres-js");
const drizzle_orm_1 = require("drizzle-orm");
const question_sanitizer_1 = require("../questions/utils/question-sanitizer");
let ExamService = class ExamService {
    constructor(db) {
        this.db = db;
    }
    async createSession(userId, type, subject, subjects, subjectConfigs, questionCount, difficultyLevel, topics) {
        let subjectsList = [];
        const questionsList = [];
        const sessionWarnings = [];
        let timeRemaining = 7200;
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException('User profile not found');
        }
        if (type === 'mock') {
            const tier = user.subscription_tier || 'max';
            let limit = 10;
            if (tier === 'plus') {
                limit = 3;
            }
            else if (tier === 'pro') {
                limit = 5;
            }
            else {
                limit = 10;
            }
            const startOfToday = new Date();
            startOfToday.setUTCHours(0, 0, 0, 0);
            const mockCountResult = await this.db.select({ value: (0, drizzle_orm_1.count)() }).from(schema.exam_sessions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_sessions.userId, userId), (0, drizzle_orm_1.eq)(schema.exam_sessions.type, 'mock'), (0, drizzle_orm_1.gte)(schema.exam_sessions.startedAt, startOfToday)));
            const mockCount = mockCountResult[0].value;
            if (mockCount >= limit) {
                throw new common_1.BadRequestException(`You have reached your daily limit of ${limit} mock exams for today. Please return tomorrow for more practice!`);
            }
            if (subjects && subjects.length > 0) {
                subjectsList = subjects;
            }
            else {
                const combination = user.exam_subject_combination || [];
                if (combination.length !== 4 || !combination.includes('english')) {
                    throw new common_1.BadRequestException('Configure a valid 4-subject combination including English first.');
                }
                subjectsList = combination;
            }
            for (const sub of subjectsList) {
                const targetCount = sub === 'english' ? 60 : 40;
                const config = subjectConfigs?.[sub];
                let topicsToUse = topics;
                if (config?.mode === 'specific' && config.topics.length > 0) {
                    topicsToUse = config.topics;
                }
                else if (config?.mode === 'random' || !config) {
                    topicsToUse = undefined;
                }
                const { questions: subQuestions, warnings } = await this.getUniqueQuestionsForSubject(sub, targetCount, difficultyLevel, topicsToUse);
                questionsList.push(...subQuestions);
                sessionWarnings.push(...warnings);
            }
        }
        else {
            if (!subject) {
                throw new common_1.BadRequestException('Subject is required for individual drills.');
            }
            const finalCount = questionCount && [10, 20, 40].includes(questionCount) ? questionCount : 20;
            subjectsList = [subject];
            timeRemaining = finalCount * 60;
            const { questions: subQuestions, warnings } = await this.getUniqueQuestionsForSubject(subject, finalCount, difficultyLevel, topics);
            if (subQuestions.length === 0) {
                throw new common_1.BadRequestException(`No published questions found for subject: ${subject}`);
            }
            questionsList.push(...subQuestions);
            sessionWarnings.push(...warnings);
        }
        const [session] = await this.db.insert(schema.exam_sessions).values({
            id: (0, uuid_1.v4)(),
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
    async getSession(sessionId, userId) {
        const [session] = await this.db.select().from(schema.exam_sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_sessions.id, sessionId), (0, drizzle_orm_1.eq)(schema.exam_sessions.userId, userId))).limit(1);
        if (!session) {
            throw new common_1.NotFoundException('Exam session not found.');
        }
        if (session.status !== 'active') {
            const [existingResult] = await this.db.select({ id: schema.exam_results.id })
                .from(schema.exam_results)
                .where((0, drizzle_orm_1.eq)(schema.exam_results.sessionId, session.id))
                .limit(1);
            return {
                ...this.sanitizeSession(session),
                resultId: existingResult?.id,
                isExpired: true,
            };
        }
        const sessionQuestions = session.questions || [];
        const durationLimit = session.type === 'mock' ? 7200 : sessionQuestions.length * 60;
        const startedAtTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtTime) / 1000));
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
        const trueTimeRemaining = Math.max(0, durationLimit - elapsedSeconds);
        if (trueTimeRemaining !== session.timeRemaining) {
            await this.db.update(schema.exam_sessions).set({
                timeRemaining: trueTimeRemaining,
                updatedAt: new Date()
            }).where((0, drizzle_orm_1.eq)(schema.exam_sessions.id, session.id));
            session.timeRemaining = trueTimeRemaining;
        }
        return this.sanitizeSession(session);
    }
    async saveAnswers(sessionId, userId, answers, timeRemaining) {
        const [session] = await this.db.select().from(schema.exam_sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_sessions.id, sessionId), (0, drizzle_orm_1.eq)(schema.exam_sessions.userId, userId))).limit(1);
        if (!session) {
            throw new common_1.NotFoundException('Exam session not found.');
        }
        if (session.status !== 'active') {
            const [existingResult] = await this.db.select({ id: schema.exam_results.id })
                .from(schema.exam_results)
                .where((0, drizzle_orm_1.eq)(schema.exam_results.sessionId, session.id))
                .limit(1);
            return {
                ...this.sanitizeSession(session),
                resultId: existingResult?.id,
                isExpired: true,
            };
        }
        const sessionQuestions = session.questions || [];
        const durationLimit = session.type === 'mock' ? 7200 : sessionQuestions.length * 60;
        const startedAtTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtTime) / 1000));
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
        const trueTimeRemaining = Math.max(0, Math.min(timeRemaining, durationLimit - elapsedSeconds));
        let newAnswers = session.answers || {};
        if (answers) {
            const answersMap = {};
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
        }).where((0, drizzle_orm_1.eq)(schema.exam_sessions.id, session.id)).returning();
        return updatedSession;
    }
    async submitSession(sessionId, userId, terminationReason) {
        const [session] = await this.db.select().from(schema.exam_sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_sessions.id, sessionId), (0, drizzle_orm_1.eq)(schema.exam_sessions.userId, userId))).limit(1);
        if (!session) {
            throw new common_1.NotFoundException('Exam session not found.');
        }
        if (session.status !== 'active') {
            const [existingResult] = await this.db.select({ id: schema.exam_results.id })
                .from(schema.exam_results)
                .where((0, drizzle_orm_1.eq)(schema.exam_results.sessionId, session.id))
                .limit(1);
            return {
                resultId: existingResult?.id,
                id: existingResult?.id,
                status: session.status,
            };
        }
        const sessionQuestions = session.questions;
        const sessionSubjects = session.subjects;
        const sessionAnswers = session.answers || {};
        const durationLimit = session.type === 'mock' ? 7200 : sessionQuestions.length * 60;
        const timeSpentSeconds = Math.max(0, durationLimit - session.timeRemaining);
        const subjectScoresList = [];
        const isDisqualifiedCheating = terminationReason === 'cheating_disqualification';
        for (const sub of sessionSubjects) {
            const subQuestions = sessionQuestions.filter((q) => q.subject === sub);
            const totalInSub = subQuestions.length;
            let correct = 0;
            let incorrect = 0;
            let unanswered = 0;
            for (const question of subQuestions) {
                const qId = question.id || question.questionId;
                const userChoice = sessionAnswers[qId];
                if (!userChoice) {
                    unanswered += 1;
                }
                else if (userChoice.toUpperCase() === question.correct_option.toUpperCase()) {
                    correct += 1;
                }
                else {
                    incorrect += 1;
                }
            }
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
        let totalScore = 0;
        if (isDisqualifiedCheating) {
            totalScore = 0;
        }
        else if (session.type === 'mock') {
            totalScore = subjectScoresList.reduce((acc, val) => acc + val.score, 0);
        }
        else {
            totalScore = subjectScoresList[0]?.score || 0;
        }
        let finalStatus = 'completed';
        if (terminationReason === 'cheating_disqualification') {
            finalStatus = 'terminated_cheating';
        }
        else if (terminationReason === 'tab_switch') {
            finalStatus = 'terminated_tab_switch';
        }
        const [result] = await this.db.insert(schema.exam_results).values({
            id: (0, uuid_1.v4)(),
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
        const currentWarnings = Array.isArray(session.warnings) ? session.warnings : [];
        if (terminationReason === 'cheating_disqualification') {
            currentWarnings.push('Candidate disqualified: 3 proctoring strikes recorded for malpractice.');
        }
        else if (terminationReason === 'tab_switch') {
            currentWarnings.push('Exam terminated immediately: Candidate switched away from the exam tab/window.');
        }
        await this.db.update(schema.exam_sessions).set({
            status: finalStatus,
            warnings: currentWarnings,
            completedAt: new Date(),
            updatedAt: new Date()
        }).where((0, drizzle_orm_1.eq)(schema.exam_sessions.id, session.id));
        if (finalStatus === 'completed') {
            const xpReward = session.type === 'mock' ? 150 : 35;
            const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
            if (user) {
                let currentXp = (user.xp_points || 0) + xpReward;
                let currentLevel = user.level || 1;
                let currentStreak = (user.streak_count || 0) + 1;
                while (currentXp >= currentLevel * 400) {
                    currentLevel += 1;
                }
                await this.db.update(schema.users).set({
                    xp_points: currentXp,
                    level: currentLevel,
                    streak_count: currentStreak,
                    updatedAt: new Date()
                }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
            }
        }
        return { ...result, resultId: result.id, status: finalStatus };
    }
    async recordProctorViolation(sessionId, userId, reasons) {
        const [session] = await this.db.select().from(schema.exam_sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_sessions.id, sessionId), (0, drizzle_orm_1.eq)(schema.exam_sessions.userId, userId))).limit(1);
        if (!session) {
            throw new common_1.NotFoundException('Exam session not found.');
        }
        const existingWarnings = Array.isArray(session.warnings) ? session.warnings : [];
        const proctorStrikes = existingWarnings.filter((w) => typeof w === 'object' ? w.type === 'proctor_violation' : typeof w === 'string' && w.includes('Proctor Strike')).length;
        const currentStrike = proctorStrikes + 1;
        const strikeEntry = {
            type: 'proctor_violation',
            strike: currentStrike,
            reasons,
            timestamp: new Date().toISOString(),
        };
        const updatedWarnings = [...existingWarnings, strikeEntry];
        if (currentStrike >= 3) {
            await this.db.update(schema.exam_sessions).set({
                warnings: updatedWarnings,
                updatedAt: new Date(),
            }).where((0, drizzle_orm_1.eq)(schema.exam_sessions.id, sessionId));
            const submitted = await this.submitSession(sessionId, userId, 'cheating_disqualification');
            return {
                strikes: 3,
                disqualified: true,
                message: 'Disqualified: You have received 3 proctoring strikes for suspected malpractice. Your exam has ended and failed.',
                resultId: submitted.resultId || submitted.id,
            };
        }
        await this.db.update(schema.exam_sessions).set({
            warnings: updatedWarnings,
            updatedAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema.exam_sessions.id, sessionId));
        return {
            strikes: currentStrike,
            disqualified: false,
            message: currentStrike === 1
                ? `Warning 1 of 3: Suspicious activity detected (${reasons.join(', ')}). Please face your screen alone with no unauthorized devices.`
                : `FINAL WARNING (Strike 2 of 3): Suspicious activity detected (${reasons.join(', ')}). One more violation will immediately fail and terminate your exam!`,
        };
    }
    async getSessionStrikes(sessionId, userId) {
        const [session] = await this.db.select().from(schema.exam_sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_sessions.id, sessionId), (0, drizzle_orm_1.eq)(schema.exam_sessions.userId, userId))).limit(1);
        if (!session || !Array.isArray(session.warnings))
            return 0;
        return session.warnings.filter((w) => typeof w === 'object' ? w.type === 'proctor_violation' : typeof w === 'string' && w.includes('Proctor Strike')).length;
    }
    sanitizeSession(session) {
        const plain = { ...session };
        if (plain.questions && Array.isArray(plain.questions)) {
            plain.questions = plain.questions.map((q) => {
                const { correct_option, explanation, embedding_vector, versions, ...rest } = q;
                const sanitizedStem = (0, question_sanitizer_1.sanitizeQuestionText)(rest.question_text);
                const cleanedOptions = Array.isArray(rest.options)
                    ? rest.options.map((opt) => ({
                        ...opt,
                        text: (0, question_sanitizer_1.cleanOptionText)(opt.text),
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
    async getUniqueQuestionsForSubject(subject, targetCount, difficultyLevel, topics) {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema.questions.subject, subject),
            (0, drizzle_orm_1.eq)(schema.questions.status, 'published')
        ];
        const warnings = [];
        if (difficultyLevel && difficultyLevel !== 'any') {
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.difficulty_level, Number(difficultyLevel)));
        }
        if (topics && topics.length > 0) {
            conditions.push((0, drizzle_orm_1.inArray)(schema.questions.topic, topics));
        }
        const candidates = await this.db.select().from(schema.questions)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.sql) `RANDOM()`)
            .limit(targetCount * 3);
        const seenTexts = new Set();
        let result = [];
        for (const q of candidates) {
            if ((0, question_sanitizer_1.isIncompleteQuestion)(q.question_text))
                continue;
            const sanitizedText = (0, question_sanitizer_1.sanitizeQuestionText)(q.question_text);
            if (!sanitizedText || sanitizedText.length < 10)
                continue;
            const normalized = sanitizedText.trim().toLowerCase();
            if (!seenTexts.has(normalized)) {
                seenTexts.add(normalized);
                const cleanedOptions = Array.isArray(q.options)
                    ? q.options.map((opt) => ({
                        ...opt,
                        text: (0, question_sanitizer_1.cleanOptionText)(opt.text),
                    }))
                    : q.options;
                result.push({
                    ...q,
                    question_text: sanitizedText,
                    options: cleanedOptions,
                    explanation: q.explanation ? (0, question_sanitizer_1.sanitizeExplanation)(q.explanation) : null,
                });
                if (result.length >= targetCount)
                    break;
            }
        }
        if (topics && topics.length > 0 && result.length < targetCount) {
            const remainingCount = targetCount - result.length;
            const fetchedIds = result.map(q => q.id);
            const fallbackConditions = [
                (0, drizzle_orm_1.eq)(schema.questions.subject, subject),
                (0, drizzle_orm_1.eq)(schema.questions.status, 'published')
            ];
            if (fetchedIds.length > 0) {
                fallbackConditions.push((0, drizzle_orm_1.notInArray)(schema.questions.id, fetchedIds));
            }
            if (difficultyLevel && difficultyLevel !== 'any') {
                fallbackConditions.push((0, drizzle_orm_1.eq)(schema.questions.difficulty_level, Number(difficultyLevel)));
            }
            const fallbackCandidates = await this.db.select().from(schema.questions)
                .where((0, drizzle_orm_1.and)(...fallbackConditions))
                .orderBy((0, drizzle_orm_1.sql) `RANDOM()`)
                .limit(remainingCount * 3);
            const fallbackQuestions = [];
            for (const q of fallbackCandidates) {
                if ((0, question_sanitizer_1.isIncompleteQuestion)(q.question_text))
                    continue;
                const sanitizedText = (0, question_sanitizer_1.sanitizeQuestionText)(q.question_text);
                if (!sanitizedText || sanitizedText.length < 10)
                    continue;
                const normalized = sanitizedText.trim().toLowerCase();
                if (!seenTexts.has(normalized)) {
                    seenTexts.add(normalized);
                    const cleanedOptions = Array.isArray(q.options)
                        ? q.options.map((opt) => ({
                            ...opt,
                            text: (0, question_sanitizer_1.cleanOptionText)(opt.text),
                        }))
                        : q.options;
                    fallbackQuestions.push({
                        ...q,
                        question_text: sanitizedText,
                        options: cleanedOptions,
                        explanation: q.explanation ? (0, question_sanitizer_1.sanitizeExplanation)(q.explanation) : null,
                    });
                    if (fallbackQuestions.length >= remainingCount)
                        break;
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
            const repeated = [];
            for (let r = 0; r < 3 && repeated.length < targetCount; r++) {
                const pass = [...result].sort(() => Math.random() - 0.5);
                repeated.push(...pass);
            }
            result = repeated.slice(0, targetCount);
        }
        return { questions: result, warnings };
    }
};
exports.ExamService = ExamService;
exports.ExamService = ExamService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase])
], ExamService);
//# sourceMappingURL=exam.service.js.map