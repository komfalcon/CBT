import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { CbtKeyLoginDto } from './dto/cbt-key-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './types/jwt-payload.type';





const ACCESS_COOKIE = 'cbt_access_token';
const REFRESH_COOKIE = 'cbt_refresh_token';
const MFA_COOKIE = 'cbt_mfa_token';

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie || '';
  const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function cookieOptions(maxAge: number, httpOnly = true) {
  return { httpOnly, secure: true, sameSite: 'none' as const, path: '/', maxAge };
}

function setAuthCookies(res: Response, tokens: { accessToken?: string; refreshToken?: string; tempToken?: string; requiresMFA?: boolean }) {
  if (tokens.accessToken) res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(15 * 60 * 1000));
  if (tokens.refreshToken) res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
}

class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}

class MfaDto {
  @IsString()
  @IsNotEmpty()
  otp!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  register(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  verifyEmail(@Body(new ValidationPipe({ whitelist: true })) body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: Request & { user: any }, @Res({ passthrough: true }) res: Response, @Body() _: LoginDto, @Ip() ipAddress?: string) {
    const result = await this.authService.completeLogin(req.user, ipAddress);
    if (result.requiresMFA && result.tempToken) {
      res.cookie(MFA_COOKIE, result.tempToken, cookieOptions(5 * 60 * 1000));
      return { requiresMFA: true };
    }
    setAuthCookies(res, result);
    return { requiresMFA: false };
  }

  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new ValidationPipe({ whitelist: true, transform: true })) verifyOtpDto: VerifyOtpDto, @Ip() ipAddress?: string) {
    const tempToken = readCookie(req, MFA_COOKIE);
    if (!tempToken) throw new UnauthorizedException('MFA session has expired. Please sign in again.');
    const result = await this.authService.verifyOtp(tempToken, verifyOtpDto.otp, ipAddress);
    res.clearCookie(MFA_COOKIE, { path: '/' });
    setAuthCookies(res, result);
    return { requiresMFA: false };
  }

  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = readCookie(req, REFRESH_COOKIE);
    if (!refreshToken) throw new UnauthorizedException('Refresh session has expired. Please sign in again.');
    const result = await this.authService.refreshTokens(refreshToken);
    setAuthCookies(res, result);
    return { refreshed: true };
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.code, resetPasswordDto.password);
  }

  @Post('google')
  @HttpCode(200)
  async loginGoogle(@Res({ passthrough: true }) res: Response, @Body(new ValidationPipe({ whitelist: true, transform: true })) googleLoginDto: GoogleLoginDto, @Ip() ipAddress?: string) {
    const result = await this.authService.loginWithGoogle(googleLoginDto.credential, ipAddress);
    if (result.requiresMFA && result.tempToken) {
      res.cookie(MFA_COOKIE, result.tempToken, cookieOptions(5 * 60 * 1000));
      return { requiresMFA: true };
    }
    setAuthCookies(res, result);
    return { requiresMFA: false };
  }

  @Post('login/cbt-key')
  @HttpCode(200)
  async loginCbtKey(@Res({ passthrough: true }) res: Response, @Body(new ValidationPipe({ whitelist: true, transform: true })) cbtKeyLoginDto: CbtKeyLoginDto, @Ip() ipAddress?: string) {
    const result = await this.authService.loginWithCbtKey(cbtKeyLoginDto.cbtKey, ipAddress);
    setAuthCookies(res, result);
    return { requiresMFA: false };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(MFA_COOKIE, { path: '/' });
    return { message: 'Signed out.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.getProfile(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ValidationPipe({ whitelist: true, transform: true })) updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Post('mfa/generate')
  @UseGuards(JwtAuthGuard)
  generateMfaSecret(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.generateMfaSecret(req.user.sub);
  }

  @Get('sso-token')
  @UseGuards(JwtAuthGuard)
  getSsoToken(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.generateSsoToken(req.user.sub);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  enableMfa(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ValidationPipe({ whitelist: true })) body: MfaDto,
  ) {
    return this.authService.enableMfa(req.user.sub, body.otp);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  disableMfa(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ValidationPipe({ whitelist: true })) body: MfaDto,
  ) {
    return this.authService.disableMfa(req.user.sub, body.otp);
  }

}
