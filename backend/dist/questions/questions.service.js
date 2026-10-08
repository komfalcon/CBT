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
var QuestionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsService = void 0;
exports.tokenizeQuestionText = tokenizeQuestionText;
exports.computeTfIdfVector = computeTfIdfVector;
exports.cosineSimilarity = cosineSimilarity;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const notifications_service_1 = require("../notifications/notifications.service");
const database_module_1 = require("../db/database.module");
const schema = __importStar(require("../db/schema"));
const postgres_js_1 = require("drizzle-orm/postgres-js");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const search_service_1 = require("./search/search.service");
const question_types_1 = require("./types/question.types");
const duplicateStatuses = ["published", "approved", "under_review"];
const createQuestionSchema = zod_1.z.object({
    subject: zod_1.z.string(),
    topic: zod_1.z.string().trim().min(1),
    question_text: zod_1.z.string().trim().min(10),
    options: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.enum(["A", "B", "C", "D", "E"]),
        text: zod_1.z.string().trim().min(1),
        image_url: zod_1.z.string().optional(),
    }))
        .min(2),
    correct_option: zod_1.z.enum(["A", "B", "C", "D", "E"]),
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
        .replace(/[^a-z0-9\s]/g, " ")
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
let QuestionsService = QuestionsService_1 = class QuestionsService {
    constructor(db, searchService, notificationsService) {
        this.db = db;
        this.searchService = searchService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(QuestionsService_1.name);
    }
    getActorId(user) {
        return user.sub ?? user.userId ?? "system";
    }
    normalizeTags(tags) {
        return (tags ?? [])
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean);
    }
    sanitizeTextSearchInput(input) {
        return input
            .replace(/[^a-zA-Z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 300);
    }
    async runDuplicateCheck(params) {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema.questions.subject, params.subject),
            (0, drizzle_orm_1.inArray)(schema.questions.status, duplicateStatuses),
        ];
        if (params.excludeQuestionId) {
            conditions.push((0, drizzle_orm_1.not)((0, drizzle_orm_1.eq)(schema.questions.id, params.excludeQuestionId)));
        }
        const candidates = await this.db
            .select({
            id: schema.questions.id,
            question_text: schema.questions.question_text,
        })
            .from(schema.questions)
            .where((0, drizzle_orm_1.and)(...conditions));
        const corpus = candidates.map((entry) => entry.question_text);
        const targetVector = computeTfIdfVector(params.questionText, corpus);
        let highestSimilarity = 0;
        let highestQuestionId;
        for (const candidate of candidates) {
            const candidateVector = computeTfIdfVector(candidate.question_text, corpus);
            const similarity = cosineSimilarity(targetVector, candidateVector);
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                highestQuestionId = candidate.id;
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
            questionId: question.id,
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
            throw new common_1.BadRequestException(parsed.error.issues.map((issue) => issue.message).join(", "));
        }
        const optionIds = payload.options.map((option) => option.id);
        if (!optionIds.includes(payload.correct_option)) {
            throw new common_1.BadRequestException("correct_option must match one of options[].id");
        }
        const duplicate = await this.runDuplicateCheck({
            subject: payload.subject,
            questionText: payload.question_text,
        });
        if (duplicate.blocked) {
            throw new common_1.ConflictException({
                message: "Similar question exists",
                similarity: duplicate.similarity,
                existingQuestionId: duplicate.existingQuestionId,
            });
        }
        const [question] = await this.db
            .insert(schema.questions)
            .values({
            id: (0, uuid_1.v4)(),
            ...payload,
            options: payload.options,
            tags: this.normalizeTags(payload.tags),
            status: "draft",
            created_by: this.getActorId(user),
            source: options?.source ?? "manual",
            import_batch_id: options?.importBatchId,
            embedding_vector: duplicate.embeddingVector,
        })
            .returning();
        await this.indexQuestion(question);
        if (duplicate.warning) {
            return {
                warning: "Similar question exists",
                similarity: duplicate.similarity,
                existingQuestionId: duplicate.existingQuestionId,
                data: question,
            };
        }
        return question;
    }
    async listQuestions(filters) {
        const conditions = [];
        if (filters.subject)
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.subject, filters.subject));
        if (filters.topic)
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.topic, filters.topic));
        if (filters.subtopic)
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.subtopic, filters.subtopic));
        if (filters.status)
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.status, filters.status));
        if (filters.difficulty_level)
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.difficulty_level, filters.difficulty_level));
        if (filters.year_sourced)
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.year_sourced, filters.year_sourced));
        if (filters.bloom_level)
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.bloom_level, filters.bloom_level));
        if (filters.question_type)
            conditions.push((0, drizzle_orm_1.eq)(schema.questions.question_type, filters.question_type));
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const sortBy = filters.sortBy ?? "createdAt";
        const sortOrder = filters.sortOrder === "asc" ? drizzle_orm_1.asc : drizzle_orm_1.desc;
        const dbQuery = conditions.length ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const [data, totalRes] = await Promise.all([
            this.db
                .select()
                .from(schema.questions)
                .where(dbQuery)
                .orderBy(sortOrder(schema.questions[sortBy] || schema.questions.createdAt))
                .limit(limit)
                .offset((page - 1) * limit),
            this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema.questions).where(dbQuery),
        ]);
        const total = totalRes[0].count;
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async search(params, user) {
        const sanitizedQuery = this.sanitizeTextSearchInput(params.q);
        if (!sanitizedQuery) {
            throw new common_1.BadRequestException("Search query is required");
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
            const data = await this.db
                .select()
                .from(schema.questions)
                .where((0, drizzle_orm_1.inArray)(schema.questions.id, esResult.ids));
            data.sort((a, b) => (indexedOrder.get(a.id) ?? 0) - (indexedOrder.get(b.id) ?? 0));
            const processedData = !user?.role || user.role === "student"
                ? data.map((q) => this.sanitizeForStudents(q))
                : data;
            return {
                data: processedData,
                total: esResult.total,
                page: params.page,
                limit: params.limit,
                totalPages: Math.ceil(esResult.total / params.limit) || 1,
            };
        }
        const subjectFilter = params.subject && question_types_1.QUESTION_SUBJECTS.includes(params.subject)
            ? params.subject
            : undefined;
        const statusFilter = params.status && question_types_1.QUESTION_STATUSES.includes(params.status)
            ? params.status
            : undefined;
        const difficultyFilter = typeof params.difficulty_level === "number" &&
            params.difficulty_level >= 1 &&
            params.difficulty_level <= 5
            ? params.difficulty_level
            : undefined;
        const allQuestions = await this.db.select().from(schema.questions);
        const searchTokens = sanitizedQuery
            .toLowerCase()
            .split(" ")
            .filter(Boolean);
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
        const processedData = !user?.role || user.role === "student"
            ? data.map((q) => this.sanitizeForStudents(q))
            : data;
        return {
            data: processedData,
            total,
            page: params.page,
            limit: params.limit,
            totalPages: Math.ceil(total / params.limit) || 1,
        };
    }
    sanitizeForStudents(question) {
        const plain = question;
        const { correct_option, explanation, versions, embedding_vector, ...rest } = plain;
        return rest;
    }
    async getQuestionById(questionId, user) {
        const [question] = await this.db
            .select()
            .from(schema.questions)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .limit(1);
        if (!question) {
            throw new common_1.NotFoundException("Question not found");
        }
        if (!user?.role || user.role === "student") {
            if (question.status !== "published") {
                throw new common_1.ForbiddenException("Only published questions are visible to students/public");
            }
            return this.sanitizeForStudents(question);
        }
        return question;
    }
    async updateQuestion(questionId, payload, user) {
        const parsed = updateQuestionSchema.safeParse(payload);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.issues.map((issue) => issue.message).join(", "));
        }
        const [question] = await this.db
            .select()
            .from(schema.questions)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .limit(1);
        if (!question) {
            throw new common_1.NotFoundException("Question not found");
        }
        const actorRole = user.role;
        if (actorRole === "examiner" &&
            question.created_by !== this.getActorId(user)) {
            throw new common_1.ForbiddenException("Examiners can only edit their own questions");
        }
        if (payload.correct_option) {
            const options = payload.options ?? question.options;
            if (!options.some((option) => option.id === payload.correct_option)) {
                throw new common_1.BadRequestException("correct_option must match one of options[].id");
            }
        }
        const versionNumber = question.versions.length + 1;
        question.versions = [
            ...(question.versions || []),
            {
                version_number: versionNumber,
                question_text: question.question_text,
                options: question.options,
                correct_option: question.correct_option,
                modified_by: this.getActorId(user),
                modified_at: new Date(),
                change_reason: payload.change_reason,
            },
        ];
        if (payload.question_text &&
            payload.question_text !== question.question_text) {
            const duplicate = await this.runDuplicateCheck({
                subject: payload.subject ?? question.subject,
                questionText: payload.question_text,
                excludeQuestionId: questionId,
            });
            if (duplicate.blocked) {
                throw new common_1.ConflictException({
                    message: "Similar question exists",
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
        const [updated] = await this.db
            .update(schema.questions)
            .set(question)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .returning();
        Object.assign(question, updated);
        await this.indexQuestion(question);
        return question;
    }
    async retireQuestion(questionId) {
        const [question] = await this.db
            .update(schema.questions)
            .set({ status: "retired" })
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .returning();
        if (!question) {
            throw new common_1.NotFoundException("Question not found");
        }
        await this.searchService.deleteQuestion(questionId);
        return { message: "Question retired successfully" };
    }
    async saveDiagramSVG(questionId, svg) {
        await this.db
            .update(schema.questions)
            .set({ diagram_svg: svg })
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId));
    }
    async rollbackQuestion(questionId, versionNumber, user) {
        const [question] = await this.db
            .select()
            .from(schema.questions)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .limit(1);
        if (!question) {
            throw new common_1.NotFoundException("Question not found");
        }
        const targetVersion = (question.versions || []).find((version) => version.version_number === versionNumber);
        if (!targetVersion) {
            throw new common_1.NotFoundException("Version not found");
        }
        const nextVersionNumber = question.versions.length + 1;
        question.versions = [
            ...(question.versions || []),
            {
                version_number: nextVersionNumber,
                question_text: question.question_text,
                options: question.options,
                correct_option: question.correct_option,
                modified_by: this.getActorId(user),
                modified_at: new Date(),
                change_reason: `Rollback to version ${versionNumber}`,
            },
        ];
        question.question_text = targetVersion.question_text;
        question.options = targetVersion.options;
        question.correct_option = targetVersion.correct_option;
        const [updated] = await this.db
            .update(schema.questions)
            .set(question)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .returning();
        Object.assign(question, updated);
        await this.indexQuestion(question);
        return question;
    }
    async transitionStatus(questionId, fromStatus, toStatus, patch) {
        const [question] = await this.db
            .select()
            .from(schema.questions)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .limit(1);
        if (!question) {
            throw new common_1.NotFoundException("Question not found");
        }
        if (question.status !== fromStatus) {
            throw new common_1.BadRequestException(`Question status must be ${fromStatus} to transition to ${toStatus}`);
        }
        question.status = toStatus;
        Object.assign(question, patch ?? {});
        const [updated] = await this.db
            .update(schema.questions)
            .set(question)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .returning();
        Object.assign(question, updated);
        if (toStatus === "published" ||
            toStatus === "approved" ||
            toStatus === "under_review") {
            await this.indexQuestion(question);
        }
        if (toStatus === "retired") {
            await this.searchService.deleteQuestion(questionId);
        }
        return question;
    }
    async submitForReview(questionId, user) {
        const question = await this.transitionStatus(questionId, "draft", "under_review", {
            reviewed_by: this.getActorId(user),
        });
        await this.notificationsService.queueEmailVerification({
            email: "reviewers@localhost",
            fullName: "Question Review Team",
            token: `review:${question.id}`,
        });
        return question;
    }
    async approveQuestion(questionId, user) {
        return this.transitionStatus(questionId, "under_review", "approved", {
            approved_by: this.getActorId(user),
            approved_at: new Date(),
        });
    }
    async publishQuestion(questionId) {
        return this.transitionStatus(questionId, "approved", "published");
    }
    async retirePublishedQuestion(questionId) {
        return this.transitionStatus(questionId, "published", "retired");
    }
    async getStats() {
        const [totalRes, totalPublishedRes, recentlyAddedRes, bySubjectAgg, byStatusAgg, byDifficultyAgg,] = await Promise.all([
            this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema.questions),
            this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema.questions)
                .where((0, drizzle_orm_1.eq)(schema.questions.status, "published")),
            this.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema.questions)
                .where((0, drizzle_orm_1.gt)(schema.questions.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))),
            this.db
                .select({ _id: schema.questions.subject, count: (0, drizzle_orm_1.count)() })
                .from(schema.questions)
                .groupBy(schema.questions.subject),
            this.db
                .select({ _id: schema.questions.status, count: (0, drizzle_orm_1.count)() })
                .from(schema.questions)
                .groupBy(schema.questions.status),
            this.db
                .select({ _id: schema.questions.difficulty_level, count: (0, drizzle_orm_1.count)() })
                .from(schema.questions)
                .groupBy(schema.questions.difficulty_level),
        ]);
        const total = totalRes[0].count;
        const totalPublished = totalPublishedRes[0].count;
        const recentlyAdded = recentlyAddedRes[0].count;
        const bySubject = {};
        const byStatus = {};
        const byDifficulty = {
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            "5": 0,
        };
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
        const rows = await this.db
            .select({ _id: schema.questions.subject, count: (0, drizzle_orm_1.count)() })
            .from(schema.questions)
            .where((0, drizzle_orm_1.eq)(schema.questions.status, "published"))
            .groupBy(schema.questions.subject)
            .orderBy((0, drizzle_orm_1.asc)(schema.questions.subject));
        return rows.map((row) => ({
            subject: row._id,
            count: row.count,
        }));
    }
    async getTopics(subject) {
        const rows = await this.db
            .select({ _id: schema.questions.topic, count: (0, drizzle_orm_1.count)() })
            .from(schema.questions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questions.subject, subject), (0, drizzle_orm_1.eq)(schema.questions.status, "published")))
            .groupBy(schema.questions.topic)
            .orderBy((0, drizzle_orm_1.asc)(schema.questions.topic));
        return rows
            .map((row) => ({ topic: row._id, count: row.count }))
            .filter((row) => Boolean(row.topic));
    }
    async updateTags(id, tags) {
        const [doc] = await this.db
            .update(schema.questions)
            .set({ tags })
            .where((0, drizzle_orm_1.eq)(schema.questions.id, id))
            .returning();
        if (!doc) {
            throw new common_1.NotFoundException("Question not found");
        }
        return doc;
    }
    async insertGeneratedQuestions(subject, rawQuestions) {
        if (!rawQuestions || rawQuestions.length === 0)
            return [];
        const documentsToInsert = rawQuestions.map((q) => {
            const uniqueId = `${subject}_ai_${Math.random().toString(36).substring(2, 9)}`;
            const parsedOptions = (q.options || []).map((opt, optIndex) => {
                const id = ["A", "B", "C", "D", "E"][optIndex];
                return {
                    id: opt.id || id,
                    text: opt.text || `Option ${id}`,
                };
            });
            while (parsedOptions.length < 4) {
                const id = ["A", "B", "C", "D", "E"][parsedOptions.length];
                parsedOptions.push({ id, text: `Option ${id}` });
            }
            let correctOpt = q.correct_option;
            let isBonus = false;
            if (!["A", "B", "C", "D", "E"].includes(correctOpt)) {
                correctOpt = "A";
                isBonus = true;
            }
            return {
                questionId: uniqueId,
                subject: subject,
                topic: q.topic || "General",
                question_text: q.question_text || "Generated Question",
                options: parsedOptions,
                correct_option: correctOpt,
                explanation: q.explanation || undefined,
                difficulty_level: q.difficulty ? Number(q.difficulty) : 3,
                question_type: "mcq_single",
                status: "published",
                source: "ai_generated",
                created_by: "ai-generator",
                tags: q.tags || ["ai-generated"],
                is_bonus: isBonus,
                has_diagram: !!q.has_diagram,
                diagram_svg: q.diagram_svg || undefined,
            };
        });
        try {
            const inserted = await this.db
                .insert(schema.questions)
                .values(documentsToInsert)
                .returning();
            return inserted;
        }
        catch (error) {
            if (error.code === 11000 && error.insertedDocs) {
                return error.insertedDocs;
            }
            this.logger.error("Failed inserting AI generated questions", error.stack);
            return [];
        }
    }
    async getVersions(questionId) {
        const [question] = await this.db
            .select({ versions: schema.questions.versions })
            .from(schema.questions)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId))
            .limit(1);
        if (!question) {
            throw new common_1.NotFoundException("Question not found");
        }
        return question.versions ?? [];
    }
    async bulkTagUpdate(payload) {
        if (!payload.questionIds.length || !payload.tags.length) {
            throw new common_1.BadRequestException("questionIds and tags are required");
        }
        const tags = this.normalizeTags(payload.tags);
        if (payload.action === "add") {
            const rows = await this.db
                .select({ id: schema.questions.id, tags: schema.questions.tags })
                .from(schema.questions)
                .where((0, drizzle_orm_1.inArray)(schema.questions.id, payload.questionIds));
            for (const row of rows) {
                const newTags = Array.from(new Set([...(row.tags || []), ...tags]));
                await this.db
                    .update(schema.questions)
                    .set({ tags: newTags })
                    .where((0, drizzle_orm_1.eq)(schema.questions.id, row.id));
            }
        }
        else {
            const rows = await this.db
                .select({ id: schema.questions.id, tags: schema.questions.tags })
                .from(schema.questions)
                .where((0, drizzle_orm_1.inArray)(schema.questions.id, payload.questionIds));
            for (const row of rows) {
                const newTags = (row.tags || []).filter((t) => !tags.includes(t));
                await this.db
                    .update(schema.questions)
                    .set({ tags: newTags })
                    .where((0, drizzle_orm_1.eq)(schema.questions.id, row.id));
            }
        }
        return { message: "Bulk tag update completed" };
    }
    async correctQuestionError(questionId, newCorrectOption, newExplanation) {
        const updatePayload = { correct_option: newCorrectOption };
        if (newExplanation) {
            updatePayload.explanation = newExplanation;
        }
        await this.db
            .update(schema.questions)
            .set(updatePayload)
            .where((0, drizzle_orm_1.eq)(schema.questions.id, questionId));
        this.logger.log(`Question ${questionId} corrected via AI vetting: ${newCorrectOption}`);
    }
    async getInterleavedExamQuestions(subjects, countPerSubject = 40) {
        const result = {};
        for (const rawSubject of subjects) {
            const subject = rawSubject.toLowerCase().trim();
            const targetTextCount = Math.floor(countPerSubject * 0.5);
            const targetDiagramCount = Math.floor(countPerSubject * 0.25);
            const targetScannedCount = countPerSubject - targetTextCount - targetDiagramCount;
            const textQuestions = await this.db
                .select()
                .from(schema.questions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questions.subject, subject), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema.questions.question_source_type, 'new_text'), (0, drizzle_orm_1.sql) `${schema.questions.question_source_type} IS NULL`)))
                .limit(targetTextCount * 2);
            const diagramQuestions = await this.db
                .select()
                .from(schema.questions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questions.subject, subject), (0, drizzle_orm_1.eq)(schema.questions.question_source_type, 'new_svg_diagram')))
                .limit(targetDiagramCount * 2);
            const scannedQuestions = await this.db
                .select()
                .from(schema.questions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.questions.subject, subject), (0, drizzle_orm_1.eq)(schema.questions.question_source_type, 'scanned_past_paper')))
                .limit(targetScannedCount * 2);
            const pickRandom = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
            const pickedText = pickRandom(textQuestions, targetTextCount);
            const pickedDiagram = pickRandom(diagramQuestions, targetDiagramCount);
            const pickedScanned = pickRandom(scannedQuestions, targetScannedCount);
            const interleaved = [];
            const maxLength = Math.max(pickedText.length, pickedDiagram.length, pickedScanned.length);
            for (let i = 0; i < maxLength; i++) {
                if (pickedText[i])
                    interleaved.push(pickedText[i]);
                if (pickedDiagram[i])
                    interleaved.push(pickedDiagram[i]);
                if (pickedScanned[i])
                    interleaved.push(pickedScanned[i]);
            }
            if (interleaved.length < countPerSubject) {
                const existingIds = new Set(interleaved.map((q) => q.id));
                const fillCandidates = await this.db
                    .select()
                    .from(schema.questions)
                    .where((0, drizzle_orm_1.eq)(schema.questions.subject, subject))
                    .limit(countPerSubject * 2);
                for (const candidate of fillCandidates) {
                    if (interleaved.length >= countPerSubject)
                        break;
                    if (!existingIds.has(candidate.id)) {
                        interleaved.push(candidate);
                        existingIds.add(candidate.id);
                    }
                }
            }
            result[subject] = interleaved.slice(0, countPerSubject);
        }
        return result;
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = QuestionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase,
        search_service_1.SearchService,
        notifications_service_1.NotificationsService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map