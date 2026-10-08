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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async explainQuestion(req, body) {
        return this.aiService.generateExplanation(req.user.sub, body.questionText, body.correctAnswer, body.studentAnswer, body.questionId);
    }
    async reportExplanation(req, questionId, body) {
        return this.aiService.reportExplanation(req.user.sub, questionId, body.reason);
    }
    async getChatSessions(req) {
        return this.aiService.getChatSessions(req.user.sub);
    }
    async createChatSession(req, body) {
        return this.aiService.createChatSession(req.user.sub, body.title);
    }
    async getChatSession(req, sessionId) {
        return this.aiService.getChatSession(req.user.sub, sessionId);
    }
    async deleteChatSession(req, sessionId) {
        return this.aiService.deleteChatSession(req.user.sub, sessionId);
    }
    async chatWithTutor(req, body) {
        return this.aiService.chatWithTutor(req.user.sub, body.message, body.history || [], body.contextPayload, body.sessionId);
    }
    async generateDiagram(questionId) {
        const svg = await this.aiService.generateDiagram(questionId);
        return { svg };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('explain'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "explainQuestion", null);
__decorate([
    (0, common_1.Post)('explanations/:questionId/report'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('questionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "reportExplanation", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getChatSessions", null);
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "createChatSession", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getChatSession", null);
__decorate([
    (0, common_1.Delete)('sessions/:sessionId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "deleteChatSession", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chatWithTutor", null);
__decorate([
    (0, common_1.Post)('generate-diagram/:questionId'),
    __param(0, (0, common_1.Param)('questionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateDiagram", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map