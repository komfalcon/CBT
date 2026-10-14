import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { QuestionsModule } from '../questions/questions.module';
import { AiGeneratorTask } from './ai-generator.task';
import { ExplanationCacheService } from './explanation-cache.service';
import { AiKeyManagerService } from './ai-key-manager.service';
import { ClefDecisionService } from './clef-decision.service';

import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [
    QuestionsModule,
    CoinsModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiGeneratorTask, ExplanationCacheService, AiKeyManagerService, ClefDecisionService],
  exports: [AiService, ClefDecisionService],
})
export class AiModule {}
