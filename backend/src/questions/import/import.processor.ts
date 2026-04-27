import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { ImportService } from './import.service';

type ImportMessage = {
  importId: string;
  actorUserId: string;
  columnMapping: Record<string, string>;
};

@Injectable()
export class ImportProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImportProcessor.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  constructor(
    private readonly configService: ConfigService,
    private readonly importService: ImportService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');
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
          const payload = JSON.parse(msg.content.toString()) as ImportMessage;
          await this.importService.commitImport(
            {
              importId: payload.importId,
              columnMapping: payload.columnMapping,
            },
            payload.actorUserId,
          );
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error('Failed to process import queue message', error as Error);
          this.channel.nack(msg, false, false);
        }
      });
    } catch (error) {
      this.logger.warn(`Unable to start import queue consumer: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
