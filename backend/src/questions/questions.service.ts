import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
  Inject,
} from "@nestjs/common";
import { z } from "zod";
import { NotificationsService } from "../notifications/notifications.service";
import { UserRole } from "../users/schemas/user.schema";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { FilterQuestionsDto } from "./dto/filter-questions.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { DRIZZLE } from "../db/database.module";
import * as schema from "../db/schema";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import {
  eq,
  inArray,
  and,
  not,
  desc,
  asc,
  count,
  sum,
  or,
  gt,
} from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { SearchService } from "./search/search.service";
import { QUESTION_STATUSES, QUESTION_SUBJECTS } from "./types/question.types";

const duplicateStatuses = ["published", "approved", "under_review"];

const createQuestionSchema = z.object({
  subject: z.string(),
  topic: z.string().trim().min(1),
  question_text: z.string().trim().min(10),
  options: z
    .array(
      z.object({
        id: z.enum(["A", "B", "C", "D", "E"]),
        text: z.string().trim().min(1),
        image_url: z.string().optional(),
      }),
    )
    .min(2),
  correct_option: z.enum(["A", "B", "C", "D", "E"]),
  question_type: z.string(),
  difficulty_level: z.number().int().min(1).max(5),
});

const updateQuestionSchema = z
  .object({
    question_text: z.string().trim().min(10).optional(),
    change_reason: z.string().trim().min(1),
  })
  .passthrough();

export function tokenizeQuestionText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  return freq;
}

export function computeTfIdfVector(text: string, corpus: string[]): number[] {
  const docs = [text, ...corpus];
  const tokenizedDocs = docs.map((entry) => tokenizeQuestionText(entry));
  const vocabSet = new Set<string>();
  const docFrequency = new Map<string, number>();

  tokenizedDocs.forEach((tokens) => {
    const seen = new Set<string>();
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
    const idf =
      Math.log((docs.length + 1) / ((docFrequency.get(term) ?? 0) + 1)) + 1;
    return Number((tfValue * idf).toFixed(6));
  });
}

