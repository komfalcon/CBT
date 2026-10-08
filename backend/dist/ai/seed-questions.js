"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const ai_service_1 = require("./ai.service");
const questions_service_1 = require("../questions/questions.service");
const common_1 = require("@nestjs/common");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const TARGET_SUBJECTS = {
    'physics': ['Electricity', 'Modern Physics'],
    'chemistry': ['Organic Chemistry', 'Physical Chemistry', 'Inorganic Chemistry'],
    'english': ['Lexis and Structure', 'Comprehension', 'Summary Writing'],
    'biology': ['Cell Biology', 'Genetics', 'Ecology'],
};
const BATCH_SIZE = 5;
const BATCHES_PER_TOPIC = 5;
async function bootstrap() {
    const logger = new common_1.Logger('SeedQuestions');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const aiService = app.get(ai_service_1.AiService);
    const questionsService = app.get(questions_service_1.QuestionsService);
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
                        await questionsService.createQuestion({
                            subject: subject,
                            topic: q.topic || topic,
                            question_text: q.question_text,
                            options: q.options,
                            correct_option: q.correct_option,
                            question_type: 'mcq_single',
                            difficulty_level: typeof q.difficulty === 'number' ? q.difficulty : 3,
                            explanation: q.explanation,
                        }, { userId: adminUserId }, { source: 'ai_generated' });
                        saved++;
                        totalSaved++;
                    }
                    catch (e) {
                        logger.warn(`  Skipped (${e.message?.slice(0, 80)})`);
                    }
                }
                logger.log(`  Batch ${batch}: saved ${saved}/${questions.length}`);
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
//# sourceMappingURL=seed-questions.js.map