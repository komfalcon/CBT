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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArenaService = void 0;
const common_1 = require("@nestjs/common");
const questions_service_1 = require("../questions/questions.service");
let ArenaService = class ArenaService {
    constructor(questionsService) {
        this.questionsService = questionsService;
        this.queue = [];
        this.matches = new Map();
        this.userSocketMap = new Map();
    }
    registerUser(socketId, userId) {
        this.userSocketMap.set(socketId, userId);
    }
    unregisterUser(socketId) {
        this.userSocketMap.delete(socketId);
        this.queue = this.queue.filter(id => id !== socketId);
    }
    getUserId(socketId) {
        return this.userSocketMap.get(socketId);
    }
    joinQueue(socketId) {
        if (!this.queue.includes(socketId)) {
            this.queue.push(socketId);
        }
    }
    async matchmake() {
        if (this.queue.length >= 2) {
            const p1 = this.queue.shift();
            const p2 = this.queue.shift();
            const matchId = `match_${Date.now()}`;
            const questions = [];
            const match = {
                matchId,
                players: [
                    { userId: this.getUserId(p1) || 'unknown', socketId: p1, score: 0 },
                    { userId: this.getUserId(p2) || 'unknown', socketId: p2, score: 0 },
                ],
                questions,
                status: 'active',
            };
            this.matches.set(matchId, match);
            return match;
        }
        return null;
    }
};
exports.ArenaService = ArenaService;
exports.ArenaService = ArenaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], ArenaService);
//# sourceMappingURL=arena.service.js.map