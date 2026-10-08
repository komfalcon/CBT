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
exports.QuestionSchema = exports.Question = exports.QuestionVersion = exports.QuestionMedia = exports.QuestionOption = void 0;
const uuid_1 = require("uuid");
const question_types_1 = require("../types/question.types");
let QuestionOption = class QuestionOption {
};
exports.QuestionOption = QuestionOption;
__decorate([
    Prop({ required: true, enum: question_types_1.OPTION_IDS }),
    __metadata("design:type", String)
], QuestionOption.prototype, "id", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], QuestionOption.prototype, "text", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], QuestionOption.prototype, "image_url", void 0);
exports.QuestionOption = QuestionOption = __decorate([
    Schema({ _id: false })
], QuestionOption);
const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);
let QuestionMedia = class QuestionMedia {
};
exports.QuestionMedia = QuestionMedia;
__decorate([
    Prop({ required: true, enum: question_types_1.MEDIA_TYPES }),
    __metadata("design:type", String)
], QuestionMedia.prototype, "type", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], QuestionMedia.prototype, "url", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], QuestionMedia.prototype, "alt_text", void 0);
exports.QuestionMedia = QuestionMedia = __decorate([
    Schema({ _id: false })
], QuestionMedia);
const QuestionMediaSchema = SchemaFactory.createForClass(QuestionMedia);
let QuestionVersion = class QuestionVersion {
};
exports.QuestionVersion = QuestionVersion;
__decorate([
    Prop({ required: true }),
    __metadata("design:type", Number)
], QuestionVersion.prototype, "version_number", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], QuestionVersion.prototype, "question_text", void 0);
__decorate([
    Prop({ type: [QuestionOptionSchema], required: true, default: [] }),
    __metadata("design:type", Array)
], QuestionVersion.prototype, "options", void 0);
__decorate([
    Prop({ required: true, enum: question_types_1.OPTION_IDS }),
    __metadata("design:type", String)
], QuestionVersion.prototype, "correct_option", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], QuestionVersion.prototype, "modified_by", void 0);
__decorate([
    Prop({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], QuestionVersion.prototype, "modified_at", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], QuestionVersion.prototype, "change_reason", void 0);
exports.QuestionVersion = QuestionVersion = __decorate([
    Schema({ _id: false })
], QuestionVersion);
const QuestionVersionSchema = SchemaFactory.createForClass(QuestionVersion);
let Question = class Question {
};
exports.Question = Question;
__decorate([
    Prop({ default: uuid_1.v4, unique: true, index: true }),
    __metadata("design:type", String)
], Question.prototype, "questionId", void 0);
__decorate([
    Prop({ required: true, enum: question_types_1.QUESTION_SUBJECTS, index: true }),
    __metadata("design:type", String)
], Question.prototype, "subject", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Question.prototype, "topic", void 0);
__decorate([
    Prop({ index: true }),
    __metadata("design:type", String)
], Question.prototype, "topicId", void 0);
__decorate([
    Prop({ index: true }),
    __metadata("design:type", String)
], Question.prototype, "conceptId", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Question.prototype, "subtopic", void 0);
__decorate([
    Prop({ min: 1990, max: 2024 }),
    __metadata("design:type", Number)
], Question.prototype, "year_sourced", void 0);
__decorate([
    Prop({ required: true, minlength: 10 }),
    __metadata("design:type", String)
], Question.prototype, "question_text", void 0);
__decorate([
    Prop({ type: [QuestionOptionSchema], required: true, default: [] }),
    __metadata("design:type", Array)
], Question.prototype, "options", void 0);
__decorate([
    Prop({ required: true, enum: question_types_1.OPTION_IDS }),
    __metadata("design:type", String)
], Question.prototype, "correct_option", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Question.prototype, "explanation", void 0);
__decorate([
    Prop({ required: true, enum: question_types_1.QUESTION_TYPES }),
    __metadata("design:type", String)
], Question.prototype, "question_type", void 0);
__decorate([
    Prop({ required: true, min: 1, max: 5, index: true }),
    __metadata("design:type", Number)
], Question.prototype, "difficulty_level", void 0);
__decorate([
    Prop({ min: -3, max: 3, default: 0 }),
    __metadata("design:type", Number)
], Question.prototype, "irt_difficulty", void 0);
__decorate([
    Prop({ min: 0.5, max: 3, default: 1 }),
    __metadata("design:type", Number)
], Question.prototype, "irt_discrimination", void 0);
__decorate([
    Prop({ min: 0, max: 0.35, default: 0.25 }),
    __metadata("design:type", Number)
], Question.prototype, "irt_guessing", void 0);
__decorate([
    Prop({ enum: question_types_1.BLOOM_LEVELS }),
    __metadata("design:type", String)
], Question.prototype, "bloom_level", void 0);
__decorate([
    Prop({ default: 60 }),
    __metadata("design:type", Number)
], Question.prototype, "estimated_solve_time_seconds", void 0);
__decorate([
    Prop({ type: [QuestionMediaSchema], default: [] }),
    __metadata("design:type", Array)
], Question.prototype, "media", void 0);
__decorate([
    Prop({ default: 'en' }),
    __metadata("design:type", String)
], Question.prototype, "language", void 0);
__decorate([
    Prop({ type: String, enum: question_types_1.QUESTION_STATUSES, default: 'draft', index: true }),
    __metadata("design:type", String)
], Question.prototype, "status", void 0);
__decorate([
    Prop({ required: true }),
    __metadata("design:type", String)
], Question.prototype, "created_by", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Question.prototype, "reviewed_by", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Question.prototype, "approved_by", void 0);
__decorate([
    Prop(),
    __metadata("design:type", Date)
], Question.prototype, "approved_at", void 0);
__decorate([
    Prop({ default: false }),
    __metadata("design:type", Boolean)
], Question.prototype, "is_bonus", void 0);
__decorate([
    Prop({ type: [QuestionVersionSchema], default: [] }),
    __metadata("design:type", Array)
], Question.prototype, "versions", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], Question.prototype, "use_count", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], Question.prototype, "avg_response_time_ms", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], Question.prototype, "correct_count", void 0);
__decorate([
    Prop({ default: 0 }),
    __metadata("design:type", Number)
], Question.prototype, "attempt_count", void 0);
__decorate([
    Prop({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Question.prototype, "tags", void 0);
__decorate([
    Prop({ type: [Number], default: [], select: false }),
    __metadata("design:type", Array)
], Question.prototype, "embedding_vector", void 0);
__decorate([
    Prop({ default: false }),
    __metadata("design:type", Boolean)
], Question.prototype, "has_diagram", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Question.prototype, "diagram_svg", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Question.prototype, "latex", void 0);
__decorate([
    Prop(),
    __metadata("design:type", String)
], Question.prototype, "import_batch_id", void 0);
__decorate([
    Prop({ type: String, enum: question_types_1.QUESTION_SOURCES, default: 'manual' }),
    __metadata("design:type", String)
], Question.prototype, "source", void 0);
exports.Question = Question = __decorate([
    Schema({
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    })
], Question);
exports.QuestionSchema = SchemaFactory.createForClass(Question);
exports.QuestionSchema.index({ subject: 1, topic: 1, difficulty_level: 1 });
exports.QuestionSchema.index({ subject: 1, status: 1, year_sourced: 1 });
exports.QuestionSchema.index({ status: 1, created_at: -1 });
exports.QuestionSchema.index({ question_text: 'text' });
exports.QuestionSchema.index({ tags: 1 });
exports.QuestionSchema.index({ import_batch_id: 1 });
//# sourceMappingURL=question.schema.js.map