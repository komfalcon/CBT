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
let ExamController = class ExamController {
    constructor(examService) {
        this.examService = examService;
    }
    async createSession(user, body) {
        const session = await this.examService.createSession(user.sub, body.type, body.subject, body.count);
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
    async submitSession(user, sessionId) {
        return this.examService.submitSession(sessionId, user.sub);
    }
};
exports.ExamController = ExamController;
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
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
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "saveAnswers", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "submitSession", null);
exports.ExamController = ExamController = __decorate([
    (0, common_1.Controller)('exam'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [exam_service_1.ExamService])
], ExamController);
//# sourceMappingURL=exam.controller.js.map