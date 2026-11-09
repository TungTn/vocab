import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProgressService } from "../src/progress/progress.service";

describe("ProgressService", () => {
  let progressService: ProgressService;
  let prisma: any;
  let redis: any;

  beforeEach(() => {
    prisma = {
      lesson: {
        findUnique: vi.fn(),
        count: vi.fn()
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      userProgress: {
        upsert: vi.fn(),
        count: vi.fn()
      }
    };

    const redisClient = {
      zincrby: vi.fn().mockResolvedValue("10")
    };
    redis = {
      getClient: vi.fn().mockReturnValue(redisClient)
    };

    progressService = new ProgressService(prisma, redis);
  });

  it("should record completed lesson and award full XP and update streak", async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: "lesson-1",
      xpReward: 15,
      unit: { course: { id: "course-1" } }
    });

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      xp: 100,
      streak: 4,
      streakFreezeCount: 1,
      updatedAt: yesterday
    });

    prisma.userProgress.upsert.mockResolvedValue({
      id: "prog-1",
      completed: true,
      score: 100
    });

    const result = await progressService.recordLessonProgress("user-1", {
      lessonId: "lesson-1",
      courseId: "course-1",
      unitId: "unit-1",
      score: 100,
      completed: true
    });

    expect(result.xpEarned).toBe(15);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        xp: 115,
        streak: 5 // streak increased from 4 to 5!
      }
    });
    expect(redis.getClient().zincrby).toHaveBeenCalled();
  });

  it("should calculate course progress percentage correctly", async () => {
    prisma.lesson.count.mockResolvedValue(20);
    prisma.userProgress.count.mockResolvedValue(10);

    const result = await progressService.getCourseProgress("user-1", "course-1");

    expect(result.totalLessons).toBe(20);
    expect(result.completedLessons).toBe(10);
    expect(result.percentage).toBe(50);
  });
});
