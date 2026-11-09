import { z } from "zod";
import { LanguageLevel } from "./enums";

export interface PronunciationWordScore {
  word: string;
  expectedIpa?: string;
  actualIpa?: string;
  score: number; // 0 - 100
  status: "GOOD" | "OK" | "BAD";
  errorType?: "CORRECT" | "MISPRONOUNCED" | "OMISSION" | "INSERTION";
}

export interface PronunciationAssessmentResult {
  overallScore: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  words: PronunciationWordScore[];
}

export interface SpeakingTurnMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  audioUrl?: string;
  pronunciation?: PronunciationAssessmentResult;
  grammarCorrection?: string | null;
  naturalAlternative?: string | null;
  timestamp: string;
}

export interface RoleplayScenarioDto {
  id: string;
  title: string;
  description: string;
  level: LanguageLevel;
  topic: string;
  avatarUrl?: string;
  initialMessage: string;
  suggestedPhrases?: string[];
}

export interface SpeakingSessionDto {
  id: string;
  userId: string;
  scenarioId: string;
  scenarioTitle?: string;
  durationSeconds: number;
  turnsCount: number;
  averageScore: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  transcript: SpeakingTurnMessage[];
  completed: boolean;
  createdAt: string;
}

export const AssessPronunciationSchema = z.object({
  referenceText: z.string().min(1, "Reference text is required"),
  spokenText: z.string().min(1, "Spoken text is required"),
  audioBase64: z.string().optional()
});
export type AssessPronunciationInput = z.infer<typeof AssessPronunciationSchema>;

export const StartSpeakingSessionSchema = z.object({
  scenarioId: z.string().min(1, "Scenario ID is required")
});
export type StartSpeakingSessionInput = z.infer<typeof StartSpeakingSessionSchema>;

export const SpeakingTurnInputSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  userMessageText: z.string().min(1, "Message text is required"),
  audioBase64: z.string().optional()
});
export type SpeakingTurnInput = z.infer<typeof SpeakingTurnInputSchema>;
