import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { QuestionsService } from '../questions/questions.service';
import { QUESTION_SUBJECTS } from '../questions/types/question.types';
import { Cron } from '@nestjs/schedule';
import { SYLLABUS } from './syllabus';

@Injectable()
export class AiGeneratorTask {
  private readonly logger = new Logger(AiGeneratorTask.name);
  private isGenerating = false;
  // Round-robin: tracks which subject index we should generate next
  private currentSubjectIndex = 0;

  constructor(
    private readonly aiService: AiService,
    private readonly questionsService: QuestionsService,
  ) {}

  /**
   * Runs every 30 minutes. Generates questions for ONE subject at a time
   * in round-robin order to avoid burning through free API quotas.
   *
   * Budget math (Gemini free tier = 3,000 req/day):
   *   - 1 call every 30 min = 48 calls/day
   *   - Leaves 2,952 calls/day for real user features (explanations, tutor, etc.)
   *
   * Round-robin means all 17 subjects get covered every ~8.5 hours.
   */
  // @Cron('0 */30 * * * *') // DISABLED — uncomment to re-enable background question generation
  async handleQuestionGeneration() {
    if (this.isGenerating) {
      this.logger.warn('Question generation already in progress, skipping this tick.');
      return;
    }
    this.isGenerating = true;

    try {
      const subject = QUESTION_SUBJECTS[this.currentSubjectIndex];
      // Advance round-robin pointer for next tick
      this.currentSubjectIndex = (this.currentSubjectIndex + 1) % QUESTION_SUBJECTS.length;

      const topics = SYLLABUS[subject as keyof typeof SYLLABUS];
      let topic: string | undefined;
      if (topics && topics.length > 0) {
        topic = topics[Math.floor(Math.random() * topics.length)];
      }

      this.logger.log(`[Round-Robin #${this.currentSubjectIndex}] Generating 3 questions for: ${subject}${topic ? ` -> ${topic}` : ''}`);

      // Generate only 3 questions per tick (was 5 * 17 = 85 before)
      const generatedQuestions = await this.aiService.generateQuestionsBatch(subject, 3, topic);

      if (generatedQuestions && generatedQuestions.length > 0) {
        const finalizedQuestions = generatedQuestions.map(q => ({
          ...q,
          topic: q.topic || topic || 'General',
        }));

        await this.questionsService.insertGeneratedQuestions(subject, finalizedQuestions);
        this.logger.log(`Successfully generated and inserted ${generatedQuestions.length} questions for ${subject}.`);
      } else {
        this.logger.warn(`No valid questions were generated for ${subject}.`);
      }
    } catch (error: any) {
      this.logger.error('Failed during question generation tick', error.stack);
    } finally {
      this.isGenerating = false;
    }
  }
}
