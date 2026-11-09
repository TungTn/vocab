import { describe, it, expect } from "vitest";
import { calculateSM2 } from "../src/sm2";
import { CardRating } from "@linguaflow/shared-types";

describe("SM-2 Spaced Repetition Engine", () => {
  it("should set interval to 1 day on first successful recall", () => {
    const result = calculateSM2({
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      rating: CardRating.GOOD
    });

    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("should set interval to 6 days on second successful recall", () => {
    const result = calculateSM2({
      repetitions: 1,
      interval: 1,
      easeFactor: 2.5,
      rating: CardRating.GOOD
    });

    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it("should reset repetitions on AGAIN rating", () => {
    const result = calculateSM2({
      repetitions: 5,
      interval: 20,
      easeFactor: 2.5,
      rating: CardRating.AGAIN
    });

    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeLessThan(2.5);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
