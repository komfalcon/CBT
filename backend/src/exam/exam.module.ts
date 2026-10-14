import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { ClefDecisionService } from '../ai/clef-decision.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [ExamController],
  providers: [ExamService, ClefDecisionService],
  exports: [ExamService],
})
export class ExamModule {}
