import { CardRating } from "@linguaflow/shared-types";

export interface SM2Input {
  repetitions: number;
  interval: number; // in days
  easeFactor: number;
  rating: CardRating; // 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
}

export interface SM2Output {
  repetitions: number;
  interval: number;
  easeFactor: number;
}

/**
 * SuperMemo 2 (SM-2) Spaced Repetition calculation
 */
export function calculateSM2(input: SM2Input): SM2Output {
  let { repetitions, interval, easeFactor, rating } = input;

  // Grade scale from 0 to 5 in original SM-2; mapped from CardRating 1-4:
  // Again (1) -> 1, Hard (2) -> 3, Good (3) -> 4, Easy (4) -> 5
  const gradeMap: Record<CardRating, number> = {
    [CardRating.AGAIN]: 1,
    [CardRating.HARD]: 3,
    [CardRating.GOOD]: 4,
    [CardRating.EASY]: 5
  };

  const grade = gradeMap[rating];

  if (grade >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  // EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  return {
    repetitions,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100
  };
}
