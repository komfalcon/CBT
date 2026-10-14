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
exports.ExamController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const exam_service_1 = require("./exam.service");
const create_session_dto_1 = require("./dto/create-session.dto");
const save_answers_dto_1 = require("./dto/save-answers.dto");
const clef_decision_service_1 = require("../ai/clef-decision.service");
let ExamController = class ExamController {
    constructor(examService, clefDecisionService) {
        this.examService = examService;
        this.clefDecisionService = clefDecisionService;
    }
    async createSession(user, body) {
        const session = await this.examService.createSession(user.sub, body.type, body.subject, body.subjects, body.subjectConfigs, body.count, body.difficultyLevel, body.topics);
        return this.examService.sanitizeSession(session);
    }
    async getSession(user, sessionId) {
        const session = await this.examService.getSession(sessionId, user.sub);
        if (session.status === 'active') {
            return this.examService.sanitizeSession(session);
        }
        return session;
    }
    async saveAnswers(user, sessionId, body) {
        const session = await this.examService.saveAnswers(sessionId, user.sub, body.answers, body.timeRemaining);
        return this.examService.sanitizeSession(session);
    }
    async submitSession(user, sessionId, body) {
        return this.examService.submitSession(sessionId, user.sub, body?.reason);
    }
    async evaluateProctoring(user, sessionId, body) {
        if (!body?.image) {
            const strikes = await this.examService.getSessionStrikes(sessionId, user.sub);
            return { violationFlagged: false, strikes, disqualified: false };
        }
        const result = await this.clefDecisionService.evaluateProctoringFrame(body.image);
        if (result.violationFlagged) {
            const strikeData = await this.examService.recordProctorViolation(sessionId, user.sub, result.reasons);
            return {
                ...result,
                ...strikeData,
            };
        }
        const strikes = await this.examService.getSessionStrikes(sessionId, user.sub);
        return {
            ...result,
            strikes,
            disqualified: false,
        };
    }
    async evaluateAdaptive(_user, _sessionId, body) {
        return this.clefDecisionService.evaluateAdaptiveRouting({
            recentAccuracyPercent: body.recentAccuracyPercent ?? 50,
            avgTimeSeconds: body.avgTimeSeconds ?? 45,
            currentDifficulty: body.currentDifficulty ?? 'medium',
            unansweredStreak: body.unansweredStreak ?? 0,
        });
    }
};
exports.ExamController = ExamController;
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/answers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, save_answers_dto_1.SaveAnswersDto]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "saveAnswers", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "submitSession", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/proctor'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "evaluateProctoring", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/adaptive-evaluate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "evaluateAdaptive", null);
exports.ExamController = ExamController = __decorate([
    (0, common_1.Controller)('exam'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [exam_service_1.ExamService,
        clef_decision_service_1.ClefDecisionService])
], ExamController);
//# sourceMappingURL=exam.controller.js.map