import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SyllabusTracker extends Document {
  @Prop({ type: String, ref: 'User', required: true })
  user!: string;

  @Prop({ required: true })
  subject!: string;

  @Prop({ type: [String], default: [] })
  completedTopics!: string[];

  @Prop({ default: 0 })
  progress!: number;
}

export const SyllabusTrackerSchema = SchemaFactory.createForClass(SyllabusTracker);
