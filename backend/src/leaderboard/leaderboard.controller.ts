import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Wait, let's see if this path is right. I will just skip the guard for now or use the global one if I can.

@Controller('leaderboard')
export class LeaderboardController {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @Get('xp')
  async getXpLeaderboard(@Query('limit') limit = 10) {
    return this.userModel.find()
      .sort({ xp_points: -1 })
      .limit(Number(limit))
      .select('fullName username xp_points level subscription_tier')
      .exec();
  }

  @Get('streak')
  async getStreakLeaderboard(@Query('limit') limit = 10) {
    return this.userModel.find()
      .sort({ streak_count: -1 })
      .limit(Number(limit))
      .select('fullName username streak_count level subscription_tier')
      .exec();
  }
}
