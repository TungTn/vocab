import { z } from "zod";
import { UserRole, LanguageLevel } from "./enums";

export const UserProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  displayName: z.string().min(1).max(50),
  targetLang: z.string().default("en"),
  nativeLang: z.string().default("vi"),
  currentLevel: z.nativeEnum(LanguageLevel).default(LanguageLevel.A1),
  dailyGoalMinutes: z.number().int().min(5).max(120).default(15),
  dailyGoalXp: z.number().int().min(10).max(500).default(30),
  bio: z.string().max(200).optional().nullable()
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UpdateProfileSchema = UserProfileSchema.partial().omit({ id: true, userId: true });
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(30),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  avatarUrl: z.string().url().optional().nullable(),
  xp: z.number().int().nonnegative().default(0),
  streak: z.number().int().nonnegative().default(0),
  hearts: z.number().int().min(0).max(5).default(5),
  streakFreezeCount: z.number().int().nonnegative().default(0),
  timezone: z.string().default("UTC"),
  profile: UserProfileSchema.optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  targetLang: z.string().optional().default("en"),
  nativeLang: z.string().optional().default("vi")
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: UserSchema.omit({ createdAt: true, updatedAt: true })
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8)
});

export type ChangePassword = z.infer<typeof ChangePasswordSchema>;

export const PlacementQuestionSchema = z.object({
  id: z.number().int(),
  level: z.nativeEnum(LanguageLevel),
  prompt: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string()
});

export type PlacementQuestion = z.infer<typeof PlacementQuestionSchema>;

export const PlacementTestSubmissionSchema = z.object({
  targetLang: z.string().default("en"),
  answers: z.array(
    z.object({
      questionId: z.number().int(),
      selectedAnswer: z.string()
    })
  )
});

export type PlacementTestSubmission = z.infer<typeof PlacementTestSubmissionSchema>;

export const PlacementTestResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  assessedLevel: z.nativeEnum(LanguageLevel),
  correctCount: z.number().int(),
  totalQuestions: z.number().int(),
  recommendation: z.string()
});

export type PlacementTestResult = z.infer<typeof PlacementTestResultSchema>;

export const UpdateLessonProgressSchema = z.object({
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  unitId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  completed: z.boolean().default(true)
});

export type UpdateLessonProgress = z.infer<typeof UpdateLessonProgressSchema>;
