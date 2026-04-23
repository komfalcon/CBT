import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import { createHmac } from 'crypto';
import { z } from 'zod';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';

export function calculateLockoutDurationMs(failedAttempts: number): number {
  if (failedAttempts < 5) {
    return 0;
  }

  if (failedAttempts === 5) {
    return 60_000;
  }

  if (failedAttempts === 6) {
    return 5 * 60_000;
  }

  if (failedAttempts === 7) {
    return 15 * 60_000;
  }

  return 60 * 60_000;
}

export function getLockoutRemainingSeconds(lockoutUntil?: Date): number {
  if (!lockoutUntil) {
    return 0;
  }

  const remainingMs = lockoutUntil.getTime() - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

const registerValidationSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number')
    .regex(/[^A-Za-z0-9]/, 'Password must include a special character'),
  role: z.enum(['super_admin', 'admin', 'examiner', 'proctor', 'student']).optional(),
});

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(payload: RegisterDto) {
    const parsed = registerValidationSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const existing = await this.userModel.findOne({ email: normalizedEmail }).lean().exec();
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await argon2.hash(parsed.data.password, {
      type: argon2.argon2id,
      memoryCost: 65_536,
      timeCost: 3,
      parallelism: 2,
    });

    const user = await this.userModel.create({
      fullName: parsed.data.fullName,
      email: normalizedEmail,
      phone: parsed.data.phone,
      passwordHash,
      role: parsed.data.role ?? 'student',
      account_status: 'pending_verification',
    });

    const verificationToken = await this.signToken(
      {
        sub: user.userId,
        email: user.email,
        role: user.role,
        tokenType: 'email_verification',
        purpose: 'email_verification',
      },
      '24h',
    );

    await this.notificationsService.queueEmailVerification({
      email: user.email,
      fullName: user.fullName,
      token: verificationToken,
    });

    return { message: 'Registration successful. Check email to verify.' };
  }

  async verifyEmail(token: string) {
    const payload = await this.verifyToken(token);
    if (payload.purpose !== 'email_verification') {
      throw new BadRequestException('Invalid verification token.');
    }

    const user = await this.userModel.findOne({ userId: payload.sub }).exec();
    if (!user) {
      throw new BadRequestException('User not found for verification token.');
    }

    user.account_status = 'active';
    await user.save();

    return { message: 'Email verified successfully.' };
  }

  async validateUserCredentials(email: string, password: string): Promise<UserDocument> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.account_status !== 'active') {
      throw new ForbiddenException(
        `Account is ${user.account_status}. Please verify your account or contact support.`,
      );
    }

    const lockoutRemaining = getLockoutRemainingSeconds(user.lockout_until);
    if (lockoutRemaining > 0) {
      throw new ForbiddenException(
        `Account locked. Try again in ${lockoutRemaining} second(s).`,
      );
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      user.failed_login_attempts += 1;
      const lockoutMs = calculateLockoutDurationMs(user.failed_login_attempts);
      user.lockout_until = lockoutMs > 0 ? new Date(Date.now() + lockoutMs) : undefined;
      await user.save();
      throw new UnauthorizedException('Invalid email or password.');
    }

    return user;
  }

  async loginWithCredentials(email: string, password: string, ipAddress?: string) {
    const user = await this.validateUserCredentials(email, password);
    return this.completeLogin(user, ipAddress);
  }

  async completeLogin(user: UserDocument, ipAddress?: string) {
    user.failed_login_attempts = 0;
    user.lockout_until = undefined;

    if (user.mfa_enabled) {
      await user.save();

      const tempToken = await this.signToken(
        {
          sub: user.userId,
          email: user.email,
          role: user.role,
          tokenType: 'mfa',
          purpose: 'mfa',
        },
        '5m',
      );

      return { requiresMFA: true, tempToken };
    }

    const tokens = await this.issueAuthTokens(user);
    user.last_login = new Date();
    user.last_login_ip = ipAddress;
    await user.save();

    return {
      requiresMFA: false,
      ...tokens,
    };
  }

  async verifyOtp(tempToken: string, otp: string, ipAddress?: string) {
    const payload = await this.verifyToken(tempToken);
    if (payload.purpose !== 'mfa') {
      throw new BadRequestException('Invalid MFA token.');
    }

    const user = await this.userModel.findOne({ userId: payload.sub }).exec();
    if (!user || !user.mfa_enabled) {
      throw new UnauthorizedException('MFA is not enabled for this account.');
    }

    const mfaSecret = user.get('mfa_secret', null, { getters: true }) as string | undefined;
    if (!this.isOtpValid(mfaSecret, otp)) {
      throw new UnauthorizedException('Invalid OTP code.');
    }

    const tokens = await this.issueAuthTokens(user);
    user.last_login = new Date();
    user.last_login_ip = ipAddress;
    await user.save();

    return {
      requiresMFA: false,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.verifyToken(refreshToken);
    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.userModel
      .findOne({ userId: payload.sub, account_status: 'active' })
      .exec();

    if (!user) {
      throw new UnauthorizedException('Refresh token user not found.');
    }

    return this.issueAuthTokens(user);
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (user) {
      const resetToken = await this.signToken(
        {
          sub: user.userId,
          email: user.email,
          role: user.role,
          tokenType: 'password_reset',
          purpose: 'password_reset',
        },
        '1h',
      );

      await this.notificationsService.queuePasswordReset({
        email: user.email,
        fullName: user.fullName,
        token: resetToken,
      });
    }

    return {
      message: 'If this email is registered, a password reset link has been sent.',
    };
  }

  private async issueAuthTokens(user: UserDocument) {
    const basePayload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.signToken(
      { ...basePayload, tokenType: 'access' },
      this.configService.get<string>('JWT_EXPIRY', '15m'),
    );

    const refreshToken = await this.signToken(
      { ...basePayload, tokenType: 'refresh' },
      this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
    );

    return { accessToken, refreshToken };
  }

  private getPrivateKey(): string {
    return Buffer.from(this.configService.get<string>('JWT_PRIVATE_KEY', ''), 'base64').toString('utf8');
  }

  private getPublicKey(): string {
    return Buffer.from(this.configService.get<string>('JWT_PUBLIC_KEY', ''), 'base64').toString('utf8');
  }

  private async signToken(payload: JwtPayload, expiresIn: string): Promise<string> {
    return this.jwtService.signAsync(payload, {
      algorithm: 'RS256',
      privateKey: this.getPrivateKey(),
      expiresIn,
    });
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['RS256'],
        publicKey: this.getPublicKey(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private isOtpValid(secret: string | undefined, otp: string): boolean {
    if (!secret || !/^\d{6}$/.test(otp)) {
      return false;
    }

    const currentWindow = Math.floor(Date.now() / 30_000).toString();
    const digest = createHmac('sha1', secret).update(currentWindow).digest('hex');
    const expectedOtp = (parseInt(digest.slice(-8), 16) % 1_000_000).toString().padStart(6, '0');

    return expectedOtp === otp;
  }
}
