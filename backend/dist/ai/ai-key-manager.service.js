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
var AiKeyManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiKeyManagerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_orm_1 = require("drizzle-orm");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const crypto_1 = require("crypto");
const database_module_1 = require("../db/database.module");
let AiKeyManagerService = AiKeyManagerService_1 = class AiKeyManagerService {
    constructor(db, config) {
        this.db = db;
        this.config = config;
        this.logger = new common_1.Logger(AiKeyManagerService_1.name);
    }
    getMistralKeys() {
        const configured = [
            ['mistral-chat-primary', this.config.get('MISTRAL_CHAT_API_KEY')],
            ['mistral-chat-alt', this.config.get('MISTRAL_API_KEY_CHAT')],
            ['mistral-primary', this.config.get('MISTRAL_API_KEY')],
            ['mistral-2', this.config.get('MISTRAL_API_KEY_2')],
            ['mistral-3', this.config.get('MISTRAL_API_KEY_3')],
            ['mistral-4', this.config.get('MISTRAL_API_KEY_4')],
        ];
        const keys = configured.filter((entry) => Boolean(entry[1])).map(([alias, key]) => ({ alias, key }));
        const generic = this.config.get('AI_API_KEYS', '').split(',').map((key) => key.trim()).filter(Boolean);
        for (const [index, key] of generic.entries()) {
            if (!keys.some((entry) => entry.key === key))
                keys.push({ alias: `ai-key-${index + 1}`, key });
        }
        return keys;
    }
    getGeminiKeys() {
        return [
            { alias: 'gemini-1', key: this.config.get('GEMINI_API_KEY_1') || '' },
            { alias: 'gemini-2', key: this.config.get('GEMINI_API_KEY_2') || '' },
        ].filter((entry) => Boolean(entry.key));
    }
    getCloudflareWorkerKeys() {
        return [
            { alias: 'cloudflare-worker-1', key: this.config.get('CF_API_TOKEN_1') || '' },
            { alias: 'cloudflare-worker-2', key: this.config.get('CF_API_TOKEN_2') || '' },
        ].filter((entry) => Boolean(entry.key));
    }
    getCloudflareAccountId() {
        return this.config.get('CF_ACCOUNT_ID', '');
    }
    getSeekAiKey() {
        return this.config.get('SEEKAI_KEY', '');
    }
    async reserveDailyKeyUse(alias, transaction) {
        try {
            const cap = Number(this.config.get('PER_KEY_DAILY_CAP', '0'));
            const bucketStartIso = utcDay().toISOString();
            const capValue = Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : null;
            const executor = transaction ?? this.db;
            const result = await executor.execute((0, drizzle_orm_1.sql) `
        INSERT INTO ai_usage_counters (id, scope_type, scope_key, bucket_type, bucket_start, count, updated_at)
        VALUES (${(0, crypto_1.randomUUID)()}, 'key', ${alias}, 'day', ${bucketStartIso}::timestamp, 1, now())
        ON CONFLICT (scope_type, scope_key, bucket_type, bucket_start)
        DO UPDATE SET count = ai_usage_counters.count + 1, updated_at = now()
        ${capValue ? (0, drizzle_orm_1.sql) `WHERE ai_usage_counters.count < ${capValue}` : (0, drizzle_orm_1.sql) ``}
        RETURNING count
      `);
            const rows = Array.isArray(result) ? result : result.rows;
            if (rows?.length)
                return true;
            this.logger.warn(`Daily AI request cap reached for key alias ${alias}.`);
            return false;
        }
        catch (err) {
            this.logger.warn(`reserveDailyKeyUse bypass for key ${alias}: ${err?.message || err}`);
            return true;
        }
    }
};
exports.AiKeyManagerService = AiKeyManagerService;
exports.AiKeyManagerService = AiKeyManagerService = AiKeyManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase,
        config_1.ConfigService])
], AiKeyManagerService);
function utcDay() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
//# sourceMappingURL=ai-key-manager.service.js.map