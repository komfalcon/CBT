import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class ResultsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async listResults(userId: string) {
    return this.db
      .select()
      .from(schema.exam_results)
      .where(eq(schema.exam_results.userId, userId))
      .orderBy(desc(schema.exam_results.completedAt));
  }

  async getResult(resultId: string, userId: string) {
    const [result] = await this.db
      .select()
      .from(schema.exam_results)
      .where(
        and(
          eq(schema.exam_results.id, resultId),
          eq(schema.exam_results.userId, userId),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Exam result not found.');
    }
    return result;
  }

  async getTopicStats(userId: string) {
    const results = await this.db
      .select()
      .from(schema.exam_results)
      .where(eq(schema.exam_results.userId, userId));
      
    const stats: Record<string, { total: number; correct: number; incorrect: number; unanswered: number; subject: string }> = {};

    for (const res of results) {
      const questionsSnapshot: any[] = res.questionsSnapshot as any[] || [];
      const answers: Record<string, string> = res.answers as Record<string, string> || {};
      
      for (const q of questionsSnapshot) {
        if (!q.topic || !q.subject) continue;
        
        const qId = q.questionId || q.id;
        const topic = q.topic;
        const subject = q.subject;
        const key = `${subject}:::${topic}`;
        
        if (!stats[key]) {
          stats[key] = { total: 0, correct: 0, incorrect: 0, unanswered: 0, subject };
        }
        
        stats[key].total++;
        
        // Drizzle schema parses JSON field into object, unlike mongoose Map
        const answer = answers[qId];
        if (!answer) {
          stats[key].unanswered++;
        } else if (answer.toUpperCase() === q.correct_option.toUpperCase()) {
          stats[key].correct++;
        } else {
          stats[key].incorrect++;
        }
      }
    }

    return Object.entries(stats).map(([key, val]) => ({
      topic: key.split(':::')[1],
      subject: val.subject,
      total: val.total,
      correct: val.correct,
      incorrect: val.incorrect,
      unanswered: val.unanswered,
      accuracy: val.total > 0 ? (val.correct / val.total) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }
}
