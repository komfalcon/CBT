import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { Resend } from 'resend';

import { renderEmailVerificationTemplate, renderPasswordResetTemplate } from './templates/email-templates';

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
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend API Key configured.');
    } else {
      this.logger.warn('RESEND_API_KEY is not configured. Emails will be logged to console.');
    }

    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');
    if (!rabbitUrl) {
      this.logger.warn('RABBITMQ_URL is not configured. Notifications processor running in direct mode.');
      return;
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
          await this.sendVerificationDirect(payload);
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
          await this.sendPasswordResetDirect(payload);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Failed to process password reset email', error as Error);
          this.channel.nack(msg, false, false);
        }
      });

      this.logger.log('Notifications processor successfully subscribed to queues.');
    } catch (error) {
      this.logger.error(`Unable to start RabbitMQ consumer: ${(error as Error).message}`);
    }
  }

  async sendVerificationDirect(payload: NotificationPayload): Promise<void> {
    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'https://cbt.aurikrex.com').replace(/\/+$/, '');
    const verificationUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(payload.email)}&code=${encodeURIComponent(payload.token)}`;
    const { text, html } = renderEmailVerificationTemplate({
      fullName: payload.fullName,
      verificationUrl,
      code: payload.token,
      senderEmail: 'info@aurikrex.com',
    });

    await this.sendEmail(
      payload.email,
      'Verify your email address - Aurikrex Exam Arena',
      text,
      html,
    );
  }

  async sendPasswordResetDirect(payload: NotificationPayload): Promise<void> {
    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'https://cbt.aurikrex.com').replace(/\/+$/, '');
    const resetUrl = `${frontendUrl}/register?tab=reset-password&email=${encodeURIComponent(payload.email)}&token=${encodeURIComponent(payload.token)}`;
    const { text, html } = renderPasswordResetTemplate({
      fullName: payload.fullName,
      resetUrl,
      code: payload.token,
      senderEmail: 'info@aurikrex.com',
    });

    await this.sendEmail(
      payload.email,
      'Reset your password - Aurikrex Exam Arena',
      text,
      html,
    );
  }

  private async sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL', 'Aurikrex <info@aurikrex.com>');

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: fromEmail,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(`Email successfully sent to ${to} from ${fromEmail} via Resend.`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}`, error as Error);
        throw error;
      }
    } else {
      this.logger.log(`[DEVELOPMENT EMAIL SENDER - CONSOLE ONLY]\nFrom: ${fromEmail}\nTo: ${to}\nSubject: ${subject}\nBody: ${text}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
