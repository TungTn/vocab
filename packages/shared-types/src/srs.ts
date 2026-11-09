import { z } from "zod";
import { CardRating, CardState } from "./enums";

export const ExampleSentenceSchema = z.object({
  text: z.string(),
  translation: z.string(),
  audioUrl: z.string().url().optional().nullable()
});

export type ExampleSentence = z.infer<typeof ExampleSentenceSchema>;

export const DeckSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  language: z.string().default("en"),
  isSystem: z.boolean().default(false),
  userId: z.string().uuid().optional().nullable(),
  cardCount: z.number().int().nonnegative().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Deck = z.infer<typeof DeckSchema>;

export const CreateDeckSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  language: z.string().default("en"),
  isSystem: z.boolean().optional().default(false)
});

export type CreateDeck = z.infer<typeof CreateDeckSchema>;

export const FlashcardSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  term: z.string().min(1).max(100),
  ipa: z.string().max(100).optional().nullable(),
  meaning: z.string().min(1).max(500),
  pos: z.string().max(30).optional().nullable(), // noun, verb, adjective, etc.
  examples: z.array(ExampleSentenceSchema).default([]),
  audioUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

export const CreateFlashcardSchema = z.object({
  deckId: z.string().uuid().optional(),
  term: z.string().min(1).max(100),
  ipa: z.string().max(100).optional(),
  meaning: z.string().min(1).max(500),
  pos: z.string().max(30).optional(),
  examples: z.array(ExampleSentenceSchema).optional().default([]),
  audioUrl: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable()
});

export type CreateFlashcard = z.infer<typeof CreateFlashcardSchema>;

export const UpdateFlashcardSchema = CreateFlashcardSchema.partial().omit({ deckId: true });
export type UpdateFlashcard = z.infer<typeof UpdateFlashcardSchema>;

export const ReviewCardStateSchema = z.object({
  id: z.string().uuid().optional(),
  cardId: z.string().uuid(),
  userId: z.string().uuid(),
  state: z.nativeEnum(CardState),
  stability: z.number().nonnegative(),
  difficulty: z.number().min(1).max(10),
  reps: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  scheduledDays: z.number().nonnegative(),
  dueAt: z.date(),
  lastReview: z.date().optional().nullable()
});

export type ReviewCardState = z.infer<typeof ReviewCardStateSchema>;

export const SubmitCardReviewSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.nativeEnum(CardRating),
  reviewDurationMs: z.number().int().nonnegative().optional(),
  idempotencyKey: z.string().optional()
});

export type SubmitCardReview = z.infer<typeof SubmitCardReviewSchema>;

export const ReviewQueueQuerySchema = z.object({
  deckId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  catchUpMode: z.coerce.boolean().default(false)
});

export type ReviewQueueQuery = z.infer<typeof ReviewQueueQuerySchema>;

export const SrsStatsSchema = z.object({
  reviewedToday: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  learningCount: z.number().int().nonnegative(),
  masteredCount: z.number().int().nonnegative(),
  totalCards: z.number().int().nonnegative()
});

export type SrsStats = z.infer<typeof SrsStatsSchema>;
