"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const exam_controller_1 = require("./exam.controller");
const exam_service_1 = require("./exam.service");
const session_schema_1 = require("./schemas/session.schema");
const result_schema_1 = require("../results/schemas/result.schema");
const question_schema_1 = require("../questions/schemas/question.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let ExamModule = class ExamModule {
};
exports.ExamModule = ExamModule;
exports.ExamModule = ExamModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: session_schema_1.ExamSession.name, schema: session_schema_1.ExamSessionSchema },
                { name: result_schema_1.ExamResult.name, schema: result_schema_1.ExamResultSchema },
                { name: question_schema_1.Question.name, schema: question_schema_1.QuestionSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
        ],
        controllers: [exam_controller_1.ExamController],
        providers: [exam_service_1.ExamService],
        exports: [exam_service_1.ExamService],
    })
], ExamModule);
//# sourceMappingURL=exam.module.js.map