import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ChatSession, ChatSessionSchema } from './schemas/chat-session.schema';
import { QuestionsModule } from '../questions/questions.module';
import { AiGeneratorTask } from './ai-generator.task';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ChatSession.name, schema: ChatSessionSchema }
    ]),
    QuestionsModule
  ],
  controllers: [AiController],
  providers: [AiService, AiGeneratorTask],
  exports: [AiService],
})
export class AiModule {}
