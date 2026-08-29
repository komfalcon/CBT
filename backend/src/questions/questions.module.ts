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

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
  ],
  controllers: [QuestionsController, ImportController],
  providers: [QuestionsService, SearchService, QuestionsResolver, ImportService, ImportProcessor],
  exports: [QuestionsService, SearchService],
})
export class QuestionsModule {}
