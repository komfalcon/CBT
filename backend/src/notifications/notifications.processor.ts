import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { Resend } from 'resend';

type NotificationPayload = {
  email: string;
  fullName: string;
  token: string;
};

@Injectable()
export class NotificationsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private resend?: Resend;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');
    if (!rabbitUrl) {
      this.logger.warn('RABBITMQ_URL is not configured. Notifications processor skipped.');
      return;
    }

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend API Key configured.');
    } else {
      this.logger.warn('RESEND_API_KEY is not configured. Emails will be logged to console.');
    }

    try {
      this.connection = await amqp.connect(rabbitUrl, { timeout: 2000 });
      this.channel = await this.connection.createChannel();

      // Consume Verification Queue
      await this.channel.assertQueue('notifications.email.verification', { durable: true });
      await this.channel.consume('notifications.email.verification', async (msg) => {
        if (!msg || !this.channel) return;
        try {
          const payload = JSON.parse(msg.content.toString()) as NotificationPayload;
          await this.sendEmail(
            payload.email,
            'Verify your email address - Aurikrex Exam Arena',
            `Hello ${payload.fullName},\n\nYour verification code is: ${payload.token}\n\nThis code will expire in 24 hours.`,
            `<strong>Hello ${payload.fullName}</strong>,<br><br>Your verification code is: <strong>${payload.token}</strong><br><br>This code will expire in 24 hours.`,
          );
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Failed to process verification email', error as Error);
          this.channel.nack(msg, false, false);
        }
      });

      // Consume Password Reset Queue
      await this.channel.assertQueue('notifications.email.password_reset', { durable: true });
      await this.channel.consume('notifications.email.password_reset', async (msg) => {
        if (!msg || !this.channel) return;
        try {
          const payload = JSON.parse(msg.content.toString()) as NotificationPayload;
          await this.sendEmail(
            payload.email,
            'Reset your password - Aurikrex Exam Arena',
            `Hello ${payload.fullName},\n\nYour password reset code is: ${payload.token}\n\nThis code will expire in 1 hour.`,
            `<strong>Hello ${payload.fullName}</strong>,<br><br>Your password reset code is: <strong>${payload.token}</strong><br><br>This code will expire in 1 hour.`,
          );
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Failed to process password reset email', error as Error);
          this.channel.nack(msg, false, false);
        }
      });

      this.logger.log('Notifications processor successfully subscribed to queues.');
    } catch (error) {
      this.logger.error(`Unable to start notifications processor: ${(error as Error).message}`);
    }
  }

  private async sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL', 'noreply@aurikrex.com');

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
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}`, error as Error);
        throw error;
      }
    } else {
      this.logger.log(`[DEVELOPMENT EMAIL SENDER - CONSOLE ONLY]\nTo: ${to}\nSubject: ${subject}\nBody: ${text}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
