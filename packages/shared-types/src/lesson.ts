import { z } from "zod";
import { ExerciseType, LanguageLevel } from "./enums";

export const CourseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(), // e.g. "en-vi-a1"
  title: z.string(),
  description: z.string(),
  language: z.string().default("en"),
  level: z.nativeEnum(LanguageLevel),
  thumbnailUrl: z.string().url().optional().nullable(),
  totalUnits: z.number().int().nonnegative().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type Course = z.infer<typeof CourseSchema>;

export const MatchPairItemSchema = z.object({
  left: z.string(),
  right: z.string()
});

export type MatchPairItem = z.infer<typeof MatchPairItemSchema>;

export const ExerciseContentSchema = z.object({
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  words: z.array(z.string()).optional(), // Word tokens for sentence reorder
  pairs: z.array(MatchPairItemSchema).optional(), // Pairs for match pairs
  audioUrl: z.string().url().optional().nullable(),
  explanation: z.string().optional()
});

export type ExerciseContent = z.infer<typeof ExerciseContentSchema>;

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  type: z.nativeEnum(ExerciseType),
  prompt: z.string(),
  audioUrl: z.string().url().optional().nullable(),
  content: ExerciseContentSchema,
  orderIndex: z.number().int().nonnegative(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type Exercise = z.infer<typeof ExerciseSchema>;

export const LessonSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  title: z.string(),
  orderIndex: z.number().int().nonnegative(),
  xpReward: z.number().int().default(15),
  exercises: z.array(ExerciseSchema).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type Lesson = z.infer<typeof LessonSchema>;

export const UnitSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional().nullable(),
  orderIndex: z.number().int().nonnegative(),
  lessons: z.array(LessonSchema).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type Unit = z.infer<typeof UnitSchema>;

export const CheckAnswerRequestSchema = z.object({
  exerciseId: z.string().uuid(),
  answer: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.string())
  ])
});

export type CheckAnswerRequest = z.infer<typeof CheckAnswerRequestSchema>;

export const CheckAnswerResponseSchema = z.object({
  isCorrect: z.boolean(),
  correctAnswer: z.any(),
  explanation: z.string(),
  heartsRemaining: z.number().int().min(0).max(5),
  isGameOver: z.boolean()
});

export type CheckAnswerResponse = z.infer<typeof CheckAnswerResponseSchema>;

export const CompleteLessonRequestSchema = z.object({
  score: z.number().int().min(0).max(100),
  mistakes: z.number().int().nonnegative().default(0),
  durationSeconds: z.number().int().nonnegative().default(0)
});

export type CompleteLessonRequest = z.infer<typeof CompleteLessonRequestSchema>;
