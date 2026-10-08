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
exports.QuestionsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const questions_service_1 = require("./questions.service");
let QuestionSubjectCount = class QuestionSubjectCount {
};
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], QuestionSubjectCount.prototype, "subject", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], QuestionSubjectCount.prototype, "count", void 0);
QuestionSubjectCount = __decorate([
    (0, graphql_1.ObjectType)()
], QuestionSubjectCount);
let QuestionListResponse = class QuestionListResponse {
};
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], QuestionListResponse.prototype, "total", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], QuestionListResponse.prototype, "page", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], QuestionListResponse.prototype, "limit", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], QuestionListResponse.prototype, "totalPages", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], QuestionListResponse.prototype, "questionIds", void 0);
QuestionListResponse = __decorate([
    (0, graphql_1.ObjectType)()
], QuestionListResponse);
let QuestionsResolver = class QuestionsResolver {
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    async questionSubjects() {
        return this.questionsService.getPublishedSubjectCounts();
    }
    async questionSearch(q, page = 1, limit = 20) {
        const result = await this.questionsService.searchQuestions({
            q,
            page,
            limit,
        });
        return {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            questionIds: result.data.map((question) => question.questionId),
        };
    }
};
exports.QuestionsResolver = QuestionsResolver;
__decorate([
    (0, graphql_1.Query)(() => [QuestionSubjectCount]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QuestionsResolver.prototype, "questionSubjects", null);
__decorate([
    (0, graphql_1.Query)(() => QuestionListResponse),
    __param(0, (0, graphql_1.Args)('q')),
    __param(1, (0, graphql_1.Args)('page', { type: () => graphql_1.Int, nullable: true })),
    __param(2, (0, graphql_1.Args)('limit', { type: () => graphql_1.Int, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], QuestionsResolver.prototype, "questionSearch", null);
exports.QuestionsResolver = QuestionsResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], QuestionsResolver);
//# sourceMappingURL=questions.resolver.js.map