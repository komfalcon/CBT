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
exports.StudyService = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../db/database.module");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
let StudyService = class StudyService {
    constructor(db) {
        this.db = db;
    }
    async getSyllabusProgress(userId, subject) {
        let tracker = await this.db.select().from(schema.syllabus_trackers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.syllabus_trackers.userId, userId), (0, drizzle_orm_1.eq)(schema.syllabus_trackers.subject, subject)))
            .limit(1)
            .then(res => res[0]);
        if (!tracker) {
            tracker = await this.db.insert(schema.syllabus_trackers).values({
                id: (0, crypto_1.randomUUID)(),
                userId: userId,
                subject,
                completedTopics: [],
                progress: 0,
            }).returning().then(res => res[0]);
        }
        return tracker;
    }
    async getAllSyllabusProgress(userId) {
        return this.db.select().from(schema.syllabus_trackers).where((0, drizzle_orm_1.eq)(schema.syllabus_trackers.userId, userId));
    }
    async updateTopicStatus(userId, subject, topic, completed) {
        let tracker = await this.getSyllabusProgress(userId, subject);
        let completedTopics = tracker.completedTopics || [];
        if (completed && !completedTopics.includes(topic)) {
            completedTopics.push(topic);
        }
        else if (!completed && completedTopics.includes(topic)) {
            completedTopics = completedTopics.filter(t => t !== topic);
        }
        tracker = await this.db.update(schema.syllabus_trackers).set({
            completedTopics
        }).where((0, drizzle_orm_1.eq)(schema.syllabus_trackers.id, tracker.id)).returning().then(res => res[0]);
        return tracker;
    }
    async getTimetable(userId) {
        let timetable = await this.db.select().from(schema.timetables)
            .where((0, drizzle_orm_1.eq)(schema.timetables.userId, userId))
            .limit(1)
            .then(res => res[0]);
        if (!timetable) {
            timetable = await this.db.insert(schema.timetables).values({
                id: (0, crypto_1.randomUUID)(),
                userId: userId,
                sessions: [],
            }).returning().then(res => res[0]);
        }
        if (!timetable.sessions) {
            timetable.sessions = [];
        }
        return timetable;
    }
    async addSession(userId, sessionData) {
        const timetable = await this.getTimetable(userId);
        const sessions = timetable.sessions || [];
        sessions.push({
            _id: (0, crypto_1.randomUUID)(),
            ...sessionData,
        });
        return await this.db.update(schema.timetables)
            .set({ sessions })
            .where((0, drizzle_orm_1.eq)(schema.timetables.id, timetable.id))
            .returning()
            .then(res => {
            const t = res[0];
            if (!t.sessions)
                t.sessions = [];
            return t;
        });
    }
    async updateSession(userId, sessionId, updateData) {
        const timetable = await this.getTimetable(userId);
        const sessions = timetable.sessions || [];
        const sessionIndex = sessions.findIndex(s => s._id === sessionId);
        if (sessionIndex === -1) {
            throw new common_1.NotFoundException('Session not found');
        }
        sessions[sessionIndex] = {
            ...sessions[sessionIndex],
            ...updateData,
        };
        return await this.db.update(schema.timetables)
            .set({ sessions })
            .where((0, drizzle_orm_1.eq)(schema.timetables.id, timetable.id))
            .returning()
            .then(res => {
            const t = res[0];
            if (!t.sessions)
                t.sessions = [];
            return t;
        });
    }
    async deleteSession(userId, sessionId) {
        const timetable = await this.getTimetable(userId);
        let sessions = timetable.sessions || [];
        sessions = sessions.filter(s => s._id !== sessionId);
        return await this.db.update(schema.timetables)
            .set({ sessions })
            .where((0, drizzle_orm_1.eq)(schema.timetables.id, timetable.id))
            .returning()
            .then(res => {
            const t = res[0];
            if (!t.sessions)
                t.sessions = [];
            return t;
        });
    }
};
exports.StudyService = StudyService;
exports.StudyService = StudyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase])
], StudyService);
//# sourceMappingURL=study.service.js.map