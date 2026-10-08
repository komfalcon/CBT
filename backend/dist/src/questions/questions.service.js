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
exports.QuestionsService = void 0;
exports.tokenizeQuestionText = tokenizeQuestionText;
exports.computeTfIdfVector = computeTfIdfVector;
exports.cosineSimilarity = cosineSimilarity;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const zod_1 = require("zod");
const notifications_service_1 = require("../notifications/notifications.service");
const question_schema_1 = require("./schemas/question.schema");
const search_service_1 = require("./search/search.service");
const question_types_1 = require("./types/question.types");
const duplicateStatuses = ['published', 'approved', 'under_review'];
const createQuestionSchema = zod_1.z.object({
    subject: zod_1.z.string(),
    topic: zod_1.z.string().trim().min(1),
    question_text: zod_1.z.string().trim().min(10),
    options: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.enum(['A', 'B', 'C', 'D', 'E']),
        text: zod_1.z.string().trim().min(1),
        image_url: zod_1.z.string().optional(),
    }))
        .min(2),
    correct_option: zod_1.z.enum(['A', 'B', 'C', 'D', 'E']),
    question_type: zod_1.z.string(),
    difficulty_level: zod_1.z.number().int().min(1).max(5),
});
const updateQuestionSchema = zod_1.z
    .object({
    question_text: zod_1.z.string().trim().min(10).optional(),
    change_reason: zod_1.z.string().trim().min(1),
})
    .passthrough();
