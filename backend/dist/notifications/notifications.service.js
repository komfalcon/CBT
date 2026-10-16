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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = __importStar(require("amqplib"));
const notifications_processor_1 = require("./notifications.processor");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(configService, notificationsProcessor) {
        this.configService = configService;
        this.notificationsProcessor = notificationsProcessor;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async queueEmailVerification(payload) {
        const published = await this.publishToQueue('notifications.email.verification', payload);
        if (!published) {
            await this.notificationsProcessor.sendVerificationDirect(payload).catch((err) => {
                this.logger.error('Failed direct fallback for email verification', err);
            });
        }
    }
    async queuePasswordReset(payload) {
        const published = await this.publishToQueue('notifications.email.password_reset', payload);
        if (!published) {
            await this.notificationsProcessor.sendPasswordResetDirect(payload).catch((err) => {
                this.logger.error('Failed direct fallback for password reset', err);
            });
        }
    }
    async publishToQueue(queueName, payload) {
        const rabbitUrl = this.configService.get('RABBITMQ_URL');
        if (!rabbitUrl) {
            this.logger.log('RABBITMQ_URL is not configured; sending email directly.');
            return false;
        }
        let connection;
        let channel;
        try {
            connection = await amqp.connect(rabbitUrl, { timeout: 2000 });
            connection.on('error', (err) => {
                this.logger.error('RabbitMQ connection error', err);
            });
            channel = await connection.createChannel();
            await channel.assertQueue(queueName, { durable: true });
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), { persistent: true });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to publish to queue ${queueName}`, error);
            return false;
        }
        finally {
            await channel?.close().catch(() => undefined);
            await connection?.close().catch(() => undefined);
        }
    }
    async sendPushNotification(title, message, userIds) {
        const appId = this.configService.get('ONESIGNAL_APP_ID') || 'b7622f37-8ca3-4304-922c-69438cc14d67';
        const apiKey = this.configService.get('ONESIGNAL_REST_API_KEY');
        if (!appId || !apiKey) {
            this.logger.warn('OneSignal credentials missing; cannot send push notification.');
            return false;
        }
        try {
            const payload = {
                app_id: appId,
                headings: { en: title },
                contents: { en: message },
            };
            if (userIds && userIds.length > 0) {
                payload.include_external_user_ids = userIds;
            }
            else {
                payload.included_segments = ['Subscribed Users'];
            }
            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    Authorization: `Key ${apiKey}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errText = await response.text();
                this.logger.error(`OneSignal notification failed: ${response.status} ${errText}`);
                return false;
            }
            const resData = await response.json();
            this.logger.log(`OneSignal notification sent successfully: ${JSON.stringify(resData)}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to send OneSignal push notification', error);
            return false;
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        notifications_processor_1.NotificationsProcessor])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map