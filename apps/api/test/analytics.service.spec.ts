import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalyticsService } from "../src/analytics/analytics.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        count: vi.fn().mockImplementation(({ where }: any = {}) => {
          if (where?.streak) return Promise.resolve(45); // active users
          return Promise.resolve(120); // total users
        })
      },
      userLessonProgress: {
        count: vi.fn().mockResolvedValue(350),
        aggregate: vi.fn().mockResolvedValue({ _avg: { score: 88.5 } }),
        groupBy: vi.fn().mockResolvedValue([
          { lessonId: "l-1", _sum: { mistakes: 42 }, _count: { id: 50 } }
        ])
      },
      reviewLog: {
        count: vi.fn().mockResolvedValue(1200)
      },
      lesson: {
        findMany: vi.fn().mockResolvedValue([
          { id: "l-1", title: "Phát âm nguyên âm", unit: { title: "Unit 1" } }
        ])
      },
      cardReviewState: {
        findMany: vi.fn().mockResolvedValue([
          {
            cardId: "card-1",
            lapses: 4,
            stability: 1.2,
            difficulty: 7.5,
            state: "REVIEW",
            card: { term: "pronunciation", meaning: "Cách phát âm" }
          }
        ])
      }
    };

    service = new AnalyticsService(prisma);
  });

  it("should return system KPI overview", async () => {
    const overview = await service.getDashboardOverview();

    expect(overview.totalUsers).toBe(120);
    expect(overview.activeUsers).toBe(45);
    expect(overview.totalCompletedLessons).toBe(350);
    expect(overview.totalReviews).toBe(1200);
    expect(overview.averageAccuracy).toBe(89);
  });

  it("should calculate exercise drop-off / error rate heatmap", async () => {
    const heatmap = await service.getExerciseDropOffHeatmap();

    expect(heatmap.length).toBe(1);
    expect(heatmap[0].lessonTitle).toBe("Phát âm nguyên âm");
    expect(heatmap[0].totalMistakes).toBe(42);
    expect(heatmap[0].errorRate).toBeGreaterThan(0);
  });

  it("should identify top struggling vocabulary terms", async () => {
    const struggling = await service.getStrugglingVocabulary(5);

    expect(struggling.length).toBe(1);
    expect(struggling[0].term).toBe("pronunciation");
    expect(struggling[0].lapses).toBe(4);
  });

  it("should return DAU trend data", async () => {
    const trend = await service.getDauTrend();
    expect(trend.length).toBe(7);
    expect(trend[0].day).toBe("T2");
    expect(trend[0].activeUsers).toBeGreaterThan(0);
  });
});
