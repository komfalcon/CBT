import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { createHmac, randomInt, createHash } from 'crypto';
import { z } from 'zod';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserDocument, generateCbtKey } from '../users/schemas/user.schema';
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
});

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    // Migrate legacy plaintext cbt_key fields if they exist in DB
    const legacyUsers = await this.userModel.find({ cbt_key: { $exists: true } }).exec();
    if (legacyUsers.length > 0) {
      console.log(`[Migration] Found ${legacyUsers.length} users with legacy cbt_key. Hashing them...`);
      for (const user of legacyUsers) {
        const plainKey = (user as any).cbt_key;
        if (plainKey && !user.cbt_key_hash) {
          const hash = createHash('sha256').update(plainKey).digest('hex');
          await this.userModel.updateOne(
            { _id: user._id },
            { 
              $set: { cbt_key_hash: hash }, 
              $unset: { cbt_key: 1 } 
            }
          );
        }
      }
      console.log(`[Migration] Legacy CBT keys successfully migrated to hashed format.`);
    }
  }

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

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const code = randomInt(100000, 999999).toString();
    const plainCbtKey = generateCbtKey();
    const cbtKeyHash = createHash('sha256').update(plainCbtKey).digest('hex');

    const user = await this.userModel.create({
      fullName: parsed.data.fullName,
      email: normalizedEmail,
      phone: parsed.data.phone,
      passwordHash,
      role: 'student',
      account_status: 'pending_verification',
      verification_code: code,
      verification_code_expires: new Date(Date.now() + 24 * 3600 * 1000),
      cbt_key_hash: cbtKeyHash,
    });

    await this.notificationsService.queueEmailVerification({
      email: user.email,
      fullName: user.fullName,
      token: code,
    });

    return {
      message: 'Registration successful. Check email to verify.',
      cbt_key: plainCbtKey,
    };
  }

  async verifyEmail(email: string, code: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const formattedCode = code.trim();

    const user = await this.userModel.findOne({
      email: normalizedEmail,
      verification_code: formattedCode,
    }).exec();

    if (!user) {
      throw new BadRequestException('Invalid email or verification code.');
    }

    if (user.verification_code_expires && user.verification_code_expires.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired. Please register again.');
    }

    user.account_status = 'active';
    user.verification_code = undefined;
    user.verification_code_expires = undefined;
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

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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
    if (payload.tokenType !== 'mfa') {
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
      const code = randomInt(100000, 999999).toString();
      user.password_reset_code = code;
      user.password_reset_expires = new Date(Date.now() + 3600 * 1000);
      await user.save();

      await this.notificationsService.queuePasswordReset({
        email: user.email,
        fullName: user.fullName,
        token: code,
      });
    }

    return {
      message: 'If this email is registered, a password reset code has been sent.',
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

  async resetPassword(email: string, code: string, newPassword: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const formattedCode = code.trim();

    const user = await this.userModel.findOne({
      email: normalizedEmail,
      password_reset_code: formattedCode,
    }).exec();

    if (!user) {
      throw new BadRequestException('Invalid email or reset code.');
    }

    if (user.password_reset_expires && user.password_reset_expires.getTime() < Date.now()) {
      throw new BadRequestException('Reset code has expired. Please request a new one.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    user.passwordHash = passwordHash;
    user.failed_login_attempts = 0;
    user.lockout_until = undefined;
    user.password_reset_code = undefined;
    user.password_reset_expires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully.' };
  }

  async loginWithGoogle(credential: string, ipAddress?: string) {
    if (!credential) {
      throw new BadRequestException('Credential is required.');
    }

    let googleUser: { email: string; name: string; picture?: string };
    try {
      const { data } = await axios.get<{
        email: string;
        name: string;
        picture?: string;
        email_verified: string | boolean;
      }>(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);

      if (!data.email) {
        throw new UnauthorizedException('Invalid Google token.');
      }
      googleUser = {
        email: data.email,
        name: data.name || data.email.split('@')[0],
        picture: data.picture,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Google token.');
    }

    const normalizedEmail = googleUser.email.toLowerCase();
    let user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      const dummyPassword = await bcrypt.hash(uuidv4(), 10);

      user = await this.userModel.create({
        fullName: googleUser.name,
        email: normalizedEmail,
        passwordHash: dummyPassword,
        profile_photo_url: googleUser.picture,
        role: 'student',
        account_status: 'active',
      });
    } else {
      if (user.account_status === 'pending_verification') {
        user.account_status = 'active';
      }
      if (googleUser.picture && !user.profile_photo_url) {
        user.profile_photo_url = googleUser.picture;
      }
      await user.save();
    }

    return this.completeLogin(user, ipAddress);
  }

  async loginWithCbtKey(cbtKey: string, ipAddress?: string) {
    if (!cbtKey) {
      throw new BadRequestException('CBT Key is required.');
    }

    const formattedKey = cbtKey.trim().toUpperCase();
    const hash = createHash('sha256').update(formattedKey).digest('hex');
    const user = await this.userModel.findOne({ cbt_key_hash: hash }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid CBT Key.');
    }

    if (user.account_status !== 'active') {
      throw new ForbiddenException(
        `Account is ${user.account_status}. Please verify your account first.`,
      );
    }

    return this.completeLogin(user, ipAddress);
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async updateProfile(userId: string, payload: { fullName?: string; phone?: string; exam_subject_combination?: string[] }) {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (payload.fullName !== undefined) {
      user.fullName = payload.fullName;
    }
    if (payload.phone !== undefined) {
      user.phone = payload.phone;
    }
    if (payload.exam_subject_combination !== undefined) {
      const subjects = payload.exam_subject_combination.map(s => s.toLowerCase());
      if (subjects.length > 0) {
        if (!subjects.includes('english')) {
          throw new BadRequestException('English Language is a compulsory subject and must be included.');
        }
        if (subjects.length !== 4) {
          throw new BadRequestException('Subject combination must contain exactly 4 subjects.');
        }
        const validSubjects = [
          'english', 'mathematics', 'physics', 'chemistry', 'biology',
          'geography', 'economics', 'government', 'literature', 'commerce',
          'accounting', 'agriculture', 'civic_education', 'crk', 'irk'
        ];
        for (const sub of subjects) {
          if (!validSubjects.includes(sub)) {
            throw new BadRequestException(`Invalid subject name: ${sub}`);
          }
        }
      }
      user.exam_subject_combination = subjects;
    }

    await user.save();
    return user;
  }
}
