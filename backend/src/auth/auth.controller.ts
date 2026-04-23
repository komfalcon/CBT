import {
  Body,
  Controller,
  HttpCode,
  Ip,
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

class VerifyEmailDto {
  token!: string;
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
    return this.authService.verifyEmail(body.token);
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  login(@Req() req: Request & { user: unknown }, @Body() _: LoginDto, @Ip() ipAddress?: string) {
    return this.authService.completeLogin(req.user as never, ipAddress);
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
}
