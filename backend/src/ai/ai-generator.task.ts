import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiService } from './ai.service';
import { QuestionsService } from '../questions/questions.service';
import { QUESTION_SUBJECTS } from '../questions/types/question.types';

@Injectable()
export class AiGeneratorTask {
  private readonly logger = new Logger(AiGeneratorTask.name);
  private isGenerating = false;

  constructor(
    private readonly aiService: AiService,
    private readonly questionsService: QuestionsService,
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  async handleQuestionGeneration() {
    if (this.isGenerating) {
      return;
    }
    this.isGenerating = true;

    try {
      // Pick a random subject to augment to ensure continuous variety
      const subject = QUESTION_SUBJECTS[Math.floor(Math.random() * QUESTION_SUBJECTS.length)];
      
      this.logger.log(`Starting continuous generation for subject: ${subject}`);
      
      // Generate 5 questions at a time to prevent timeout and ensure high variety
      const generatedQuestions = await this.aiService.generateQuestionsBatch(subject, 5);
      
      if (generatedQuestions && generatedQuestions.length > 0) {
        await this.questionsService.insertGeneratedQuestions(subject, generatedQuestions);
        this.logger.log(`Successfully generated and inserted ${generatedQuestions.length} new questions for ${subject}`);
      } else {
        this.logger.warn(`No valid questions were generated for ${subject}`);
      }
    } catch (error: any) {
      this.logger.error('Failed during continuous question generation', error.stack);
    } finally {
      this.isGenerating = false;
    }
  }
}
