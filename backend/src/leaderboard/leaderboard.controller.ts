import { Controller, Get, Inject, Query as NestQuery } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.module';
import { users } from '../db/schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  @Get('xp')
  async getXpLeaderboard(@NestQuery('limit') limit = 10) {
    return await this.db.select({
      fullName: users.fullName,
      
      xp_points: users.xp_points,
      level: users.level,
      subscription_tier: users.subscription_tier
    })
    .from(users)
    .where(eq(users.role, 'student' as any))
    .orderBy(desc(users.xp_points))
    .limit(Number(limit));
  }

  @Get('streak')
  async getStreakLeaderboard(@NestQuery('limit') limit = 10) {
    return await this.db.select({
      fullName: users.fullName,
      
      streak_count: users.streak_count,
      level: users.level,
      subscription_tier: users.subscription_tier
    })
    .from(users)
    .where(eq(users.role, 'student' as any))
    .orderBy(desc(users.streak_count))
    .limit(Number(limit));
  }
}
