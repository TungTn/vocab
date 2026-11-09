import { describe, it, expect, beforeEach, vi } from "vitest";
import { SpeakingGateway } from "../src/ai/speaking.gateway";

describe("SpeakingGateway", () => {
  let gateway: SpeakingGateway;
  let speakingService: any;
  let pronunciationScorer: any;
  let mockSocket: any;

  beforeEach(() => {
    speakingService = {
      processTurn: vi.fn().mockResolvedValue({
        userMessage: {
          id: "msg-1",
          role: "user",
          text: "Hello",
          timestamp: new Date().toISOString()
        },
        assistantMessage: {
          id: "msg-2",
          role: "assistant",
          text: "Welcome!",
          audioUrl: "https://example.com/audio.mp3",
          timestamp: new Date().toISOString()
        },
        sessionSummary: {
          turnsCount: 1,
          averageScore: 90,
          accuracyScore: 92,
          xpAwarded: 10
        }
      })
    };

    pronunciationScorer = {
      assess: vi.fn().mockReturnValue({
        overallScore: 88,
        accuracy: 90,
        fluency: 85,
        completeness: 100,
        words: []
      })
    };

    mockSocket = {
      id: "socket-1",
      join: vi.fn(),
      emit: vi.fn()
    };

    gateway = new SpeakingGateway(speakingService, pronunciationScorer);
  });

  it("should join session room on join_session message", () => {
    gateway.handleJoinSession(mockSocket, {
      sessionId: "session-123",
      userId: "user-1"
    });

    expect(mockSocket.join).toHaveBeenCalledWith("session:session-123");
    expect(mockSocket.emit).toHaveBeenCalledWith("session_joined", {
      sessionId: "session-123"
    });
  });

  it("should emit speaking_error if join_session lacks sessionId", () => {
    gateway.handleJoinSession(mockSocket, {
      sessionId: "",
      userId: "user-1"
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "speaking_error",
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  it("should process audio turn and emit ai_response event", async () => {
    await gateway.handleSendAudio(mockSocket, {
      sessionId: "session-123",
      userId: "user-1",
      text: "Can I have a coffee please?"
    });

    expect(speakingService.processTurn).toHaveBeenCalledWith("user-1", {
      sessionId: "session-123",
      userMessageText: "Can I have a coffee please?",
      audioBase64: undefined
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "ai_response",
      expect.objectContaining({
        sessionId: "session-123",
        assistantMessage: expect.objectContaining({ text: "Welcome!" })
      })
    );
  });

  it("should assess pronunciation and emit pronunciation_result", () => {
    gateway.handleAssessPronunciation(mockSocket, {
      referenceText: "cappuccino",
      spokenText: "capuchino"
    });

    expect(pronunciationScorer.assess).toHaveBeenCalledWith("cappuccino", "capuchino");
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "pronunciation_result",
      expect.objectContaining({ overallScore: 88 })
    );
  });
});
