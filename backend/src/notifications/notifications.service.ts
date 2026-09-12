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

  /**
   * Send a push notification to OneSignal subscribers.
   */
  async sendPushNotification(title: string, message: string, userIds?: string[]): Promise<boolean> {
    const appId = this.configService.get<string>('ONESIGNAL_APP_ID') || 'b7622f37-8ca3-4304-922c-69438cc14d67';
    const apiKey = this.configService.get<string>('ONESIGNAL_REST_API_KEY') || 'os_v2_app_w5rc6n4munbqjermnfbyzqknm543pnx3nzeepqvnd2pl4nkqooz2otx7rgjtmd62epkwwfd2xxmrr6w25y52tnpdmswszkjsxvbtxly';

    if (!appId || !apiKey) {
      this.logger.warn('OneSignal credentials missing; cannot send push notification.');
      return false;
    }

    try {
      const payload: any = {
        app_id: appId,
        headings: { en: title },
        contents: { en: message },
      };

      if (userIds && userIds.length > 0) {
        payload.include_external_user_ids = userIds;
      } else {
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
    } catch (error) {
      this.logger.error('Failed to send OneSignal push notification', error as Error);
      return false;
    }
  }
}
