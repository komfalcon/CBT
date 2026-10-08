"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
const questions_module_1 = require("../questions/questions.module");
const ai_generator_task_1 = require("./ai-generator.task");
const explanation_cache_service_1 = require("./explanation-cache.service");
const ai_key_manager_service_1 = require("./ai-key-manager.service");
const coins_module_1 = require("../coins/coins.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            questions_module_1.QuestionsModule,
            coins_module_1.CoinsModule,
        ],
        controllers: [ai_controller_1.AiController],
        providers: [ai_service_1.AiService, ai_generator_task_1.AiGeneratorTask, explanation_cache_service_1.ExplanationCacheService, ai_key_manager_service_1.AiKeyManagerService],
        exports: [ai_service_1.AiService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map