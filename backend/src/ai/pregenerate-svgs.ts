import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AiService } from './ai.service';
import { Logger } from '@nestjs/common';
import { eq, isNull, and, or } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.module';
import { questions } from '../db/schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DRIZZLE);
  const aiService = app.get(AiService);
  const logger = new Logger('PregenerateSVGs');

  // Find all questions that need diagrams but don't have them
  const questionsToProcess = await db.select().from(questions).where(
    and(
      eq(questions.has_diagram, true),
      isNull(questions.diagram_svg)
    )
  );

  logger.log(`Found ${questionsToProcess.length} questions that need SVG diagrams generated.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < questionsToProcess.length; i++) {
    const q = questionsToProcess[i];
    logger.log(`[${i + 1}/${questionsToProcess.length}] Generating SVG for question: ${q.id}`);
    
    try {
      // Small delay to prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const svg = await aiService.generateDiagram(q.id.toString());
      if (svg) {
        successCount++;
        logger.log(`Success for ${q.id}`);
      }
    } catch (error: any) {
      failCount++;
      logger.error(`Failed to generate diagram for ${q.id}: ${error.message}`);
    }
  }

  logger.log(`\n--- Finished ---`);
  logger.log(`Successfully generated: ${successCount}`);
  logger.log(`Failed to generate: ${failCount}`);

  await app.close();
  process.exit(0);
}

bootstrap();
