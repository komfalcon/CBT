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
exports.SsoService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const crypto_1 = require("crypto");
const database_module_1 = require("../../db/database.module");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const schema = __importStar(require("../../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const utils_1 = require("../../users/utils");
let SsoService = class SsoService {
    constructor(db, jwtService, configService) {
        this.db = db;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateClient(clientId, redirectUri) {
        const clients = await this.db
            .select()
            .from(schema.ssoClients)
            .where((0, drizzle_orm_1.eq)(schema.ssoClients.client_id, clientId))
            .limit(1);
        if (!clients.length) {
            if (['aurikrex_library', 'aurikrex_bytes', 'aurikrex_cbt', 'aurikrex_vault'].includes(clientId)) {
                return {
                    client_id: clientId,
                    client_name: clientId === 'aurikrex_library' ? 'Aurikrex Library' : clientId === 'aurikrex_bytes' ? 'Aurikrex Bytes' : clientId === 'aurikrex_vault' ? 'Aurikrex Phorynt' : 'Aurikrex CBT',
                    redirect_uris: [
                        'https://library.aurikrex.com/sso/callback',
                        'https://www.library.aurikrex.com/sso/callback',
                        'https://bytes.aurikrex.com/sso/callback',
                        'https://www.bytes.aurikrex.com/sso/callback',
                        'https://phorynt.aurikrex.com/sso/callback',
                        'https://www.phorynt.aurikrex.com/sso/callback',
                        'https://cbt.aurikrex.com/sso/callback',
                        'https://www.cbt.aurikrex.com/sso/callback',
                        'http://localhost:5173/sso/callback',
                        'http://localhost:5174/sso/callback',
                        'http://localhost:5175/sso/callback',
                    ],
                    allowed_scopes: ['openid', 'profile', 'email'],
                };
            }
            throw new common_1.NotFoundException(`SSO Client '${clientId}' not found`);
        }
        const client = clients[0];
        if (redirectUri && Array.isArray(client.redirect_uris)) {
            const normReq = redirectUri.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
            const allowed = client.redirect_uris.some((uri) => {
                const normUri = uri.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
                return normReq === normUri || normReq.startsWith(normUri);
            });
            if (!allowed) {
                throw new common_1.BadRequestException(`Redirect URI '${redirectUri}' is not authorized for client '${clientId}'`);
            }
        }
        return client;
    }
    async generateAuthCode(params) {
        await this.validateClient(params.clientId, params.redirectUri);
        const code = `ac_${(0, crypto_1.randomBytes)(24).toString('hex')}`;
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.db.insert(schema.ssoCodes).values({
            id: (0, uuid_1.v4)(),
            code,
            client_id: params.clientId,
            aurikrex_id: params.aurikrexId,
            code_challenge: params.codeChallenge,
            code_challenge_method: params.codeChallengeMethod || 'S256',
            redirect_uri: params.redirectUri,
            scope: params.scope || 'openid profile email',
            expires_at: expiresAt,
        });
        return code;
    }
    async exchangeToken(params) {
        const records = await this.db
            .select()
            .from(schema.ssoCodes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.ssoCodes.code, params.code), (0, drizzle_orm_1.eq)(schema.ssoCodes.client_id, params.clientId)))
            .limit(1);
        if (!records.length) {
            throw new common_1.UnauthorizedException('Invalid or expired authorization code');
        }
        const record = records[0];
        if (new Date() > record.expires_at) {
            await this.db.delete(schema.ssoCodes).where((0, drizzle_orm_1.eq)(schema.ssoCodes.id, record.id));
            throw new common_1.UnauthorizedException('Authorization code has expired');
        }
        if (record.code_challenge) {
            if (!params.codeVerifier) {
                throw new common_1.BadRequestException('code_verifier is required for PKCE code exchange');
            }
            let calculatedChallenge = params.codeVerifier;
            if (record.code_challenge_method === 'S256') {
                calculatedChallenge = (0, crypto_1.createHash)('sha256').update(params.codeVerifier).digest('base64url');
            }
            if (calculatedChallenge !== record.code_challenge) {
                throw new common_1.UnauthorizedException('PKCE code_verifier verification failed');
            }
        }
        await this.db.delete(schema.ssoCodes).where((0, drizzle_orm_1.eq)(schema.ssoCodes.id, record.id));
        const users = await this.db
            .select()
            .from(schema.users)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema.users.aurikrex_id, record.aurikrex_id), (0, drizzle_orm_1.eq)(schema.users.id, record.aurikrex_id)))
            .limit(1);
        if (!users.length) {
            throw new common_1.NotFoundException('Associated Aurikrex User not found');
        }
        const user = users[0];
        if (!user.aurikrex_id) {
            user.aurikrex_id = await this.ensureAurikrexId(user.id);
        }
        const payload = {
            sub: user.aurikrex_id,
            aurikrex_id: user.aurikrex_id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            aud: params.clientId,
            iss: 'https://cbt.aurikrex.com',
            scope: record.scope,
        };
        const secret = this.configService.get('JWT_SECRET') || 'aurikrex-sso-secret-key-2026';
        const accessToken = this.jwtService.sign(payload, { secret, expiresIn: '24h' });
        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 86400,
            aurikrex_id: user.aurikrex_id,
            user: {
                aurikrex_id: user.aurikrex_id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        };
    }
    async getUserInfo(aurikrexId) {
        const users = await this.db
            .select()
            .from(schema.users)
            .where((0, drizzle_orm_1.eq)(schema.users.aurikrex_id, aurikrexId))
            .limit(1);
        if (!users.length) {
            throw new common_1.NotFoundException('Aurikrex User not found');
        }
        const user = users[0];
        return {
            sub: user.aurikrex_id,
            aurikrex_id: user.aurikrex_id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profile_photo_url: user.profile_photo_url,
        };
    }
    async ensureAurikrexId(userId) {
        const users = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!users.length)
            throw new common_1.NotFoundException('User not found');
        const user = users[0];
        if (user.aurikrex_id)
            return user.aurikrex_id;
        const newAurikrexId = (0, utils_1.generateAurikrexId)();
        await this.db
            .update(schema.users)
            .set({ aurikrex_id: newAurikrexId, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.users.id, userId));
        return newAurikrexId;
    }
};
exports.SsoService = SsoService;
exports.SsoService = SsoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase,
        jwt_1.JwtService,
        config_1.ConfigService])
], SsoService);
//# sourceMappingURL=sso.service.js.map