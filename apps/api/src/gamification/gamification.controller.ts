import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UsePipes
} from "@nestjs/common";
import { StreakService } from "./streak.service";
import { LeaderboardService } from "./leaderboard.service";
import { ShopService } from "./shop.service";
import { AchievementsService } from "./achievements.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  LeagueTier,
  BuyShopItemRequestSchema,
  BuyShopItemRequest
} from "@linguaflow/shared-types";
import { PrismaService } from "../prisma/prisma.service";

@Controller("gamification")
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(
    private readonly streakService: StreakService,
    private readonly leaderboardService: LeaderboardService,
    private readonly shopService: ShopService,
    private readonly achievementsService: AchievementsService,
    private readonly prisma: PrismaService
  ) {}

  @Get("streak")
  async getStreak(@CurrentUser("userId") userId: string) {
    return this.streakService.getStreakInfo(userId);
  }

  @Get("leaderboard")
  async getLeaderboard(
    @CurrentUser("userId") userId: string,
    @Query("tier") tier?: LeagueTier
  ) {
    // If tier not provided, look up user's current league tier
    let targetTier = tier;
    if (!targetTier) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { league: true }
      });
      targetTier = (user?.league as LeagueTier) || LeagueTier.BRONZE;
    }

    return this.leaderboardService.getLeagueLeaderboard(userId, targetTier);
  }

  @Get("shop")
  async getShop(@CurrentUser("userId") userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { gems: true, hearts: true, streakFreezeCount: true }
    });

    const isDoubleXp = await this.shopService.isDoubleXpActive(userId);

    return {
      gems: user?.gems || 0,
      hearts: user?.hearts || 5,
      streakFreezeCount: user?.streakFreezeCount || 0,
      isDoubleXpActive: isDoubleXp,
      items: this.shopService.getCatalog()
    };
  }

  @Post("shop/buy")
  @UsePipes(new ZodValidationPipe(BuyShopItemRequestSchema))
  async buyItem(
    @CurrentUser("userId") userId: string,
    @Body() dto: BuyShopItemRequest
  ) {
    return this.shopService.buyItem(userId, dto.itemId);
  }

  @Get("achievements")
  async getAchievements(@CurrentUser("userId") userId: string) {
    // Auto check if any new achievements are unlocked
    await this.achievementsService.checkAndUnlock(userId);
    return this.achievementsService.getUserAchievements(userId);
  }

  @Post("admin/weekly-reset")
  async triggerWeeklyReset(@Query("week") week?: string) {
    return this.leaderboardService.processWeeklyLeagueReset(week);
  }
}
