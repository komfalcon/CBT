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
exports.SsoController = void 0;
const common_1 = require("@nestjs/common");
const sso_service_1 = require("./sso.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let SsoController = class SsoController {
    constructor(ssoService, jwtService, configService) {
        this.ssoService = ssoService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async authorize(clientId, redirectUri, responseType, codeChallenge, codeChallengeMethod, state, scope, queryToken, req, res) {
        await this.ssoService.validateClient(clientId, redirectUri);
        let userPayload = null;
        try {
            const cookieHeader = String(req.headers.cookie || '');
            const token = queryToken ||
                cookieHeader
                    .split(';')
                    .map((p) => p.trim())
                    .find((p) => p.startsWith('cbt_access_token='))
                    ?.slice(17) ||
                String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
            if (token) {
                const publicKeyB64 = this.configService.get('JWT_PUBLIC_KEY', '');
                const publicKey = publicKeyB64 ? Buffer.from(publicKeyB64, 'base64').toString('utf8') : null;
                const secret = this.configService.get('JWT_SECRET') || 'aurikrex-sso-secret-key-2026';
                if (publicKey) {
                    try {
                        userPayload = this.jwtService.verify(token, { secret: publicKey, algorithms: ['RS256'] });
                    }
                    catch {
                        try {
                            userPayload = this.jwtService.verify(token, { secret, algorithms: ['HS256'] });
                        }
                        catch {
                            userPayload = this.jwtService.decode(token);
                        }
                    }
                }
                else {
                    try {
                        userPayload = this.jwtService.verify(token, { secret });
                    }
                    catch {
                        userPayload = this.jwtService.decode(token);
                    }
                }
                if (!userPayload) {
                    userPayload = this.jwtService.decode(token);
                }
            }
        }
        catch {
        }
        const userId = userPayload?.sub || userPayload?.id;
        if (!userPayload || !userId) {
            const host = req.headers['x-forwarded-host'] || req.headers.host;
            const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
            const reqOrigin = host ? `${protocol}://${host}` : null;
            const frontendUrl = (process.env.CBT_ORIGIN || process.env.FRONTEND_URL || reqOrigin || 'https://cbt.pxxl.click').replace(/\/+$/, '');
            const loginReturnUrl = encodeURIComponent(req.originalUrl || req.url);
            return res.redirect(`${frontendUrl}/auth?returnUrl=${loginReturnUrl}`);
        }
        const aurikrexId = userPayload.aurikrex_id || (await this.ssoService.ensureAurikrexId(userId));
        const code = await this.ssoService.generateAuthCode({
            clientId,
            userId,
            aurikrexId,
            redirectUri,
            codeChallenge,
            codeChallengeMethod,
            scope,
        });
        const targetUrl = new URL(redirectUri);
        targetUrl.searchParams.set('code', code);
        if (state)
            targetUrl.searchParams.set('state', state);
        return res.redirect(targetUrl.toString());
    }
    async token(clientId, code, codeVerifier, redirectUri) {
        return this.ssoService.exchangeToken({
            clientId,
            code,
            codeVerifier,
            redirectUri,
        });
    }
    async userinfo(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing Authorization Bearer token');
        }
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const secret = this.configService.get('JWT_SECRET') || 'aurikrex-sso-secret-key-2026';
        const payload = this.jwtService.verify(token, { secret });
        return this.ssoService.getUserInfo(payload.aurikrex_id || payload.sub);
    }
    async logout(res) {
        res.clearCookie('cbt_access_token');
        return res.status(200).json({ message: 'Single Logout completed successfully' });
    }
};
exports.SsoController = SsoController;
__decorate([
    (0, common_1.Get)('authorize'),
    __param(0, (0, common_1.Query)('client_id')),
    __param(1, (0, common_1.Query)('redirect_uri')),
    __param(2, (0, common_1.Query)('response_type')),
    __param(3, (0, common_1.Query)('code_challenge')),
    __param(4, (0, common_1.Query)('code_challenge_method')),
    __param(5, (0, common_1.Query)('state')),
    __param(6, (0, common_1.Query)('scope')),
    __param(7, (0, common_1.Query)('token')),
    __param(8, (0, common_1.Req)()),
    __param(9, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "authorize", null);
__decorate([
    (0, common_1.Post)(['token', 'exchange']),
    __param(0, (0, common_1.Body)('client_id')),
    __param(1, (0, common_1.Body)('code')),
    __param(2, (0, common_1.Body)('code_verifier')),
    __param(3, (0, common_1.Body)('redirect_uri')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "token", null);
__decorate([
    (0, common_1.Get)('userinfo'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "userinfo", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "logout", null);
exports.SsoController = SsoController = __decorate([
    (0, common_1.Controller)(['auth/sso', 'api/auth/sso', 'api/v1/auth/sso']),
    __metadata("design:paramtypes", [sso_service_1.SsoService,
        jwt_1.JwtService,
        config_1.ConfigService])
], SsoController);
//# sourceMappingURL=sso.controller.js.map