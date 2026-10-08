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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningEventDto = exports.ExchangeHandoffDto = exports.CreateHandoffDto = void 0;
const class_validator_1 = require("class-validator");
const SUBJECTS = [
    'english', 'mathematics', 'physics', 'chemistry', 'biology', 'geography',
    'economics', 'government', 'literature', 'commerce', 'accounting',
    'agriculture', 'civic_education', 'crk', 'irk', 'history', 'further_mathematics',
];
class CreateHandoffDto {
}
exports.CreateHandoffDto = CreateHandoffDto;
__decorate([
    (0, class_validator_1.IsIn)(['library', 'cbt']),
    __metadata("design:type", String)
], CreateHandoffDto.prototype, "audience", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateHandoffDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(SUBJECTS),
    __metadata("design:type", String)
], CreateHandoffDto.prototype, "subjectId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateHandoffDto.prototype, "topicId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateHandoffDto.prototype, "conceptId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreateHandoffDto.prototype, "returnUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\/(?!\/).*/),
    __metadata("design:type", String)
], CreateHandoffDto.prototype, "nextPath", void 0);
class ExchangeHandoffDto {
}
exports.ExchangeHandoffDto = ExchangeHandoffDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(20),
    __metadata("design:type", String)
], ExchangeHandoffDto.prototype, "handoff", void 0);
class LearningEventDto {
}
exports.LearningEventDto = LearningEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], LearningEventDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['topic_opened', 'topic_engaged', 'topic_reviewed', 'topic_practiced', 'topic_repaired']),
    __metadata("design:type", String)
], LearningEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LearningEventDto.prototype, "subjectId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LearningEventDto.prototype, "topicId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LearningEventDto.prototype, "sourceProduct", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LearningEventDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LearningEventDto.prototype, "occurredAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], LearningEventDto.prototype, "metadata", void 0);
//# sourceMappingURL=handoff.dto.js.map