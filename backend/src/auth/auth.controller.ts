import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UserDocument } from '../users/schemas/user.schema';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { CbtKeyLoginDto } from './dto/cbt-key-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './types/jwt-payload.type';

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
  login(
    @Req() req: Request & { user: UserDocument },
    @Body() _: LoginDto,
    @Ip() ipAddress?: string,
  ) {
    return this.authService.completeLogin(req.user, ipAddress);
  }

  @Post('verify-otp')
  @HttpCode(200)
  verifyOtp(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) verifyOtpDto: VerifyOtpDto,
    @Ip() ipAddress?: string,
  ) {
    return this.authService.verifyOtp(verifyOtpDto.tempToken, verifyOtpDto.otp, ipAddress);
  }

  @Post('refresh')
  @HttpCode(200)
  refreshToken(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
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
  loginGoogle(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) googleLoginDto: GoogleLoginDto,
    @Ip() ipAddress?: string,
  ) {
    return this.authService.loginWithGoogle(googleLoginDto.credential, ipAddress);
  }

  @Post('login/cbt-key')
  @HttpCode(200)
  loginCbtKey(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) cbtKeyLoginDto: CbtKeyLoginDto,
    @Ip() ipAddress?: string,
  ) {
    return this.authService.loginWithCbtKey(cbtKeyLoginDto.cbtKey, ipAddress);
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
