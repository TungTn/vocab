import { describe, it, expect, beforeEach, vi } from "vitest";
import { LeaderboardService } from "../src/gamification/leaderboard.service";
import { LeagueTier } from "@linguaflow/shared-types";

describe("LeaderboardService", () => {
  let service: LeaderboardService;
  let prisma: any;
  let redis: any;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn()
      }
    };

    const redisClient = {
      zincrby: vi.fn().mockResolvedValue("50"),
      zrevrange: vi.fn(),
      zcard: vi.fn(),
      zrevrank: vi.fn(),
      zscore: vi.fn()
    };
    redis = {
      getClient: vi.fn().mockReturnValue(redisClient)
    };

    service = new LeaderboardService(prisma, redis);
  });

  it("should record XP using Redis zincrby", async () => {
    await service.recordXp("user-1", 30, LeagueTier.SILVER);
    expect(redis.getClient().zincrby).toHaveBeenCalledWith(
      expect.stringContaining("leaderboard:league:SILVER"),
      30,
      "user-1"
    );
  });

  it("should return leaderboard members with promote/stay/demote zones", async () => {
    // 20 participants
    const rawScores: string[] = [];
    const mockUsers = [];
    for (let i = 1; i <= 20; i++) {
      rawScores.push(`user-${i}`, `${1000 - i * 10}`);
      mockUsers.push({ id: `user-${i}`, username: `player_${i}`, avatarUrl: null });
    }

    redis.getClient().zrevrange.mockResolvedValue(rawScores);
    redis.getClient().zcard.mockResolvedValue(20);
    redis.getClient().zrevrank.mockResolvedValue(2); // user-3 is rank 3 (0-indexed 2)
    redis.getClient().zscore.mockResolvedValue("970");
    prisma.user.findMany.mockResolvedValue(mockUsers);

    const result = await service.getLeagueLeaderboard("user-3", LeagueTier.SILVER);

    expect(result.members.length).toBe(20);
    expect(result.currentUserRank).toBe(3);
    expect(result.currentUserXp).toBe(970);

    // Rank 1-7 in PROMOTE zone
    expect(result.members[0].zone).toBe("PROMOTE");
    expect(result.members[6].zone).toBe("PROMOTE");

    // Rank 8 in STAY zone
    expect(result.members[7].zone).toBe("STAY");

    // Bottom 5 (rank 16-20) in DEMOTE zone
    expect(result.members[19].zone).toBe("DEMOTE");
  });

  it("should promote top 7 and demote bottom 5 during weekly reset", async () => {
    const rawScores: string[] = [];
    for (let i = 1; i <= 20; i++) {
      rawScores.push(`user-${i}`, `${500 - i * 10}`);
    }

    redis.getClient().zcard.mockImplementation(async (key: string) => {
      return key.includes("SILVER") ? 20 : 0;
    });
    redis.getClient().zrevrange.mockResolvedValue(rawScores);

    const summary = await service.processWeeklyLeagueReset("2026-W44");

    expect(summary.rewardsAwarded).toBe(3); // Top 3 got gems
    expect(summary.promoted).toBe(7); // Top 7 promoted to next tier
    expect(summary.demoted).toBe(5); // Bottom 5 demoted to prev tier
  });
});
