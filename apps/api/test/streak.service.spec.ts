import { describe, it, expect, beforeEach, vi } from "vitest";
import { StreakService } from "../src/gamification/streak.service";

describe("StreakService", () => {
  let service: StreakService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      userStreak: {
        upsert: vi.fn()
      }
    };

    service = new StreakService(prisma);
  });

  it("should initialize streak to 1 on very first activity", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      timezone: "UTC",
      streakData: null
    });
    prisma.userStreak.upsert.mockResolvedValue({
      currentStreak: 1,
      longestStreak: 1,
      freezeCount: 1
    });

    const result = await service.recordActivity("user-1");

    expect(result?.currentStreak).toBe(1);
    expect(result?.longestStreak).toBe(1);
    expect(result?.freezeUsed).toBe(false);
  });

  it("should not change streak if user is already active today", async () => {
    const today = new Date();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      timezone: "UTC",
      streakData: {
        currentStreak: 5,
        longestStreak: 10,
        freezeCount: 1,
        lastActivityAt: today
      }
    });

    const result = await service.recordActivity("user-1");

    expect(result?.currentStreak).toBe(5);
    expect(prisma.userStreak.upsert).not.toHaveBeenCalled();
  });

  it("should increment streak on consecutive day", async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      timezone: "UTC",
      streakData: {
        currentStreak: 5,
        longestStreak: 10,
        freezeCount: 1,
        lastActivityAt: yesterday
      }
    });
    prisma.userStreak.upsert.mockResolvedValue({
      currentStreak: 6,
      longestStreak: 10,
      freezeCount: 1
    });

    const result = await service.recordActivity("user-1");

    expect(result?.currentStreak).toBe(6);
    expect(result?.freezeUsed).toBe(false);
    expect(prisma.userStreak.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ currentStreak: 6 })
      })
    );
  });

  it("should consume 1 streak freeze and preserve streak if missed 1 day", async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      timezone: "UTC",
      streakData: {
        currentStreak: 12,
        longestStreak: 20,
        freezeCount: 2, // Has 2 freezes
        lastActivityAt: twoDaysAgo
      }
    });
    prisma.userStreak.upsert.mockResolvedValue({
      currentStreak: 13,
      longestStreak: 20,
      freezeCount: 1
    });

    const result = await service.recordActivity("user-1");

    expect(result?.currentStreak).toBe(13);
    expect(result?.freezeCount).toBe(1); // 1 freeze consumed
    expect(result?.freezeUsed).toBe(true);
  });

  it("should reset streak to 1 if missed 1 day without streak freeze", async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      timezone: "UTC",
      streakData: {
        currentStreak: 12,
        longestStreak: 20,
        freezeCount: 0, // No freeze!
        lastActivityAt: twoDaysAgo
      }
    });
    prisma.userStreak.upsert.mockResolvedValue({
      currentStreak: 1,
      longestStreak: 20,
      freezeCount: 0
    });

    const result = await service.recordActivity("user-1");

    expect(result?.currentStreak).toBe(1);
    expect(result?.freezeUsed).toBe(false);
  });
});
