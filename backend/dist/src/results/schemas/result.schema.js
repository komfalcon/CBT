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
exports.ExamResultSchema = exports.ExamResult = exports.SubjectScore = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const uuid_1 = require("uuid");
const question_schema_1 = require("../../questions/schemas/question.schema");
let SubjectScore = class SubjectScore {
};
exports.SubjectScore = SubjectScore;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SubjectScore.prototype, "subject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SubjectScore.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SubjectScore.prototype, "correctCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SubjectScore.prototype, "incorrectCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SubjectScore.prototype, "unansweredCount", void 0);
exports.SubjectScore = SubjectScore = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SubjectScore);
const SubjectScoreSchema = mongoose_1.SchemaFactory.createForClass(SubjectScore);
let ExamResult = class ExamResult {
};
exports.ExamResult = ExamResult;
__decorate([
    (0, mongoose_1.Prop)({ default: uuid_1.v4, unique: true, index: true }),
    __metadata("design:type", String)
], ExamResult.prototype, "resultId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], ExamResult.prototype, "sessionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], ExamResult.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['mock', 'drill'] }),
    __metadata("design:type", String)
], ExamResult.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [SubjectScoreSchema], required: true }),
    __metadata("design:type", Array)
], ExamResult.prototype, "subjectScores", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], ExamResult.prototype, "totalScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], ExamResult.prototype, "timeSpentSeconds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Map, of: String, default: {} }),
    __metadata("design:type", Map)
], ExamResult.prototype, "answers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [question_schema_1.QuestionSchema], required: true }),
    __metadata("design:type", Array)
], ExamResult.prototype, "questionsSnapshot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: Date.now }),
    __metadata("design:type", Date)
], ExamResult.prototype, "completedAt", void 0);
exports.ExamResult = ExamResult = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        toJSON: { getters: true },
        toObject: { getters: true },
    })
], ExamResult);
exports.ExamResultSchema = mongoose_1.SchemaFactory.createForClass(ExamResult);
//# sourceMappingURL=result.schema.js.map