import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createConnection } from 'mongoose';
import Redis from 'ioredis';
import * as amqp from 'amqplib';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';

type ServiceState = 'connected' | 'disconnected';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  services: {
    mongodb: ServiceState;
    redis: ServiceState;
    rabbitmq: ServiceState;
    elasticsearch: ServiceState;
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  async check(): Promise<HealthStatus> {
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

  private async checkMongo(): Promise<ServiceState> {
    const uri = this.configService.get<string>('MONGODB_URI');
    if (!uri) {
      return 'disconnected';
    }

    let connection: Awaited<ReturnType<typeof createConnection>> | undefined;
    try {
      connection = await createConnection(uri, {
        serverSelectionTimeoutMS: 2000,
      }).asPromise();
      if (!connection.db) {
        return 'disconnected';
      }
      await connection.db.admin().ping();
      return 'connected';
    } catch {
      return 'disconnected';
    } finally {
      if (connection) {
        await connection.close().catch(() => undefined);
      }
    }
  }

  private async checkRedis(): Promise<ServiceState> {
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      return 'disconnected';
    }

    const client = new Redis(url, {
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
    } catch {
      return 'disconnected';
    } finally {
      await client.quit().catch(() => client.disconnect());
    }
  }

  private async checkRabbitMq(): Promise<ServiceState> {
    const url = this.configService.get<string>('RABBITMQ_URL');
    if (!url) {
      return 'disconnected';
    }

    let connection: amqp.ChannelModel | undefined;
    try {
      connection = await amqp.connect(url, { timeout: 2000 });
      return 'connected';
    } catch {
      return 'disconnected';
    } finally {
      if (connection) {
        await connection.close().catch(() => undefined);
      }
    }
  }

  private async checkElasticsearch(): Promise<ServiceState> {
    const node = this.configService.get<string>('ELASTICSEARCH_URL');
    if (!node) {
      return 'disconnected';
    }

    const client = new ElasticsearchClient({
      node,
      maxRetries: 0,
      requestTimeout: 2000,
    });

    try {
      await client.ping();
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private async withTimeout(promise: Promise<ServiceState>): Promise<ServiceState> {
    return Promise.race([
      promise,
      new Promise<ServiceState>((resolve) =>
        setTimeout(() => resolve('disconnected'), 3000),
      ),
    ]);
  }
}
