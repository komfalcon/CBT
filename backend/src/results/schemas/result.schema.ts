import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionSchema } from '../../questions/schemas/question.schema';

@Schema({ _id: false })
export class SubjectScore {
  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  score!: number; // Standardized score out of 100

  @Prop({ required: true })
  correctCount!: number;

  @Prop({ required: true })
  incorrectCount!: number;

  @Prop({ required: true })
  unansweredCount!: number;
}

const SubjectScoreSchema = SchemaFactory.createForClass(SubjectScore);

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { getters: true },
  toObject: { getters: true },
})
export class ExamResult {
  @Prop({ default: uuidv4, unique: true, index: true })
  resultId!: string;

  @Prop({ required: true, index: true })
  sessionId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, enum: ['mock', 'drill'] })
  type!: 'mock' | 'drill';

  @Prop({ type: [SubjectScoreSchema], required: true })
  subjectScores!: SubjectScore[];

  @Prop({ required: true })
  totalScore!: number; // For mock: total out of 400. For drill: percentage or correct ratio.

  @Prop({ required: true })
  timeSpentSeconds!: number;

  @Prop({ type: Map, of: String, default: {} })
  answers!: Map<string, string>;

  @Prop({ type: [QuestionSchema], required: true })
  questionsSnapshot!: Question[];

  @Prop({ required: true, default: Date.now })
  completedAt!: Date;
}

export type ExamResultDocument = HydratedDocument<ExamResult>;
export const ExamResultSchema = SchemaFactory.createForClass(ExamResult);
