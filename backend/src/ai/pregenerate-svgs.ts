import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const questionModel = app.get<Model<any>>(getModelToken('Question'));
  const aiService = app.get(AiService);
  const logger = new Logger('PregenerateSVGs');

  // Find all questions that need diagrams but don't have them
  const questions = await questionModel.find({
    has_diagram: true,
    $or: [{ diagram_svg: null }, { diagram_svg: { $exists: false } }]
  });

  logger.log(`Found ${questions.length} questions that need SVG diagrams generated.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    logger.log(`[${i + 1}/${questions.length}] Generating SVG for question: ${q._id}`);
    
    try {
      // Small delay to prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const svg = await aiService.generateDiagram(q._id.toString());
      if (svg) {
        successCount++;
        logger.log(`✅ Success for ${q._id}`);
      }
    } catch (error: any) {
      failCount++;
      logger.error(`❌ Failed to generate diagram for ${q._id}: ${error.message}`);
    }
  }

  logger.log(`\n--- Finished ---`);
  logger.log(`Successfully generated: ${successCount}`);
  logger.log(`Failed to generate: ${failCount}`);

  await app.close();
  process.exit(0);
}

bootstrap();
