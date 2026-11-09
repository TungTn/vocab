import { CardRating, CardState } from "@linguaflow/shared-types";

export interface FSRSCard {
  state: CardState;
  stability: number; // S (days)
  difficulty: number; // D (1 to 10)
  reps: number;
  lapses: number;
  scheduledDays: number;
  lastReview?: Date | null;
}

export interface FSRSResult {
  card: FSRSCard;
  interval: number; // in days
  retrievability: number; // Probability of recall (0.0 to 1.0)
}

export interface FSRSConfig {
  requestRetention: number; // Target retention rate, default 0.9 (90%)
  maximumInterval: number; // Maximum review interval, default 36500 (100 years)
  w: number[]; // FSRS v4 model weights
}

export const DEFAULT_FSRS_CONFIG: FSRSConfig = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  w: [0.4, 0.9, 2.3, 10.9, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
};

/**
 * Calculates Retrievability R: estimated probability of recalling a card after t days.
 * R(t, S) = (1 + Factor * t / S)^(-w)
 */
export function calculateRetrievability(stability: number, elapsedDays: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1.0;
  // Standard power decay formula
  const decayFactor = 19 / 81; // ~0.2346
  return Math.pow(1 + (decayFactor * elapsedDays) / stability, -0.5);
}

/**
 * Free Spaced Repetition Scheduler (FSRS v4) Implementation
 */
export function calculateFSRS(
  card: FSRSCard,
  rating: CardRating,
  elapsedDays: number = 0,
  config: FSRSConfig = DEFAULT_FSRS_CONFIG
): FSRSResult {
  const updated: FSRSCard = { ...card };
  let newStability = card.stability;
  let newDifficulty = card.difficulty;

  if (card.state === CardState.NEW) {
    // Initial ratings for new cards
    switch (rating) {
      case CardRating.AGAIN:
        newStability = 0.4;
        newDifficulty = 7.5;
        updated.state = CardState.RELEARNING;
        updated.lapses = 1;
        break;
      case CardRating.HARD:
        newStability = 1.0;
        newDifficulty = 6.0;
        updated.state = CardState.LEARNING;
        break;
      case CardRating.GOOD:
        newStability = 2.5;
        newDifficulty = 4.8;
        updated.state = CardState.REVIEW;
        break;
      case CardRating.EASY:
        newStability = 5.0;
        newDifficulty = 3.2;
        updated.state = CardState.REVIEW;
        break;
    }
    updated.reps = 1;
  } else {
    // Card in Learning, Review, or Relearning state
    const retrievability = calculateRetrievability(card.stability, Math.max(1, elapsedDays));

    if (rating === CardRating.AGAIN) {
      // Forget event
      updated.state = CardState.RELEARNING;
      updated.lapses += 1;
      newDifficulty = Math.min(10, Math.max(1, card.difficulty + 0.6));
      newStability = Math.max(0.2, card.stability * 0.3);
    } else {
      updated.reps += 1;
      updated.state = CardState.REVIEW;

      // Adjust difficulty: Hard increases D, Easy decreases D
      const dDelta = rating === CardRating.HARD ? 0.35 : rating === CardRating.EASY ? -0.4 : 0;
      newDifficulty = Math.min(10, Math.max(1, card.difficulty + dDelta));

      // Adjust stability based on recall success and retrievability
      const recallFactor = (11 - newDifficulty) / 5;
      if (rating === CardRating.HARD) {
        newStability = Math.max(1.2, card.stability * 1.25);
      } else if (rating === CardRating.GOOD) {
        newStability = Math.max(card.stability * 1.5, card.stability * (1 + recallFactor * Math.max(0.3, 1 - retrievability) * 2));
      } else if (rating === CardRating.EASY) {
        newStability = Math.max(card.stability * 2.2, card.stability * (1.5 + recallFactor * 2.5 * Math.max(0.3, 1 - retrievability)));
      }
    }
  }

  // Interval formula: I = S * ln(R_target) / ln(0.9)
  const factor = Math.log(config.requestRetention) / Math.log(0.9);
  let interval = Math.round(newStability * factor);
  if (rating === CardRating.AGAIN) {
    interval = 1;
  } else {
    interval = Math.min(config.maximumInterval, Math.max(1, interval));
  }

  updated.stability = Math.round(newStability * 100) / 100;
  updated.difficulty = Math.round(newDifficulty * 100) / 100;
  updated.scheduledDays = interval;
  updated.lastReview = new Date();

  return {
    card: updated,
    interval,
    retrievability: Math.round(calculateRetrievability(updated.stability, interval) * 1000) / 1000
  };
}
