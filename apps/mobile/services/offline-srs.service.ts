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

  constructor(initialCards?: OfflineFlashcard[]) {
    if (initialCards && initialCards.length > 0) {
      initialCards.forEach((c) => this.localDeck.set(c.id, c));
    }
  }

  loadCards(cards: OfflineFlashcard[]) {
    cards.forEach((c) => this.localDeck.set(c.id, c));
  }

  clearLocalDeck() {
    this.localDeck.clear();
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

    // 1. Submit pending reviews to server
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

    // 2. Fetch fresh queue from server and sync to localDeck
    try {
      const freshQueue = await mobileApi.getReviewQueue();
      if (Array.isArray(freshQueue) && freshQueue.length > 0) {
        freshQueue.forEach((card: any) => {
          this.localDeck.set(card.id, {
            id: card.id,
            term: card.term,
            ipa: card.ipa,
            meaning: card.meaning,
            examples: card.examples,
            stability: card.stability || 2.0,
            difficulty: card.difficulty || 4.5,
            reps: card.reps || 0,
            lapses: card.lapses || 0,
            scheduledDays: card.scheduledDays || 1,
            state: card.state || CardState.REVIEW,
            dueAt: card.dueAt || new Date().toISOString(),
            lastReview: card.lastReview
          });
        });
      }
    } catch {
      // In offline mode, continue using existing local cache
    }

    return { syncedCount: synced, errors };
  }

  getPendingCount(): number {
    return this.pendingReviews.length;
  }
}

export const offlineSrsService = new OfflineSrsService();
