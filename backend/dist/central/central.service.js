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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CentralService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentralService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const jwt = __importStar(require("jsonwebtoken"));
let CentralService = CentralService_1 = class CentralService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CentralService_1.name);
        this.jwksCache = null;
        this.lastCentralFailure = 0;
    }
    get centralUrl() {
        return (this.configService.get('CENTRAL_API_URL') ||
            'https://aurikrex-central.pxxl.click').replace(/\/+$/, '');
    }
    get s2sSecret() {
        return (this.configService.get('AURIKREX_CENTRAL_S2S_SECRET') || '');
    }
    async getPublicKey() {
        if (this.jwksCache && Date.now() < this.jwksCache.expiresAt) {
            return this.jwksCache.pem;
        }
        try {
            const response = await axios_1.default.get(`${this.centralUrl}/.well-known/jwks.json`, {
                timeout: 5000,
            });
            const key = response.data?.keys?.[0];
            if (!key || !key.pem) {
                throw new Error('Invalid JWKS response structure from Central');
            }
            this.jwksCache = {
                pem: key.pem,
                expiresAt: Date.now() + 60 * 60 * 1000,
            };
            return key.pem;
        }
        catch (err) {
            this.logger.error(`Failed to fetch JWKS public key from Central: ${err?.message || err}`);
            throw new common_1.UnauthorizedException('Central Auth JWKS verification unavailable');
        }
    }
    async verifyCentralToken(token) {
        const publicKey = await this.getPublicKey();
        try {
            const decoded = jwt.verify(token, publicKey, {
                algorithms: ['RS256'],
            });
            return decoded;
        }
        catch (err) {
            throw new common_1.UnauthorizedException(`Invalid token signature: ${err?.message || err}`);
        }
    }
    async getBalance(userIdOrAurikrexId) {
        if (Date.now() - this.lastCentralFailure < 30000) {
            return null;
        }
        try {
            const response = await axios_1.default.get(`${this.centralUrl}/api/v1/coins/balance?userId=${encodeURIComponent(userIdOrAurikrexId)}`, {
                headers: {
                    'X-Central-Api-Key': this.s2sSecret,
                    'Content-Type': 'application/json',
                },
                timeout: 2500,
            });
            return response.data;
        }
        catch (err) {
            this.lastCentralFailure = Date.now();
            this.logger.warn(`Failed to fetch AuriCoin balance for user ${userIdOrAurikrexId}: ${err?.message}`);
            return null;
        }
    }
    async deductCoins(params) {
        try {
            const response = await axios_1.default.post(`${this.centralUrl}/api/v1/coins/deduct`, {
                userId: params.userId,
                featureName: params.featureName,
                appId: 'aurikrex_cbt',
                idempotencyKey: params.idempotencyKey || `cbt_${params.featureName}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                metadata: params.metadata || {},
            }, {
                headers: {
                    'X-Central-Api-Key': this.s2sSecret,
                    'Content-Type': 'application/json',
                },
                timeout: 7000,
            });
            return response.data;
        }
        catch (err) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Coin deduction failed';
            this.logger.warn(`AuriCoin deduction failed for user ${params.userId}: ${errorMsg}`);
            throw new common_1.BadRequestException(`AuriCoin deduction failed: ${errorMsg}`);
        }
    }
    async refundCoins(params) {
        try {
            const response = await axios_1.default.post(`${this.centralUrl}/api/v1/coins/refund`, {
                idempotencyKey: params.idempotencyKey,
                reason: params.reason || 'AI call failed',
            }, {
                headers: {
                    'X-Central-Api-Key': this.s2sSecret,
                    'Content-Type': 'application/json',
                },
                timeout: 7000,
            });
            return response.data;
        }
        catch (err) {
            this.logger.error(`AuriCoin refund failed for key ${params.idempotencyKey}: ${err?.message}`);
            return null;
        }
    }
    async searchKnowledge(queryText, subject, limit = 5) {
        try {
            const response = await axios_1.default.post(`${this.centralUrl}/api/v1/knowledge/search`, {
                queryText,
                subject,
                limit,
            }, {
                headers: {
                    'X-Central-Api-Key': this.s2sSecret,
                    'Content-Type': 'application/json',
                },
                timeout: 8000,
            });
            return response.data;
        }
        catch (err) {
            this.logger.error(`Shared Knowledge search failed: ${err?.message}`);
            return [];
        }
    }
    async ingestKnowledge(data) {
        try {
            const response = await axios_1.default.post(`${this.centralUrl}/api/v1/knowledge/ingest`, {
                ...data,
                sourceApp: 'aurikrex_cbt',
            }, {
                headers: {
                    'X-Central-Api-Key': this.s2sSecret,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            return response.data;
        }
        catch (err) {
            this.logger.error(`Shared Knowledge ingestion failed: ${err?.message}`);
            return null;
        }
    }
};
exports.CentralService = CentralService;
exports.CentralService = CentralService = CentralService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CentralService);
//# sourceMappingURL=central.service.js.map