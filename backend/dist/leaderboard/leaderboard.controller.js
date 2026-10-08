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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardController = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../db/database.module");
const schema_1 = require("../db/schema");
let LeaderboardController = class LeaderboardController {
    constructor(db) {
        this.db = db;
    }
    async getXpLeaderboard(limit = 10) {
        return await this.db.select({
            fullName: schema_1.users.fullName,
            xp_points: schema_1.users.xp_points,
            level: schema_1.users.level,
            subscription_tier: schema_1.users.subscription_tier
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.role, 'student'))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.users.xp_points))
            .limit(Number(limit));
    }
    async getStreakLeaderboard(limit = 10) {
        return await this.db.select({
            fullName: schema_1.users.fullName,
            streak_count: schema_1.users.streak_count,
            level: schema_1.users.level,
            subscription_tier: schema_1.users.subscription_tier
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.role, 'student'))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.users.streak_count))
            .limit(Number(limit));
    }
};
exports.LeaderboardController = LeaderboardController;
__decorate([
    (0, common_1.Get)('xp'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaderboardController.prototype, "getXpLeaderboard", null);
__decorate([
    (0, common_1.Get)('streak'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaderboardController.prototype, "getStreakLeaderboard", null);
exports.LeaderboardController = LeaderboardController = __decorate([
    (0, common_1.Controller)('leaderboard'),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [Object])
], LeaderboardController);
//# sourceMappingURL=leaderboard.controller.js.map