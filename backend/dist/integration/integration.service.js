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
exports.IntegrationService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const database_module_1 = require("../db/database.module");
const schema = __importStar(require("../db/schema"));
const postgres_js_1 = require("drizzle-orm/postgres-js");
const drizzle_orm_1 = require("drizzle-orm");
const LIBRARY_ORIGIN = process.env.LIBRARY_ORIGIN || 'https://library.aurikrex.com';
const ALLOWED_RETURN_ORIGINS = [
    process.env.CBT_ORIGIN || 'https://cbt.aurikrex.com',
    'https://cbt.aurikrex.tech',
    'http://localhost:5173',
];
let IntegrationService = class IntegrationService {
    constructor(db, jwtService, configService) {
        this.db = db;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    getPrivateKey() {
        return Buffer.from(this.configService.get('JWT_PRIVATE_KEY', ''), 'base64').toString('utf8');
    }
    getPublicKey() {
        return Buffer.from(this.configService.get('JWT_PUBLIC_KEY', ''), 'base64').toString('utf8');
    }
    safeReturnUrl(candidate) {
        if (!candidate)
            return `${ALLOWED_RETURN_ORIGINS[0]}/dashboard`;
        try {
            const parsed = new URL(candidate);
            if (ALLOWED_RETURN_ORIGINS.includes(parsed.origin))
                return parsed.toString();
        }
        catch {
        }
        return `${ALLOWED_RETURN_ORIGINS[0]}/dashboard`;
    }
    async signHandoff(payload) {
        return this.jwtService.signAsync(payload, {
            algorithm: 'RS256',
            privateKey: this.getPrivateKey(),
            audience: 'library',
            issuer: 'aurikrex-cbt',
            expiresIn: '60s',
        });
    }
    async createHandoff(userId, dto) {
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.users.id, userId), (0, drizzle_orm_1.eq)(schema.users.account_status, 'active'))).limit(1);
        if (!user)
            throw new common_1.UnauthorizedException('User not found or inactive.');
        if (dto.audience !== 'library')
            throw new common_1.BadRequestException('Only Library handoffs are enabled in this slice.');
        const jti = (0, crypto_1.randomUUID)();
        const state = (0, crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + 60_000);
        const nextPath = dto.nextPath || (dto.subjectId && dto.topicId
            ? `/subject/${encodeURIComponent(dto.subjectId)}/topic/${encodeURIComponent(dto.topicId)}`
            : '/');
        await this.db.insert(schema.handoffs).values({
            jti,
            userId,
            audience: dto.audience,
            scope: dto.scope.length ? dto.scope : ['profile', 'topic_context', 'return_context'],
            returnUrl: this.safeReturnUrl(dto.returnUrl),
            nextPath,
            expiresAt,
            state,
        });
        const handoff = await this.signHandoff({
            sub: userId,
            userId,
            email: user.email,
            role: user.role || 'student',
            tokenType: 'sso',
            scope: dto.scope.length ? dto.scope : ['profile', 'topic_context', 'return_context'],
            jti,
            state,
            subjectId: dto.subjectId,
            topicId: dto.topicId,
            conceptId: dto.conceptId,
            nextPath,
            returnUrl: this.safeReturnUrl(dto.returnUrl),
        });
        return { handoff, expiresAt: expiresAt.toISOString(), nextPath };
    }
    async exchangeHandoff(token) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(token, {
                algorithms: ['RS256'],
                publicKey: this.getPublicKey(),
                audience: 'library',
                issuer: 'aurikrex-cbt',
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Unable to complete handoff.');
        }
        const [handoff] = await this.db.update(schema.handoffs).set({ exchanged: true }).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.handoffs.jti, payload.jti), (0, drizzle_orm_1.eq)(schema.handoffs.audience, 'library'), (0, drizzle_orm_1.eq)(schema.handoffs.exchanged, false), (0, drizzle_orm_1.gt)(schema.handoffs.expiresAt, new Date()))).returning();
        if (!handoff)
            throw new common_1.UnauthorizedException('Unable to complete handoff.');
        const sessionToken = await this.jwtService.signAsync({
            sub: handoff.userId,
            userId: handoff.userId,
            tokenType: 'integration_session',
            scope: handoff.scope,
            state: handoff.state,
        }, {
            algorithm: 'RS256',
            privateKey: this.getPrivateKey(),
            audience: 'library',
            issuer: 'aurikrex-cbt',
            expiresIn: '30m',
        });
        return {
            sessionToken,
            session: {
                userId: handoff.userId,
                audience: handoff.audience,
                scope: handoff.scope,
                state: handoff.state,
                expiresAt: handoff.expiresAt,
            },
            context: {
                subjectId: payload.subjectId,
                topicId: payload.topicId,
                conceptId: payload.conceptId,
                nextPath: handoff.nextPath,
                returnUrl: handoff.returnUrl,
            },
        };
    }
    async resolveTopic(subjectId, topicId) {
        const normalizedTopic = topicId.trim().toLowerCase().replace(/\s+/g, '-');
        return {
            subjectId,
            topicId: `${subjectId}.${normalizedTopic}`,
            libraryTarget: {
                bookId: `${subjectId}-volume-01`,
                pageId: normalizedTopic,
            },
            cbtTarget: { filter: `${subjectId}.${normalizedTopic}` },
            version: 1,
        };
    }
    async verifyIntegrationSession(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                algorithms: ['RS256'],
                publicKey: this.getPublicKey(),
                audience: 'library',
                issuer: 'aurikrex-cbt',
            });
            if (payload.tokenType !== 'integration_session' || !payload.sub)
                throw new Error('invalid');
            return payload.sub;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid integration session.');
        }
    }
    async ingestEvent(userId, dto) {
        const key = `integration:event:${dto.eventId}`;
        const [existing] = await this.db.select().from(schema.integration_learning_events)
            .where((0, drizzle_orm_1.eq)(schema.integration_learning_events.eventId, dto.eventId)).limit(1);
        if (existing)
            return { accepted: true, duplicate: true, eventId: dto.eventId };
        await this.db.insert(schema.integration_learning_events).values({
            eventId: dto.eventId,
            userId,
            occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
            createdAt: new Date(),
            idempotencyKey: key,
            data: dto
        });
        return { accepted: true, duplicate: false, eventId: dto.eventId };
    }
};
exports.IntegrationService = IntegrationService;
exports.IntegrationService = IntegrationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase,
        jwt_1.JwtService,
        config_1.ConfigService])
], IntegrationService);
//# sourceMappingURL=integration.service.js.map