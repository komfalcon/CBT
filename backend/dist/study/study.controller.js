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
exports.StudyController = void 0;
const common_1 = require("@nestjs/common");
const study_service_1 = require("./study.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let StudyController = class StudyController {
    constructor(studyService) {
        this.studyService = studyService;
    }
    async getAllSyllabus(req) {
        return this.studyService.getAllSyllabusProgress(req.user.id || req.user.sub);
    }
    async getSyllabus(req, subject) {
        return this.studyService.getSyllabusProgress(req.user.id || req.user.sub, subject);
    }
    async updateTopic(req, subject, body) {
        return this.studyService.updateTopicStatus(req.user.id || req.user.sub, subject, body.topic, body.completed);
    }
    async getTimetable(req) {
        return this.studyService.getTimetable(req.user.id || req.user.sub);
    }
    async addSession(req, body) {
        return this.studyService.addSession(req.user.id || req.user.sub, body);
    }
    async updateSession(req, id, body) {
        return this.studyService.updateSession(req.user.id || req.user.sub, id, body);
    }
    async deleteSession(req, id) {
        return this.studyService.deleteSession(req.user.id || req.user.sub, id);
    }
};
exports.StudyController = StudyController;
__decorate([
    (0, common_1.Get)('syllabus'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudyController.prototype, "getAllSyllabus", null);
__decorate([
    (0, common_1.Get)('syllabus/:subject'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('subject')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudyController.prototype, "getSyllabus", null);
__decorate([
    (0, common_1.Post)('syllabus/:subject/topic'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('subject')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], StudyController.prototype, "updateTopic", null);
__decorate([
    (0, common_1.Get)('timetable'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudyController.prototype, "getTimetable", null);
__decorate([
    (0, common_1.Post)('timetable/session'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StudyController.prototype, "addSession", null);
__decorate([
    (0, common_1.Put)('timetable/session/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], StudyController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Delete)('timetable/session/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudyController.prototype, "deleteSession", null);
exports.StudyController = StudyController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('study'),
    __metadata("design:paramtypes", [study_service_1.StudyService])
], StudyController);
//# sourceMappingURL=study.controller.js.map