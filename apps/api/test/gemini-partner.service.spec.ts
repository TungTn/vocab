import { describe, it, expect, beforeEach, vi } from "vitest";
import { GeminiPartnerService } from "../src/ai/gemini-partner.service";
import { SYSTEM_SCENARIOS } from "../src/ai/scenarios.data";

describe("GeminiPartnerService", () => {
  let service: GeminiPartnerService;
  let configService: any;

  beforeEach(() => {
    configService = {
      get: vi.fn().mockReturnValue(undefined) // No API key -> fallback simulator
    };
    service = new GeminiPartnerService(configService);
  });

  it("should generate contextual fallback reply for CAFE_LONDON scenario", async () => {
    const scenario = SYSTEM_SCENARIOS.find((s) => s.id === "CAFE_LONDON")!;
    const history = [{ role: "assistant" as const, text: scenario.initialMessage }];

    const turn = await service.generateReply(
      scenario,
      history,
      "Could I have a large cappuccino please?"
    );

    expect(turn.replyText).toContain("milk");
    expect(typeof turn.replyText).toBe("string");
  });

  it("should provide grammar correction and natural alternative when user makes errors", async () => {
    const scenario = SYSTEM_SCENARIOS.find((s) => s.id === "CAFE_LONDON")!;
    const history = [{ role: "assistant" as const, text: scenario.initialMessage }];

    const turn = await service.generateReply(
      scenario,
      history,
      "How much it is? Give me bill please."
    );

    expect(turn.grammarCorrection).toBeDefined();
    expect(turn.grammarCorrection).toContain("How much is it?");
    expect(turn.naturalAlternative).toBeDefined();
    expect(turn.naturalAlternative).toContain("Could you tell me how much that costs?");
  });

  it("should generate appropriate replies for Tokyo directions scenario", async () => {
    const scenario = SYSTEM_SCENARIOS.find((s) => s.id === "DIRECTIONS_TOKYO")!;
    const history = [{ role: "assistant" as const, text: scenario.initialMessage }];

    const turn = await service.generateReply(
      scenario,
      history,
      "Where is Shibuya Sky observatory?"
    );

    expect(turn.replyText).toContain("Shibuya");
    expect(turn.replyText).toContain("elevator");
  });
});
