import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { z } from 'zod';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/schemas/user.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { FilterQuestionsDto } from './dto/filter-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question, QuestionDocument } from './schemas/question.schema';
import { SearchService } from './search/search.service';
import { QUESTION_STATUSES, QUESTION_SUBJECTS } from './types/question.types';

const duplicateStatuses = ['published', 'approved', 'under_review'];

const createQuestionSchema = z.object({
  subject: z.string(),
  topic: z.string().trim().min(1),
  question_text: z.string().trim().min(10),
  options: z
    .array(
      z.object({
        id: z.enum(['A', 'B', 'C', 'D', 'E']),
        text: z.string().trim().min(1),
        image_url: z.string().optional(),
      }),
    )
    .min(2),
  correct_option: z.enum(['A', 'B', 'C', 'D', 'E']),
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
    .replace(/[^a-z0-9\s]/g, ' ')
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
    const idf = Math.log((docs.length + 1) / ((docFrequency.get(term) ?? 0) + 1)) + 1;
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
    @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
    private readonly searchService: SearchService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getActorId(user: CurrentUser): string {
    return user.sub ?? user.userId ?? 'system';
  }

  private normalizeTags(tags?: string[]): string[] {
    return (tags ?? []).map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  }

  private sanitizeTextSearchInput(input: string): string {
    return input.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
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
    const filter: FilterQuery<QuestionDocument> = {
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
    let highestQuestionId: string | undefined;

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

  private async indexQuestion(question: QuestionDocument): Promise<void> {
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

  async createQuestion(
    payload: CreateQuestionDto,
    user: CurrentUser,
    options?: { source?: 'manual' | 'import' | 'ai_generated'; importBatchId?: string },
  ) {
    const parsed = createQuestionSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
    }

    const optionIds = payload.options.map((option) => option.id);
    if (!optionIds.includes(payload.correct_option)) {
      throw new BadRequestException('correct_option must match one of options[].id');
    }

    const duplicate = await this.runDuplicateCheck({
      subject: payload.subject,
      questionText: payload.question_text,
    });

    if (duplicate.blocked) {
      throw new ConflictException({
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

  async listQuestions(filters: FilterQuestionsDto) {
    const query: FilterQuery<QuestionDocument> = {};

    if (filters.subject) query.subject = filters.subject;
    if (filters.topic) query.topic = filters.topic;
    if (filters.subtopic) query.subtopic = filters.subtopic;
    if (filters.status) query.status = filters.status;
    if (filters.difficulty_level) query.difficulty_level = filters.difficulty_level;
    if (filters.year_sourced) query.year_sourced = filters.year_sourced;
    if (filters.bloom_level) query.bloom_level = filters.bloom_level;
    if (filters.question_type) query.question_type = filters.question_type;
    if (filters.tags?.length) query.tags = { $in: filters.tags.map((tag) => tag.toLowerCase()) };

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

  async searchQuestions(params: {
    q: string;
    page: number;
    limit: number;
    subject?: string;
    difficulty_level?: number;
    status?: string;
  }) {
    const sanitizedQuery = this.sanitizeTextSearchInput(params.q);
    if (!sanitizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    const filters: Record<string, unknown> = {
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

    const subjectFilter = params.subject && QUESTION_SUBJECTS.includes(params.subject as never) ? params.subject : undefined;
    const statusFilter =
      params.status && QUESTION_STATUSES.includes(params.status as never) ? params.status : undefined;
    const difficultyFilter =
      typeof params.difficulty_level === 'number' && params.difficulty_level >= 1 && params.difficulty_level <= 5
        ? params.difficulty_level
        : undefined;

    const allQuestions = await this.questionModel.find().lean().exec();
    const searchTokens = sanitizedQuery.toLowerCase().split(' ').filter(Boolean);
    const filtered = allQuestions.filter((question) => {
      if (subjectFilter && question.subject !== subjectFilter) return false;
      if (statusFilter && question.status !== statusFilter) return false;
      if (difficultyFilter && question.difficulty_level !== difficultyFilter) return false;

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

  private sanitizeForStudents(question: QuestionDocument | (Question & { [key: string]: unknown })) {
    const plain =
      typeof (question as QuestionDocument).toObject === 'function'
        ? (question as QuestionDocument).toObject()
        : question;
    const { correct_option, ...rest } = plain as Question & { correct_option: string };
    return rest;
  }

  async getQuestionById(questionId: string, user?: CurrentUser) {
    const question = await this.questionModel.findOne({ questionId }).exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (!user?.role || user.role === 'student') {
      if (question.status !== 'published') {
        throw new ForbiddenException('Only published questions are visible to students/public');
      }
      return this.sanitizeForStudents(question);
    }

    return question;
  }

  async updateQuestion(questionId: string, payload: UpdateQuestionDto, user: CurrentUser) {
    const parsed = updateQuestionSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
    }

    const question = await this.questionModel.findOne({ questionId }).exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const actorRole = user.role;
    if (
      actorRole === 'examiner' &&
      question.created_by !== this.getActorId(user)
    ) {
      throw new ForbiddenException('Examiners can only edit their own questions');
    }

    if (payload.correct_option) {
      const options = payload.options ?? question.options;
      if (!options.some((option) => option.id === payload.correct_option)) {
        throw new BadRequestException('correct_option must match one of options[].id');
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
        throw new ConflictException({
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

  async retireQuestion(questionId: string) {
    const question = await this.questionModel.findOneAndUpdate(
      { questionId },
      { $set: { status: 'retired' } },
      { new: true },
    );

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.searchService.deleteQuestion(questionId);
    return { message: 'Question retired successfully' };
  }

  async rollbackQuestion(questionId: string, versionNumber: number, user: CurrentUser) {
    const question = await this.questionModel.findOne({ questionId }).exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const targetVersion = question.versions.find((version) => version.version_number === versionNumber);
    if (!targetVersion) {
      throw new NotFoundException('Version not found');
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

  private async transitionStatus(
    questionId: string,
    fromStatus: (typeof QUESTION_STATUSES)[number],
    toStatus: (typeof QUESTION_STATUSES)[number],
    patch?: Partial<Question>,
  ) {
    const question = await this.questionModel.findOne({ questionId }).exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.status !== fromStatus) {
      throw new BadRequestException(`Question status must be ${fromStatus} to transition to ${toStatus}`);
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

  async submitForReview(questionId: string, user: CurrentUser) {
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

  async approveQuestion(questionId: string, user: CurrentUser) {
    return this.transitionStatus(questionId, 'under_review', 'approved', {
      approved_by: this.getActorId(user),
      approved_at: new Date(),
    });
  }

  async publishQuestion(questionId: string) {
    return this.transitionStatus(questionId, 'approved', 'published');
  }

  async retirePublishedQuestion(questionId: string) {
    return this.transitionStatus(questionId, 'published', 'retired');
  }

  async getStats() {
    const [total, bySubjectAgg, byStatusAgg, byDifficultyAgg, totalPublished, recentlyAdded] =
      await Promise.all([
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

    const bySubject: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byDifficulty: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

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
    const rows = await this.questionModel
      .aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .exec();

    return rows.map((row) => ({ subject: row._id as string, count: row.count as number }));
  }

  async updateTags(id: string, tags: string[]): Promise<QuestionDocument> {
    const doc = await this.questionModel.findOneAndUpdate({ questionId: id }, { tags }, { new: true }).exec();
    if (!doc) {
      throw new NotFoundException('Question not found');
    }
    return doc;
  }

  async insertGeneratedQuestions(subject: string, rawQuestions: any[]): Promise<QuestionDocument[]> {
    if (!rawQuestions || rawQuestions.length === 0) return [];

    const documentsToInsert = rawQuestions.map(q => {
      // Ensure we have a unique ID to avoid E11000 dup key errors if any index was left behind
      const uniqueId = `${subject}_ai_${Math.random().toString(36).substring(2, 9)}`;
      
      const parsedOptions = (q.options || []).map((opt: any, optIndex: number) => {
        const id = ['A', 'B', 'C', 'D', 'E'][optIndex];
        return {
          id: opt.id || id,
          text: opt.text || `Option ${id}`
        };
      });

      // Ensure 4 options at minimum
      while(parsedOptions.length < 4) {
        const id = ['A', 'B', 'C', 'D', 'E'][parsedOptions.length];
        parsedOptions.push({ id, text: `Option ${id}` });
      }

      let correctOpt = q.correct_option;
      let isBonus = false;
      if (!['A', 'B', 'C', 'D', 'E'].includes(correctOpt)) {
        correctOpt = 'A'; // Fallback to pass validation
        isBonus = true; // Mark as bonus since AI hallucinated
      }

      return {
        questionId: uniqueId,
        subject: subject,
        topic: q.topic || 'General',
        question_text: q.question_text || 'Generated Question',
        options: parsedOptions,
        correct_option: correctOpt,
        explanation: q.explanation || undefined,
        difficulty_level: q.difficulty ? Number(q.difficulty) : 3,
        question_type: 'mcq_single',
        status: 'published',
        source: 'ai_generated',
        created_by: 'ai-generator',
        tags: q.tags || ['ai-generated'],
        is_bonus: isBonus,
        has_diagram: !!q.has_diagram,
        diagram_svg: q.diagram_svg || undefined
      };
    });

    try {
      const inserted = await this.questionModel.insertMany(documentsToInsert, { ordered: false });
      return inserted as unknown as QuestionDocument[];
    } catch (error: any) {
      // In case of any duplicate key errors (code 11000) from bulk insert, we can filter them out
      if (error.code === 11000 && error.insertedDocs) {
        return error.insertedDocs;
      }
      this.logger.error('Failed inserting AI generated questions', error.stack);
      return [];
    }
  }

  async getVersions(questionId: string) {
    const question = await this.questionModel.findOne({ questionId }).select({ versions: 1 }).lean().exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question.versions ?? [];
  }

  async bulkTagUpdate(payload: {
    questionIds: string[];
    tags: string[];
    action: 'add' | 'remove';
  }) {
    if (!payload.questionIds.length || !payload.tags.length) {
      throw new BadRequestException('questionIds and tags are required');
    }

    const tags = this.normalizeTags(payload.tags);

    if (payload.action === 'add') {
      await this.questionModel.updateMany(
        { questionId: { $in: payload.questionIds } },
        { $addToSet: { tags: { $each: tags } } },
      );
    } else {
      await this.questionModel.updateMany(
        { questionId: { $in: payload.questionIds } },
        { $pullAll: { tags } },
      );
    }

    return { message: 'Bulk tag update completed' };
  }

  async correctQuestionError(questionId: string, newCorrectOption: string, newExplanation?: string): Promise<void> {
    const updatePayload: any = { correct_option: newCorrectOption };
    if (newExplanation) {
      updatePayload.explanation = newExplanation;
    }
    await this.questionModel.updateOne({ questionId }, { $set: updatePayload }).exec();
    this.logger.log(`Question ${questionId} corrected via AI vetting: ${newCorrectOption}`);
  }
}
