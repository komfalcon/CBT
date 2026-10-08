"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiGeneratorTask_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGeneratorTask = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const questions_service_1 = require("../questions/questions.service");
const question_types_1 = require("../questions/types/question.types");
const syllabus_1 = require("./syllabus");
let AiGeneratorTask = AiGeneratorTask_1 = class AiGeneratorTask {
    constructor(aiService, questionsService) {
        this.aiService = aiService;
        this.questionsService = questionsService;
        this.logger = new common_1.Logger(AiGeneratorTask_1.name);
        this.isGenerating = false;
        this.currentSubjectIndex = 0;
    }
    async handleQuestionGeneration() {
        if (this.isGenerating) {
            this.logger.warn('Question generation already in progress, skipping this tick.');
            return;
        }
        this.isGenerating = true;
        try {
            const subject = question_types_1.QUESTION_SUBJECTS[this.currentSubjectIndex];
            this.currentSubjectIndex = (this.currentSubjectIndex + 1) % question_types_1.QUESTION_SUBJECTS.length;
            const topics = syllabus_1.SYLLABUS[subject];
            let topic;
            if (topics && topics.length > 0) {
                topic = topics[Math.floor(Math.random() * topics.length)];
            }
            this.logger.log(`[Round-Robin #${this.currentSubjectIndex}] Generating 3 questions for: ${subject}${topic ? ` -> ${topic}` : ''}`);
            const generatedQuestions = await this.aiService.generateQuestionsBatch(subject, 3, topic);
            if (generatedQuestions && generatedQuestions.length > 0) {
                const finalizedQuestions = generatedQuestions.map(q => ({
                    ...q,
                    topic: q.topic || topic || 'General',
                }));
                await this.questionsService.insertGeneratedQuestions(subject, finalizedQuestions);
                this.logger.log(`Successfully generated and inserted ${generatedQuestions.length} questions for ${subject}.`);
            }
            else {
                this.logger.warn(`No valid questions were generated for ${subject}.`);
            }
        }
        catch (error) {
            this.logger.error('Failed during question generation tick', error.stack);
        }
        finally {
            this.isGenerating = false;
        }
    }
};
exports.AiGeneratorTask = AiGeneratorTask;
exports.AiGeneratorTask = AiGeneratorTask = AiGeneratorTask_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        questions_service_1.QuestionsService])
], AiGeneratorTask);
//# sourceMappingURL=ai-generator.task.js.map