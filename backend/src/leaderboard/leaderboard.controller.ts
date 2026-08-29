import { Controller, Get, Inject } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.module';
import { users } from '../db/schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Wait, let's see if this path is right. I will just skip the guard for now or use the global one if I can.

@Controller('leaderboard')
export class LeaderboardController {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  @Get('xp')
  async getXpLeaderboard(@Query()('limit') limit = 10) {
    return this.db.find()
      .sort({ xp_points: -1 })
      .limit(Number(limit))
      .select('fullName username xp_points level subscription_tier')
      .exec();
  }

  @Get('streak')
  async getStreakLeaderboard(@Query()('limit') limit = 10) {
    return this.db.find()
      .sort({ streak_count: -1 })
      .limit(Number(limit))
      .select('fullName username streak_count level subscription_tier')
      .exec();
  }
}
