"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const notifications_module_1 = require("../notifications/notifications.module");
const questions_controller_1 = require("./questions.controller");
const questions_service_1 = require("./questions.service");
const search_service_1 = require("./search/search.service");
const questions_resolver_1 = require("./questions.resolver");
const import_controller_1 = require("./import/import.controller");
const import_service_1 = require("./import/import.service");
const import_processor_1 = require("./import/import.processor");
const ai_question_generator_service_1 = require("./ai-question-generator.service");
const pdf_scanner_service_1 = require("./pdf-scanner.service");
let QuestionsModule = class QuestionsModule {
};
exports.QuestionsModule = QuestionsModule;
exports.QuestionsModule = QuestionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [questions_controller_1.QuestionsController, import_controller_1.ImportController],
        providers: [
            questions_service_1.QuestionsService,
            search_service_1.SearchService,
            questions_resolver_1.QuestionsResolver,
            import_service_1.ImportService,
            import_processor_1.ImportProcessor,
            ai_question_generator_service_1.AiQuestionGeneratorService,
            pdf_scanner_service_1.PdfScannerService,
        ],
        exports: [questions_service_1.QuestionsService, search_service_1.SearchService, ai_question_generator_service_1.AiQuestionGeneratorService, pdf_scanner_service_1.PdfScannerService],
    })
], QuestionsModule);
//# sourceMappingURL=questions.module.js.map