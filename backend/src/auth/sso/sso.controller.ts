import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SsoService } from './sso.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller(['auth/sso', 'api/auth/sso', 'api/v1/auth/sso'])
export class SsoController {
  constructor(
    private readonly ssoService: SsoService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('authorize')
  async authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('response_type') responseType: string,
    @Query('code_challenge') codeChallenge: string,
    @Query('code_challenge_method') codeChallengeMethod: string,
    @Query('state') state: string,
    @Query('scope') scope: string,
    @Query('token') queryToken: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.ssoService.validateClient(clientId, redirectUri);

    // Check if user is logged into CBT backend via query token, JWT cookie, or Authorization header
    let userPayload: any = null;
    try {
      const cookieHeader = String(req.headers.cookie || '');
      const token =
        queryToken ||
        cookieHeader
          .split(';')
          .map((p) => p.trim())
          .find((p) => p.startsWith('cbt_access_token='))
          ?.slice(17) ||
        String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');

      if (token) {
        const publicKeyB64 = this.configService.get<string>('JWT_PUBLIC_KEY', '');
        const publicKey = publicKeyB64 ? Buffer.from(publicKeyB64, 'base64').toString('utf8') : null;
        const secret = this.configService.get<string>('JWT_SECRET') || 'aurikrex-sso-secret-key-2026';

        if (publicKey) {
          try {
            userPayload = this.jwtService.verify(token, { secret: publicKey, algorithms: ['RS256'] });
          } catch {
            try {
              userPayload = this.jwtService.verify(token, { secret, algorithms: ['HS256'] });
            } catch {
              userPayload = null;
            }
          }
        } else {
          try {
            userPayload = this.jwtService.verify(token, { secret });
          } catch {
            userPayload = null;
          }
        }
      }
    } catch {
      // Session expired or missing
    }

    const userId = userPayload?.sub || userPayload?.id;

    if (!userPayload || !userId) {
      // Redirect user to CBT Frontend Auth page with return parameter to complete SSO login
      const frontendUrl = (process.env.CBT_ORIGIN || process.env.FRONTEND_URL || 'https://cbt.aurikrex.com').replace(/\/+$/, '');
      const loginReturnUrl = encodeURIComponent(req.originalUrl || req.url);
      return res.redirect(`${frontendUrl}/auth?returnUrl=${loginReturnUrl}`);
    }

    const aurikrexId = userPayload.aurikrex_id || (await this.ssoService.ensureAurikrexId(userId));
    const code = await this.ssoService.generateAuthCode({
      clientId,
      userId,
      aurikrexId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      scope,
    });

    const targetUrl = new URL(redirectUri);
    targetUrl.searchParams.set('code', code);
    if (state) targetUrl.searchParams.set('state', state);

    return res.redirect(targetUrl.toString());
  }

  @Post('token')
  async token(
    @Body('client_id') clientId: string,
    @Body('code') code: string,
    @Body('code_verifier') codeVerifier: string,
    @Body('redirect_uri') redirectUri: string,
  ) {
    return this.ssoService.exchangeToken({
      clientId,
      code,
      codeVerifier,
      redirectUri,
    });
  }

  @Get('userinfo')
  async userinfo(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const secret = this.configService.get<string>('JWT_SECRET') || 'aurikrex-sso-secret-key-2026';
    const payload = this.jwtService.verify(token, { secret });
    return this.ssoService.getUserInfo(payload.aurikrex_id || payload.sub);
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('cbt_access_token');
    return res.status(200).json({ message: 'Single Logout completed successfully' });
  }
}
