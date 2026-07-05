import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  BLOOM_LEVELS,
  MEDIA_TYPES,
  OPTION_IDS,
  QUESTION_SOURCES,
  QUESTION_STATUSES,
  QUESTION_SUBJECTS,
  QUESTION_TYPES,
} from '../types/question.types';

@Schema({ _id: false })
export class QuestionOption {
  @Prop({ required: true, enum: OPTION_IDS })
  id!: string;

  @Prop({ required: true })
  text!: string;

  @Prop()
  image_url?: string;
}

const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

@Schema({ _id: false })
export class QuestionMedia {
  @Prop({ required: true, enum: MEDIA_TYPES })
  type!: string;

  @Prop({ required: true })
  url!: string;

  @Prop()
  alt_text?: string;
}

const QuestionMediaSchema = SchemaFactory.createForClass(QuestionMedia);

@Schema({ _id: false })
export class QuestionVersion {
  @Prop({ required: true })
  version_number!: number;

  @Prop({ required: true })
  question_text!: string;

  @Prop({ type: [QuestionOptionSchema], required: true, default: [] })
  options!: QuestionOption[];

  @Prop({ required: true, enum: OPTION_IDS })
  correct_option!: string;

  @Prop({ required: true })
  modified_by!: string;

  @Prop({ required: true, default: Date.now })
  modified_at!: Date;

  @Prop()
  change_reason?: string;
}

const QuestionVersionSchema = SchemaFactory.createForClass(QuestionVersion);

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Question {
  @Prop({ default: uuidv4, unique: true, index: true })
  questionId!: string;

  @Prop({ required: true, enum: QUESTION_SUBJECTS, index: true })
  subject!: string;

  @Prop({ required: true })
  topic!: string;

  @Prop()
  subtopic?: string;

  @Prop({ min: 1990, max: 2024 })
  year_sourced?: number;

  @Prop({ required: true, minlength: 10 })
  question_text!: string;

  @Prop({ type: [QuestionOptionSchema], required: true, default: [] })
  options!: QuestionOption[];

  @Prop({ required: true, enum: OPTION_IDS })
  correct_option!: string;

  @Prop()
  explanation?: string;

  @Prop({ required: true, enum: QUESTION_TYPES })
  question_type!: string;

  @Prop({ required: true, min: 1, max: 5, index: true })
  difficulty_level!: number;

  @Prop({ min: -3, max: 3, default: 0 })
  irt_difficulty!: number;

  @Prop({ min: 0.5, max: 3, default: 1 })
  irt_discrimination!: number;

  @Prop({ min: 0, max: 0.35, default: 0.25 })
  irt_guessing!: number;

  @Prop({ enum: BLOOM_LEVELS })
  bloom_level?: string;

  @Prop({ default: 60 })
  estimated_solve_time_seconds!: number;

  @Prop({ type: [QuestionMediaSchema], default: [] })
  media!: QuestionMedia[];

  @Prop({ default: 'en' })
  language!: string;

  @Prop({ type: String, enum: QUESTION_STATUSES, default: 'draft', index: true })
  status!: string;

  @Prop({ required: true })
  created_by!: string;

  @Prop()
  reviewed_by?: string;

  @Prop()
  approved_by?: string;

  @Prop()
  approved_at?: Date;

  @Prop({ default: false })
  is_bonus!: boolean;

  @Prop({ type: [QuestionVersionSchema], default: [] })
  versions!: QuestionVersion[];

  @Prop({ default: 0 })
  use_count!: number;

  @Prop({ default: 0 })
  avg_response_time_ms!: number;

  @Prop({ default: 0 })
  correct_count!: number;

  @Prop({ default: 0 })
  attempt_count!: number;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [Number], default: [], select: false })
  embedding_vector!: number[];

  @Prop()
  diagram_svg?: string;

  @Prop()
  latex?: string;

  @Prop()
  import_batch_id?: string;

  @Prop({ type: String, enum: QUESTION_SOURCES, default: 'manual' })
  source!: string;

  created_at!: Date;
  updated_at!: Date;
}

export type QuestionDocument = HydratedDocument<Question>;
export const QuestionSchema = SchemaFactory.createForClass(Question);

QuestionSchema.index({ subject: 1, topic: 1, difficulty_level: 1 });
QuestionSchema.index({ subject: 1, status: 1, year_sourced: 1 });
QuestionSchema.index({ status: 1, created_at: -1 });
QuestionSchema.index({ question_text: 'text' });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ import_batch_id: 1 });
