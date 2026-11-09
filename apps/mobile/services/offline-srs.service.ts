import { calculateFSRS, FSRSCard, FSRSResult } from "@linguaflow/srs-engine";
import { CardRating, CardState } from "@linguaflow/shared-types";
import { mobileApi } from "./api";

export interface OfflineFlashcard {
  id: string;
  term: string;
  ipa?: string;
  meaning: string;
  examples?: { text: string; translation: string }[];
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  scheduledDays: number;
  state: CardState;
  dueAt: string;
  lastReview?: string;
}

export interface PendingReview {
  cardId: string;
  rating: CardRating;
  reviewedAt: string;
}

export class OfflineSrsService {
  private localDeck: Map<string, OfflineFlashcard> = new Map();
  private pendingReviews: PendingReview[] = [];

  constructor() {
    this.seedDefaultCards();
  }

  private seedDefaultCards() {
    const samples: OfflineFlashcard[] = [
      {
        id: "offline-card-1",
        term: "cappuccino",
        ipa: "/ˌkæpəˈtʃiːnoʊ/",
        meaning: "Cà phê cappuccino (espresso pha sữa nóng và bọt sữa)",
        examples: [{ text: "Could I have a large cappuccino please?", translation: "Cho tôi một ly cappuccino lớn nhé?" }],
        stability: 2.0,
        difficulty: 4.5,
        reps: 1,
        lapses: 0,
        scheduledDays: 1,
        state: CardState.REVIEW,
        dueAt: new Date().toISOString()
      },
      {
        id: "offline-card-2",
        term: "croissant",
        ipa: "/krwɑːˈsɑ̃/",
        meaning: "Bánh sừng bò",
        examples: [{ text: "Fresh croissants smell incredible in the morning.", translation: "Bánh sừng bò mới ra lò có mùi thơm tuyệt vời vào buổi sáng." }],
        stability: 1.0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        scheduledDays: 0,
        state: CardState.LEARNING,
        dueAt: new Date().toISOString()
      }
    ];

    samples.forEach((c) => this.localDeck.set(c.id, c));
  }

  getDueCards(): OfflineFlashcard[] {
    const now = new Date();
    return Array.from(this.localDeck.values()).filter(
      (card) => new Date(card.dueAt) <= now
    );
  }

  recordOfflineReview(cardId: string, rating: CardRating): OfflineFlashcard | null {
    const card = this.localDeck.get(cardId);
    if (!card) return null;

    const fsrsState: FSRSCard = {
      stability: card.stability,
      difficulty: card.difficulty,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      scheduledDays: card.scheduledDays,
      lastReview: card.lastReview ? new Date(card.lastReview) : null
    };

    const elapsedDays = card.lastReview
      ? Math.max(0, Math.floor((Date.now() - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const result = calculateFSRS(fsrsState, rating, elapsedDays);
    const nextCard = result.card;

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + nextCard.scheduledDays);

    const updatedCard: OfflineFlashcard = {
      ...card,
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      reps: nextCard.reps,
      lapses: nextCard.lapses,
      state: nextCard.state,
      scheduledDays: nextCard.scheduledDays,
      dueAt: nextDueDate.toISOString(),
      lastReview: new Date().toISOString()
    };

    this.localDeck.set(cardId, updatedCard);
    this.pendingReviews.push({
      cardId,
      rating,
      reviewedAt: new Date().toISOString()
    });

    return updatedCard;
  }

  async syncWithServer(): Promise<{ syncedCount: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    const toSync = [...this.pendingReviews];
    for (const review of toSync) {
      try {
        await mobileApi.submitReview(review.cardId, review.rating);
        synced += 1;
      } catch {
        errors += 1;
      }
    }

    if (errors === 0) {
      this.pendingReviews = [];
    }

    return { syncedCount: synced, errors };
  }

  getPendingCount(): number {
    return this.pendingReviews.length;
  }
}

export const offlineSrsService = new OfflineSrsService();