export function cosineSimilarity(a: number[], b: number[]): number {
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

type CurrentUser = {
  sub?: string;
  userId?: string;
  role?: UserRole;
};

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly searchService: SearchService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getActorId(user: CurrentUser): string {
    return user.sub ?? user.userId ?? "system";
  }

  private normalizeTags(tags?: string[]): string[] {
    return (tags ?? [])
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }

  private sanitizeTextSearchInput(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
  }

  private async runDuplicateCheck(params: {
    subject: string;
    questionText: string;
    excludeQuestionId?: string;
  }): Promise<{
    similarity: number;
    existingQuestionId?: string;
    blocked: boolean;
    warning: boolean;
    embeddingVector: number[];
  }> {
    const conditions = [
      eq(schema.questions.subject, params.subject),
      inArray(schema.questions.status, duplicateStatuses),
    ];

    if (params.excludeQuestionId) {
      conditions.push(not(eq(schema.questions.id, params.excludeQuestionId)));
    }

    const candidates = await this.db
      .select({
        id: schema.questions.id,
        question_text: schema.questions.question_text,
      })
      .from(schema.questions)
      .where(and(...conditions));

    const corpus = candidates.map((entry) => entry.question_text);
    const targetVector = computeTfIdfVector(params.questionText, corpus);

    let highestSimilarity = 0;
    let highestQuestionId: string | undefined;

    for (const candidate of candidates) {
      const candidateVector = computeTfIdfVector(
        candidate.question_text,
        corpus,
      );
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

  private async indexQuestion(question: any): Promise<void> {
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

  async createQuestion(
    payload: CreateQuestionDto,
    user: CurrentUser,
    options?: {
      source?: "manual" | "import" | "ai_generated";
      importBatchId?: string;
    },
  ) {
    const parsed = createQuestionSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((issue) => issue.message).join(", "),
      );
    }

    const optionIds = payload.options.map((option) => option.id);
    if (!optionIds.includes(payload.correct_option)) {
      throw new BadRequestException(
        "correct_option must match one of options[].id",
      );
    }

    const duplicate = await this.runDuplicateCheck({
      subject: payload.subject,
      questionText: payload.question_text,
    });

    if (duplicate.blocked) {
      throw new ConflictException({
        message: "Similar question exists",
        similarity: duplicate.similarity,
        existingQuestionId: duplicate.existingQuestionId,
      });
    }

    const [question] = await this.db
      .insert(schema.questions)
      .values({
        id: uuidv4(),
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

  async listQuestions(filters: FilterQuestionsDto) {
    const conditions = [];

    if (filters.subject)
      conditions.push(eq(schema.questions.subject, filters.subject));
    if (filters.topic)
      conditions.push(eq(schema.questions.topic, filters.topic));
    if (filters.subtopic)
      conditions.push(eq(schema.questions.subtopic, filters.subtopic));
    if (filters.status)
      conditions.push(eq(schema.questions.status, filters.status));
    if (filters.difficulty_level)
      conditions.push(
        eq(schema.questions.difficulty_level, filters.difficulty_level),
      );
    if (filters.year_sourced)
      conditions.push(eq(schema.questions.year_sourced, filters.year_sourced));
    if (filters.bloom_level)
      conditions.push(eq(schema.questions.bloom_level, filters.bloom_level));
    if (filters.question_type)
      conditions.push(
        eq(schema.questions.question_type, filters.question_type),
      );

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const sortBy = filters.sortBy ?? "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? asc : desc;

    const dbQuery = conditions.length ? and(...conditions) : undefined;

    const [data, totalRes] = await Promise.all([
      this.db
        .select()
        .from(schema.questions)
        .where(dbQuery)
        .orderBy(
          sortOrder(
            (schema.questions as any)[sortBy] || schema.questions.createdAt,
          ),
        )
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ count: count() }).from(schema.questions).where(dbQuery),
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

  async searchQuestions(
    params: {
      q: string;
      page: number;
      limit: number;
      subject?: string;
      difficulty_level?: number;
      status?: string;
    },
    user?: { role?: string },
  ) {
    const sanitizedQuery = this.sanitizeTextSearchInput(params.q);
    if (!sanitizedQuery) {
      throw new BadRequestException("Search query is required");
    }

    const filters: Record<string, unknown> = {
      subject: params.subject,
      difficulty_level: params.difficulty_level,
      status: params.status,
    };

    const esResult = await this.searchService.searchQuestions(
      sanitizedQuery,
      filters,
      {
        page: params.page,
        limit: params.limit,
      },
    );

    if (esResult) {
      const indexedOrder = new Map(
        esResult.ids.map((id, index) => [id, index]),
      );
      const data = await this.db
        .select()
        .from(schema.questions)
        .where(inArray(schema.questions.id, esResult.ids));
      data.sort(
        (a, b) => (indexedOrder.get(a.id) ?? 0) - (indexedOrder.get(b.id) ?? 0),
      );

      const processedData =
        !user?.role || user.role === "student"
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

    const subjectFilter =
      params.subject && QUESTION_SUBJECTS.includes(params.subject as never)
        ? params.subject
        : undefined;
    const statusFilter =
      params.status && QUESTION_STATUSES.includes(params.status as never)
        ? params.status
        : undefined;
    const difficultyFilter =
      typeof params.difficulty_level === "number" &&
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
      if (subjectFilter && question.subject !== subjectFilter) return false;
      if (statusFilter && question.status !== statusFilter) return false;
      if (difficultyFilter && question.difficulty_level !== difficultyFilter)
        return false;

      const text = question.question_text.toLowerCase();
      return searchTokens.every((token) => text.includes(token));
    });

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    const processedData =
      !user?.role || user.role === "student"
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

  private sanitizeForStudents(question: any) {
    const plain = question;
    const { correct_option, explanation, versions, embedding_vector, ...rest } =
      plain as any;
    return rest;
  }

  async getQuestionById(questionId: string, user?: CurrentUser) {
    const [question] = await this.db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, questionId))
      .limit(1);
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    if (!user?.role || user.role === "student") {
      if (question.status !== "published") {
        throw new ForbiddenException(
          "Only published questions are visible to students/public",
        );
      }
      return this.sanitizeForStudents(question);
    }

    return question;
  }

  async updateQuestion(
    questionId: string,
    payload: UpdateQuestionDto,
    user: CurrentUser,
  ) {
    const parsed = updateQuestionSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((issue) => issue.message).join(", "),
      );
    }

    const [question] = await this.db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, questionId))
      .limit(1);
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    const actorRole = user.role;
    if (
      actorRole === "examiner" &&
      question.created_by !== this.getActorId(user)
    ) {
      throw new ForbiddenException(
        "Examiners can only edit their own questions",
      );
    }

    if (payload.correct_option) {
      const options = payload.options ?? (question.options as any[]);
      if (!options.some((option) => option.id === payload.correct_option)) {
        throw new BadRequestException(
          "correct_option must match one of options[].id",
        );
      }
    }

    const versionNumber = (question.versions as any[]).length + 1;
    question.versions = [
      ...((question.versions as any[]) || []),
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

    if (
      payload.question_text &&
      payload.question_text !== question.question_text
    ) {
      const duplicate = await this.runDuplicateCheck({
        subject: payload.subject ?? question.subject,
        questionText: payload.question_text,
        excludeQuestionId: questionId,
      });

      if (duplicate.blocked) {
        throw new ConflictException({
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
      .where(eq(schema.questions.id, questionId))
      .returning();
    Object.assign(question, updated);
    await this.indexQuestion(question);
    return question;
  }

  async retireQuestion(questionId: string) {
    const [question] = await this.db
      .update(schema.questions)
      .set({ status: "retired" })
      .where(eq(schema.questions.id, questionId))
      .returning();

    if (!question) {
      throw new NotFoundException("Question not found");
    }

    await this.searchService.deleteQuestion(questionId);
    return { message: "Question retired successfully" };
  }

  async saveDiagramSVG(questionId: string, svg: string) {
    await this.db
      .update(schema.questions)
      .set({ diagram_svg: svg })
      .where(eq(schema.questions.id, questionId));
  }

  async rollbackQuestion(
    questionId: string,
    versionNumber: number,
    user: CurrentUser,
  ) {
    const [question] = await this.db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, questionId))
      .limit(1);
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    const targetVersion = ((question.versions as any[]) || []).find(
      (version) => version.version_number === versionNumber,
    );
    if (!targetVersion) {
      throw new NotFoundException("Version not found");
    }

    const nextVersionNumber = (question.versions as any[]).length + 1;
    question.versions = [
      ...((question.versions as any[]) || []),
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
      .where(eq(schema.questions.id, questionId))
      .returning();
    Object.assign(question, updated);
    await this.indexQuestion(question);
    return question;
  }

  private async transitionStatus(
    questionId: string,
    fromStatus: (typeof QUESTION_STATUSES)[number],
    toStatus: (typeof QUESTION_STATUSES)[number],
    patch?: any,
  ) {
    const [question] = await this.db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, questionId))
      .limit(1);
    if (!question) {
      throw new NotFoundException("Question not found");
    }

    if (question.status !== fromStatus) {
      throw new BadRequestException(
        `Question status must be ${fromStatus} to transition to ${toStatus}`,
      );
    }

    question.status = toStatus;
    Object.assign(question, patch ?? {});
    const [updated] = await this.db
      .update(schema.questions)
      .set(question)
      .where(eq(schema.questions.id, questionId))
      .returning();
    Object.assign(question, updated);

    if (
      toStatus === "published" ||
      toStatus === "approved" ||
      toStatus === "under_review"
    ) {
      await this.indexQuestion(question);
    }

    if (toStatus === "retired") {
      await this.searchService.deleteQuestion(questionId);
    }

    return question;
  }

  async submitForReview(questionId: string, user: CurrentUser) {
    const question = await this.transitionStatus(
      questionId,
      "draft",
      "under_review",
      {
        reviewed_by: this.getActorId(user),
      },
    );

    await this.notificationsService.queueEmailVerification({
      email: "reviewers@localhost",
      fullName: "Question Review Team",
      token: `review:${question.id}`,
    });

    return question;
  }

  async approveQuestion(questionId: string, user: CurrentUser) {
    return this.transitionStatus(questionId, "under_review", "approved", {
      approved_by: this.getActorId(user),
      approved_at: new Date(),
    });
  }

  async publishQuestion(questionId: string) {
    return this.transitionStatus(questionId, "approved", "published");
  }

  async retirePublishedQuestion(questionId: string) {
    return this.transitionStatus(questionId, "published", "retired");
  }

  async getStats() {
    const [
      totalRes,
      totalPublishedRes,
      recentlyAddedRes,
      bySubjectAgg,
      byStatusAgg,
      byDifficultyAgg,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(schema.questions),
      this.db
        .select({ count: count() })
        .from(schema.questions)
        .where(eq(schema.questions.status, "published")),
      this.db
        .select({ count: count() })
        .from(schema.questions)
        .where(
          gt(
            schema.questions.createdAt,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ),
        ),
      this.db
        .select({ _id: schema.questions.subject, count: count() })
        .from(schema.questions)
        .groupBy(schema.questions.subject),
      this.db
        .select({ _id: schema.questions.status, count: count() })
        .from(schema.questions)
        .groupBy(schema.questions.status),
      this.db
        .select({ _id: schema.questions.difficulty_level, count: count() })
        .from(schema.questions)
        .groupBy(schema.questions.difficulty_level),
    ]);
    const total = totalRes[0].count;
    const totalPublished = totalPublishedRes[0].count;
    const recentlyAdded = recentlyAddedRes[0].count;

    const bySubject: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };

    bySubjectAgg.forEach((entry) => {
      bySubject[entry._id as string] = entry.count as number;
    });
    byStatusAgg.forEach((entry) => {
      byStatus[entry._id as string] = entry.count as number;
    });
    byDifficultyAgg.forEach((entry) => {
      if (entry._id !== null && entry._id !== undefined) {
        byDifficulty[String(entry._id)] = entry.count as number;
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
      .select({ _id: schema.questions.subject, count: count() })
      .from(schema.questions)
      .where(eq(schema.questions.status, "published"))
      .groupBy(schema.questions.subject)
      .orderBy(asc(schema.questions.subject));

    return rows.map((row) => ({
      subject: row._id as string,
      count: row.count as number,
    }));
  }

  async getTopics(subject: string) {
    const rows = await this.db
      .select({ _id: schema.questions.topic, count: count() })
      .from(schema.questions)
      .where(
        and(
          eq(schema.questions.subject, subject),
          eq(schema.questions.status, "published"),
        ),
      )
      .groupBy(schema.questions.topic)
      .orderBy(asc(schema.questions.topic));

    return rows
      .map((row) => ({ topic: row._id as string, count: row.count as number }))
      .filter((row) => Boolean(row.topic));
  }

  async updateTags(id: string, tags: string[]): Promise<any> {
    const [doc] = await this.db
      .update(schema.questions)
      .set({ tags })
      .where(eq(schema.questions.id, id))
      .returning();
    if (!doc) {
      throw new NotFoundException("Question not found");
    }
    return doc;
  }

  async insertGeneratedQuestions(
    subject: string,
    rawQuestions: any[],
  ): Promise<any[]> {
    if (!rawQuestions || rawQuestions.length === 0) return [];

    const documentsToInsert = rawQuestions.map((q) => {
      // Ensure we have a unique ID to avoid E11000 dup key errors if any index was left behind
      const uniqueId = `${subject}_ai_${Math.random().toString(36).substring(2, 9)}`;

      const parsedOptions = (q.options || []).map(
        (opt: any, optIndex: number) => {
          const id = ["A", "B", "C", "D", "E"][optIndex];
          return {
            id: opt.id || id,
            text: opt.text || `Option ${id}`,
          };
        },
      );

      // Ensure 4 options at minimum
      while (parsedOptions.length < 4) {
        const id = ["A", "B", "C", "D", "E"][parsedOptions.length];
        parsedOptions.push({ id, text: `Option ${id}` });
      }

      let correctOpt = q.correct_option;
      let isBonus = false;
      if (!["A", "B", "C", "D", "E"].includes(correctOpt)) {
        correctOpt = "A"; // Fallback to pass validation
        isBonus = true; // Mark as bonus since AI hallucinated
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
        .values(documentsToInsert as any)
        .returning();
      return inserted as any;
    } catch (error: any) {
      // In case of any duplicate key errors (code 11000) from bulk insert, we can filter them out
      if (error.code === 11000 && error.insertedDocs) {
        return error.insertedDocs;
      }
      this.logger.error("Failed inserting AI generated questions", error.stack);
      return [];
    }
  }

  async getVersions(questionId: string) {
    const [question] = await this.db
      .select({ versions: schema.questions.versions })
      .from(schema.questions)
      .where(eq(schema.questions.id, questionId))
      .limit(1);
    if (!question) {
      throw new NotFoundException("Question not found");
    }
    return question.versions ?? [];
  }

  async bulkTagUpdate(payload: {
    questionIds: string[];
    tags: string[];
    action: "add" | "remove";
  }) {
    if (!payload.questionIds.length || !payload.tags.length) {
      throw new BadRequestException("questionIds and tags are required");
    }

    const tags = this.normalizeTags(payload.tags);

    if (payload.action === "add") {
      // NOTE: For SQLite, appending to JSON array is complex, skip or implement a manual select/update loop
      const rows = await this.db
        .select({ id: schema.questions.id, tags: schema.questions.tags })
        .from(schema.questions)
        .where(inArray(schema.questions.id, payload.questionIds));
      for (const row of rows) {
        const newTags = Array.from(
          new Set([...((row.tags as string[]) || []), ...tags]),
        );
        await this.db
          .update(schema.questions)
          .set({ tags: newTags })
          .where(eq(schema.questions.id, row.id));
      }
    } else {
      const rows = await this.db
        .select({ id: schema.questions.id, tags: schema.questions.tags })
        .from(schema.questions)
        .where(inArray(schema.questions.id, payload.questionIds));
      for (const row of rows) {
        const newTags = ((row.tags as string[]) || []).filter(
          (t) => !tags.includes(t),
        );
        await this.db
          .update(schema.questions)
          .set({ tags: newTags })
          .where(eq(schema.questions.id, row.id));
      }
    }

    return { message: "Bulk tag update completed" };
  }

  async correctQuestionError(
    questionId: string,
    newCorrectOption: string,
    newExplanation?: string,
  ): Promise<void> {
    const updatePayload: any = { correct_option: newCorrectOption };
    if (newExplanation) {
      updatePayload.explanation = newExplanation;
    }
    await this.db
      .update(schema.questions)
      .set(updatePayload)
      .where(eq(schema.questions.id, questionId));
    this.logger.log(
      `Question ${questionId} corrected via AI vetting: ${newCorrectOption}`,
    );
  }
}
