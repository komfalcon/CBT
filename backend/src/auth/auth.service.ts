import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHmac, randomInt, createHash } from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { z } from 'zod';
import { NotificationsService } from '../notifications/notifications.service';
import { generateCbtKey, decryptFieldValue } from '../users/utils';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';

import { DRIZZLE } from '../db/database.module';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';

type UserDocument = typeof schema.users.$inferSelect;

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
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    console.log('Running role fix migration...');
    const usersList = await this.db.select().from(schema.users);
    for (const user of usersList) {
      if (user.role && user.role !== user.role.toLowerCase()) {
        console.log('Fixing role for', user.email);
        await this.db.update(schema.users)
          .set({ role: user.role.toLowerCase() as any })
          .where(eq(schema.users.id, user.id));
      }
    }
    console.log('Role fix migration complete.');
  }

  async register(payload: RegisterDto) {
    const parsed = registerValidationSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const [existing] = await this.db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const code = randomInt(100000, 999999).toString();
    const plainCbtKey = generateCbtKey();
    const cbtKeyHash = createHash('sha256').update(plainCbtKey).digest('hex');

    const [user] = await this.db.insert(schema.users).values({
      id: uuidv4(),
      fullName: parsed.data.fullName,
      email: normalizedEmail,
      phone: parsed.data.phone || null,
      passwordHash,
      role: "student" as any,
      account_status: 'pending_verification',
      verification_code: code,
      verification_code_expires: new Date(Date.now() + 24 * 3600 * 1000),
      cbt_key: plainCbtKey,
      cbt_key_hash: cbtKeyHash,
    }).returning();

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

    const [user] = await this.db.select().from(schema.users).where(
      and(eq(schema.users.email, normalizedEmail), eq(schema.users.verification_code, formattedCode))
    ).limit(1);

    if (!user) {
      throw new BadRequestException('Invalid email or verification code.');
    }

    if (user.verification_code_expires && user.verification_code_expires.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired. Please register again.');
    }

    await this.db.update(schema.users).set({
      account_status: 'active',
      verification_code: null,
      verification_code_expires: null,
    }).where(eq(schema.users.id, user.id));

    return { message: 'Email verified successfully.' };
  }

  async recoverAdmin() {
    const email = 'falcon@aurikrex.tech';
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!user) {
      return { error: 'Admin user not found' };
    }
    
    // Reset password
    const passwordHash = await bcrypt.hash('Korex1025$1025$', 10);
    
    await this.db.update(schema.users).set({
      passwordHash,
      account_status: 'active',
      role: 'admin' as any,
    }).where(eq(schema.users.id, user.id));
    
    // Return decrypted CBT key (getter is invoked on access)
    return {
      message: 'Admin recovered',
      email: user.email,
      cbt_key: decryptFieldValue(user.cbt_key),
    };
  }

  async validateUserCredentials(email: string, password: string): Promise<UserDocument> {
    const normalizedEmail = email.toLowerCase();
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.account_status !== 'active') {
      throw new ForbiddenException(
        `Account is ${user.account_status}. Please verify your account or contact support.`,
      );
    }

    const lockoutRemaining = getLockoutRemainingSeconds(user.lockout_until || undefined);
    if (lockoutRemaining > 0) {
      throw new ForbiddenException(
        `Account locked. Try again in ${lockoutRemaining} second(s).`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      const lockoutMs = calculateLockoutDurationMs(failed_login_attempts);
      const lockout_until = lockoutMs > 0 ? new Date(Date.now() + lockoutMs) : null;
      
      await this.db.update(schema.users).set({
        failed_login_attempts,
        lockout_until,
      }).where(eq(schema.users.id, user.id));
      
      throw new UnauthorizedException('Invalid email or password.');
    }

    return user;
  }

  async loginWithCredentials(email: string, password: string, ipAddress?: string) {
    const user = await this.validateUserCredentials(email, password);
    return this.completeLogin(user, ipAddress);
  }

  async completeLogin(user: UserDocument, ipAddress?: string) {
    let updateData: any = {
      failed_login_attempts: 0,
      lockout_until: null,
    };

    if (user.mfa_enabled) {
      await this.db.update(schema.users).set(updateData).where(eq(schema.users.id, user.id));

      const tempToken = await this.signToken(
        {
          sub: user.id,
          email: user.email,
          role: (user.role || 'student') as any,
          tokenType: 'mfa',
        },
        '5m',
      );

      return { requiresMFA: true, tempToken };
    }

    const tokens = await this.issueAuthTokens(user);
    updateData.last_login = new Date();
    updateData.last_login_ip = ipAddress || null;
    
    await this.db.update(schema.users).set(updateData).where(eq(schema.users.id, user.id));

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

    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).limit(1);
    if (!user || !user.mfa_enabled) {
      throw new UnauthorizedException('MFA is not enabled for this account.');
    }

    const mfaSecret = user.mfa_secret;
    if (!this.isOtpValid(mfaSecret || undefined, otp)) {
      throw new UnauthorizedException('Invalid OTP code.');
    }

    const tokens = await this.issueAuthTokens(user);
    await this.db.update(schema.users).set({
      last_login: new Date(),
      last_login_ip: ipAddress || null,
    }).where(eq(schema.users.id, user.id));

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

    const [user] = await this.db.select().from(schema.users).where(
      and(eq(schema.users.id, payload.sub), eq(schema.users.account_status, 'active'))
    ).limit(1);

    if (!user) {
      throw new UnauthorizedException('Refresh token user not found.');
    }

    return this.issueAuthTokens(user);
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);

    if (user) {
      const code = randomInt(100000, 999999).toString();
      await this.db.update(schema.users).set({
        password_reset_code: code,
        password_reset_expires: new Date(Date.now() + 3600 * 1000),
      }).where(eq(schema.users.id, user.id));

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
      sub: user.id,
      email: user.email,
      role: (user.role || 'student') as any,
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
    return authenticator.verify({ token: otp, secret });
  }

  async generateMfaSecret(userId: string) {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Aurikrex CBT', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await this.db.update(schema.users).set({ mfa_secret: secret }).where(eq(schema.users.id, user.id));

    return { qrCode: qrCodeDataUrl, secret };
  }

  async generateSsoToken(userId: string) {
    const [user] = await this.db.select().from(schema.users).where(
      and(eq(schema.users.id, userId), eq(schema.users.account_status, 'active'))
    ).limit(1);
    if (!user) {
      throw new UnauthorizedException('User not found or inactive.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: (user.role || 'student') as any,
      tokenType: 'sso',
    };

    const ssoToken = await this.signToken(payload, '1m');
    return { ssoToken };
  }

  async enableMfa(userId: string, otp: string) {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const mfaSecret = user.mfa_secret;
    if (!this.isOtpValid(mfaSecret || undefined, otp)) {
      throw new BadRequestException('Invalid OTP code.');
    }

    await this.db.update(schema.users).set({ mfa_enabled: true }).where(eq(schema.users.id, user.id));

    return { message: 'Two-Factor Authentication enabled successfully.' };
  }

  async disableMfa(userId: string, otp: string) {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const mfaSecret = user.mfa_secret;
    if (!this.isOtpValid(mfaSecret || undefined, otp)) {
      throw new BadRequestException('Invalid OTP code.');
    }

    await this.db.update(schema.users).set({ mfa_enabled: false, mfa_secret: null }).where(eq(schema.users.id, user.id));

    return { message: 'Two-Factor Authentication disabled successfully.' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const formattedCode = code.trim();

    const [user] = await this.db.select().from(schema.users).where(
      and(eq(schema.users.email, normalizedEmail), eq(schema.users.password_reset_code, formattedCode))
    ).limit(1);

    if (!user) {
      throw new BadRequestException('Invalid email or reset code.');
    }

    if (user.password_reset_expires && user.password_reset_expires.getTime() < Date.now()) {
      throw new BadRequestException('Reset code has expired. Please request a new one.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db.update(schema.users).set({
      passwordHash,
      failed_login_attempts: 0,
      lockout_until: null,
      password_reset_code: null,
      password_reset_expires: null,
    }).where(eq(schema.users.id, user.id));

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
    let [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, normalizedEmail)).limit(1);

    if (!user) {
      const dummyPassword = await bcrypt.hash(uuidv4(), 10);

      const [newUser] = await this.db.insert(schema.users).values({
        id: uuidv4(),
        fullName: googleUser.name,
        email: normalizedEmail,
        passwordHash: dummyPassword,
        profile_photo_url: googleUser.picture || null,
        role: "student" as any,
        account_status: 'active',
      }).returning();
      user = newUser;
    } else {
      let updateData: any = {};
      if (user.account_status === 'pending_verification') {
        updateData.account_status = 'active';
        user.account_status = 'active';
      }
      if (googleUser.picture && !user.profile_photo_url) {
        updateData.profile_photo_url = googleUser.picture;
        user.profile_photo_url = googleUser.picture;
      }
      if (Object.keys(updateData).length > 0) {
        await this.db.update(schema.users).set(updateData).where(eq(schema.users.id, user.id));
      }
    }

    return this.completeLogin(user, ipAddress);
  }

  async loginWithCbtKey(cbtKey: string, ipAddress?: string) {
    if (!cbtKey) {
      throw new BadRequestException('CBT Key is required.');
    }

    const formattedKey = cbtKey.trim().toUpperCase();
    const hash = createHash('sha256').update(formattedKey).digest('hex');
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.cbt_key_hash, hash)).limit(1);
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
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.cbt_key) {
      const plainCbtKey = generateCbtKey();
      const hash = createHash('sha256').update(plainCbtKey).digest('hex');
      
      await this.db.update(schema.users).set({
        cbt_key: plainCbtKey,
        cbt_key_hash: hash,
      }).where(eq(schema.users.id, user.id));
      
      Object.assign(user, { cbt_key: plainCbtKey, cbt_key_hash: hash });
    }

    const userObj: any = { ...user };
    if (userObj.cbt_key) {
      userObj.cbt_key = decryptFieldValue(userObj.cbt_key);
    }
    delete userObj.passwordHash;
    delete userObj.mfa_secret;
    delete userObj.verification_code;
    delete userObj.password_reset_code;

    return userObj;
  }

  async updateProfile(userId: string, payload: { fullName?: string; phone?: string; exam_subject_combination?: string[] }) {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    let updateData: any = {};

    if (payload.fullName !== undefined) {
      updateData.fullName = payload.fullName;
    }

    if (payload.phone !== undefined) {
      updateData.phone = payload.phone;
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
      updateData.exam_subject_combination = subjects;
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.update(schema.users).set(updateData).where(eq(schema.users.id, user.id));
      Object.assign(user, updateData);
    }

    const userObj: any = { ...user };
    delete userObj.passwordHash;
    delete userObj.mfa_secret;
    delete userObj.verification_code;
    delete userObj.password_reset_code;

    return userObj;
  }
}
