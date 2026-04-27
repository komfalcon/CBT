import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from '../schemas/question.schema';

const INDEX_NAME = 'jamb_questions';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly client?: ElasticsearchClient;
  private mappingEnsured = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
  ) {
    const node = this.configService.get<string>('ELASTICSEARCH_URL');
    if (node) {
      this.client = new ElasticsearchClient({ node, requestTimeout: 3000, maxRetries: 1 });
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  private async ensureIndex() {
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
    } catch {
      this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
    }
  }

  async indexQuestion(question: Pick<Question, 'questionId'> & Record<string, unknown>): Promise<boolean> {
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
    } catch {
      this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
      return false;
    }
  }

  async deleteQuestion(questionId: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
      return false;
    }

    try {
      await this.client.delete({ index: INDEX_NAME, id: questionId, refresh: 'wait_for' });
      return true;
    } catch {
      this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
      return false;
    }
  }

  async searchQuestions(
    query: string,
    filters: Record<string, unknown>,
    pagination: { page: number; limit: number },
  ): Promise<{ ids: string[]; total: number } | null> {
    if (!this.client) {
      this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
      return null;
    }

    try {
      await this.ensureIndex();

      const must: Array<Record<string, unknown>> = [{ match: { question_text: query } }];
      const filter: Array<Record<string, unknown>> = [];

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
      const totalValue =
        typeof response.hits.total === 'number' ? response.hits.total : (response.hits.total?.value ?? 0);

      return { ids, total: totalValue };
    } catch {
      this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
      return null;
    }
  }

  async bulkIndex(questions: Array<Pick<Question, 'questionId'> & Record<string, unknown>>): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
      return false;
    }

    try {
      await this.ensureIndex();
      if (questions.length === 0) {
        return true;
      }

      const operations: Array<Record<string, unknown>> = [];
      for (const question of questions) {
        operations.push({ index: { _index: INDEX_NAME, _id: question.questionId } });
        operations.push(question);
      }

      await this.client.bulk({ operations, refresh: true });
      return true;
    } catch {
      this.logger.warn('[SEARCH] Elasticsearch unavailable, using MongoDB fallback');
      return false;
    }
  }

  async reindexAll(): Promise<{ indexed: number }> {
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
}
