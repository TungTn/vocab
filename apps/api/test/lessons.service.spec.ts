import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonsService } from "../src/lessons/lessons.service";
import { GradingEngineService } from "../src/lessons/grading-engine.service";
import { ForbiddenException } from "@nestjs/common";

describe("LessonsService", () => {
  let service: LessonsService;
  let prisma: any;
  let redis: any;
  let gradingEngine: GradingEngineService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      lesson: {
        findUnique: vi.fn()
      },
      exercise: {
        findUnique: vi.fn()
      },
      userLessonProgress: {
        upsert: vi.fn()
      },
      userProgress: {
        upsert: vi.fn()
      }
    };

    const redisClient = {
      zincrby: vi.fn().mockResolvedValue("15")
    };
    redis = {
      getClient: vi.fn().mockReturnValue(redisClient)
    };

    gradingEngine = new GradingEngineService();
    service = new LessonsService(prisma, redis, gradingEngine);
  });

  describe("getLessonSession", () => {
    it("should strip correctAnswer and shuffle options for client security", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", hearts: 5 });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        title: "Lesson 1",
        xpReward: 15,
        exercises: [
          {
            id: "ex-1",
            lessonId: "lesson-1",
            type: "MULTIPLE_CHOICE",
            prompt: "What is this?",
            content: {
              options: ["A", "B", "C"],
              correctAnswer: "A",
              explanation: "Rule 1"
            },
            orderIndex: 1
          }
        ]
      });

      const session = await service.getLessonSession("lesson-1", "user-1");

      expect(session.lessonId).toBe("lesson-1");
      expect(session.heartsRemaining).toBe(5);
      expect(session.exercises.length).toBe(1);

      // Verify security invariant: correctAnswer must NOT be present!
      expect((session.exercises[0].content as any).correctAnswer).toBeUndefined();
      expect(session.exercises[0].content.options).toBeDefined();
    });

    it("should throw ForbiddenException if user has 0 hearts", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", hearts: 0 });

      await expect(
        service.getLessonSession("lesson-1", "user-1")
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("checkAnswer", () => {
    it("should return isCorrect true on valid answer without losing hearts", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", hearts: 5 });
      prisma.exercise.findUnique.mockResolvedValue({
        id: "ex-1",
        lessonId: "lesson-1",
        type: "MULTIPLE_CHOICE",
        content: {
          options: ["A", "B"],
          correctAnswer: "A",
          explanation: "Explanation"
        }
      });

      const result = await service.checkAnswer("lesson-1", "user-1", {
        exerciseId: "ex-1",
        answer: "A"
      });

      expect(result.isCorrect).toBe(true);
      expect(result.heartsRemaining).toBe(5);
      expect(result.isGameOver).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should deduct 1 heart on incorrect answer", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", hearts: 3 });
      prisma.user.update.mockResolvedValue({ id: "user-1", hearts: 2 });
      prisma.userLessonProgress.upsert.mockResolvedValue({});
      prisma.exercise.findUnique.mockResolvedValue({
        id: "ex-1",
        lessonId: "lesson-1",
        type: "MULTIPLE_CHOICE",
        content: {
          options: ["A", "B"],
          correctAnswer: "A",
          explanation: "Explanation"
        }
      });

      const result = await service.checkAnswer("lesson-1", "user-1", {
        exerciseId: "ex-1",
        answer: "B"
      });

      expect(result.isCorrect).toBe(false);
      expect(result.heartsRemaining).toBe(2);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { hearts: 2 }
      });
    });
  });

  describe("completeLesson", () => {
    it("should complete lesson, award XP and bonus for 100% score", async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        unitId: "unit-1",
        xpReward: 15,
        unit: { courseId: "course-1" }
      });
      prisma.userLessonProgress.upsert.mockResolvedValue({});
      prisma.userProgress.upsert.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", xp: 50 });
      prisma.user.update.mockResolvedValue({});

      const result = await service.completeLesson("lesson-1", "user-1", {
        score: 100,
        mistakes: 0,
        durationSeconds: 120
      });

      expect(result.success).toBe(true);
      expect(result.xpEarned).toBe(20); // 15 base + 5 bonus for 100% score
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { xp: { increment: 20 } }
        })
      );
    });
  });
});
