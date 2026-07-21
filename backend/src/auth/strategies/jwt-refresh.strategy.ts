import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { JwtPayload } from '../types/jwt-payload.type';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    const publicKey = Buffer.from(configService.get<string>('JWT_PUBLIC_KEY', ''), 'base64').toString(
      'utf8',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: publicKey,
      passReqToCallback: true,
    });
  }

  async validate(_: Request, payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.userModel.findOne({ userId: payload.sub }).lean().exec();
    if (!user || user.account_status !== 'active') {
      throw new UnauthorizedException('User account is locked or suspended.');
    }
    return payload;
  }
}
