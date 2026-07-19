import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Question } from '../../questions/schemas/question.schema';

export const SESSION_STATUSES = ['active', 'completed', 'expired'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { getters: true },
  toObject: { getters: true },
})
export class ExamSession {
  @Prop({ default: uuidv4, unique: true, index: true })
  sessionId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, enum: ['mock', 'drill'] })
  type!: 'mock' | 'drill';

  @Prop({ type: [String], required: true })
  subjects!: string[];

  @Prop({ type: [Object], required: true })
  questions!: Record<string, any>[];

  @Prop({ type: Map, of: String, default: {} })
  answers!: Map<string, string>;

  @Prop({ required: true })
  timeRemaining!: number; // in seconds

  @Prop({ type: String, enum: SESSION_STATUSES, default: 'active', index: true })
  status!: SessionStatus;

  @Prop({ required: true, default: Date.now })
  startedAt!: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ type: [String], default: [] })
  warnings?: string[];
}

export type ExamSessionDocument = HydratedDocument<ExamSession>;
export const ExamSessionSchema = SchemaFactory.createForClass(ExamSession);
