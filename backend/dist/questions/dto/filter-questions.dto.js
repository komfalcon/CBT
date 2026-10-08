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
exports.FilterQuestionsDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const question_types_1 = require("../types/question.types");
class FilterQuestionsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
    }
}
exports.FilterQuestionsDto = FilterQuestionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.QUESTION_SUBJECTS),
    __metadata("design:type", Object)
], FilterQuestionsDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterQuestionsDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FilterQuestionsDto.prototype, "subtopic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.QUESTION_STATUSES),
    __metadata("design:type", Object)
], FilterQuestionsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => Number(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], FilterQuestionsDto.prototype, "difficulty_level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => Number(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1990),
    (0, class_validator_1.Max)(2024),
    __metadata("design:type", Number)
], FilterQuestionsDto.prototype, "year_sourced", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.BLOOM_LEVELS),
    __metadata("design:type", Object)
], FilterQuestionsDto.prototype, "bloom_level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_types_1.QUESTION_TYPES),
    __metadata("design:type", Object)
], FilterQuestionsDto.prototype, "question_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (Array.isArray(value)) {
            return value;
        }
        return String(value)
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
    }),
    __metadata("design:type", Array)
], FilterQuestionsDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => Number(value ?? 1)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], FilterQuestionsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => Math.min(Number(value ?? 20), 100)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], FilterQuestionsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['created_at', 'difficulty_level', 'use_count']),
    __metadata("design:type", String)
], FilterQuestionsDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], FilterQuestionsDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=filter-questions.dto.js.map