function tokenizeQuestionText(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 1);
}
function termFrequency(tokens) {
    const freq = new Map();
    for (const token of tokens) {
        freq.set(token, (freq.get(token) ?? 0) + 1);
    }
    return freq;
}
function computeTfIdfVector(text, corpus) {
    const docs = [text, ...corpus];
    const tokenizedDocs = docs.map((entry) => tokenizeQuestionText(entry));
    const vocabSet = new Set();
    const docFrequency = new Map();
    tokenizedDocs.forEach((tokens) => {
        const seen = new Set();
        tokens.forEach((token) => {
            vocabSet.add(token);
            if (!seen.has(token)) {
                docFrequency.set(token, (docFrequency.get(token) ?? 0) + 1);
            }
            seen.add(token);
        });
    });
    const vocab = [...vocabSet].sort();
    const targetTokens = tokenizedDocs[0];
    const tf = termFrequency(targetTokens);
    const totalTerms = targetTokens.length || 1;
    return vocab.map((term) => {
        const termCount = tf.get(term) ?? 0;
        if (termCount === 0) {
            return 0;
        }
        const tfValue = termCount / totalTerms;
        const idf = Math.log((docs.length + 1) / ((docFrequency.get(term) ?? 0) + 1)) + 1;
        return Number((tfValue * idf).toFixed(6));
    });
}
function cosineSimilarity(a, b) {
    const maxLen = Math.max(a.length, b.length);
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let index = 0; index < maxLen; index += 1) {
        const av = a[index] ?? 0;
        const bv = b[index] ?? 0;
        dot += av * bv;
        magA += av * av;
        magB += bv * bv;
    }
    if (magA === 0 || magB === 0) {
        return 0;
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
let QuestionsService = class QuestionsService {
    constructor(questionModel, searchService, notificationsService) {
        this.questionModel = questionModel;
        this.searchService = searchService;
        this.notificationsService = notificationsService;
    }
    getActorId(user) {
        return user.sub ?? user.userId ?? 'system';
    }
    normalizeTags(tags) {
        return (tags ?? []).map((entry) => entry.trim().toLowerCase()).filter(Boolean);
    }
    sanitizeTextSearchInput(input) {
        return input.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
    }
    async runDuplicateCheck(params) {
        const filter = {
            subject: params.subject,
            status: { $in: duplicateStatuses },
        };
        if (params.excludeQuestionId) {
            filter.questionId = { $ne: params.excludeQuestionId };
        }
        const candidates = await this.questionModel
            .find(filter)
            .select({ questionId: 1, question_text: 1 })
            .lean()
            .exec();
        const corpus = candidates.map((entry) => entry.question_text);
        const targetVector = computeTfIdfVector(params.questionText, corpus);
        let highestSimilarity = 0;
        let highestQuestionId;
        for (const candidate of candidates) {
            const candidateVector = computeTfIdfVector(candidate.question_text, corpus);
            const similarity = cosineSimilarity(targetVector, candidateVector);
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                highestQuestionId = candidate.questionId;
            }
        }
        return {
            similarity: Number(highestSimilarity.toFixed(4)),
            existingQuestionId: highestQuestionId,
            blocked: highestSimilarity >= 0.95,
            warning: highestSimilarity >= 0.85 && highestSimilarity < 0.95,
            embeddingVector: targetVector,
        };
    }
    async indexQuestion(question) {
        await this.searchService.indexQuestion({
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
        });
    }
    async createQuestion(payload, user, options) {
        const parsed = createQuestionSchema.safeParse(payload);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
        }
        const optionIds = payload.options.map((option) => option.id);
        if (!optionIds.includes(payload.correct_option)) {
            throw new common_1.BadRequestException('correct_option must match one of options[].id');
        }
        const duplicate = await this.runDuplicateCheck({
            subject: payload.subject,
            questionText: payload.question_text,
        });
        if (duplicate.blocked) {
            throw new common_1.ConflictException({
                message: 'Similar question exists',
                similarity: duplicate.similarity,
                existingQuestionId: duplicate.existingQuestionId,
            });
        }
        const question = await this.questionModel.create({
            ...payload,
            tags: this.normalizeTags(payload.tags),
            status: 'draft',
            created_by: this.getActorId(user),
            source: options?.source ?? 'manual',
            import_batch_id: options?.importBatchId,
            embedding_vector: duplicate.embeddingVector,
        });
        await this.indexQuestion(question);
        if (duplicate.warning) {
            return {
                warning: 'Similar question exists',
                similarity: duplicate.similarity,
                existingQuestionId: duplicate.existingQuestionId,
                data: question,
            };
        }
        return question;
    }
    async listQuestions(filters) {
        const query = {};
        if (filters.subject)
            query.subject = filters.subject;
        if (filters.topic)
            query.topic = filters.topic;
        if (filters.subtopic)
            query.subtopic = filters.subtopic;
        if (filters.status)
            query.status = filters.status;
        if (filters.difficulty_level)
            query.difficulty_level = filters.difficulty_level;
        if (filters.year_sourced)
            query.year_sourced = filters.year_sourced;
        if (filters.bloom_level)
            query.bloom_level = filters.bloom_level;
        if (filters.question_type)
            query.question_type = filters.question_type;
        if (filters.tags?.length)
            query.tags = { $in: filters.tags.map((tag) => tag.toLowerCase()) };
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const sortDirection = filters.sortOrder === 'asc' ? 1 : -1;
        const sortBy = filters.sortBy ?? 'created_at';
        const [data, total] = await Promise.all([
            this.questionModel
                .find(query)
                .sort({ [sortBy]: sortDirection })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec(),
            this.questionModel.countDocuments(query).exec(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async searchQuestions(params) {
        const sanitizedQuery = this.sanitizeTextSearchInput(params.q);
        if (!sanitizedQuery) {
            throw new common_1.BadRequestException('Search query is required');
        }
        const filters = {
            subject: params.subject,
            difficulty_level: params.difficulty_level,
            status: params.status,
        };
        const esResult = await this.searchService.searchQuestions(sanitizedQuery, filters, {
            page: params.page,
            limit: params.limit,
        });
        if (esResult) {
            const indexedOrder = new Map(esResult.ids.map((id, index) => [id, index]));
            const data = await this.questionModel.find({ questionId: { $in: esResult.ids } }).lean().exec();
            data.sort((a, b) => (indexedOrder.get(a.questionId) ?? 0) - (indexedOrder.get(b.questionId) ?? 0));
            return {
                data,
                total: esResult.total,
                page: params.page,
                limit: params.limit,
                totalPages: Math.ceil(esResult.total / params.limit) || 1,
            };
        }
        const subjectFilter = params.subject && question_types_1.QUESTION_SUBJECTS.includes(params.subject) ? params.subject : undefined;
        const statusFilter = params.status && question_types_1.QUESTION_STATUSES.includes(params.status) ? params.status : undefined;
        const difficultyFilter = typeof params.difficulty_level === 'number' && params.difficulty_level >= 1 && params.difficulty_level <= 5
            ? params.difficulty_level
            : undefined;
        const allQuestions = await this.questionModel.find().lean().exec();
        const searchTokens = sanitizedQuery.toLowerCase().split(' ').filter(Boolean);
        const filtered = allQuestions.filter((question) => {
            if (subjectFilter && question.subject !== subjectFilter)
                return false;
            if (statusFilter && question.status !== statusFilter)
                return false;
            if (difficultyFilter && question.difficulty_level !== difficultyFilter)
                return false;
            const text = question.question_text.toLowerCase();
            return searchTokens.every((token) => text.includes(token));
        });
        const total = filtered.length;
        const start = (params.page - 1) * params.limit;
        const data = filtered.slice(start, start + params.limit);
        return {
            data,
            total,
            page: params.page,
            limit: params.limit,
            totalPages: Math.ceil(total / params.limit) || 1,
        };
    }
    sanitizeForStudents(question) {
        const plain = typeof question.toObject === 'function'
            ? question.toObject()
            : question;
        const { correct_option, ...rest } = plain;
        return rest;
    }
    async getQuestionById(questionId, user) {
        const question = await this.questionModel.findOne({ questionId }).exec();
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        if (!user?.role || user.role === 'student') {
            if (question.status !== 'published') {
                throw new common_1.ForbiddenException('Only published questions are visible to students/public');
            }
            return this.sanitizeForStudents(question);
        }
        return question;
    }
    async updateQuestion(questionId, payload, user) {
        const parsed = updateQuestionSchema.safeParse(payload);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
        }
        const question = await this.questionModel.findOne({ questionId }).exec();
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        const actorRole = user.role;
        if (actorRole === 'examiner' &&
            question.created_by !== this.getActorId(user)) {
            throw new common_1.ForbiddenException('Examiners can only edit their own questions');
        }
        if (payload.correct_option) {
            const options = payload.options ?? question.options;
            if (!options.some((option) => option.id === payload.correct_option)) {
                throw new common_1.BadRequestException('correct_option must match one of options[].id');
            }
        }
        const versionNumber = question.versions.length + 1;
        question.versions.push({
            version_number: versionNumber,
            question_text: question.question_text,
            options: question.options,
            correct_option: question.correct_option,
            modified_by: this.getActorId(user),
            modified_at: new Date(),
            change_reason: payload.change_reason,
        });
        if (payload.question_text && payload.question_text !== question.question_text) {
            const duplicate = await this.runDuplicateCheck({
                subject: payload.subject ?? question.subject,
                questionText: payload.question_text,
                excludeQuestionId: questionId,
            });
            if (duplicate.blocked) {
                throw new common_1.ConflictException({
                    message: 'Similar question exists',
                    similarity: duplicate.similarity,
                    existingQuestionId: duplicate.existingQuestionId,
                });
            }
            question.embedding_vector = duplicate.embeddingVector;
        }
        Object.assign(question, {
            ...payload,
            tags: payload.tags ? this.normalizeTags(payload.tags) : question.tags,
        });
        await question.save();
        await this.indexQuestion(question);
        return question;
    }
    async retireQuestion(questionId) {
        const question = await this.questionModel.findOneAndUpdate({ questionId }, { $set: { status: 'retired' } }, { new: true });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        await this.searchService.deleteQuestion(questionId);
        return { message: 'Question retired successfully' };
    }
    async rollbackQuestion(questionId, versionNumber, user) {
        const question = await this.questionModel.findOne({ questionId }).exec();
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        const targetVersion = question.versions.find((version) => version.version_number === versionNumber);
        if (!targetVersion) {
            throw new common_1.NotFoundException('Version not found');
        }
        const nextVersionNumber = question.versions.length + 1;
        question.versions.push({
            version_number: nextVersionNumber,
            question_text: question.question_text,
            options: question.options,
            correct_option: question.correct_option,
            modified_by: this.getActorId(user),
            modified_at: new Date(),
            change_reason: `Rollback to version ${versionNumber}`,
        });
        question.question_text = targetVersion.question_text;
        question.options = targetVersion.options;
        question.correct_option = targetVersion.correct_option;
        await question.save();
        await this.indexQuestion(question);
        return question;
    }
    async transitionStatus(questionId, fromStatus, toStatus, patch) {
        const question = await this.questionModel.findOne({ questionId }).exec();
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        if (question.status !== fromStatus) {
            throw new common_1.BadRequestException(`Question status must be ${fromStatus} to transition to ${toStatus}`);
        }
        question.status = toStatus;
        Object.assign(question, patch ?? {});
        await question.save();
        if (toStatus === 'published' || toStatus === 'approved' || toStatus === 'under_review') {
            await this.indexQuestion(question);
        }
        if (toStatus === 'retired') {
            await this.searchService.deleteQuestion(questionId);
        }
        return question;
    }
    async submitForReview(questionId, user) {
        const question = await this.transitionStatus(questionId, 'draft', 'under_review', {
            reviewed_by: this.getActorId(user),
        });
        await this.notificationsService.queueEmailVerification({
            email: 'reviewers@localhost',
            fullName: 'Question Review Team',
            token: `review:${question.questionId}`,
        });
        return question;
    }
    async approveQuestion(questionId, user) {
        return this.transitionStatus(questionId, 'under_review', 'approved', {
            approved_by: this.getActorId(user),
            approved_at: new Date(),
        });
    }
    async publishQuestion(questionId) {
        return this.transitionStatus(questionId, 'approved', 'published');
    }
    async retirePublishedQuestion(questionId) {
        return this.transitionStatus(questionId, 'published', 'retired');
    }
    async getStats() {
        const [total, bySubjectAgg, byStatusAgg, byDifficultyAgg, totalPublished, recentlyAdded] = await Promise.all([
            this.questionModel.countDocuments().exec(),
            this.questionModel.aggregate([{ $group: { _id: '$subject', count: { $sum: 1 } } }]).exec(),
            this.questionModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).exec(),
            this.questionModel
                .aggregate([{ $group: { _id: '$difficulty_level', count: { $sum: 1 } } }])
                .exec(),
            this.questionModel.countDocuments({ status: 'published' }).exec(),
            this.questionModel
                .countDocuments({ created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
                .exec(),
        ]);
        const bySubject = {};
        const byStatus = {};
        const byDifficulty = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        bySubjectAgg.forEach((entry) => {
            bySubject[entry._id] = entry.count;
        });
        byStatusAgg.forEach((entry) => {
            byStatus[entry._id] = entry.count;
        });
        byDifficultyAgg.forEach((entry) => {
            if (entry._id !== null && entry._id !== undefined) {
                byDifficulty[String(entry._id)] = entry.count;
            }
        });
        return {
            total,
            bySubject,
            byStatus,
            byDifficulty,
            totalPublished,
            recentlyAdded,
        };
    }
    async getPublishedSubjectCounts() {
        const rows = await this.questionModel
            .aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ])
            .exec();
        return rows.map((row) => ({ subject: row._id, count: row.count }));
    }
    async getVersions(questionId) {
        const question = await this.questionModel.findOne({ questionId }).select({ versions: 1 }).lean().exec();
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        return question.versions ?? [];
    }
    async bulkTagUpdate(payload) {
        if (!payload.questionIds.length || !payload.tags.length) {
            throw new common_1.BadRequestException('questionIds and tags are required');
        }
        const tags = this.normalizeTags(payload.tags);
        if (payload.action === 'add') {
            await this.questionModel.updateMany({ questionId: { $in: payload.questionIds } }, { $addToSet: { tags: { $each: tags } } });
        }
        else {
            await this.questionModel.updateMany({ questionId: { $in: payload.questionIds } }, { $pullAll: { tags } });
        }
        return { message: 'Bulk tag update completed' };
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(question_schema_1.Question.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        search_service_1.SearchService,
        notifications_service_1.NotificationsService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map