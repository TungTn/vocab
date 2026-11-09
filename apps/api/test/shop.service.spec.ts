import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShopService } from "../src/gamification/shop.service";
import { BadRequestException } from "@nestjs/common";

describe("ShopService", () => {
  let service: ShopService;
  let prisma: any;
  let redis: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      userStreak: {
        upsert: vi.fn()
      },
      $transaction: vi.fn().mockImplementation(async (promises: any[]) => {
        return Promise.all(promises);
      })
    };

    const redisClient = {
      set: vi.fn().mockResolvedValue("OK"),
      get: vi.fn().mockResolvedValue(null)
    };
    redis = {
      getClient: vi.fn().mockReturnValue(redisClient)
    };

    service = new ShopService(prisma, redis);
  });

  it("should return the shop catalog", () => {
    const catalog = service.getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(3);
    expect(catalog.some((i) => i.id === "HEART_REFILL")).toBe(true);
    expect(catalog.some((i) => i.id === "STREAK_FREEZE")).toBe(true);
  });

  it("should reject purchase when user has insufficient gems", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      gems: 20 // Heart refill costs 50
    });

    await expect(service.buyItem("user-1", "HEART_REFILL")).rejects.toThrow(
      BadRequestException
    );
  });

  it("should buy Heart Refill and restore hearts to 5", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      gems: 100,
      hearts: 2
    });

    const result = await service.buyItem("user-1", "HEART_REFILL");

    expect(result.success).toBe(true);
    expect(result.remainingGems).toBe(50); // 100 - 50
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hearts: 5, gems: 50 })
      })
    );
  });

  it("should reject Heart Refill if hearts are already full (5/5)", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      gems: 100,
      hearts: 5
    });

    await expect(service.buyItem("user-1", "HEART_REFILL")).rejects.toThrow(
      BadRequestException
    );
  });

  it("should buy Streak Freeze and increment freeze count", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      gems: 200,
      streakData: { freezeCount: 1 }
    });

    const result = await service.buyItem("user-1", "STREAK_FREEZE");

    expect(result.success).toBe(true);
    expect(result.remainingGems).toBe(100); // 200 - 100
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("should reject Streak Freeze if already holding 3", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      gems: 200,
      streakData: { freezeCount: 3 }
    });

    await expect(service.buyItem("user-1", "STREAK_FREEZE")).rejects.toThrow(
      BadRequestException
    );
  });
});
