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
}
