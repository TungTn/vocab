import {
  Injectable,
  NotFoundException,
  Logger
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { calculateFSRS, FSRSCard } from "@linguaflow/srs-engine";
import {
  CardState,
  SubmitCardReview,
  ReviewQueueQuery,
  SrsStats
} from "@linguaflow/shared-types";

@Injectable()
export class SrsService {
  private readonly logger = new Logger(SrsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async getReviewQueue(userId: string, query: ReviewQueueQuery) {
    const now = new Date();
    const limit = query.limit || 20;

    // 1. Fetch due cards (Relearning and Review due now)
    const dueStates = await this.prisma.cardReviewState.findMany({
      where: {
        userId,
        dueAt: { lte: now },
        ...(query.deckId && { card: { deckId: query.deckId } })
      },
      include: {
        card: true
      },
      orderBy: [
        { state: "desc" }, // RELEARNING first, then REVIEW, LEARNING
        { dueAt: "asc" }
      ],
      take: query.catchUpMode ? Math.min(limit, 50) : limit
    });

    const dueCards = dueStates.map((state) => ({
      ...state.card,
      reviewState: {
        state: state.state,
        stability: state.stability,
        difficulty: state.difficulty,
        reps: state.reps,
        lapses: state.lapses,
        dueAt: state.dueAt,
        scheduledDays: state.scheduledDays
      }
    }));

    // If queue is already full, return due cards
    if (dueCards.length >= limit) {
      return dueCards.slice(0, limit);
    }

    // 2. Fetch NEW cards to fill remaining queue quota
    const remainingSlots = limit - dueCards.length;

    // Find cards that this user has never reviewed yet
    const newCards = await this.prisma.flashcard.findMany({
      where: {
        ...(query.deckId && { deckId: query.deckId }),
        reviewStates: {
          none: { userId }
        }
      },
      orderBy: { createdAt: "asc" },
      take: remainingSlots
    });

    const newCardsWithState = newCards.map((card) => ({
      ...card,
      reviewState: {
        state: CardState.NEW,
        stability: 0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        dueAt: now,
        scheduledDays: 0
      }
    }));

    return [...dueCards, ...newCardsWithState];
  }

  async submitReview(userId: string, dto: SubmitCardReview) {
    // 1. Check idempotency
    if (dto.idempotencyKey) {
      const existingLog = await this.prisma.reviewLog.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { card: true }
      });
      if (existingLog) {
        return {
          cardId: existingLog.cardId,
          rating: existingLog.rating,
          intervalDays: existingLog.scheduledDays,
          stability: existingLog.stability,
          difficulty: existingLog.difficulty,
          isDuplicate: true
        };
      }
    }

    // 2. Find card
    const card = await this.prisma.flashcard.findUnique({
      where: { id: dto.cardId }
    });

    if (!card) {
      throw new NotFoundException("Flashcard not found");
    }

    // 3. Find or initialize CardReviewState
    const currentState = await this.prisma.cardReviewState.findUnique({
      where: {
        userId_cardId: {
          userId,
          cardId: dto.cardId
        }
      }
    });

    const now = new Date();
    let elapsedDays = 0;
    if (currentState?.lastReview) {
      const diffMs = now.getTime() - new Date(currentState.lastReview).getTime();
      elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const fsrsInput: FSRSCard = currentState
      ? {
          state: currentState.state as CardState,
          stability: currentState.stability,
          difficulty: currentState.difficulty,
          reps: currentState.reps,
          lapses: currentState.lapses,
          scheduledDays: currentState.scheduledDays,
          lastReview: currentState.lastReview
        }
      : {
          state: CardState.NEW,
          stability: 0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          scheduledDays: 0,
          lastReview: null
        };

    // Calculate next state via FSRS
    const fsrsResult = calculateFSRS(fsrsInput, dto.rating, elapsedDays);

    const nextDueDate = new Date(now);
    nextDueDate.setDate(nextDueDate.getDate() + fsrsResult.interval);

    const xpEarned = dto.rating === 4 ? 10 : 5;

    // 4. Perform database transaction
    const [savedState] = await this.prisma.$transaction([
      this.prisma.cardReviewState.upsert({
        where: {
          userId_cardId: {
            userId,
            cardId: dto.cardId
          }
        },
        create: {
          userId,
          cardId: dto.cardId,
          stability: fsrsResult.card.stability,
          difficulty: fsrsResult.card.difficulty,
          reps: fsrsResult.card.reps,
          lapses: fsrsResult.card.lapses,
          scheduledDays: fsrsResult.interval,
          state: fsrsResult.card.state as CardState,
          dueAt: nextDueDate,
          lastReview: now
        },
        update: {
          stability: fsrsResult.card.stability,
          difficulty: fsrsResult.card.difficulty,
          reps: fsrsResult.card.reps,
          lapses: fsrsResult.card.lapses,
          scheduledDays: fsrsResult.interval,
          state: fsrsResult.card.state as CardState,
          dueAt: nextDueDate,
          lastReview: now
        }
      }),
      this.prisma.reviewLog.create({
        data: {
          userId,
          cardId: dto.cardId,
          rating: dto.rating,
          reviewDurationMs: dto.reviewDurationMs,
          stability: fsrsResult.card.stability,
          difficulty: fsrsResult.card.difficulty,
          scheduledDays: fsrsResult.interval,
          idempotencyKey: dto.idempotencyKey
        }
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpEarned }
        }
      })
    ]);

    // 5. Update Redis weekly leaderboard
    const currentYear = now.getUTCFullYear();
    const weekNumber = this.getWeekNumber(now);
    const leaderboardKey = `leaderboard:weekly:${currentYear}-W${weekNumber}`;
    await this.redis.getClient().zincrby(leaderboardKey, xpEarned, userId);

    return {
      cardId: savedState.cardId,
      state: savedState.state,
      stability: savedState.stability,
      difficulty: savedState.difficulty,
      reps: savedState.reps,
      lapses: savedState.lapses,
      intervalDays: savedState.scheduledDays,
      dueAt: savedState.dueAt,
      retrievability: fsrsResult.retrievability,
      xpEarned
    };
  }

  async getStats(userId: string): Promise<SrsStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [reviewedToday, dueCount, learningCount, masteredCount, totalCards] =
      await Promise.all([
        this.prisma.reviewLog.count({
          where: {
            userId,
            reviewedAt: { gte: startOfDay }
          }
        }),
        this.prisma.cardReviewState.count({
          where: {
            userId,
            dueAt: { lte: now }
          }
        }),
        this.prisma.cardReviewState.count({
          where: {
            userId,
            state: { in: [CardState.LEARNING, CardState.RELEARNING] }
          }
        }),
        this.prisma.cardReviewState.count({
          where: {
            userId,
            state: CardState.REVIEW,
            stability: { gte: 21 } // Cards with 3+ weeks retention
          }
        }),
        this.prisma.flashcard.count()
      ]);

    return {
      reviewedToday,
      dueCount,
      learningCount,
      masteredCount,
      totalCards
    };
  }

  private getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
