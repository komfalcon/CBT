"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const session_schema_1 = require("./schemas/session.schema");
const result_schema_1 = require("../results/schemas/result.schema");
const question_schema_1 = require("../questions/schemas/question.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let ExamService = class ExamService {
    constructor(sessionModel, resultModel, questionModel, userModel) {
        this.sessionModel = sessionModel;
        this.resultModel = resultModel;
        this.questionModel = questionModel;
        this.userModel = userModel;
    }
    async createSession(userId, type, subject, count) {
        let subjectsList = [];
        const questionsList = [];
        let timeRemaining = 7200;
        const user = await this.userModel.findOne({ userId }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User profile not found');
        }
        if (type === 'mock') {
            const combination = user.exam_subject_combination || [];
            if (combination.length !== 4 || !combination.includes('english')) {
                throw new common_1.BadRequestException('Configure a valid 4-subject combination including English first.');
            }
            subjectsList = combination;
            for (const sub of subjectsList) {
                const targetCount = sub === 'english' ? 60 : 40;
                const subQuestions = await this.questionModel
                    .aggregate([
                    { $match: { subject: sub, status: 'published' } },
                    { $sample: { size: targetCount } },
                ])
                    .exec();
                questionsList.push(...subQuestions);
            }
        }
        else {
            if (!subject) {
                throw new common_1.BadRequestException('Subject is required for individual drills.');
            }
            const finalCount = count && [10, 20, 40].includes(count) ? count : 20;
            subjectsList = [subject];
            timeRemaining = finalCount * 60;
            const subQuestions = await this.questionModel
                .aggregate([
                { $match: { subject, status: 'published' } },
                { $sample: { size: finalCount } },
            ])
                .exec();
            if (subQuestions.length === 0) {
                throw new common_1.BadRequestException(`No published questions found for subject: ${subject}`);
            }
            questionsList.push(...subQuestions);
        }
        const session = await this.sessionModel.create({
            userId,
            type,
            subjects: subjectsList,
            questions: questionsList,
            answers: new Map(),
            timeRemaining,
            status: 'active',
            startedAt: new Date(),
        });
        return session;
    }
    async getSession(sessionId, userId) {
        const session = await this.sessionModel.findOne({ sessionId, userId }).exec();
        if (!session) {
            throw new common_1.NotFoundException('Exam session not found.');
        }
        return session;
    }
    async saveAnswers(sessionId, userId, answers, timeRemaining) {
        const session = await this.sessionModel.findOne({ sessionId, userId, status: 'active' }).exec();
        if (!session) {
            throw new common_1.NotFoundException('Active exam session not found.');
        }
        session.timeRemaining = Math.max(0, timeRemaining);
        if (answers) {
            const answersMap = new Map();
            Object.entries(answers).forEach(([qId, val]) => {
                if (val) {
                    answersMap.set(qId, val);
                }
            });
            session.answers = answersMap;
        }
        await session.save();
        return session;
    }
    async submitSession(sessionId, userId) {
        const session = await this.sessionModel.findOne({ sessionId, userId, status: 'active' }).exec();
        if (!session) {
            throw new common_1.NotFoundException('Active exam session not found or already submitted.');
        }
        const durationLimit = session.type === 'mock' ? 7200 : session.questions.length * 60;
        const timeSpentSeconds = Math.max(0, durationLimit - session.timeRemaining);
        const subjectScoresList = [];
        for (const sub of session.subjects) {
            const subQuestions = session.questions.filter((q) => q.subject === sub);
            const totalInSub = subQuestions.length;
            let correct = 0;
            let incorrect = 0;
            let unanswered = 0;
            for (const question of subQuestions) {
                const userChoice = session.answers.get(question.questionId);
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
            const standardizedScore = totalInSub > 0 ? Math.round((correct / totalInSub) * 100) : 0;
            subjectScoresList.push({
                subject: sub,
                score: standardizedScore,
                correctCount: correct,
                incorrectCount: incorrect,
                unansweredCount: unanswered,
            });
        }
        let totalScore = 0;
        if (session.type === 'mock') {
            totalScore = subjectScoresList.reduce((acc, val) => acc + val.score, 0);
        }
        else {
            totalScore = subjectScoresList[0]?.score || 0;
        }
        const result = await this.resultModel.create({
            sessionId: session.sessionId,
            userId: session.userId,
            type: session.type,
            subjectScores: subjectScoresList,
            totalScore,
            timeSpentSeconds,
            answers: session.answers,
            questionsSnapshot: session.questions,
            completedAt: new Date(),
        });
        session.status = 'completed';
        session.completedAt = new Date();
        await session.save();
        const xpReward = session.type === 'mock' ? 150 : 35;
        const user = await this.userModel.findOne({ userId }).exec();
        if (user) {
            user.xp_points = (user.xp_points || 0) + xpReward;
            user.streak_count = (user.streak_count || 0) + 1;
            while (user.xp_points >= user.level * 400) {
                user.level += 1;
            }
            await user.save();
        }
        return result;
    }
    sanitizeSession(session) {
        const plain = session.toObject();
        plain.questions = plain.questions.map((q) => {
            const { correct_option, explanation, embedding_vector, ...rest } = q;
            return rest;
        });
        return plain;
    }
};
exports.ExamService = ExamService;
exports.ExamService = ExamService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(session_schema_1.ExamSession.name)),
    __param(1, (0, mongoose_1.InjectModel)(result_schema_1.ExamResult.name)),
    __param(2, (0, mongoose_1.InjectModel)(question_schema_1.Question.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ExamService);
//# sourceMappingURL=exam.service.js.map