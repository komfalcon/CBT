"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const ai_service_1 = require("./ai.service");
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../db/database.module");
const schema_1 = require("../db/schema");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const db = app.get(database_module_1.DRIZZLE);
    const aiService = app.get(ai_service_1.AiService);
    const logger = new common_1.Logger('PregenerateSVGs');
    const questionsToProcess = await db.select().from(schema_1.questions).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.questions.has_diagram, true), (0, drizzle_orm_1.isNull)(schema_1.questions.diagram_svg)));
    logger.log(`Found ${questionsToProcess.length} questions that need SVG diagrams generated.`);
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < questionsToProcess.length; i++) {
        const q = questionsToProcess[i];
        logger.log(`[${i + 1}/${questionsToProcess.length}] Generating SVG for question: ${q.id}`);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const svg = await aiService.generateDiagram(q.id.toString());
            if (svg) {
                successCount++;
                logger.log(`Success for ${q.id}`);
            }
        }
        catch (error) {
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
//# sourceMappingURL=pregenerate-svgs.js.map