import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [
  ],
  controllers: [LeaderboardController],
})
export class LeaderboardModule {}
