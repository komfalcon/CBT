import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../db/database.module';
import { users } from '../../db/schema';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    configService: ConfigService,
    
  ) {
    const publicKey = Buffer.from(configService.get<string>('JWT_PUBLIC_KEY', ''), 'base64').toString(
      'utf8',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: publicKey,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const [user] = await this.db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user || user.account_status !== 'active') {
      throw new UnauthorizedException('User account is locked or suspended.');
    }
    return payload;
  }
}
