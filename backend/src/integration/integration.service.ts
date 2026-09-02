import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CreateHandoffDto, LearningEventDto } from './handoff.dto';
import { DRIZZLE } from '../db/database.module';
import * as schema from '../db/schema';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { eq, and, gt } from 'drizzle-orm';

const LIBRARY_ORIGIN = process.env.LIBRARY_ORIGIN || 'https://library.aurikrex.tech';
const ALLOWED_RETURN_ORIGINS = [
  process.env.CBT_ORIGIN || 'https://cbt.aurikrex.tech',
  'http://localhost:5173',
];

@Injectable()
export class IntegrationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getPrivateKey(): string {
    return Buffer.from(this.configService.get<string>('JWT_PRIVATE_KEY', ''), 'base64').toString('utf8');
  }

  private getPublicKey(): string {
    return Buffer.from(this.configService.get<string>('JWT_PUBLIC_KEY', ''), 'base64').toString('utf8');
  }

  private safeReturnUrl(candidate?: string): string {
    if (!candidate) return `${ALLOWED_RETURN_ORIGINS[0]}/dashboard`;
    try {
      const parsed = new URL(candidate);
      if (ALLOWED_RETURN_ORIGINS.includes(parsed.origin)) return parsed.toString();
    } catch {
      // Fall through to the safe default.
    }
    return `${ALLOWED_RETURN_ORIGINS[0]}/dashboard`;
  }

  private async signHandoff(payload: Record<string, unknown>): Promise<string> {
    return this.jwtService.signAsync(payload, {
      algorithm: 'RS256',
      privateKey: this.getPrivateKey(),
      audience: 'library',
      issuer: 'aurikrex-cbt',
      expiresIn: '60s',
    });
  }

  async createHandoff(userId: string, dto: CreateHandoffDto) {
    const [user] = await this.db.select().from(schema.users).where(
      and(eq(schema.users.id, userId), eq(schema.users.account_status, 'active'))
    ).limit(1);
    
    if (!user) throw new UnauthorizedException('User not found or inactive.');
    if (dto.audience !== 'library') throw new BadRequestException('Only Library handoffs are enabled in this slice.');

    const jti = randomUUID();
    const state = randomUUID();
    const expiresAt = new Date(Date.now() + 60_000);
    const nextPath = dto.nextPath || (dto.subjectId && dto.topicId
      ? `/subject/${encodeURIComponent(dto.subjectId)}/topic/${encodeURIComponent(dto.topicId)}`
      : '/');

    await this.db.insert(schema.handoffs).values({
      jti,
      userId,
      audience: dto.audience,
      scope: dto.scope.length ? dto.scope : ['profile', 'topic_context', 'return_context'],
      returnUrl: this.safeReturnUrl(dto.returnUrl),
      nextPath,
      expiresAt,
      state,
    });

    const handoff = await this.signHandoff({
      sub: userId,
      userId,
      email: user.email,
      role: user.role || 'student',
      tokenType: 'sso',
      scope: dto.scope.length ? dto.scope : ['profile', 'topic_context', 'return_context'],
      jti,
      state,
      subjectId: dto.subjectId,
      topicId: dto.topicId,
      conceptId: dto.conceptId,
      nextPath,
      returnUrl: this.safeReturnUrl(dto.returnUrl),
    });

    return { handoff, expiresAt: expiresAt.toISOString(), nextPath };
  }

  async exchangeHandoff(token: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        algorithms: ['RS256'],
        publicKey: this.getPublicKey(),
        audience: 'library',
        issuer: 'aurikrex-cbt',
      });
    } catch {
      throw new UnauthorizedException('Unable to complete handoff.');
    }

    const [handoff] = await this.db.update(schema.handoffs).set({ exchanged: true }).where(
      and(
        eq(schema.handoffs.jti, payload.jti),
        eq(schema.handoffs.audience, 'library'),
        eq(schema.handoffs.exchanged, false),
        gt(schema.handoffs.expiresAt, new Date())
      )
    ).returning();

    if (!handoff) throw new UnauthorizedException('Unable to complete handoff.');

    const sessionToken = await this.jwtService.signAsync({
      sub: handoff.userId,
      userId: handoff.userId,
      tokenType: 'integration_session',
      scope: handoff.scope,
      state: handoff.state,
    }, {
      algorithm: 'RS256',
      privateKey: this.getPrivateKey(),
      audience: 'library',
      issuer: 'aurikrex-cbt',
      expiresIn: '30m',
    });

    return {
      sessionToken,
      session: {
        userId: handoff.userId,
        audience: handoff.audience,
        scope: handoff.scope,
        state: handoff.state,
        expiresAt: handoff.expiresAt,
      },
      context: {
        subjectId: payload.subjectId,
        topicId: payload.topicId,
        conceptId: payload.conceptId,
        nextPath: handoff.nextPath,
        returnUrl: handoff.returnUrl,
      },
    };
  }

  async resolveTopic(subjectId: string, topicId: string) {
    const normalizedTopic = topicId.trim().toLowerCase().replace(/\s+/g, '-');
    return {
      subjectId,
      topicId: `${subjectId}.${normalizedTopic}`,
      libraryTarget: {
        bookId: `${subjectId}-volume-01`,
        pageId: normalizedTopic,
      },
      cbtTarget: { filter: `${subjectId}.${normalizedTopic}` },
      version: 1,
    };
  }

  async verifyIntegrationSession(token: string): Promise<string> {
    try {
      const payload: any = await this.jwtService.verifyAsync(token, {
        algorithms: ['RS256'],
        publicKey: this.getPublicKey(),
        audience: 'library',
        issuer: 'aurikrex-cbt',
      });
      if (payload.tokenType !== 'integration_session' || !payload.sub) throw new Error('invalid');
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid integration session.');
    }
  }

  async ingestEvent(userId: string, dto: LearningEventDto) {
    const key = `integration:event:${dto.eventId}`;
    
    const [existing] = await this.db.select().from(schema.integration_learning_events)
      .where(eq(schema.integration_learning_events.eventId, dto.eventId)).limit(1);
      
    if (existing) return { accepted: true, duplicate: true, eventId: dto.eventId };
    
    await this.db.insert(schema.integration_learning_events).values({ 
      eventId: dto.eventId,
      userId,
      occurredAt: dto.occurredAt || new Date().toISOString(),
      createdAt: new Date(),
      idempotencyKey: key,
      data: dto
    });
    
    return { accepted: true, duplicate: false, eventId: dto.eventId };
  }
}
