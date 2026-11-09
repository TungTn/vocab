import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { LeagueTier, LeaderboardMember, LeagueLeaderboard } from "@linguaflow/shared-types";

const TIER_ORDER: LeagueTier[] = [
  LeagueTier.BRONZE,
  LeagueTier.SILVER,
  LeagueTier.GOLD,
  LeagueTier.SAPPHIRE,
  LeagueTier.RUBY,
  LeagueTier.DIAMOND
];

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  getWeekIdentifier(d: Date = new Date()): string {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  getLeaderboardKey(tier: LeagueTier, weekIdentifier?: string): string {
    const week = weekIdentifier || this.getWeekIdentifier();
    return `leaderboard:league:${tier}:week:${week}`;
  }

  async recordXp(userId: string, xpGained: number, tier: LeagueTier = LeagueTier.BRONZE) {
    if (xpGained <= 0) return;
    const key = this.getLeaderboardKey(tier);
    await this.redis.getClient().zincrby(key, xpGained, userId);
  }

  async getLeagueLeaderboard(userId: string, tier: LeagueTier = LeagueTier.BRONZE): Promise<LeagueLeaderboard> {
    const weekIdentifier = this.getWeekIdentifier();
    const key = this.getLeaderboardKey(tier, weekIdentifier);
    const client = this.redis.getClient();

    // 1. Get Top 30 with scores from Redis Sorted Set
    const rawMembers = await client.zrevrange(key, 0, 29, "WITHSCORES");
    const memberEntries: { userId: string; xp: number }[] = [];

    for (let i = 0; i < rawMembers.length; i += 2) {
      memberEntries.push({
        userId: rawMembers[i],
        xp: Math.round(Number(rawMembers[i + 1]))
      });
    }

    // 2. Fetch user details from DB
    const userIds = memberEntries.map((m) => m.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatarUrl: true }
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const totalCount = await client.zcard(key);

    // 3. Assemble leaderboard members with zones
    const members: LeaderboardMember[] = memberEntries.map((m, index) => {
      const rank = index + 1;
      let zone: "PROMOTE" | "STAY" | "DEMOTE" = "STAY";

      // Top 7 are in promote zone (unless highest tier DIAMOND)
      if (rank <= 7 && tier !== LeagueTier.DIAMOND) {
        zone = "PROMOTE";
      }
      // Bottom 5 (if at least 15 people in leaderboard) are in demote zone (unless lowest tier BRONZE)
      else if (totalCount >= 15 && rank > totalCount - 5 && tier !== LeagueTier.BRONZE) {
        zone = "DEMOTE";
      }

      const user = userMap.get(m.userId);
      return {
        userId: m.userId,
        username: user?.username || "Learner",
        avatarUrl: user?.avatarUrl || null,
        xp: m.xp,
        rank,
        zone
      };
    });

    // 4. Current user rank & XP
    const userRankIndex = await client.zrevrank(key, userId);
    const userScore = await client.zscore(key, userId);

    return {
      tier,
      weekIdentifier,
      members,
      currentUserRank: userRankIndex !== null ? userRankIndex + 1 : null,
      currentUserXp: userScore !== null ? Math.round(Number(userScore)) : null
    };
  }

  /**
   * Weekly Reset Job:
   * Runs at 00:00 UTC Monday:
   * - Evaluates past week's leaderboards across all tiers
   * - Promotes Top 7, Demotes Bottom 5
   * - Awards Gems for Top 3 winners (1st: 100, 2nd: 50, 3rd: 25)
   */
  async processWeeklyLeagueReset(pastWeekIdentifier?: string) {
    const week = pastWeekIdentifier || this.getWeekIdentifier();
    const client = this.redis.getClient();
    const summary = { promoted: 0, demoted: 0, rewardsAwarded: 0 };

    for (let tIdx = 0; tIdx < TIER_ORDER.length; tIdx++) {
      const currentTier = TIER_ORDER[tIdx];
      const key = this.getLeaderboardKey(currentTier, week);
      const totalMembers = await client.zcard(key);
      if (totalMembers === 0) continue;

      const raw = await client.zrevrange(key, 0, -1, "WITHSCORES");
      const userList: { userId: string; xp: number }[] = [];
      for (let i = 0; i < raw.length; i += 2) {
        userList.push({ userId: raw[i], xp: Number(raw[i + 1]) });
      }

      // 1. Award Gems to Top 3
      if (userList.length > 0) {
        const top1 = userList[0];
        await this.prisma.user.update({
          where: { id: top1.userId },
          data: { gems: { increment: 100 } }
        });
        summary.rewardsAwarded += 1;
      }
      if (userList.length > 1) {
        const top2 = userList[1];
        await this.prisma.user.update({
          where: { id: top2.userId },
          data: { gems: { increment: 50 } }
        });
        summary.rewardsAwarded += 1;
      }
      if (userList.length > 2) {
        const top3 = userList[2];
        await this.prisma.user.update({
          where: { id: top3.userId },
          data: { gems: { increment: 25 } }
        });
        summary.rewardsAwarded += 1;
      }

      // 2. Promote Top 7 (if not DIAMOND)
      if (tIdx < TIER_ORDER.length - 1) {
        const nextTier = TIER_ORDER[tIdx + 1];
        const promotedUsers = userList.slice(0, 7).map((u) => u.userId);
        if (promotedUsers.length > 0) {
          await this.prisma.user.updateMany({
            where: { id: { in: promotedUsers } },
            data: { league: nextTier }
          });
          summary.promoted += promotedUsers.length;
        }
      }

      // 3. Demote Bottom 5 (if not BRONZE and at least 15 participants)
      if (tIdx > 0 && userList.length >= 15) {
        const prevTier = TIER_ORDER[tIdx - 1];
        const demotedUsers = userList.slice(-5).map((u) => u.userId);
        if (demotedUsers.length > 0) {
          await this.prisma.user.updateMany({
            where: { id: { in: demotedUsers } },
            data: { league: prevTier }
          });
          summary.demoted += demotedUsers.length;
        }
      }
    }

    this.logger.log(`Weekly reset for ${week} complete: ${JSON.stringify(summary)}`);
    return summary;
  }
}
