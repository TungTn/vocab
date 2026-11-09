import { describe, it, expect, beforeEach, vi } from "vitest";
import { AchievementsService, SYSTEM_ACHIEVEMENTS } from "../src/gamification/achievements.service";

describe("AchievementsService", () => {
  let service: AchievementsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      achievement: {
        upsert: vi.fn().mockResolvedValue({})
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({})
      },
      userLessonProgress: {
        count: vi.fn().mockResolvedValue(0)
      },
      userAchievement: {
        create: vi.fn().mockResolvedValue({})
      }
    };

    service = new AchievementsService(prisma);
  });

  it("should seed system achievements on init", async () => {
    await service.onModuleInit();
    expect(prisma.achievement.upsert).toHaveBeenCalledTimes(SYSTEM_ACHIEVEMENTS.length);
  });

  it("should unlock streak achievement when condition is met", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      streakData: { currentStreak: 3 },
      xp: 0,
      achievements: []
    });
    prisma.userLessonProgress.count.mockResolvedValue(0);

    const unlocked = await service.checkAndUnlock("user-1");

    expect(unlocked).toContain("Cháy Bỏng Khởi Đầu (Wildfire)");
    expect(prisma.userAchievement.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        achievementId: "STREAK_3"
      }
    });
    // Check gems awarded
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { gems: { increment: 20 } }
    });
  });

  it("should not re-unlock already unlocked achievements", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      streakData: { currentStreak: 5 },
      xp: 50,
      achievements: [
        { achievementId: "STREAK_3", unlockedAt: new Date() }
      ]
    });
    prisma.userLessonProgress.count.mockResolvedValue(0);

    const unlocked = await service.checkAndUnlock("user-1");

    expect(unlocked).not.toContain("Cháy Bỏng Khởi Đầu (Wildfire)");
    expect(prisma.userAchievement.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { achievementId: "STREAK_3" } })
    );
  });

  it("should return all achievements with progress and unlock status", async () => {
    const unlockTime = new Date();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      streakData: { currentStreak: 5 },
      xp: 150,
      achievements: [
        { achievementId: "STREAK_3", unlockedAt: unlockTime }
      ]
    });
    prisma.userLessonProgress.count.mockResolvedValue(2);

    const achievements = await service.getUserAchievements("user-1");

    expect(achievements.length).toBe(SYSTEM_ACHIEVEMENTS.length);
    const streak3 = achievements.find((a) => a.id === "STREAK_3");
    expect(streak3?.unlocked).toBe(true);
    expect(streak3?.progress).toBe(100);

    const streak7 = achievements.find((a) => a.id === "STREAK_7");
    expect(streak7?.unlocked).toBe(false);
    expect(streak7?.progress).toBe(Math.round((5 / 7) * 100));
  });
});
