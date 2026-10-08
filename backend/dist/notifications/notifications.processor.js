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
var NotificationsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsProcessor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = __importStar(require("amqplib"));
const resend_1 = require("resend");
let NotificationsProcessor = NotificationsProcessor_1 = class NotificationsProcessor {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationsProcessor_1.name);
    }
    async onModuleInit() {
        const rabbitUrl = this.configService.get('RABBITMQ_URL');
        if (!rabbitUrl) {
            this.logger.warn('RABBITMQ_URL is not configured. Notifications processor skipped.');
            return;
        }
        const apiKey = this.configService.get('RESEND_API_KEY');
        if (apiKey) {
            this.resend = new resend_1.Resend(apiKey);
            this.logger.log('Resend API Key configured.');
        }
        else {
            this.logger.warn('RESEND_API_KEY is not configured. Emails will be logged to console.');
        }
        try {
            this.connection = await amqp.connect(rabbitUrl, { timeout: 2000 });
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue('notifications.email.verification', { durable: true });
            await this.channel.consume('notifications.email.verification', async (msg) => {
                if (!msg || !this.channel)
                    return;
                try {
                    const payload = JSON.parse(msg.content.toString());
                    await this.sendEmail(payload.email, 'Verify your email address - Aurikrex Exam Arena', `Hello ${payload.fullName},\n\nYour verification code is: ${payload.token}\n\nThis code will expire in 24 hours.`, `<strong>Hello ${payload.fullName}</strong>,<br><br>Your verification code is: <strong>${payload.token}</strong><br><br>This code will expire in 24 hours.`);
                    this.channel.ack(msg);
                }
                catch (error) {
                    this.logger.error('Failed to process verification email', error);
                    this.channel.nack(msg, false, false);
                }
            });
            await this.channel.assertQueue('notifications.email.password_reset', { durable: true });
            await this.channel.consume('notifications.email.password_reset', async (msg) => {
                if (!msg || !this.channel)
                    return;
                try {
                    const payload = JSON.parse(msg.content.toString());
                    await this.sendEmail(payload.email, 'Reset your password - Aurikrex Exam Arena', `Hello ${payload.fullName},\n\nYour password reset code is: ${payload.token}\n\nThis code will expire in 1 hour.`, `<strong>Hello ${payload.fullName}</strong>,<br><br>Your password reset code is: <strong>${payload.token}</strong><br><br>This code will expire in 1 hour.`);
                    this.channel.ack(msg);
                }
                catch (error) {
                    this.logger.error('Failed to process password reset email', error);
                    this.channel.nack(msg, false, false);
                }
            });
            this.logger.log('Notifications processor successfully subscribed to queues.');
        }
        catch (error) {
            this.logger.error(`Unable to start notifications processor: ${error.message}`);
        }
    }
    async sendEmail(to, subject, text, html) {
        const fromEmail = this.configService.get('RESEND_FROM_EMAIL', 'noreply@aurikrex.com');
        if (this.resend) {
            try {
                await this.resend.emails.send({
                    from: fromEmail,
                    to,
                    subject,
                    text,
                    html,
                });
                this.logger.log(`Email successfully sent to ${to} via Resend.`);
            }
            catch (error) {
                this.logger.error(`Failed to send email to ${to}`, error);
                throw error;
            }
        }
        else {
            this.logger.log(`[DEVELOPMENT EMAIL SENDER - CONSOLE ONLY]\nTo: ${to}\nSubject: ${subject}\nBody: ${text}`);
        }
    }
    async onModuleDestroy() {
        await this.channel?.close().catch(() => undefined);
        await this.connection?.close().catch(() => undefined);
    }
};
exports.NotificationsProcessor = NotificationsProcessor;
exports.NotificationsProcessor = NotificationsProcessor = NotificationsProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsProcessor);
//# sourceMappingURL=notifications.processor.js.map