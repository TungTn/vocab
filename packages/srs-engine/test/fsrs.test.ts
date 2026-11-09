import { describe, it, expect } from "vitest";
import { calculateFSRS, calculateRetrievability } from "../src/fsrs";
import { CardRating, CardState } from "@linguaflow/shared-types";

describe("FSRS v4 Spaced Repetition Engine", () => {
  it("should calculate initial stability and difficulty for NEW card across all ratings", () => {
    const newCard = {
      state: CardState.NEW,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      scheduledDays: 0
    };

    const again = calculateFSRS(newCard, CardRating.AGAIN);
    expect(again.card.state).toBe(CardState.RELEARNING);
    expect(again.card.lapses).toBe(1);
    expect(again.interval).toBe(1);

    const hard = calculateFSRS(newCard, CardRating.HARD);
    expect(hard.card.state).toBe(CardState.LEARNING);
    expect(hard.card.stability).toBe(1.0);
    expect(hard.interval).toBeGreaterThanOrEqual(1);

    const good = calculateFSRS(newCard, CardRating.GOOD);
    expect(good.card.state).toBe(CardState.REVIEW);
    expect(good.card.stability).toBe(2.5);
    expect(good.interval).toBeGreaterThanOrEqual(2);

    const easy = calculateFSRS(newCard, CardRating.EASY);
    expect(easy.card.state).toBe(CardState.REVIEW);
    expect(easy.card.stability).toBe(5.0);
    expect(easy.interval).toBeGreaterThanOrEqual(4);
  });

  it("should increase interval on subsequent GOOD reviews", () => {
    let card = {
      state: CardState.NEW,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      scheduledDays: 0
    };

    // Review 1
    const r1 = calculateFSRS(card, CardRating.GOOD);
    expect(r1.interval).toBeGreaterThanOrEqual(2);
    card = r1.card;

    // Review 2 after elapsed days
    const r2 = calculateFSRS(card, CardRating.GOOD, r1.interval);
    expect(r2.interval).toBeGreaterThan(r1.interval);
    card = r2.card;

    // Review 3 after elapsed days
    const r3 = calculateFSRS(card, CardRating.EASY, r2.interval);
    expect(r3.interval).toBeGreaterThan(r2.interval);
  });

  it("should reset interval to 1 and enter RELEARNING when user marks AGAIN on a mature card", () => {
    const matureCard = {
      state: CardState.REVIEW,
      stability: 30,
      difficulty: 4.5,
      reps: 6,
      lapses: 0,
      scheduledDays: 30
    };

    const result = calculateFSRS(matureCard, CardRating.AGAIN, 30);
    expect(result.card.state).toBe(CardState.RELEARNING);
    expect(result.card.lapses).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.card.stability).toBeLessThan(matureCard.stability);
    expect(result.card.difficulty).toBeGreaterThan(matureCard.difficulty);
  });

  it("should calculate retrievability decay over time", () => {
    const stability = 10; // 10 days
    const rAtZero = calculateRetrievability(stability, 0);
    expect(rAtZero).toBe(1.0);

    const rAtTen = calculateRetrievability(stability, 10);
    expect(rAtTen).toBeLessThan(1.0);
    expect(rAtTen).toBeGreaterThan(0.7);

    const rAtThirty = calculateRetrievability(stability, 30);
    expect(rAtThirty).toBeLessThan(rAtTen);
  });
});
