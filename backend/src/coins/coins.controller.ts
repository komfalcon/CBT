import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('coins')
@UseGuards(JwtAuthGuard)
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get('balance')
  async getCoinsBalance(@Request() req: any) {
    return this.coinsService.getCoinsBalance(req.user.sub || req.user.id);
  }

  @Get('history')
  async getCoinsHistory(@Request() req: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.coinsService.getCoinsHistory(req.user.sub || req.user.id, limitNum);
  }

  @Post('deduct')
  async deductCoins(
    @Request() req: any,
    @Body() body: { appId: string; featureName: string; amount?: number; metadata?: any }
  ) {
    return this.coinsService.deductCoins(
      req.user.sub || req.user.id,
      body.appId || 'cbt',
      body.featureName || 'ai_feature',
      body.amount || 5,
      body.metadata
    );
  }
}
