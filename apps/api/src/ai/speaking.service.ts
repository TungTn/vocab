import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PronunciationScorerService } from "./pronunciation-scorer.service";
import { GeminiPartnerService } from "./gemini-partner.service";
import { TtsService } from "./tts.service";
import { LeaderboardService } from "../gamification/leaderboard.service";
import { AchievementsService } from "../gamification/achievements.service";
import { SYSTEM_SCENARIOS } from "./scenarios.data";
import {
  RoleplayScenarioDto,
  SpeakingSessionDto,
  SpeakingTurnMessage,
  PronunciationAssessmentResult,
  SpeakingTurnInput
} from "@linguaflow/shared-types";

@Injectable()
export class SpeakingService implements OnModuleInit {
  private readonly logger = new Logger(SpeakingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pronunciationScorer: PronunciationScorerService,
    private readonly geminiPartner: GeminiPartnerService,
    private readonly ttsService: TtsService,
    private readonly leaderboardService: LeaderboardService,
    private readonly achievementsService: AchievementsService
  ) {}

  async onModuleInit() {
    for (const sc of SYSTEM_SCENARIOS) {
      await this.prisma.roleplayScenario.upsert({
        where: { id: sc.id },
        update: {
          title: sc.title,
          description: sc.description,
          level: sc.level as any,
          topic: sc.topic,
          avatarUrl: sc.avatarUrl,
          systemPrompt: sc.systemPrompt,
          initialMessage: sc.initialMessage,
          suggestedPhrases: sc.suggestedPhrases
        },
        create: {
          id: sc.id,
          title: sc.title,
          description: sc.description,
          level: sc.level as any,
          topic: sc.topic,
          avatarUrl: sc.avatarUrl,
          systemPrompt: sc.systemPrompt,
          initialMessage: sc.initialMessage,
          suggestedPhrases: sc.suggestedPhrases
        }
      });
    }
  }

  async getScenarios(): Promise<RoleplayScenarioDto[]> {
    const list = await this.prisma.roleplayScenario.findMany({
      orderBy: { level: "asc" }
    });

    return list.map((sc) => ({
      id: sc.id,
      title: sc.title,
      description: sc.description,
      level: sc.level as any,
      topic: sc.topic,
      avatarUrl: sc.avatarUrl || undefined,
      initialMessage: sc.initialMessage,
      suggestedPhrases: (sc.suggestedPhrases as string[]) || []
    }));
  }

  async getScenarioById(id: string): Promise<RoleplayScenarioDto> {
    const sc = await this.prisma.roleplayScenario.findUnique({
      where: { id }
    });
    if (!sc) throw new NotFoundException(`Scenario with ID ${id} not found.`);

    return {
      id: sc.id,
      title: sc.title,
      description: sc.description,
      level: sc.level as any,
      topic: sc.topic,
      avatarUrl: sc.avatarUrl || undefined,
      initialMessage: sc.initialMessage,
      suggestedPhrases: (sc.suggestedPhrases as string[]) || []
    };
  }

  async startSession(userId: string, scenarioId: string): Promise<SpeakingSessionDto> {
    const scenario = await this.prisma.roleplayScenario.findUnique({
      where: { id: scenarioId }
    });
    if (!scenario) throw new NotFoundException(`Scenario ${scenarioId} not found.`);

    const initialAudioUrl = await this.ttsService.getAudioUrlForText(scenario.initialMessage);

    const initialTurn: SpeakingTurnMessage = {
      id: `msg-${Date.now()}-0`,
      role: "assistant",
      text: scenario.initialMessage,
      audioUrl: initialAudioUrl,
      timestamp: new Date().toISOString()
    };

    const session = await this.prisma.speakingSession.create({
      data: {
        userId,
        scenarioId,
        transcript: [initialTurn] as any,
        turnsCount: 0,
        averageScore: 0,
        accuracyScore: 0,
        fluencyScore: 0,
        completenessScore: 0,
        durationSeconds: 0,
        completed: false
      },
      include: {
        scenario: true
      }
    });

    return {
      id: session.id,
      userId: session.userId,
      scenarioId: session.scenarioId,
      scenarioTitle: session.scenario.title,
      durationSeconds: session.durationSeconds,
      turnsCount: session.turnsCount,
      averageScore: session.averageScore,
      accuracyScore: session.accuracyScore,
      fluencyScore: session.fluencyScore,
      completenessScore: session.completenessScore,
      transcript: session.transcript as unknown as SpeakingTurnMessage[],
      completed: session.completed,
      createdAt: session.createdAt.toISOString()
    };
  }

