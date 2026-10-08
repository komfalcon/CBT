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
exports.AuthResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const auth_service_1 = require("./auth.service");
let AuthTokensResponse = class AuthTokensResponse {
};
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], AuthTokensResponse.prototype, "requiresMFA", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AuthTokensResponse.prototype, "tempToken", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AuthTokensResponse.prototype, "accessToken", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AuthTokensResponse.prototype, "refreshToken", void 0);
AuthTokensResponse = __decorate([
    (0, graphql_1.ObjectType)()
], AuthTokensResponse);
let RefreshTokenResponse = class RefreshTokenResponse {
};
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], RefreshTokenResponse.prototype, "accessToken", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], RefreshTokenResponse.prototype, "refreshToken", void 0);
RefreshTokenResponse = __decorate([
    (0, graphql_1.ObjectType)()
], RefreshTokenResponse);
let AuthResolver = class AuthResolver {
    constructor(authService) {
        this.authService = authService;
    }
    async register(fullName, email, password, phone, role) {
        const response = await this.authService.register({
            fullName,
            email,
            password,
            phone,
            role: role,
        });
        return response.message;
    }
    async verifyEmail(email, code) {
        const response = await this.authService.verifyEmail(email, code);
        return response.message;
    }
    async forgotPassword(email) {
        const response = await this.authService.forgotPassword(email);
        return response.message;
    }
    async login(email, password, ipAddress) {
        return this.authService.loginWithCredentials(email, password, ipAddress);
    }
    async verifyOtp(tempToken, otp, ipAddress) {
        return this.authService.verifyOtp(tempToken, otp, ipAddress);
    }
    async refreshToken(refreshToken) {
        return this.authService.refreshTokens(refreshToken);
    }
};
exports.AuthResolver = AuthResolver;
__decorate([
    (0, graphql_1.Mutation)(() => String),
    __param(0, (0, graphql_1.Args)('fullName')),
    __param(1, (0, graphql_1.Args)('email')),
    __param(2, (0, graphql_1.Args)('password')),
    __param(3, (0, graphql_1.Args)('phone', { nullable: true })),
    __param(4, (0, graphql_1.Args)('role', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "register", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "verifyEmail", null);
__decorate([
    (0, graphql_1.Mutation)(() => String),
    __param(0, (0, graphql_1.Args)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "forgotPassword", null);
__decorate([
    (0, graphql_1.Mutation)(() => AuthTokensResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('password')),
    __param(2, (0, graphql_1.Args)('ipAddress', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "login", null);
__decorate([
    (0, graphql_1.Mutation)(() => AuthTokensResponse),
    __param(0, (0, graphql_1.Args)('tempToken')),
    __param(1, (0, graphql_1.Args)('otp')),
    __param(2, (0, graphql_1.Args)('ipAddress', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "verifyOtp", null);
__decorate([
    (0, graphql_1.Mutation)(() => RefreshTokenResponse),
    __param(0, (0, graphql_1.Args)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "refreshToken", null);
exports.AuthResolver = AuthResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthResolver);
//# sourceMappingURL=auth.resolver.js.map