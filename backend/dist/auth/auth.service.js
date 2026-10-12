"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.calculateLockoutDurationMs = calculateLockoutDurationMs;
exports.getLockoutRemainingSeconds = getLockoutRemainingSeconds;
const common_1 = require("@nestjs/common");
const google_auth_library_1 = require("google-auth-library");
const uuid_1 = require("uuid");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const otplib_1 = require("otplib");
const QRCode = __importStar(require("qrcode"));
const zod_1 = require("zod");
const notifications_service_1 = require("../notifications/notifications.service");
const utils_1 = require("../users/utils");
const database_module_1 = require("../db/database.module");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
function calculateLockoutDurationMs(failedAttempts) {
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
function getLockoutRemainingSeconds(lockoutUntil) {
    if (!lockoutUntil) {
        return 0;
    }
    const remainingMs = lockoutUntil.getTime() - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}
const registerValidationSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2),
    email: zod_1.z.string().trim().email(),
    phone: zod_1.z.string().trim().optional(),
    password: zod_1.z
        .string()
        .min(8)
        .regex(/[A-Z]/, 'Password must include an uppercase letter')
        .regex(/[0-9]/, 'Password must include a number')
        .regex(/[^A-Za-z0-9]/, 'Password must include a special character'),
});
let AuthService = class AuthService {
    constructor(db, jwtService, configService, notificationsService) {
        this.db = db;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationsService = notificationsService;
        this.googleClient = new google_auth_library_1.OAuth2Client();
    }
    async onModuleInit() {
        console.log('Running role & beta free tier migration...');
        try {
            await this.db.execute((0, drizzle_orm_1.sql) `ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_source_type text DEFAULT 'new_text';`);
            await this.db.execute((0, drizzle_orm_1.sql) `ALTER TABLE questions ADD COLUMN IF NOT EXISTS has_diagram boolean DEFAULT false;`);
            await this.db.execute((0, drizzle_orm_1.sql) `ALTER TABLE questions ADD COLUMN IF NOT EXISTS diagram_svg text;`);
            await this.db.execute((0, drizzle_orm_1.sql) `ALTER TABLE questions ADD COLUMN IF NOT EXISTS latex text;`);
            await this.db.execute((0, drizzle_orm_1.sql) `ALTER TABLE questions ADD COLUMN IF NOT EXISTS import_batch_id text;`);
        }
        catch {
        }
        const usersList = await this.db.select().from(schema.users);
        for (const user of usersList) {
            let updatePayload = {};
            if (user.role && user.role !== user.role.toLowerCase()) {
                updatePayload.role = user.role.toLowerCase();
            }
            if (user.subscription_tier !== 'max') {
                updatePayload.subscription_tier = 'max';
            }
            if (!user.ai_messages_remaining || user.ai_messages_remaining < 20) {
                updatePayload.ai_messages_remaining = 20;
            }
            if (Object.keys(updatePayload).length > 0) {
                await this.db.update(schema.users)
                    .set(updatePayload)
                    .where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
            }
        }
        console.log('Role & beta free tier migration complete.');
    }
    async register(payload) {
        const parsed = registerValidationSchema.safeParse(payload);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
        }
        const normalizedEmail = parsed.data.email.toLowerCase();
        const [existing] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.email, normalizedEmail)).limit(1);
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists.');
        }
        const passwordHash = await bcrypt.hash(parsed.data.password, 10);
        const code = (0, crypto_1.randomInt)(100000, 999999).toString();
        const plainCbtKey = (0, utils_1.generateCbtKey)();
        const cbtKeyHash = (0, crypto_1.createHash)('sha256').update(plainCbtKey).digest('hex');
        const [user] = await this.db.insert(schema.users).values({
            id: (0, uuid_1.v4)(),
            fullName: parsed.data.fullName,
            email: normalizedEmail,
            phone: parsed.data.phone || null,
            passwordHash,
            role: "student",
            account_status: 'pending_verification',
            verification_code: code,
            verification_code_expires: new Date(Date.now() + 24 * 3600 * 1000),
            cbt_key: plainCbtKey,
            cbt_key_hash: cbtKeyHash,
            subscription_tier: 'max',
            ai_messages_remaining: 20,
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
    async verifyEmail(email, code) {
        const normalizedEmail = email.toLowerCase().trim();
        const formattedCode = code.trim();
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.users.email, normalizedEmail), (0, drizzle_orm_1.eq)(schema.users.verification_code, formattedCode))).limit(1);
        if (!user) {
            throw new common_1.BadRequestException('Invalid email or verification code.');
        }
        if (user.verification_code_expires && user.verification_code_expires.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Verification code has expired. Please register again.');
        }
        await this.db.update(schema.users).set({
            account_status: 'active',
            verification_code: null,
            verification_code_expires: null,
        }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
        return { message: 'Email verified successfully.' };
    }
    async validateUserCredentials(email, password) {
        const normalizedEmail = email.toLowerCase();
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.email, normalizedEmail)).limit(1);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (user.account_status !== 'active') {
            throw new common_1.ForbiddenException(`Account is ${user.account_status}. Please verify your account or contact support.`);
        }
        const lockoutRemaining = getLockoutRemainingSeconds(user.lockout_until || undefined);
        if (lockoutRemaining > 0) {
            throw new common_1.ForbiddenException(`Account locked. Try again in ${lockoutRemaining} second(s).`);
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            const failed_login_attempts = (user.failed_login_attempts || 0) + 1;
            const lockoutMs = calculateLockoutDurationMs(failed_login_attempts);
            const lockout_until = lockoutMs > 0 ? new Date(Date.now() + lockoutMs) : null;
            await this.db.update(schema.users).set({
                failed_login_attempts,
                lockout_until,
            }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        return user;
    }
    async loginWithCredentials(email, password, ipAddress) {
        const user = await this.validateUserCredentials(email, password);
        return this.completeLogin(user, ipAddress);
    }
    async completeLogin(user, ipAddress) {
        let updateData = {
            failed_login_attempts: 0,
            lockout_until: null,
        };
        if (user.mfa_enabled) {
            await this.db.update(schema.users).set(updateData).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
            const tempToken = await this.signToken({
                sub: user.id,
                email: user.email,
                role: (user.role || 'student'),
                tokenType: 'mfa',
            }, '5m');
            return { requiresMFA: true, tempToken };
        }
        const tokens = await this.issueAuthTokens(user);
        updateData.last_login = new Date();
        updateData.last_login_ip = ipAddress || null;
        await this.db.update(schema.users).set(updateData).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
        return {
            requiresMFA: false,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
            },
            ...tokens,
        };
    }
    async verifyOtp(tempToken, otp, ipAddress) {
        const payload = await this.verifyToken(tempToken);
        if (payload.tokenType !== 'mfa') {
            throw new common_1.BadRequestException('Invalid MFA token.');
        }
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, payload.sub)).limit(1);
        if (!user || !user.mfa_enabled) {
            throw new common_1.UnauthorizedException('MFA is not enabled for this account.');
        }
        const mfaSecret = user.mfa_secret;
        if (!this.isOtpValid(mfaSecret || undefined, otp)) {
            throw new common_1.UnauthorizedException('Invalid OTP code.');
        }
        const tokens = await this.issueAuthTokens(user);
        await this.db.update(schema.users).set({
            last_login: new Date(),
            last_login_ip: ipAddress || null,
        }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
        return {
            requiresMFA: false,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
            },
            ...tokens,
        };
    }
    async refreshTokens(refreshToken) {
        const payload = await this.verifyToken(refreshToken);
        if (payload.tokenType !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid refresh token.');
        }
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.users.id, payload.sub), (0, drizzle_orm_1.eq)(schema.users.account_status, 'active'))).limit(1);
        if (!user) {
            throw new common_1.UnauthorizedException('Refresh token user not found.');
        }
        return this.issueAuthTokens(user);
    }
    async forgotPassword(email) {
        const normalizedEmail = email.toLowerCase();
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.email, normalizedEmail)).limit(1);
        if (user) {
            const code = (0, crypto_1.randomInt)(100000, 999999).toString();
            await this.db.update(schema.users).set({
                password_reset_code: code,
                password_reset_expires: new Date(Date.now() + 3600 * 1000),
            }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
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
    async issueAuthTokens(user) {
        const basePayload = {
            sub: user.id,
            email: user.email,
            role: (user.role || 'student'),
        };
        const accessToken = await this.signToken({ ...basePayload, tokenType: 'access' }, this.configService.get('JWT_EXPIRY', '15m'));
        const refreshToken = await this.signToken({ ...basePayload, tokenType: 'refresh' }, this.configService.get('JWT_REFRESH_EXPIRY', '7d'));
        return { accessToken, refreshToken };
    }
    getPrivateKey() {
        return Buffer.from(this.configService.get('JWT_PRIVATE_KEY', ''), 'base64').toString('utf8');
    }
    getPublicKey() {
        return Buffer.from(this.configService.get('JWT_PUBLIC_KEY', ''), 'base64').toString('utf8');
    }
    async signToken(payload, expiresIn) {
        return this.jwtService.signAsync(payload, {
            algorithm: 'RS256',
            privateKey: this.getPrivateKey(),
            expiresIn,
        });
    }
    async verifyToken(token) {
        try {
            return await this.jwtService.verifyAsync(token, {
                algorithms: ['RS256'],
                publicKey: this.getPublicKey(),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token.');
        }
    }
    isOtpValid(secret, otp) {
        if (!secret || !/^\d{6}$/.test(otp)) {
            return false;
        }
        return Boolean((0, otplib_1.verifySync)({ token: otp, secret })?.valid);
    }
    async generateMfaSecret(userId) {
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        const secret = (0, otplib_1.generateSecret)();
        const otpauthUrl = (0, otplib_1.generateURI)({ secret, label: user.email, issuer: 'Aurikrex CBT' });
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
        await this.db.update(schema.users).set({ mfa_secret: secret }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
        return { qrCode: qrCodeDataUrl, secret };
    }
    async generateSsoToken(userId) {
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.users.id, userId), (0, drizzle_orm_1.eq)(schema.users.account_status, 'active'))).limit(1);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found or inactive.');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: (user.role || 'student'),
            tokenType: 'sso',
        };
        const ssoToken = await this.signToken(payload, '1m');
        return { ssoToken };
    }
    async enableMfa(userId, otp) {
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        const mfaSecret = user.mfa_secret;
        if (!this.isOtpValid(mfaSecret || undefined, otp)) {
            throw new common_1.BadRequestException('Invalid OTP code.');
        }
        await this.db.update(schema.users).set({ mfa_enabled: true }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
        return { message: 'Two-Factor Authentication enabled successfully.' };
    }
    async disableMfa(userId, otp) {
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        const mfaSecret = user.mfa_secret;
        if (!this.isOtpValid(mfaSecret || undefined, otp)) {
            throw new common_1.BadRequestException('Invalid OTP code.');
        }
        await this.db.update(schema.users).set({ mfa_enabled: false, mfa_secret: null }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
        return { message: 'Two-Factor Authentication disabled successfully.' };
    }
    async resetPassword(email, code, newPassword) {
        const normalizedEmail = email.toLowerCase().trim();
        const formattedCode = code.trim();
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.users.email, normalizedEmail), (0, drizzle_orm_1.eq)(schema.users.password_reset_code, formattedCode))).limit(1);
        if (!user) {
            throw new common_1.BadRequestException('Invalid email or reset code.');
        }
        if (user.password_reset_expires && user.password_reset_expires.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Reset code has expired. Please request a new one.');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.db.update(schema.users).set({
            passwordHash,
            failed_login_attempts: 0,
            lockout_until: null,
            password_reset_code: null,
            password_reset_expires: null,
        }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
        return { message: 'Password has been reset successfully.' };
    }
    async loginWithGoogle(credential, ipAddress) {
        if (!credential) {
            throw new common_1.BadRequestException('Credential is required.');
        }
        const googleClientId = this.configService.get('GOOGLE_CLIENT_ID');
        if (!googleClientId) {
            throw new common_1.UnauthorizedException('Google sign-in is not configured.');
        }
        let googleUser;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: credential,
                audience: googleClientId,
            });
            const payload = ticket.getPayload();
            if (!payload?.email || payload.email_verified !== true) {
                throw new common_1.UnauthorizedException('Invalid Google token.');
            }
            googleUser = {
                email: payload.email,
                name: payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' ') || payload.email.split('@')[0],
                picture: payload.picture,
            };
        }
        catch (error) {
            console.warn('[AUTH] Google verifyIdToken failed:', error?.message || error);
            throw new common_1.UnauthorizedException('Failed to verify Google token.');
        }
        const normalizedEmail = googleUser.email.toLowerCase();
        let [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.email, normalizedEmail)).limit(1);
        if (!user) {
            const dummyPassword = await bcrypt.hash((0, uuid_1.v4)(), 10);
            const newAurikrexId = (0, utils_1.generateAurikrexId)();
            const plainCbtKey = (0, utils_1.generateCbtKey)();
            const cbtKeyHash = (0, crypto_1.createHash)('sha256').update(plainCbtKey).digest('hex');
            const [newUser] = await this.db.insert(schema.users).values({
                id: (0, uuid_1.v4)(),
                aurikrex_id: newAurikrexId,
                cbt_key: plainCbtKey,
                cbt_key_hash: cbtKeyHash,
                fullName: googleUser.name,
                email: normalizedEmail,
                passwordHash: dummyPassword,
                profile_photo_url: googleUser.picture || null,
                role: "student",
                account_status: 'active',
                subscription_tier: 'max',
                ai_messages_remaining: 20,
            }).returning();
            user = newUser;
        }
        else {
            let updateData = {};
            if (user.account_status === 'pending_verification') {
                updateData.account_status = 'active';
                user.account_status = 'active';
            }
            if (googleUser.picture && !user.profile_photo_url) {
                updateData.profile_photo_url = googleUser.picture;
                user.profile_photo_url = googleUser.picture;
            }
            if (Object.keys(updateData).length > 0) {
                await this.db.update(schema.users).set(updateData).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
            }
        }
        return this.completeLogin(user, ipAddress);
    }
    async loginWithCbtKey(cbtKey, ipAddress) {
        if (!cbtKey) {
            throw new common_1.BadRequestException('Aurikrex ID or CBT Key is required.');
        }
        const formattedKey = cbtKey.trim();
        const hash = (0, crypto_1.createHash)('sha256').update(formattedKey.toUpperCase()).digest('hex');
        let [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.aurikrex_id, formattedKey)).limit(1);
        if (!user) {
            [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.cbt_key_hash, hash)).limit(1);
        }
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid Aurikrex ID or CBT Key.');
        }
        if (user.account_status !== 'active') {
            throw new common_1.ForbiddenException(`Account is ${user.account_status}. Please verify your account first.`);
        }
        return this.completeLogin(user, ipAddress);
    }
    async getProfile(userId) {
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        if (!user.aurikrex_id) {
            const newAurikrexId = (0, utils_1.generateAurikrexId)();
            await this.db.update(schema.users).set({ aurikrex_id: newAurikrexId }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
            user.aurikrex_id = newAurikrexId;
        }
        if (!user.cbt_key) {
            const plainCbtKey = (0, utils_1.generateCbtKey)();
            const hash = (0, crypto_1.createHash)('sha256').update(plainCbtKey).digest('hex');
            await this.db.update(schema.users).set({
                cbt_key: plainCbtKey,
                cbt_key_hash: hash,
            }).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
            Object.assign(user, { cbt_key: plainCbtKey, cbt_key_hash: hash });
        }
        const userObj = { ...user };
        if (userObj.cbt_key) {
            userObj.cbt_key = (0, utils_1.decryptFieldValue)(userObj.cbt_key);
        }
        delete userObj.passwordHash;
        delete userObj.mfa_secret;
        delete userObj.verification_code;
        delete userObj.password_reset_code;
        return userObj;
    }
    async updateProfile(userId, payload) {
        const [user] = await this.db.select().from(schema.users).where((0, drizzle_orm_1.eq)(schema.users.id, userId)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        let updateData = {};
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
                    throw new common_1.BadRequestException('English Language is a compulsory subject and must be included.');
                }
                if (subjects.length !== 4) {
                    throw new common_1.BadRequestException('Subject combination must contain exactly 4 subjects.');
                }
                const validSubjects = [
                    'english', 'mathematics', 'physics', 'chemistry', 'biology',
                    'geography', 'economics', 'government', 'literature', 'commerce',
                    'accounting', 'agriculture', 'civic_education', 'crk', 'irk'
                ];
                for (const sub of subjects) {
                    if (!validSubjects.includes(sub)) {
                        throw new common_1.BadRequestException(`Invalid subject name: ${sub}`);
                    }
                }
            }
            updateData.exam_subject_combination = subjects;
        }
        if (Object.keys(updateData).length > 0) {
            await this.db.update(schema.users).set(updateData).where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
            Object.assign(user, updateData);
        }
        const userObj = { ...user };
        delete userObj.passwordHash;
        delete userObj.mfa_secret;
        delete userObj.verification_code;
        delete userObj.password_reset_code;
        return userObj;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DRIZZLE)),
    __metadata("design:paramtypes", [postgres_js_1.PostgresJsDatabase,
        jwt_1.JwtService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map