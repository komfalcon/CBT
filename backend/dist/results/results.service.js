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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsService = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../db/database.module");
const schema = __importStar(require("../db/schema"));
const postgres_js_1 = require("drizzle-orm/postgres-js");
const drizzle_orm_1 = require("drizzle-orm");
let ResultsService = class ResultsService {
    constructor(db) {
        this.db = db;
    }
    async listResults(userId) {
        return this.db
            .select()
            .from(schema.exam_results)
            .where((0, drizzle_orm_1.eq)(schema.exam_results.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema.exam_results.completedAt));
    }
    async getResult(resultId, userId) {
        const [result] = await this.db
            .select()
            .from(schema.exam_results)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.exam_results.id, resultId), (0, drizzle_orm_1.eq)(schema.exam_results.userId, userId)))
            .limit(1);
        if (!result) {
            throw new common_1.NotFoundException('Exam result not found.');
        }
        return result;
    }
    async getTopicStats(userId) {
        const results = await this.db
            .select()
            .from(schema.exam_results)
            .where((0, drizzle_orm_1.eq)(schema.exam_results.userId, userId));
        const stats = {};
        for (const res of results) {
            const questionsSnapshot = res.questionsSnapshot || [];
            const answers = res.answers || {};
            for (const q of questionsSnapshot) {
                if (!q.topic || !q.subject)
                    continue;
                const qId = q.questionId || q.id;
                const topic = q.topic;
                const subject = q.subject;
                const key = `${subject}:::${topic}`;
                if (!stats[key]) {
                    stats[key] = { total: 0, correct: 0, incorrect: 0, unanswered: 0, subject };
                }
                stats[key].total++;
                const answer = answers[qId];
                if (!answer) {
                    stats[key].unanswered++;
                }
                else if (answer.toUpperCase() === q.correct_option.toUpperCase()) {
                    stats[key].correct++;
                }
                else {
                    stats[key].incorrect++;
                }
            }
        }
        return Object.entries(stats).map(([key, val]) => ({
            topic: key.split(':::')[1],
            subject: val.subject,
            total: val.total,
            correct: val.correct,
            incorrect: val.incorrect,
            unanswered: val.unanswered,
            accuracy: val.total > 0 ? (val.correct / val.total) * 100 : 0,
        })).sort((a, b) => b.total - a.total);
    }
};
exports.ResultsService = ResultsService;
exports.ResultsService = ResultsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase])
], ResultsService);
//# sourceMappingURL=results.service.js.map