import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlacementService } from "../src/placement/placement.service";
import { LanguageLevel } from "@linguaflow/shared-types";

describe("PlacementService", () => {
  let placementService: PlacementService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn()
      },
      placementTestResult: {
        create: vi.fn().mockResolvedValue({ id: "test-result-1" }),
        findFirst: vi.fn()
      },
      userProfile: {
        upsert: vi.fn().mockResolvedValue({ id: "profile-1" })
      }
    };

    placementService = new PlacementService(prisma);
  });

  it("should return 20 questions without exposing correct answers", () => {
    const questions = placementService.getQuestions();

    expect(questions.length).toBe(20);
    for (const q of questions) {
      expect((q as any).correctAnswer).toBeUndefined();
      expect(q.prompt).toBeDefined();
      expect(q.options.length).toBeGreaterThan(1);
    }
  });

  it("should assess Level C1 for score >= 90%", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-c1",
      username: "c1student"
    });

    // Provide 19 correct answers out of 20 (95%)
    const answers = [
      { questionId: 1, selectedAnswer: "is" },
      { questionId: 2, selectedAnswer: "goes" },
      { questionId: 3, selectedAnswer: "were" },
      { questionId: 4, selectedAnswer: "an" },
      { questionId: 5, selectedAnswer: "since" },
      { questionId: 6, selectedAnswer: "will" },
      { questionId: 7, selectedAnswer: "faster" },
      { questionId: 8, selectedAnswer: "yet" },
      { questionId: 9, selectedAnswer: "was" },
      { questionId: 10, selectedAnswer: "lived" },
      { questionId: 11, selectedAnswer: "to tell" },
      { questionId: 12, selectedAnswer: "had" },
      { questionId: 13, selectedAnswer: "had he" },
      { questionId: 14, selectedAnswer: "started" },
      { questionId: 15, selectedAnswer: "in" },
      { questionId: 16, selectedAnswer: "would have" },
      { questionId: 17, selectedAnswer: "whereupon" },
      { questionId: 18, selectedAnswer: "should students" },
      { questionId: 19, selectedAnswer: "rise" },
      { questionId: 20, selectedAnswer: "thereby" }
    ];

    const result = await placementService.evaluateTest("user-c1", {
      targetLang: "en",
      answers
    });

    expect(result.score).toBe(100);
    expect(result.assessedLevel).toBe(LanguageLevel.C1);
    expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ currentLevel: LanguageLevel.C1 })
      })
    );
  });

  it("should assess Level A1 for beginner score (< 35%)", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-a1",
      username: "a1student"
    });

    const answers = [
      { questionId: 1, selectedAnswer: "wrong" },
      { questionId: 2, selectedAnswer: "wrong" }
    ];

    const result = await placementService.evaluateTest("user-a1", {
      targetLang: "en",
      answers
    });

    expect(result.score).toBe(0);
    expect(result.assessedLevel).toBe(LanguageLevel.A1);
  });
});
