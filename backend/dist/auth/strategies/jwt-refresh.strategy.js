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
exports.JwtRefreshStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const common_2 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../db/database.module");
const schema_1 = require("../../db/schema");
let JwtRefreshStrategy = class JwtRefreshStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    constructor(db, configService) {
        const publicKey = Buffer.from(configService.get('JWT_PUBLIC_KEY', ''), 'base64').toString('utf8');
        super({
            jwtFromRequest: (req) => req?.headers?.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('cbt_refresh_token='))?.slice(18) || passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()(req),
            ignoreExpiration: false,
            algorithms: ['RS256'],
            secretOrKey: publicKey,
            passReqToCallback: true,
        });
        this.db = db;
    }
    async validate(_, payload) {
        const [user] = await this.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, payload.sub)).limit(1);
        if (!user || user.account_status !== 'active') {
            throw new common_1.UnauthorizedException('User account is locked or suspended.');
        }
        return payload;
    }
};
exports.JwtRefreshStrategy = JwtRefreshStrategy;
exports.JwtRefreshStrategy = JwtRefreshStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], JwtRefreshStrategy);
//# sourceMappingURL=jwt-refresh.strategy.js.map