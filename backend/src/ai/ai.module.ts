import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { QuestionsModule } from '../questions/questions.module';
import { AiGeneratorTask } from './ai-generator.task';

import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [
    QuestionsModule,
    CoinsModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiGeneratorTask],
  exports: [AiService],
})
export class AiModule {}
