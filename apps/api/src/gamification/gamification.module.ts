import { Module } from "@nestjs/common";
import { StreakService } from "./streak.service";
import { LeaderboardService } from "./leaderboard.service";
import { ShopService } from "./shop.service";
import { AchievementsService } from "./achievements.service";
import { GamificationController } from "./gamification.controller";

@Module({
  controllers: [GamificationController],
  providers: [
    StreakService,
    LeaderboardService,
    ShopService,
    AchievementsService
  ],
  exports: [
    StreakService,
    LeaderboardService,
    ShopService,
    AchievementsService
  ]
})
export class GamificationModule {}
