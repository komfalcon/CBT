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
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const amqp = __importStar(require("amqplib"));
const config_1 = require("@nestjs/config");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const import_questions_dto_1 = require("../dto/import-questions.dto");
const import_service_1 = require("./import.service");
let ImportController = class ImportController {
    constructor(importService, configService) {
        this.importService = importService;
        this.configService = configService;
    }
    upload(file) {
        return this.importService.uploadAndParse(file);
    }
    preview(importId) {
        return this.importService.getPreview(importId);
    }
    async commit(dto, req) {
        const actorUserId = req.user?.sub ?? req.user?.userId;
        if (!actorUserId) {
            throw new common_1.BadRequestException('Authenticated user required');
        }
        if (dto.async) {
            const rabbitUrl = this.configService.get('RABBITMQ_URL');
            if (!rabbitUrl) {
                throw new common_1.BadRequestException('RABBITMQ_URL is not configured for async import');
            }
            const connection = await amqp.connect(rabbitUrl, { timeout: 2000 });
            const channel = await connection.createChannel();
            await channel.assertQueue('questions.import.commit', { durable: true });
            channel.sendToQueue('questions.import.commit', Buffer.from(JSON.stringify({
                importId: dto.importId,
                actorUserId,
                columnMapping: dto.columnMapping,
            })), { persistent: true });
            await channel.close().catch(() => undefined);
            await connection.close().catch(() => undefined);
            return {
                message: 'Import queued successfully',
                importId: dto.importId,
            };
        }
        return this.importService.commitImport(dto, actorUserId);
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(':importId/preview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Param)('importId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('commit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_questions_dto_1.ImportQuestionsDto, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "commit", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)('questions/import'),
    __metadata("design:paramtypes", [import_service_1.ImportService,
        config_1.ConfigService])
], ImportController);
//# sourceMappingURL=import.controller.js.map