import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class StudySession {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id!: string;

  @Prop({ required: true })
  subject!: string;

  @Prop()
  topic!: string;

  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop({ default: false })
  completed!: boolean;
}

@Schema({ timestamps: true })
export class Timetable extends Document {
  @Prop({ type: String, ref: 'User', required: true })
  user!: string;

  @Prop({ type: [StudySession], default: [] })
  sessions!: StudySession[];
}

export const TimetableSchema = SchemaFactory.createForClass(Timetable);
