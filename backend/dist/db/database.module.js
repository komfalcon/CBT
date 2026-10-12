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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = exports.DRIZZLE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("./schema"));
exports.DRIZZLE = Symbol('DRIZZLE_CONNECTION');
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: exports.DRIZZLE,
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const url = configService.get('DATABASE_URL');
                    if (!url) {
                        throw new Error('DATABASE_URL must be defined');
                    }
                    const client = (0, postgres_1.default)(url, {
                        ssl: 'require',
                        max: 10,
                        idle_timeout: 30,
                        connect_timeout: 10,
                        onnotice: () => { },
                    });
                    try {
                        await client `ALTER TABLE users ADD COLUMN IF NOT EXISTS aurikrex_id text UNIQUE;`;
                        await client `ALTER TABLE users ADD COLUMN IF NOT EXISTS auri_coins_balance integer DEFAULT 5000;`;
                        await client `ALTER TABLE users ADD COLUMN IF NOT EXISTS auri_coins_last_reset timestamp DEFAULT now();`;
                        await client `ALTER TABLE users ADD COLUMN IF NOT EXISTS auri_coins_monthly_allowance integer DEFAULT 5000;`;
                        await client `
            CREATE TABLE IF NOT EXISTS auri_coin_ledger (
              id text PRIMARY KEY,
              user_id text NOT NULL,
              app_id text NOT NULL,
              feature_name text NOT NULL,
              amount integer NOT NULL,
              balance_after integer NOT NULL,
              metadata jsonb,
              created_at timestamp DEFAULT now()
            );
          `;
                        await client `
            CREATE TABLE IF NOT EXISTS sso_clients (
              id text PRIMARY KEY,
              client_id text NOT NULL UNIQUE,
              client_name text NOT NULL,
              client_secret_hash text,
              redirect_uris jsonb NOT NULL,
              allowed_scopes jsonb NOT NULL,
              created_at timestamp DEFAULT now()
            );
          `;
                        await client `
            CREATE TABLE IF NOT EXISTS sso_codes (
              id text PRIMARY KEY,
              code text NOT NULL UNIQUE,
              client_id text NOT NULL,
              aurikrex_id text NOT NULL,
              code_challenge text,
              code_challenge_method text,
              redirect_uri text NOT NULL,
              scope text,
              expires_at timestamp NOT NULL,
              created_at timestamp DEFAULT now()
            );
          `;
                        console.log('[DATABASE] Auto-migration for aurikrex_id, Auri Coins, and SSO tables completed successfully.');
                    }
                    catch (err) {
                        console.warn('[DATABASE] Auto-migration warning:', err);
                    }
                    return (0, postgres_js_1.drizzle)(client, { schema });
                },
            },
        ],
        exports: [exports.DRIZZLE],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map