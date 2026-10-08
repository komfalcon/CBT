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
var ImportProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportProcessor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = __importStar(require("amqplib"));
const import_service_1 = require("./import.service");
let ImportProcessor = ImportProcessor_1 = class ImportProcessor {
    constructor(configService, importService) {
        this.configService = configService;
        this.importService = importService;
        this.logger = new common_1.Logger(ImportProcessor_1.name);
    }
    async onModuleInit() {
        const rabbitUrl = this.configService.get('RABBITMQ_URL');
        if (!rabbitUrl) {
            return;
        }
        try {
            this.connection = await amqp.connect(rabbitUrl, { timeout: 2000 });
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue('questions.import.commit', { durable: true });
            await this.channel.consume('questions.import.commit', async (msg) => {
                if (!msg || !this.channel) {
                    return;
                }
                try {
                    const payload = JSON.parse(msg.content.toString());
                    await this.importService.commitImport({
                        importId: payload.importId,
                        columnMapping: payload.columnMapping,
                    }, payload.actorUserId);
                    this.channel.ack(msg);
                }
                catch (error) {
                    this.logger.error('Failed to process import queue message', error);
                    this.channel.nack(msg, false, false);
                }
            });
        }
        catch (error) {
            this.logger.warn(`Unable to start import queue consumer: ${error.message}`);
        }
    }
    async onModuleDestroy() {
        await this.channel?.close().catch(() => undefined);
        await this.connection?.close().catch(() => undefined);
    }
};
exports.ImportProcessor = ImportProcessor;
exports.ImportProcessor = ImportProcessor = ImportProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        import_service_1.ImportService])
], ImportProcessor);
//# sourceMappingURL=import.processor.js.map