import { Controller, Get, Post, Body, UseGuards, Request, Query, Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { CentralService } from '../central/central.service';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CoinsAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
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
}

@Controller(['coins', 'api/v1/coins'])
@UseGuards(CoinsAuthGuard)
export class CoinsController {
  constructor(
    private readonly coinsService: CoinsService,
    private readonly centralService: CentralService,
  ) {}

  private getTargetUserIdentifier(req: any, body?: any): string {
    return req.user?.aurikrex_id || req.user?.email || req.user?.sub || req.user?.id || body?.userEmail || body?.userId || '';
  }

  @Get('balance')
  async getCoinsBalanceGet(@Request() req: any) {
    const targetUser = this.getTargetUserIdentifier(req);
    if (!targetUser) {
      throw new UnauthorizedException('User identification required for coin balance');
    }

    try {
      const centralRes = await this.centralService.getBalance(targetUser);
      if (centralRes && typeof centralRes.balance === 'number') {
        return centralRes;
      }
    } catch (_) {}

    return this.coinsService.getCoinsBalance(targetUser);
  }

  @Post('balance')
  async getCoinsBalancePost(@Request() req: any, @Body() body: { userId?: string; userEmail?: string }) {
    const targetUser = this.getTargetUserIdentifier(req, body);
    if (!targetUser) {
      throw new UnauthorizedException('User identification required for coin balance');
    }

    try {
      const centralRes = await this.centralService.getBalance(targetUser);
      if (centralRes && typeof centralRes.balance === 'number') {
        return centralRes;
      }
    } catch (_) {}

    return this.coinsService.getCoinsBalance(targetUser);
  }

  @Get('history')
  async getCoinsHistory(@Request() req: any, @Query('limit') limit?: string) {
    const targetUser = this.getTargetUserIdentifier(req);
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.coinsService.getCoinsHistory(targetUser, limitNum);
  }

  @Post('deduct')
  async deductCoins(
    @Request() req: any,
    @Body() body: { userId?: string; userEmail?: string; appId: string; featureName: string; amount?: number; metadata?: any }
  ) {
    const targetUser = this.getTargetUserIdentifier(req, body);
    if (!targetUser) {
      throw new UnauthorizedException('Target user identification required for coin deduction');
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
    } catch (_) {}

    return this.coinsService.deductCoins(
      targetUser,
      body.appId || 'cbt',
      body.featureName || 'ai_feature',
      body.amount || 5,
      body.metadata
    );
  }
}
