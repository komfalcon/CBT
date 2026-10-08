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
exports.CoinsController = exports.CoinsAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const coins_service_1 = require("./coins.service");
const central_service_1 = require("../central/central.service");
const passport_1 = require("@nestjs/passport");
let CoinsAuthGuard = class CoinsAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const internalKey = req.headers['x-aurikrex-internal-key'];
        const expectedKey = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET || 'aurikrex-sso-secret-key-2026';
        if (internalKey && internalKey === expectedKey) {
            const targetUser = req.body?.userEmail || req.body?.userId || req.headers['x-user-email'] || req.headers['x-user-id'];
            if (targetUser) {
                req.user = { id: targetUser, sub: targetUser, email: targetUser };
                return true;
            }
        }
        return super.canActivate(context);
    }
};
exports.CoinsAuthGuard = CoinsAuthGuard;
exports.CoinsAuthGuard = CoinsAuthGuard = __decorate([
    (0, common_1.Injectable)()
], CoinsAuthGuard);
let CoinsController = class CoinsController {
    constructor(coinsService, centralService) {
        this.coinsService = coinsService;
        this.centralService = centralService;
    }
    getTargetUserIdentifier(req, body) {
        return req.user?.aurikrex_id || req.user?.email || req.user?.sub || req.user?.id || body?.userEmail || body?.userId || '';
    }
    async getCoinsBalanceGet(req) {
        const targetUser = this.getTargetUserIdentifier(req);
        if (!targetUser) {
            throw new common_1.UnauthorizedException('User identification required for coin balance');
        }
        try {
            const centralRes = await this.centralService.getBalance(targetUser);
            if (centralRes && typeof centralRes.balance === 'number') {
                return centralRes;
            }
        }
        catch (_) { }
        return this.coinsService.getCoinsBalance(targetUser);
    }
    async getCoinsBalancePost(req, body) {
        const targetUser = this.getTargetUserIdentifier(req, body);
        if (!targetUser) {
            throw new common_1.UnauthorizedException('User identification required for coin balance');
        }
        try {
            const centralRes = await this.centralService.getBalance(targetUser);
            if (centralRes && typeof centralRes.balance === 'number') {
                return centralRes;
            }
        }
        catch (_) { }
        return this.coinsService.getCoinsBalance(targetUser);
    }
    async getCoinsHistory(req, limit) {
        const targetUser = this.getTargetUserIdentifier(req);
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.coinsService.getCoinsHistory(targetUser, limitNum);
    }
    async deductCoins(req, body) {
        const targetUser = this.getTargetUserIdentifier(req, body);
        if (!targetUser) {
            throw new common_1.UnauthorizedException('Target user identification required for coin deduction');
        }
        try {
            const centralRes = await this.centralService.deductCoins({
                userId: targetUser,
                featureName: body.featureName || 'ai_feature',
                metadata: body.metadata,
            });
            if (centralRes && typeof centralRes.remainingCoins === 'number') {
                return {
                    remainingCoins: centralRes.remainingCoins,
                    deductedCoins: centralRes.deductedCoins || body.amount || 5,
                    nextResetDate: centralRes.nextResetDate,
                };
            }
        }
        catch (_) { }
        return this.coinsService.deductCoins(targetUser, body.appId || 'cbt', body.featureName || 'ai_feature', body.amount || 5, body.metadata);
    }
};
exports.CoinsController = CoinsController;
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoinsController.prototype, "getCoinsBalanceGet", null);
__decorate([
    (0, common_1.Post)('balance'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CoinsController.prototype, "getCoinsBalancePost", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoinsController.prototype, "getCoinsHistory", null);
__decorate([
    (0, common_1.Post)('deduct'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CoinsController.prototype, "deductCoins", null);
exports.CoinsController = CoinsController = __decorate([
    (0, common_1.Controller)(['coins', 'api/v1/coins']),
    (0, common_1.UseGuards)(CoinsAuthGuard),
    __metadata("design:paramtypes", [coins_service_1.CoinsService,
        central_service_1.CentralService])
], CoinsController);
//# sourceMappingURL=coins.controller.js.map