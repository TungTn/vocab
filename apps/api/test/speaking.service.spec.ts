import { describe, it, expect, beforeEach, vi } from "vitest";
import { SpeakingService } from "../src/ai/speaking.service";
import { SYSTEM_SCENARIOS } from "../src/ai/scenarios.data";
import { BadRequestException } from "@nestjs/common";

describe("SpeakingService", () => {
  let service: SpeakingService;
  let prisma: any;
  let pronunciationScorer: any;
  let geminiPartner: any;
  let ttsService: any;
  let leaderboardService: any;
  let achievementsService: any;

  beforeEach(() => {
    prisma = {
      roleplayScenario: {
        upsert: vi.fn().mockResolvedValue({}),
        findMany: vi.fn(),
        findUnique: vi.fn()
      },
      speakingSession: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn()
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      $transaction: vi.fn().mockImplementation(async (promises: any[]) => {
        return Promise.all(promises);
      })
    };

    pronunciationScorer = {
      assess: vi.fn().mockReturnValue({
        overallScore: 92,
        accuracy: 95,
        fluency: 90,
        completeness: 100,
        words: [
          { word: "hello", score: 95, status: "GOOD", errorType: "CORRECT" }
        ]
      })
    };

    geminiPartner = {
      generateReply: vi.fn().mockResolvedValue({
        replyText: "Certainly, here is your coffee!",
        grammarCorrection: null,
        naturalAlternative: null
      })
    };

    ttsService = {
      getAudioUrlForText: vi.fn().mockResolvedValue("https://tts.example.com/audio.mp3")
    };

    leaderboardService = {
      recordXp: vi.fn().mockResolvedValue({})
    };

    achievementsService = {
      checkAndUnlock: vi.fn().mockResolvedValue([])
    };

    service = new SpeakingService(
      prisma,
      pronunciationScorer,
      geminiPartner,
      ttsService,
      leaderboardService,
      achievementsService
    );
  });

  it("should seed scenarios on module init", async () => {
    await service.onModuleInit();
    expect(prisma.roleplayScenario.upsert).toHaveBeenCalledTimes(SYSTEM_SCENARIOS.length);
  });

  it("should start a new speaking session with initial assistant greeting", async () => {
    const scenario = SYSTEM_SCENARIOS[0];
    prisma.roleplayScenario.findUnique.mockResolvedValue(scenario);

    prisma.speakingSession.create.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      scenarioId: scenario.id,
      scenario: { title: scenario.title },
      durationSeconds: 0,
      turnsCount: 0,
      averageScore: 0,
      accuracyScore: 0,
      fluencyScore: 0,
      completenessScore: 0,
      transcript: [
        {
          id: "msg-0",
          role: "assistant",
          text: scenario.initialMessage,
          audioUrl: "https://tts.example.com/audio.mp3",
          timestamp: new Date().toISOString()
        }
      ],
      completed: false,
      createdAt: new Date()
    });

    const result = await service.startSession("user-1", scenario.id);

    expect(result.id).toBe("session-1");
    expect(result.transcript.length).toBe(1);
    expect(result.transcript[0].role).toBe("assistant");
    expect(result.transcript[0].text).toBe(scenario.initialMessage);
  });

  it("should process a speaking turn, calculate score, and award XP", async () => {
    const scenario = SYSTEM_SCENARIOS[0];
    prisma.speakingSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      scenarioId: scenario.id,
      scenario,
      durationSeconds: 0,
      turnsCount: 0,
      averageScore: 0,
      accuracyScore: 0,
      fluencyScore: 0,
      completenessScore: 0,
      transcript: [
        {
          id: "msg-0",
          role: "assistant",
          text: scenario.initialMessage,
          timestamp: new Date().toISOString()
        }
      ],
      completed: false
    });

    prisma.user.update.mockResolvedValue({
      id: "user-1",
      xp: 10,
      league: "BRONZE"
    });

    const turnResult = await service.processTurn("user-1", {
      sessionId: "session-1",
      userMessageText: "I would like a large cappuccino please."
    });

    expect(turnResult.userMessage.text).toBe("I would like a large cappuccino please.");
    expect(turnResult.userMessage.pronunciation).toBeDefined();
    expect(turnResult.assistantMessage.text).toBe("Certainly, here is your coffee!");
    expect(turnResult.sessionSummary.turnsCount).toBe(1);
    expect(turnResult.sessionSummary.xpAwarded).toBe(10);

    expect(leaderboardService.recordXp).toHaveBeenCalledWith("user-1", 10, "BRONZE");
    expect(achievementsService.checkAndUnlock).toHaveBeenCalledWith("user-1");
  });

  it("should reject turn if session does not belong to user", async () => {
    prisma.speakingSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "other-user",
      completed: false
    });

    await expect(
      service.processTurn("user-1", {
        sessionId: "session-1",
        userMessageText: "Hello"
      })
    ).rejects.toThrow(BadRequestException);
  });

  it("should complete session and award bonus XP and gems", async () => {
    prisma.speakingSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      completed: false
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      league: "BRONZE"
    });

    const result = await service.completeSession("user-1", "session-1");

    expect(result.success).toBe(true);
    expect(result.xpAwarded).toBe(30);
    expect(result.gemsAwarded).toBe(5);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
