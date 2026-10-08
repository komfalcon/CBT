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
const mongoose_1 = require("@nestjs/mongoose");
const notifications_module_1 = require("../notifications/notifications.module");
const question_schema_1 = require("./schemas/question.schema");
const questions_controller_1 = require("./questions.controller");
const questions_service_1 = require("./questions.service");
const search_service_1 = require("./search/search.service");
const questions_resolver_1 = require("./questions.resolver");
const import_controller_1 = require("./import/import.controller");
const import_service_1 = require("./import/import.service");
const import_processor_1 = require("./import/import.processor");
let QuestionsModule = class QuestionsModule {
};
exports.QuestionsModule = QuestionsModule;
exports.QuestionsModule = QuestionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            notifications_module_1.NotificationsModule,
            mongoose_1.MongooseModule.forFeature([{ name: question_schema_1.Question.name, schema: question_schema_1.QuestionSchema }]),
        ],
        controllers: [questions_controller_1.QuestionsController, import_controller_1.ImportController],
        providers: [questions_service_1.QuestionsService, search_service_1.SearchService, questions_resolver_1.QuestionsResolver, import_service_1.ImportService, import_processor_1.ImportProcessor],
        exports: [questions_service_1.QuestionsService, search_service_1.SearchService],
    })
], QuestionsModule);
//# sourceMappingURL=questions.module.js.map