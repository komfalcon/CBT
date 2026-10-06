import { Controller, Get, Post, Body, UseGuards, Request, Query, Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CoinsService } from './coins.service';
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
  constructor(private readonly coinsService: CoinsService) {}

  @Get('balance')
  async getCoinsBalanceGet(@Request() req: any) {
    return this.coinsService.getCoinsBalance(req.user.sub || req.user.id || req.user.email);
  }

  @Post('balance')
  async getCoinsBalancePost(@Request() req: any, @Body() body: { userId?: string; userEmail?: string }) {
    const targetUser = req.user?.sub || req.user?.id || req.user?.email || body.userId || body.userEmail;
    if (!targetUser) {
      throw new UnauthorizedException('User identification required for coin balance');
    }
    return this.coinsService.getCoinsBalance(targetUser);
  }

  @Get('history')
  async getCoinsHistory(@Request() req: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.coinsService.getCoinsHistory(req.user.sub || req.user.id || req.user.email, limitNum);
  }

  @Post('deduct')
  async deductCoins(
    @Request() req: any,
    @Body() body: { userId?: string; userEmail?: string; appId: string; featureName: string; amount?: number; metadata?: any }
  ) {
    const targetUser = req.user?.sub || req.user?.id || req.user?.email || body.userId || body.userEmail;
    if (!targetUser) {
      throw new UnauthorizedException('Target user identification required for coin deduction');
    }
    return this.coinsService.deductCoins(
      targetUser,
      body.appId || 'cbt',
      body.featureName || 'ai_feature',
      body.amount || 5,
      body.metadata
    );
  }
}
