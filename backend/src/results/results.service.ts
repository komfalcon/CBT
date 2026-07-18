import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExamResult, ExamResultDocument } from './schemas/result.schema';

@Injectable()
export class ResultsService {
  constructor(
    @InjectModel(ExamResult.name) private readonly resultModel: Model<ExamResultDocument>,
  ) {}

  async listResults(userId: string): Promise<ExamResultDocument[]> {
    return this.resultModel
      .find({ userId })
      .sort({ completedAt: -1 })
      .exec();
  }

  async getResult(resultId: string, userId: string): Promise<ExamResultDocument> {
    const result = await this.resultModel.findOne({ resultId, userId }).exec();
    if (!result) {
      throw new NotFoundException('Exam result not found.');
    }
    return result;
  }

  async getTopicStats(userId: string) {
    const results = await this.resultModel.find({ userId }).exec();
    const stats: Record<string, { total: number; correct: number; incorrect: number; unanswered: number; subject: string }> = {};

    for (const res of results) {
      for (const q of res.questionsSnapshot) {
        if (!q.topic || !q.subject) continue;
        
        const qId = q.questionId;
        const topic = q.topic;
        const subject = q.subject;
        const key = `${subject}:::${topic}`;
        
        if (!stats[key]) {
          stats[key] = { total: 0, correct: 0, incorrect: 0, unanswered: 0, subject };
        }
        
        stats[key].total++;
        
        const answer = res.answers.get(qId);
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