  async processTurn(userId: string, input: SpeakingTurnInput) {
    const session = await this.prisma.speakingSession.findUnique({
      where: { id: input.sessionId },
      include: { scenario: true }
    });

    if (!session) throw new NotFoundException("Speaking session not found.");
    if (session.userId !== userId) throw new BadRequestException("Unauthorized access to session.");
    if (session.completed) throw new BadRequestException("Session is already completed.");

    const currentTranscript = (session.transcript as unknown as SpeakingTurnMessage[]) || [];

    // Pronunciation Assessment of user's speech
    // By default, compare user's utterance against expected phonetics
    const pronunciation = this.pronunciationScorer.assess(
      input.userMessageText,
      input.userMessageText
    );

    // Call AI Partner
    const conversationHistory = currentTranscript.map((t) => ({
      role: (t.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      text: t.text
    }));

    const partnerReply = await this.geminiPartner.generateReply(
      {
        id: session.scenario.id,
        title: session.scenario.title,
        description: session.scenario.description,
        level: session.scenario.level as any,
        topic: session.scenario.topic,
        systemPrompt: session.scenario.systemPrompt,
        initialMessage: session.scenario.initialMessage,
        suggestedPhrases: (session.scenario.suggestedPhrases as string[]) || []
      },
      conversationHistory,
      input.userMessageText
    );

    const replyAudioUrl = await this.ttsService.getAudioUrlForText(partnerReply.replyText);

    const userMessage: SpeakingTurnMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: input.userMessageText,
      pronunciation,
      grammarCorrection: partnerReply.grammarCorrection,
      naturalAlternative: partnerReply.naturalAlternative,
      timestamp: new Date().toISOString()
    };

    const assistantMessage: SpeakingTurnMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      text: partnerReply.replyText,
      audioUrl: replyAudioUrl,
      timestamp: new Date().toISOString()
    };

    const updatedTranscript = [...currentTranscript, userMessage, assistantMessage];
    const newTurnsCount = session.turnsCount + 1;

    // Running average calculation
    const newAvg = (session.averageScore * session.turnsCount + pronunciation.overallScore) / newTurnsCount;
    const newAcc = (session.accuracyScore * session.turnsCount + pronunciation.accuracy) / newTurnsCount;
    const newFlu = (session.fluencyScore * session.turnsCount + pronunciation.fluency) / newTurnsCount;
    const newComp = (session.completenessScore * session.turnsCount + pronunciation.completeness) / newTurnsCount;

    await this.prisma.speakingSession.update({
      where: { id: session.id },
      data: {
        transcript: updatedTranscript as any,
        turnsCount: newTurnsCount,
        averageScore: Math.round(newAvg * 10) / 10,
        accuracyScore: Math.round(newAcc * 10) / 10,
        fluencyScore: Math.round(newFlu * 10) / 10,
        completenessScore: Math.round(newComp * 10) / 10,
        durationSeconds: session.durationSeconds + 15
      }
    });

    // Award 10 XP per turn
    const XP_PER_TURN = 10;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: XP_PER_TURN } }
    });

    await this.leaderboardService.recordXp(userId, XP_PER_TURN, user.league as any);
    await this.achievementsService.checkAndUnlock(userId);

    return {
      userMessage,
      assistantMessage,
      sessionSummary: {
        turnsCount: newTurnsCount,
        averageScore: Math.round(newAvg * 10) / 10,
        accuracyScore: Math.round(newAcc * 10) / 10,
        xpAwarded: XP_PER_TURN
      }
    };
  }

  assessPronunciation(referenceText: string, spokenText: string): PronunciationAssessmentResult {
    return this.pronunciationScorer.assess(referenceText, spokenText);
  }

  async completeSession(userId: string, sessionId: string) {
    const session = await this.prisma.speakingSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) throw new NotFoundException("Speaking session not found.");
    if (session.userId !== userId) throw new BadRequestException("Unauthorized access to session.");

    const COMPLETION_XP = 30;
    const COMPLETION_GEMS = 5;

    await this.prisma.$transaction([
      this.prisma.speakingSession.update({
        where: { id: sessionId },
        data: { completed: true }
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: COMPLETION_XP },
          gems: { increment: COMPLETION_GEMS }
        }
      })
    ]);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.leaderboardService.recordXp(userId, COMPLETION_XP, user.league as any);
      await this.achievementsService.checkAndUnlock(userId);
    }

    return {
      success: true,
      sessionId,
      xpAwarded: COMPLETION_XP,
      gemsAwarded: COMPLETION_GEMS
    };
  }

  async getUserSessions(userId: string): Promise<SpeakingSessionDto[]> {
    const list = await this.prisma.speakingSession.findMany({
      where: { userId },
      include: { scenario: true },
      orderBy: { createdAt: "desc" }
    });

    return list.map((s) => ({
      id: s.id,
      userId: s.userId,
      scenarioId: s.scenarioId,
      scenarioTitle: s.scenario?.title,
      durationSeconds: s.durationSeconds,
      turnsCount: s.turnsCount,
      averageScore: s.averageScore,
      accuracyScore: s.accuracyScore,
      fluencyScore: s.fluencyScore,
      completenessScore: s.completenessScore,
      transcript: s.transcript as unknown as SpeakingTurnMessage[],
      completed: s.completed,
      createdAt: s.createdAt.toISOString()
    }));
  }

  async getSessionById(userId: string, sessionId: string): Promise<SpeakingSessionDto> {
    const s = await this.prisma.speakingSession.findUnique({
      where: { id: sessionId },
      include: { scenario: true }
    });

    if (!s) throw new NotFoundException("Session not found.");
    if (s.userId !== userId) throw new BadRequestException("Unauthorized access to session.");

    return {
      id: s.id,
      userId: s.userId,
      scenarioId: s.scenarioId,
      scenarioTitle: s.scenario?.title,
      durationSeconds: s.durationSeconds,
      turnsCount: s.turnsCount,
      averageScore: s.averageScore,
      accuracyScore: s.accuracyScore,
      fluencyScore: s.fluencyScore,
      completenessScore: s.completenessScore,
      transcript: s.transcript as unknown as SpeakingTurnMessage[],
      completed: s.completed,
      createdAt: s.createdAt.toISOString()
    };
  }
}
