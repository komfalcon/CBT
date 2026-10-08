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
exports.QuestionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const create_question_dto_1 = require("./dto/create-question.dto");
const filter_questions_dto_1 = require("./dto/filter-questions.dto");
const update_question_dto_1 = require("./dto/update-question.dto");
const questions_service_1 = require("./questions.service");
class OptionalJwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    handleRequest(err, user) {
        if (err) {
            return null;
        }
        return user ?? null;
    }
}
const ai_question_generator_service_1 = require("./ai-question-generator.service");
const pdf_scanner_service_1 = require("./pdf-scanner.service");
let QuestionsController = class QuestionsController {
    constructor(questionsService, aiGeneratorService, pdfScannerService) {
        this.questionsService = questionsService;
        this.aiGeneratorService = aiGeneratorService;
        this.pdfScannerService = pdfScannerService;
    }
    startAiGeneration(payload) {
        if (!payload.subject) {
            throw new common_1.BadRequestException('subject is required');
        }
        return this.aiGeneratorService.startGenerationJob({
            subject: payload.subject,
            sourceType: payload.sourceType || 'mixed_curriculum',
            targetCount: Math.min(50000, Math.max(1, Number(payload.targetCount) || 50)),
            topics: Array.isArray(payload.topics) ? payload.topics : undefined,
        });
    }
    stopAiGeneration() {
        return this.aiGeneratorService.stopGenerationJob();
    }
    getAiGenerationStatus() {
        return this.aiGeneratorService.getGenerationStatus();
    }
    scanPdfDirectory(directoryPath) {
        return this.pdfScannerService.scanDirectory(directoryPath);
    }
    scanPdfUploadedFile(file) {
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('No PDF file uploaded');
        }
        return this.pdfScannerService.scanUploadedPdf(file.buffer, file.originalname || 'uploaded_paper.pdf');
    }
    getScanPdfStatus() {
        return this.pdfScannerService.getScanProgress();
    }
    create(payload, user) {
        return this.questionsService.createQuestion(payload, user);
    }
    list(filters) {
        return this.questionsService.listQuestions(filters);
    }
    search(q, subject, difficultyLevel, status, page = '1', limit = '20', user) {
        if (!q) {
            throw new common_1.BadRequestException('q is required');
        }
        return this.questionsService.search({
            q,
            subject,
            status,
            difficulty_level: difficultyLevel ? Number(difficultyLevel) : undefined,
            page: Number(page) || 1,
            limit: Math.min(Number(limit) || 20, 100),
        }, user);
    }
    getStats() {
        return this.questionsService.getStats();
    }
    getSubjects() {
        return this.questionsService.getPublishedSubjectCounts();
    }
    getTopics(subject) {
        if (!subject) {
            throw new common_1.BadRequestException('subject is required');
        }
        return this.questionsService.getTopics(subject);
    }
    bulkTagUpdate(payload) {
        return this.questionsService.bulkTagUpdate(payload);
    }
    versions(id) {
        return this.questionsService.getVersions(id);
    }
    getById(id, req) {
        return this.questionsService.getQuestionById(id, req.user);
    }
    update(id, payload, user) {
        return this.questionsService.updateQuestion(id, payload, user);
    }
    remove(id) {
        return this.questionsService.retireQuestion(id);
    }
    rollback(id, versionNumber, user) {
        return this.questionsService.rollbackQuestion(id, Number(versionNumber), user);
    }
    submitForReview(id, user) {
        return this.questionsService.submitForReview(id, user);
    }
    approve(id, user) {
        return this.questionsService.approveQuestion(id, user);
    }
    publish(id) {
        return this.questionsService.publishQuestion(id);
    }
    retire(id) {
        return this.questionsService.retirePublishedQuestion(id);
    }
};
exports.QuestionsController = QuestionsController;
__decorate([
    (0, common_1.Post)('ai-generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "startAiGeneration", null);
__decorate([
    (0, common_1.Post)('stop-ai-generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "stopAiGeneration", null);
__decorate([
    (0, common_1.Get)('ai-generate-status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin', 'examiner'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "getAiGenerationStatus", null);
__decorate([
    (0, common_1.Post)('scan-pdf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Body)('directoryPath')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "scanPdfDirectory", null);
__decorate([
    (0, common_1.Post)('scan-pdf-file'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "scanPdfUploadedFile", null);
__decorate([
    (0, common_1.Get)('scan-pdf-status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin', 'examiner'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "getScanPdfStatus", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('examiner', 'admin', 'super_admin'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_question_dto_1.CreateQuestionDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('examiner', 'admin', 'super_admin'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_questions_dto_1.FilterQuestionsDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.UseGuards)(OptionalJwtAuthGuard),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('subject')),
    __param(2, (0, common_1.Query)('difficulty_level')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin', 'examiner'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('subjects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "getSubjects", null);
__decorate([
    (0, common_1.Get)('topics'),
    __param(0, (0, common_1.Query)('subject')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "getTopics", null);
__decorate([
    (0, common_1.Post)('bulk-tag'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "bulkTagUpdate", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('examiner', 'admin', 'super_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "versions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "getById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('examiner', 'admin', 'super_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_question_dto_1.UpdateQuestionDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/rollback/:versionNumber'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('versionNumber')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "rollback", null);
__decorate([
    (0, common_1.Patch)(':id/submit-for-review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('examiner'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "submitForReview", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "publish", null);
__decorate([
    (0, common_1.Patch)(':id/retire'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "retire", null);
exports.QuestionsController = QuestionsController = __decorate([
    (0, common_1.Controller)('questions'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService,
        ai_question_generator_service_1.AiQuestionGeneratorService,
        pdf_scanner_service_1.PdfScannerService])
], QuestionsController);
//# sourceMappingURL=questions.controller.js.map