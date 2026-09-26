import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { SearchService } from './search/search.service';
import { QuestionsResolver } from './questions.resolver';
import { ImportController } from './import/import.controller';
import { ImportService } from './import/import.service';
import { ImportProcessor } from './import/import.processor';

import { AiQuestionGeneratorService } from './ai-question-generator.service';
import { PdfScannerService } from './pdf-scanner.service';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
  ],
  controllers: [QuestionsController, ImportController],
  providers: [
    QuestionsService,
    SearchService,
    QuestionsResolver,
    ImportService,
    ImportProcessor,
    AiQuestionGeneratorService,
    PdfScannerService,
  ],
  exports: [QuestionsService, SearchService, AiQuestionGeneratorService, PdfScannerService],
})
export class QuestionsModule {}
