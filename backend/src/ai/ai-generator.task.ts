import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiService } from './ai.service';
import { QuestionsService } from '../questions/questions.service';
import { QUESTION_SUBJECTS } from '../questions/types/question.types';

import { SYLLABUS } from './syllabus';

@Injectable()
export class AiGeneratorTask {
  private readonly logger = new Logger(AiGeneratorTask.name);
  private isGenerating = false;

  constructor(
    private readonly aiService: AiService,
    private readonly questionsService: QuestionsService,
  ) {}

  @Cron('0 */2 * * * *') // Runs every 2 minutes
  async handleQuestionGeneration() {
    if (this.isGenerating) {
      return;
    }
    this.isGenerating = true;

    try {
      // Pick a random subject to augment to ensure continuous variety
      const subject = QUESTION_SUBJECTS[Math.floor(Math.random() * QUESTION_SUBJECTS.length)];
      
      const topics = SYLLABUS[subject];
      let topic: string | undefined;
      if (topics && topics.length > 0) {
        topic = topics[Math.floor(Math.random() * topics.length)];
      }
      
      this.logger.log(`Starting continuous generation for subject: ${subject}${topic ? ` -> ${topic}` : ''}`);
      
      // Generate 5 questions at a time to prevent timeout and ensure high variety
      const generatedQuestions = await this.aiService.generateQuestionsBatch(subject, 5, topic);
      
      if (generatedQuestions && generatedQuestions.length > 0) {
        // Enforce the generated topic if the AI didn't supply it
        const finalizedQuestions = generatedQuestions.map(q => ({
          ...q,
          topic: q.topic || topic || 'General',
        }));
        
        await this.questionsService.insertGeneratedQuestions(subject, finalizedQuestions);
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
