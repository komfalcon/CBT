import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { createHash, randomBytes } from 'crypto';
import { DRIZZLE } from '../../db/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateAurikrexId } from '../../users/utils';

@Injectable()
export class SsoService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateClient(clientId: string, redirectUri?: string) {
    const clients = await this.db
      .select()
      .from(schema.ssoClients)
      .where(eq(schema.ssoClients.client_id, clientId))
      .limit(1);

    if (!clients.length) {
      // Default auto-registered clients for ecosystem
      if (['aurikrex_library', 'aurikrex_bytes', 'aurikrex_cbt'].includes(clientId)) {
        return {
          client_id: clientId,
          client_name: clientId === 'aurikrex_library' ? 'Aurikrex Library' : clientId === 'aurikrex_bytes' ? 'Aurikrex Bytes' : 'Aurikrex CBT',
          redirect_uris: ['https://library.aurikrex.com/sso/callback', 'https://bytes.aurikrex.com/sso/callback', 'https://cbt.aurikrex.com/sso/callback', 'http://localhost:5173/sso/callback', 'http://localhost:5174/sso/callback'],
          allowed_scopes: ['openid', 'profile', 'email'],
        };
      }
      throw new NotFoundException(`SSO Client '${clientId}' not found`);
    }

    const client = clients[0];
    if (redirectUri && Array.isArray(client.redirect_uris)) {
      const allowed = (client.redirect_uris as string[]).some((uri) => uri === redirectUri || redirectUri.startsWith(uri));
      if (!allowed) {
        throw new BadRequestException(`Redirect URI '${redirectUri}' is not authorized for client '${clientId}'`);
      }
    }
    return client;
  }

  async generateAuthCode(params: {
    clientId: string;
    userId: string;
    aurikrexId: string;
    redirectUri: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    scope?: string;
  }) {
    await this.validateClient(params.clientId, params.redirectUri);

    const code = `ac_${randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes lifetime

    await this.db.insert(schema.ssoCodes).values({
      id: uuidv4(),
      code,
      client_id: params.clientId,
      aurikrex_id: params.aurikrexId,
      code_challenge: params.codeChallenge,
      code_challenge_method: params.codeChallengeMethod || 'S256',
      redirect_uri: params.redirectUri,
      scope: params.scope || 'openid profile email',
      expires_at: expiresAt,
    });

    return code;
  }

  async exchangeToken(params: {
    clientId: string;
    code: string;
    codeVerifier?: string;
    redirectUri: string;
  }) {
    const records = await this.db
      .select()
      .from(schema.ssoCodes)
      .where(and(eq(schema.ssoCodes.code, params.code), eq(schema.ssoCodes.client_id, params.clientId)))
      .limit(1);

    if (!records.length) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }

    const record = records[0];
    if (new Date() > record.expires_at) {
      await this.db.delete(schema.ssoCodes).where(eq(schema.ssoCodes.id, record.id));
      throw new UnauthorizedException('Authorization code has expired');
    }

    // Verify PKCE if present
    if (record.code_challenge) {
      if (!params.codeVerifier) {
        throw new BadRequestException('code_verifier is required for PKCE code exchange');
      }
      let calculatedChallenge = params.codeVerifier;
      if (record.code_challenge_method === 'S256') {
        calculatedChallenge = createHash('sha256').update(params.codeVerifier).digest('base64url');
      }
      if (calculatedChallenge !== record.code_challenge) {
        throw new UnauthorizedException('PKCE code_verifier verification failed');
      }
    }

    // Single-use code: Delete code after exchange
    await this.db.delete(schema.ssoCodes).where(eq(schema.ssoCodes.id, record.id));

    // Fetch User Profile
    const users = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.aurikrex_id, record.aurikrex_id))
      .limit(1);

    if (!users.length) {
      throw new NotFoundException('Associated Aurikrex User not found');
    }

    const user = users[0];
    const payload = {
      sub: user.aurikrex_id,
      aurikrex_id: user.aurikrex_id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      aud: params.clientId,
      iss: 'https://cbt.aurikrex.com',
      scope: record.scope,
    };

    const secret = this.configService.get<string>('JWT_SECRET') || 'aurikrex-sso-secret-key-2026';
    const accessToken = this.jwtService.sign(payload, { secret, expiresIn: '24h' });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 86400,
      aurikrex_id: user.aurikrex_id,
      user: {
        aurikrex_id: user.aurikrex_id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getUserInfo(aurikrexId: string) {
    const users = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.aurikrex_id, aurikrexId))
      .limit(1);

    if (!users.length) {
      throw new NotFoundException('Aurikrex User not found');
    }

    const user = users[0];
    return {
      sub: user.aurikrex_id,
      aurikrex_id: user.aurikrex_id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profile_photo_url: user.profile_photo_url,
    };
  }

  async ensureAurikrexId(userId: string): Promise<string> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!users.length) throw new NotFoundException('User not found');
    const user = users[0];
    if (user.aurikrex_id) return user.aurikrex_id;

    const newAurikrexId = generateAurikrexId();
    await this.db
      .update(schema.users)
      .set({ aurikrex_id: newAurikrexId, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    return newAurikrexId;
  }
}
