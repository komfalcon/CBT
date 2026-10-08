"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const verify_otp_dto_1 = require("./dto/verify-otp.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const class_validator_1 = require("class-validator");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const google_login_dto_1 = require("./dto/google-login.dto");
const cbt_key_login_dto_1 = require("./dto/cbt-key-login.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const ACCESS_COOKIE = 'cbt_access_token';
const REFRESH_COOKIE = 'cbt_refresh_token';
const MFA_COOKIE = 'cbt_mfa_token';
function readCookie(req, name) {
    const header = req.headers.cookie || '';
    const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}
function cookieOptions(maxAge, httpOnly = true) {
    return { httpOnly, secure: true, sameSite: 'none', path: '/', maxAge };
}
function setAuthCookies(res, tokens) {
    if (tokens.accessToken)
        res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(15 * 60 * 1000));
    if (tokens.refreshToken)
        res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
}
class VerifyEmailDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], VerifyEmailDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyEmailDto.prototype, "code", void 0);
class MfaDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MfaDto.prototype, "otp", void 0);
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    register(registerDto) {
        return this.authService.register(registerDto);
    }
    verifyEmail(body) {
        return this.authService.verifyEmail(body.email, body.code);
    }
    async login(req, res, _, ipAddress) {
        const result = await this.authService.completeLogin(req.user, ipAddress);
        if (result.requiresMFA) {
            if (result.tempToken) {
                res.cookie(MFA_COOKIE, result.tempToken, cookieOptions(5 * 60 * 1000));
            }
            return { requiresMFA: true };
        }
        setAuthCookies(res, result);
        return {
            requiresMFA: false,
            accessToken: result.accessToken,
            token: result.accessToken,
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
                fullName: req.user.fullName,
            },
        };
    }
    async verifyOtp(req, res, verifyOtpDto, ipAddress) {
        const tempToken = readCookie(req, MFA_COOKIE);
        if (!tempToken)
            throw new common_1.UnauthorizedException('MFA session has expired. Please sign in again.');
        const result = await this.authService.verifyOtp(tempToken, verifyOtpDto.otp, ipAddress);
        res.clearCookie(MFA_COOKIE, { path: '/' });
        setAuthCookies(res, result);
        return {
            requiresMFA: false,
            accessToken: result.accessToken,
            token: result.accessToken,
            user: result.user,
        };
    }
    async refreshToken(req, res) {
        const refreshToken = readCookie(req, REFRESH_COOKIE);
        if (!refreshToken)
            throw new common_1.UnauthorizedException('Refresh session has expired. Please sign in again.');
        const result = await this.authService.refreshTokens(refreshToken);
        setAuthCookies(res, result);
        return { refreshed: true, accessToken: result.accessToken, token: result.accessToken };
    }
    forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }
    resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.code, resetPasswordDto.password);
    }
    async loginGoogle(res, googleLoginDto, ipAddress) {
        const result = await this.authService.loginWithGoogle(googleLoginDto.credential, ipAddress);
        if (result.requiresMFA) {
            if (result.tempToken) {
                res.cookie(MFA_COOKIE, result.tempToken, cookieOptions(5 * 60 * 1000));
            }
            return { requiresMFA: true };
        }
        setAuthCookies(res, result);
        return {
            requiresMFA: false,
            accessToken: result.accessToken,
            token: result.accessToken,
            user: result.user,
        };
    }
    async loginCbtKey(res, cbtKeyLoginDto, ipAddress) {
        const result = await this.authService.loginWithCbtKey(cbtKeyLoginDto.cbtKey, ipAddress);
        if (result.requiresMFA) {
            if (result.tempToken) {
                res.cookie(MFA_COOKIE, result.tempToken, cookieOptions(5 * 60 * 1000));
            }
            return { requiresMFA: true };
        }
        setAuthCookies(res, result);
        return {
            requiresMFA: false,
            accessToken: result.accessToken,
            token: result.accessToken,
            user: result.user,
        };
    }
    logout(res) {
        res.clearCookie(ACCESS_COOKIE, { path: '/' });
        res.clearCookie(REFRESH_COOKIE, { path: '/' });
        res.clearCookie(MFA_COOKIE, { path: '/' });
        return { message: 'Signed out.' };
    }
    getMe(req) {
        return this.authService.getProfile(req.user.sub);
    }
    updateMe(req, updateProfileDto) {
        return this.authService.updateProfile(req.user.sub, updateProfileDto);
    }
    generateMfaSecret(req) {
        return this.authService.generateMfaSecret(req.user.sub);
    }
    getSsoToken(req) {
        return this.authService.generateSsoToken(req.user.sub);
    }
    enableMfa(req, body) {
        return this.authService.enableMfa(req.user.sub, body.otp);
    }
    disableMfa(req, body) {
        return this.authService.disableMfa(req.user.sub, body.otp);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 15 * 60_000 } }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, login_dto_1.LoginDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, verify_otp_dto_1.VerifyOtpDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 15 * 60_000 } }),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('google'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, google_login_dto_1.GoogleLoginDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginGoogle", null);
__decorate([
    (0, common_1.Post)('login/cbt-key'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cbt_key_login_dto_1.CbtKeyLoginDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginCbtKey", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Post)('mfa/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "generateMfaSecret", null);
__decorate([
    (0, common_1.Get)('sso-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getSsoToken", null);
__decorate([
    (0, common_1.Post)('mfa/enable'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, MfaDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "enableMfa", null);
__decorate([
    (0, common_1.Post)('mfa/disable'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, MfaDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "disableMfa", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map