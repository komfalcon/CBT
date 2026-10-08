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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const elasticsearch_1 = require("@elastic/elasticsearch");
const mongoose_2 = require("mongoose");
const question_schema_1 = require("../schemas/question.schema");
const INDEX_NAME = 'jamb_questions';
let SearchService = SearchService_1 = class SearchService {
    constructor(configService, questionModel) {
        this.configService = configService;
        this.questionModel = questionModel;
        this.logger = new common_1.Logger(SearchService_1.name);
        this.mappingEnsured = false;
        const node = this.configService.get('ELASTICSEARCH_URL');
        if (node) {
            this.client = new elasticsearch_1.Client({ node, requestTimeout: 3000, maxRetries: 1 });
        }
    }
    isConfigured() {
        return !!this.client;
    }
    async ensureIndex() {
        if (!this.client || this.mappingEnsured) {
            return;
        }
        try {
            const exists = await this.client.indices.exists({ index: INDEX_NAME });
            if (!exists) {
                await this.client.indices.create({
                    index: INDEX_NAME,
                    mappings: {
                        properties: {
                            question_text: { type: 'text', analyzer: 'english' },
                            subject: { type: 'keyword' },
                            topic: { type: 'keyword' },
                            subtopic: { type: 'keyword' },
                            tags: { type: 'keyword' },
                            difficulty_level: { type: 'integer' },
                            status: { type: 'keyword' },
                            year_sourced: { type: 'integer' },
                            bloom_level: { type: 'keyword' },
                            question_type: { type: 'keyword' },
                        },
                    },
                });
            }
            this.mappingEnsured = true;
        }
        catch {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
        }
    }
    async indexQuestion(question) {
        if (!this.client) {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
            return false;
        }
        try {
            await this.ensureIndex();
            await this.client.index({
                index: INDEX_NAME,
                id: question.questionId,
                document: question,
                refresh: 'wait_for',
            });
            return true;
        }
        catch {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
            return false;
        }
    }
    async deleteQuestion(questionId) {
        if (!this.client) {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
            return false;
        }
        try {
            await this.client.delete({ index: INDEX_NAME, id: questionId, refresh: 'wait_for' });
            return true;
        }
        catch {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
            return false;
        }
    }
    async searchQuestions(query, filters, pagination) {
        if (!this.client) {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
            return null;
        }
        try {
            await this.ensureIndex();
            const must = [{ match: { question_text: query } }];
            const filter = [];
            Object.entries(filters).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') {
                    return;
                }
                filter.push({ term: { [key]: value } });
            });
            const from = (pagination.page - 1) * pagination.limit;
            const response = await this.client.search({
                index: INDEX_NAME,
                from,
                size: pagination.limit,
                query: {
                    bool: {
                        must,
                        filter,
                    },
                },
            });
            const hits = response.hits.hits;
            const ids = hits.map((hit) => String(hit._id));
            const totalValue = typeof response.hits.total === 'number' ? response.hits.total : (response.hits.total?.value ?? 0);
            return { ids, total: totalValue };
        }
        catch {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
            return null;
        }
    }
    async bulkIndex(questions) {
        if (!this.client) {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
            return false;
        }
        try {
            await this.ensureIndex();
            if (questions.length === 0) {
                return true;
            }
            const operations = [];
            for (const question of questions) {
                operations.push({ index: { _index: INDEX_NAME, _id: question.questionId } });
                operations.push(question);
            }
            await this.client.bulk({ operations, refresh: true });
            return true;
        }
        catch {
            this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
            return false;
        }
    }
    async reindexAll() {
        const questions = await this.questionModel.find().lean().exec();
        const mapped = questions.map((question) => ({
            questionId: question.questionId,
            question_text: question.question_text,
            subject: question.subject,
            topic: question.topic,
            subtopic: question.subtopic,
            tags: question.tags,
            difficulty_level: question.difficulty_level,
            status: question.status,
            year_sourced: question.year_sourced,
            bloom_level: question.bloom_level,
            question_type: question.question_type,
        }));
        await this.bulkIndex(mapped);
        return { indexed: mapped.length };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(question_schema_1.Question.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model])
], SearchService);
//# sourceMappingURL=search.service.js.map