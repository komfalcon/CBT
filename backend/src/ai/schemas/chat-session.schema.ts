import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatSessionDocument = ChatSession & Document;

export class ChatMessage {
  @Prop({ required: true })
  role!: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content!: string;

  @Prop({ default: Date.now })
  timestamp!: Date;
}

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ type: [ChatMessage], default: [] })
  messages!: ChatMessage[];
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
