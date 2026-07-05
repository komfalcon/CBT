import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

type NotificationPayload = {
  email: string;
  fullName: string;
  token: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly configService: ConfigService) {}

  async queueEmailVerification(payload: NotificationPayload): Promise<void> {
    await this.publishToQueue('notifications.email.verification', payload);
  }

  async queuePasswordReset(payload: NotificationPayload): Promise<void> {
    await this.publishToQueue('notifications.email.password_reset', payload);
  }

  private async publishToQueue(queueName: string, payload: NotificationPayload): Promise<void> {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');
    if (!rabbitUrl) {
      this.logger.warn('RABBITMQ_URL is not configured; notification was not queued.');
      return;
    }

    let connection: amqp.ChannelModel | undefined;
    let channel: amqp.Channel | undefined;

    try {
      connection = await amqp.connect(rabbitUrl, { timeout: 2000 });
      connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
      });
      channel = await connection.createChannel();
      await channel.assertQueue(queueName, { durable: true });
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), { persistent: true });
    } catch (error) {
      this.logger.error(`Failed to publish to queue ${queueName}`, error as Error);
    } finally {
      await channel?.close().catch(() => undefined);
      await connection?.close().catch(() => undefined);
    }
  }
}
