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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.calculateLockoutDurationMs = calculateLockoutDurationMs;
exports.getLockoutRemainingSeconds = getLockoutRemainingSeconds;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const notifications_service_1 = require("../notifications/notifications.service");
const user_schema_1 = require("../users/schemas/user.schema");
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
    role: zod_1.z.enum(['super_admin', 'admin', 'examiner', 'proctor', 'student']).optional(),
});
let AuthService = class AuthService {
    constructor(userModel, jwtService, configService, notificationsService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationsService = notificationsService;
    }
    async register(payload) {
        const parsed = registerValidationSchema.safeParse(payload);
        if (!parsed.success) {
            throw new common_1.BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
        }
        const normalizedEmail = parsed.data.email.toLowerCase();
        const existing = await this.userModel.findOne({ email: normalizedEmail }).lean().exec();
        if (existing) {
            throw new common_1.ConflictException('A user with this email already exists.');
        }
        const passwordHash = await argon2.hash(parsed.data.password, {
            type: argon2.argon2id,
            memoryCost: 65_536,
            timeCost: 3,
            parallelism: 2,
        });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const user = await this.userModel.create({
            fullName: parsed.data.fullName,
            email: normalizedEmail,
            phone: parsed.data.phone,
            passwordHash,
            role: parsed.data.role ?? 'student',
            account_status: 'pending_verification',
            verification_code: code,
            verification_code_expires: new Date(Date.now() + 24 * 3600 * 1000),
        });
        await this.notificationsService.queueEmailVerification({
            email: user.email,
            fullName: user.fullName,
            token: code,
        });
        const isDev = this.configService.get('NODE_ENV') === 'development';
        return {
            message: 'Registration successful. Check email to verify.',
            cbt_key: user.cbt_key,
            ...(isDev ? { token: code } : {}),
        };
    }
    async verifyEmail(email, code) {
        const normalizedEmail = email.toLowerCase().trim();
        const formattedCode = code.trim();
        const user = await this.userModel.findOne({
            email: normalizedEmail,
            verification_code: formattedCode,
        }).exec();
        if (!user) {
            throw new common_1.BadRequestException('Invalid email or verification code.');
        }
        if (user.verification_code_expires && user.verification_code_expires.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Verification code has expired. Please register again.');
        }
        user.account_status = 'active';
        user.verification_code = undefined;
        user.verification_code_expires = undefined;
        await user.save();
        return { message: 'Email verified successfully.' };
    }
    async validateUserCredentials(email, password) {
        const normalizedEmail = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalizedEmail }).exec();
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (user.account_status !== 'active') {
            throw new common_1.ForbiddenException(`Account is ${user.account_status}. Please verify your account or contact support.`);
        }
        const lockoutRemaining = getLockoutRemainingSeconds(user.lockout_until);
        if (lockoutRemaining > 0) {
            throw new common_1.ForbiddenException(`Account locked. Try again in ${lockoutRemaining} second(s).`);
        }
        const isPasswordValid = await argon2.verify(user.passwordHash, password);
        if (!isPasswordValid) {
            user.failed_login_attempts += 1;
            const lockoutMs = calculateLockoutDurationMs(user.failed_login_attempts);
            user.lockout_until = lockoutMs > 0 ? new Date(Date.now() + lockoutMs) : undefined;
            await user.save();
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        return user;
    }
    async loginWithCredentials(email, password, ipAddress) {
        const user = await this.validateUserCredentials(email, password);
        return this.completeLogin(user, ipAddress);
    }
    async completeLogin(user, ipAddress) {
        user.failed_login_attempts = 0;
        user.lockout_until = undefined;
        if (user.mfa_enabled) {
            await user.save();
            const tempToken = await this.signToken({
                sub: user.userId,
                email: user.email,
                role: user.role,
                tokenType: 'mfa',
            }, '5m');
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
    async verifyOtp(tempToken, otp, ipAddress) {
        const payload = await this.verifyToken(tempToken);
        if (payload.tokenType !== 'mfa') {
            throw new common_1.BadRequestException('Invalid MFA token.');
        }
        const user = await this.userModel.findOne({ userId: payload.sub }).exec();
        if (!user || !user.mfa_enabled) {
            throw new common_1.UnauthorizedException('MFA is not enabled for this account.');
        }
        const mfaSecret = user.get('mfa_secret', null, { getters: true });
        if (!this.isOtpValid(mfaSecret, otp)) {
            throw new common_1.UnauthorizedException('Invalid OTP code.');
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
    async refreshTokens(refreshToken) {
        const payload = await this.verifyToken(refreshToken);
        if (payload.tokenType !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid refresh token.');
        }
        const user = await this.userModel
            .findOne({ userId: payload.sub, account_status: 'active' })
            .exec();
        if (!user) {
            throw new common_1.UnauthorizedException('Refresh token user not found.');
        }
        return this.issueAuthTokens(user);
    }
    async forgotPassword(email) {
        const normalizedEmail = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalizedEmail }).exec();
        let code;
        if (user) {
            code = Math.floor(100000 + Math.random() * 900000).toString();
            user.password_reset_code = code;
            user.password_reset_expires = new Date(Date.now() + 3600 * 1000);
            await user.save();
            await this.notificationsService.queuePasswordReset({
                email: user.email,
                fullName: user.fullName,
                token: code,
            });
        }
        const isDev = this.configService.get('NODE_ENV') === 'development';
        return {
            message: 'If this email is registered, a password reset code has been sent.',
            ...(isDev && code ? { token: code } : {}),
        };
    }
    async issueAuthTokens(user) {
        const basePayload = {
            sub: user.userId,
            email: user.email,
            role: user.role,
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
        const currentWindow = Math.floor(Date.now() / 30_000).toString();
        const digest = (0, crypto_1.createHmac)('sha1', secret).update(currentWindow).digest('hex');
        const expectedOtp = (parseInt(digest.slice(-8), 16) % 1_000_000).toString().padStart(6, '0');
        return expectedOtp === otp;
    }
    async resetPassword(email, code, newPassword) {
        const normalizedEmail = email.toLowerCase().trim();
        const formattedCode = code.trim();
        const user = await this.userModel.findOne({
            email: normalizedEmail,
            password_reset_code: formattedCode,
        }).exec();
        if (!user) {
            throw new common_1.BadRequestException('Invalid email or reset code.');
        }
        if (user.password_reset_expires && user.password_reset_expires.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Reset code has expired. Please request a new one.');
        }
        const passwordHash = await argon2.hash(newPassword, {
            type: argon2.argon2id,
            memoryCost: 65_536,
            timeCost: 3,
            parallelism: 2,
        });
        user.passwordHash = passwordHash;
        user.failed_login_attempts = 0;
        user.lockout_until = undefined;
        user.password_reset_code = undefined;
        user.password_reset_expires = undefined;
        await user.save();
        return { message: 'Password has been reset successfully.' };
    }
    async loginWithGoogle(credential, ipAddress) {
        if (!credential) {
            throw new common_1.BadRequestException('Credential is required.');
        }
        let googleUser;
        try {
            const { data } = await axios_1.default.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
            if (!data.email) {
                throw new common_1.UnauthorizedException('Invalid Google token.');
            }
            googleUser = {
                email: data.email,
                name: data.name || data.email.split('@')[0],
                picture: data.picture,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Failed to verify Google token.');
        }
        const normalizedEmail = googleUser.email.toLowerCase();
        let user = await this.userModel.findOne({ email: normalizedEmail }).exec();
        if (!user) {
            const dummyPassword = await argon2.hash((0, uuid_1.v4)(), {
                type: argon2.argon2id,
                memoryCost: 65_536,
                timeCost: 3,
                parallelism: 2,
            });
            user = await this.userModel.create({
                fullName: googleUser.name,
                email: normalizedEmail,
                passwordHash: dummyPassword,
                profile_photo_url: googleUser.picture,
                role: 'student',
                account_status: 'active',
            });
        }
        else {
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
    async loginWithCbtKey(cbtKey, ipAddress) {
        if (!cbtKey) {
            throw new common_1.BadRequestException('CBT Key is required.');
        }
        const formattedKey = cbtKey.trim().toUpperCase();
        const user = await this.userModel.findOne({ cbt_key: formattedKey }).exec();
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid CBT Key.');
        }
        if (user.account_status !== 'active') {
            throw new common_1.ForbiddenException(`Account is ${user.account_status}. Please verify your account first.`);
        }
        return this.completeLogin(user, ipAddress);
    }
    async getProfile(userId) {
        const user = await this.userModel.findOne({ userId }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return user;
    }
    async updateProfile(userId, payload) {
        const user = await this.userModel.findOne({ userId }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
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
            user.exam_subject_combination = subjects;
        }
        await user.save();
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map