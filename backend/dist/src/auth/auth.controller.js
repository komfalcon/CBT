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
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const class_validator_1 = require("class-validator");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const google_login_dto_1 = require("./dto/google-login.dto");
const cbt_key_login_dto_1 = require("./dto/cbt-key-login.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
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
    login(req, _, ipAddress) {
        return this.authService.completeLogin(req.user, ipAddress);
    }
    verifyOtp(verifyOtpDto, ipAddress) {
        return this.authService.verifyOtp(verifyOtpDto.tempToken, verifyOtpDto.otp, ipAddress);
    }
    refreshToken(refreshTokenDto) {
        return this.authService.refreshTokens(refreshTokenDto.refreshToken);
    }
    forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }
    resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.code, resetPasswordDto.password);
    }
    loginGoogle(googleLoginDto, ipAddress) {
        return this.authService.loginWithGoogle(googleLoginDto.credential, ipAddress);
    }
    loginCbtKey(cbtKeyLoginDto, ipAddress) {
        return this.authService.loginWithCbtKey(cbtKeyLoginDto.cbtKey, ipAddress);
    }
    getMe(req) {
        return this.authService.getProfile(req.user.sub);
    }
    updateMe(req, updateProfileDto) {
        return this.authService.updateProfile(req.user.sub, updateProfileDto);
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
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.LoginDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_otp_dto_1.VerifyOtpDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
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
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_login_dto_1.GoogleLoginDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "loginGoogle", null);
__decorate([
    (0, common_1.Post)('login/cbt-key'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, transform: true }))),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cbt_key_login_dto_1.CbtKeyLoginDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "loginCbtKey", null);
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
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map