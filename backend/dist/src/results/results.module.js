"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const results_controller_1 = require("./results.controller");
const results_service_1 = require("./results.service");
const result_schema_1 = require("./schemas/result.schema");
let ResultsModule = class ResultsModule {
};
exports.ResultsModule = ResultsModule;
exports.ResultsModule = ResultsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: result_schema_1.ExamResult.name, schema: result_schema_1.ExamResultSchema }]),
        ],
        controllers: [results_controller_1.ResultsController],
        providers: [results_service_1.ResultsService],
        exports: [results_service_1.ResultsService],
    })
], ResultsModule);
//# sourceMappingURL=results.module.js.map