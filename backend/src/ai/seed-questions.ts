import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AiService } from './ai.service';
import { QuestionsService } from '../questions/questions.service';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

const TARGET_SUBJECTS: Record<string, string[]> = {
  'physics': ['Electricity', 'Modern Physics'],
  'chemistry': ['Organic Chemistry', 'Physical Chemistry', 'Inorganic Chemistry'],
  'english': ['Lexis and Structure', 'Comprehension', 'Summary Writing'],
  'biology': ['Cell Biology', 'Genetics', 'Ecology'],
};

const BATCH_SIZE = 5;       // Questions per API call (safe token budget)
const BATCHES_PER_TOPIC = 5; // 5 batches × 5 = 25 questions per topic

async function bootstrap() {
  const logger = new Logger('SeedQuestions');
  const app = await NestFactory.createApplicationContext(AppModule);

  const aiService = app.get(AiService);
  const questionsService = app.get(QuestionsService);

  const adminUserId = 'system-ai-generator';

  logger.log('Starting question generation...');
  let totalSaved = 0;

  for (const [subject, topics] of Object.entries(TARGET_SUBJECTS)) {
    for (const topic of topics) {
      logger.log(`\n=== ${subject.toUpperCase()} → ${topic} ===`);

      for (let batch = 1; batch <= BATCHES_PER_TOPIC; batch++) {
        logger.log(`  Batch ${batch}/${BATCHES_PER_TOPIC}: generating ${BATCH_SIZE} questions...`);

        const questions = await aiService.generateQuestionsBatch(subject, BATCH_SIZE, topic);

        if (!questions || questions.length === 0) {
          logger.warn(`  Batch ${batch} returned empty — skipping.`);
          continue;
        }

        let saved = 0;
        for (const q of questions) {
          try {
            await questionsService.createQuestion(
              {
                subject: subject as any,
                topic: q.topic || topic,
                question_text: q.question_text,
                options: q.options,
                correct_option: q.correct_option,
                question_type: 'mcq_single',
                difficulty_level: typeof q.difficulty === 'number' ? q.difficulty : 3,
                explanation: q.explanation,
              },
              { userId: adminUserId },
              { source: 'ai_generated' }
            );
            saved++;
            totalSaved++;
          } catch (e: any) {
            logger.warn(`  Skipped (${e.message?.slice(0, 80)})`);
          }
        }

        logger.log(`  Batch ${batch}: saved ${saved}/${questions.length}`);

        // Pause between batches to avoid rate-limiting
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  logger.log(`\n✅ Done! Total questions saved: ${totalSaved}`);
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
