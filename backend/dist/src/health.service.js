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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("mongoose");
const ioredis_1 = __importDefault(require("ioredis"));
const amqp = __importStar(require("amqplib"));
const elasticsearch_1 = require("@elastic/elasticsearch");
let HealthService = class HealthService {
    constructor(configService) {
        this.configService = configService;
    }
    async check() {
        const [mongodb, redis, rabbitmq, elasticsearch] = await Promise.all([
            this.withTimeout(this.checkMongo()),
            this.withTimeout(this.checkRedis()),
            this.withTimeout(this.checkRabbitMq()),
            this.withTimeout(this.checkElasticsearch()),
        ]);
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                mongodb,
                redis,
                rabbitmq,
                elasticsearch,
            },
        };
    }
    async checkMongo() {
        const uri = this.configService.get('MONGODB_URI');
        if (!uri) {
            return 'disconnected';
        }
        let connection;
        try {
            connection = await (0, mongoose_1.createConnection)(uri, {
                serverSelectionTimeoutMS: 2000,
            }).asPromise();
            if (!connection.db) {
                return 'disconnected';
            }
            await connection.db.admin().ping();
            return 'connected';
        }
        catch {
            return 'disconnected';
        }
        finally {
            if (connection) {
                await connection.close().catch(() => undefined);
            }
        }
    }
    async checkRedis() {
        const url = this.configService.get('REDIS_URL');
        if (!url) {
            return 'disconnected';
        }
        const client = new ioredis_1.default(url, {
            lazyConnect: true,
            connectTimeout: 2000,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null,
        });
        client.on('error', () => undefined);
        try {
            await client.connect();
            await client.ping();
            return 'connected';
        }
        catch {
            return 'disconnected';
        }
        finally {
            await client.quit().catch(() => client.disconnect());
        }
    }
    async checkRabbitMq() {
        const url = this.configService.get('RABBITMQ_URL');
        if (!url) {
            return 'disconnected';
        }
        let connection;
        try {
            connection = await amqp.connect(url, { timeout: 2000 });
            return 'connected';
        }
        catch {
            return 'disconnected';
        }
        finally {
            if (connection) {
                await connection.close().catch(() => undefined);
            }
        }
    }
    async checkElasticsearch() {
        const node = this.configService.get('ELASTICSEARCH_URL');
        if (!node) {
            return 'disconnected';
        }
        const client = new elasticsearch_1.Client({
            node,
            maxRetries: 0,
            requestTimeout: 2000,
        });
        try {
            await client.ping();
            return 'connected';
        }
        catch {
            return 'disconnected';
        }
    }
    async withTimeout(promise) {
        return Promise.race([
            promise,
            new Promise((resolve) => setTimeout(() => resolve('disconnected'), 3000)),
        ]);
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HealthService);
//# sourceMappingURL=health.service.js.map