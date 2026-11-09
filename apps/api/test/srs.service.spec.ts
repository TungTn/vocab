import { describe, it, expect, beforeEach, vi } from "vitest";
import { SrsService } from "../src/srs/srs.service";
import { CardRating, CardState } from "@linguaflow/shared-types";

describe("SrsService", () => {
  let service: SrsService;
  let prisma: any;
  let redis: any;

  beforeEach(() => {
    prisma = {
      cardReviewState: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn()
      },
      flashcard: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn()
      },
      reviewLog: {
        findUnique: vi.fn(),
        create: vi.fn(),
        count: vi.fn()
      },
      user: {
        update: vi.fn()
      },
      $transaction: vi.fn().mockImplementation(async (promises: any[]) => {
        return Promise.all(promises);
      })
    };

    const redisClient = {
      zincrby: vi.fn().mockResolvedValue("10")
    };
    redis = {
      getClient: vi.fn().mockReturnValue(redisClient)
    };

    service = new SrsService(prisma, redis);
  });

  it("should assemble review queue prioritizing due cards then filling with new cards", async () => {
    const now = new Date();

    // 1 due card
    prisma.cardReviewState.findMany.mockResolvedValue([
      {
        cardId: "card-due-1",
        state: CardState.REVIEW,
        stability: 3.0,
        difficulty: 5.0,
        reps: 2,
        lapses: 0,
        dueAt: new Date(now.getTime() - 10000),
        scheduledDays: 3,
        card: { id: "card-due-1", term: "diligent", meaning: "siêng năng" }
      }
    ]);

    // 2 new cards
    prisma.flashcard.findMany.mockResolvedValue([
      { id: "card-new-1", term: "hesitate", meaning: "do dự" },
      { id: "card-new-2", term: "fluent", meaning: "lưu loát" }
    ]);

    const queue = await service.getReviewQueue("user-1", {
      limit: 10,
      catchUpMode: false
    });

    expect(queue.length).toBe(3);
    expect(queue[0].id).toBe("card-due-1");
    expect(queue[0].reviewState.state).toBe(CardState.REVIEW);
    expect(queue[1].id).toBe("card-new-1");
    expect(queue[1].reviewState.state).toBe(CardState.NEW);
  });

  it("should handle review submission with FSRS calculation and transaction", async () => {
    prisma.reviewLog.findUnique.mockResolvedValue(null);
    prisma.flashcard.findUnique.mockResolvedValue({
      id: "card-1",
      term: "accomplish"
    });
    prisma.cardReviewState.findUnique.mockResolvedValue(null); // First time review

    prisma.cardReviewState.upsert.mockResolvedValue({
      cardId: "card-1",
      state: CardState.REVIEW,
      stability: 2.5,
      difficulty: 4.8,
      reps: 1,
      lapses: 0,
      scheduledDays: 3,
      dueAt: new Date()
    });

    const result = await service.submitReview("user-1", {
      cardId: "card-1",
      rating: CardRating.GOOD
    });

    expect(result.cardId).toBe("card-1");
    expect(result.intervalDays).toBeGreaterThanOrEqual(1);
    expect(result.xpEarned).toBe(5);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(redis.getClient().zincrby).toHaveBeenCalled();
  });

  it("should handle idempotency key and avoid double processing", async () => {
    prisma.reviewLog.findUnique.mockResolvedValue({
      cardId: "card-1",
      rating: 3,
      scheduledDays: 5,
      stability: 3.5,
      difficulty: 4.8
    });

    const result = await service.submitReview("user-1", {
      cardId: "card-1",
      rating: CardRating.GOOD,
      idempotencyKey: "unique-submission-token-123"
    });

    expect(result.isDuplicate).toBe(true);
    expect(result.intervalDays).toBe(5);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("should calculate correct SRS stats for user", async () => {
    prisma.reviewLog.count.mockResolvedValue(15);
    prisma.cardReviewState.count
      .mockResolvedValueOnce(8) // dueCount
      .mockResolvedValueOnce(12) // learningCount
      .mockResolvedValueOnce(45); // masteredCount
    prisma.flashcard.count.mockResolvedValue(150);

    const stats = await service.getStats("user-1");

    expect(stats.reviewedToday).toBe(15);
    expect(stats.dueCount).toBe(8);
    expect(stats.learningCount).toBe(12);
    expect(stats.masteredCount).toBe(45);
    expect(stats.totalCards).toBe(150);
  });
});
