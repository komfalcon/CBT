import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CentralService {
  private readonly logger = new Logger(CentralService.name);
  private jwksCache: { pem: string; expiresAt: number } | null = null;

  constructor(private readonly configService: ConfigService) {}

  private get centralUrl(): string {
    return (
      this.configService.get<string>('CENTRAL_API_URL') ||
      'https://aurikrex-central.pxxl.click'
    ).replace(/\/+$/, '');
  }

  private get s2sSecret(): string {
    return (
      this.configService.get<string>('AURIKREX_CENTRAL_S2S_SECRET') || ''
    );
  }


  /**
   * Fetch and cache Public Key from Central JWKS endpoint
   */
  public async getPublicKey(): Promise<string> {
    if (this.jwksCache && Date.now() < this.jwksCache.expiresAt) {
      return this.jwksCache.pem;
    }

    try {
      const response = await axios.get(`${this.centralUrl}/.well-known/jwks.json`, {
        timeout: 5000,
      });

      const key = response.data?.keys?.[0];
      if (!key || !key.pem) {
        throw new Error('Invalid JWKS response structure from Central');
      }

      // Cache public key for 1 hour
      this.jwksCache = {
        pem: key.pem,
        expiresAt: Date.now() + 60 * 60 * 1000,
      };

      return key.pem;
    } catch (err: any) {
      this.logger.error(`Failed to fetch JWKS public key from Central: ${err?.message || err}`);
      throw new UnauthorizedException('Central Auth JWKS verification unavailable');
    }
  }

  /**
   * Statelessly verify RS256 signed Access Token from Central
   */
  public async verifyCentralToken(token: string): Promise<any> {
    const publicKey = await this.getPublicKey();
    try {
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });
      return decoded;
    } catch (err: any) {
      throw new UnauthorizedException(`Invalid token signature: ${err?.message || err}`);
    }
  }

  private lastCentralFailure = 0;

  /**
   * Server-to-Server AuriCoin Balance Check
   */
  public async getBalance(userIdOrAurikrexId: string) {
    // If Central is currently unreachable or DNS is failing, use fast fallback for 30s
    if (Date.now() - this.lastCentralFailure < 30000) {
      return null;
    }

    try {
      const response = await axios.get(
        `${this.centralUrl}/api/v1/coins/balance?userId=${encodeURIComponent(userIdOrAurikrexId)}`,
        {
          headers: {
            'X-Central-Api-Key': this.s2sSecret,
            'Content-Type': 'application/json',
          },
          timeout: 2500,
        },
      );
      return response.data;
    } catch (err: any) {
      this.lastCentralFailure = Date.now();
      this.logger.warn(`Failed to fetch AuriCoin balance for user ${userIdOrAurikrexId}: ${err?.message}`);
      return null;
    }
  }

  /**
   * Server-to-Server AuriCoin Deduction
   * Prices are set strictly server-side per feature in Central Engine.
   */
  public async deductCoins(params: {
    userId: string;
    featureName: string;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await axios.post(
        `${this.centralUrl}/api/v1/coins/deduct`,
        {
          userId: params.userId,
          featureName: params.featureName,
          appId: 'aurikrex_cbt',
          idempotencyKey: params.idempotencyKey || `cbt_${params.featureName}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          metadata: params.metadata || {},
        },
        {
          headers: {
            'X-Central-Api-Key': this.s2sSecret,
            'Content-Type': 'application/json',
          },
          timeout: 7000,
        },
      );

      return response.data;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Coin deduction failed';
      this.logger.warn(`AuriCoin deduction failed for user ${params.userId}: ${errorMsg}`);
      throw new BadRequestException(`AuriCoin deduction failed: ${errorMsg}`);
    }
  }

  /**
   * Server-to-Server AuriCoin Refund (called if downstream AI execution fails)
   */
  public async refundCoins(params: { idempotencyKey: string; reason?: string }) {
    try {
      const response = await axios.post(
        `${this.centralUrl}/api/v1/coins/refund`,
        {
          idempotencyKey: params.idempotencyKey,
          reason: params.reason || 'AI call failed',
        },
        {
          headers: {
            'X-Central-Api-Key': this.s2sSecret,
            'Content-Type': 'application/json',
          },
          timeout: 7000,
        },
      );

      return response.data;
    } catch (err: any) {
      this.logger.error(`AuriCoin refund failed for key ${params.idempotencyKey}: ${err?.message}`);
      return null;
    }
  }

  /**
   * Search Shared Knowledge Base across ecosystem
   */
  public async searchKnowledge(queryText: string, subject?: string, limit: number = 5) {
    try {
      const response = await axios.post(
        `${this.centralUrl}/api/v1/knowledge/search`,
        {
          queryText,
          subject,
          limit,
        },
        {
          headers: {
            'X-Central-Api-Key': this.s2sSecret,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        },
      );

      return response.data;
    } catch (err: any) {
      this.logger.error(`Shared Knowledge search failed: ${err?.message}`);
      return [];
    }
  }

  /**
   * Ingest study note or question into Shared Knowledge Base
   */
  public async ingestKnowledge(data: {
    title: string;
    content: string;
    subject: string;
    topic?: string;
    sourceId?: string;
    authorUserId?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.centralUrl}/api/v1/knowledge/ingest`,
        {
          ...data,
          sourceApp: 'aurikrex_cbt',
        },
        {
          headers: {
            'X-Central-Api-Key': this.s2sSecret,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      return response.data;
    } catch (err: any) {
      this.logger.error(`Shared Knowledge ingestion failed: ${err?.message}`);
      return null;
    }
  }
}
