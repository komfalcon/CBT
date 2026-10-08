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
exports.UpdateQuestionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const question_types_1 = require("../types/question.types");
class QuestionOptionDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(question_types_1.OPTION_IDS),
    __metadata("design:type", String)
], QuestionOptionDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuestionOptionDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuestionOptionDto.prototype, "image_url", void 0);
class QuestionMediaDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(question_types_1.MEDIA_TYPES),
    __metadata("design:type", String)
], QuestionMediaDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuestionMediaDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuestionMediaDto.prototype, "alt_text", void 0);
class UpdateQuestionDto {
}
exports.UpdateQuestionDto = UpdateQuestionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.QUESTION_SUBJECTS),
    __metadata("design:type", Object)
], UpdateQuestionDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "subtopic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1990),
    (0, class_validator_1.Max)(2024),
    __metadata("design:type", Number)
], UpdateQuestionDto.prototype, "year_sourced", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "question_text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuestionOptionDto),
    __metadata("design:type", Array)
], UpdateQuestionDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.OPTION_IDS),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "correct_option", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "explanation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.QUESTION_TYPES),
    __metadata("design:type", Object)
], UpdateQuestionDto.prototype, "question_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateQuestionDto.prototype, "difficulty_level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-3),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], UpdateQuestionDto.prototype, "irt_difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.5),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], UpdateQuestionDto.prototype, "irt_discrimination", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(0.35),
    __metadata("design:type", Number)
], UpdateQuestionDto.prototype, "irt_guessing", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.BLOOM_LEVELS),
    __metadata("design:type", Object)
], UpdateQuestionDto.prototype, "bloom_level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateQuestionDto.prototype, "estimated_solve_time_seconds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuestionMediaDto),
    __metadata("design:type", Array)
], UpdateQuestionDto.prototype, "media", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateQuestionDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.QUESTION_STATUSES),
    __metadata("design:type", Object)
], UpdateQuestionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuestionDto.prototype, "change_reason", void 0);
//# sourceMappingURL=update-question.dto.js.map