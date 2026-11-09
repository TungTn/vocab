import { describe, it, expect, beforeEach } from "vitest";
import { PronunciationScorerService } from "../src/ai/pronunciation-scorer.service";

describe("PronunciationScorerService", () => {
  let service: PronunciationScorerService;

  beforeEach(() => {
    service = new PronunciationScorerService();
  });

  it("should score 100 for exact word matches", () => {
    const reference = "Good morning, could I please have a cappuccino?";
    const spoken = "Good morning could I please have a cappuccino";

    const result = service.assess(reference, spoken);

    expect(result.overallScore).toBe(100);
    expect(result.accuracy).toBe(100);
    expect(result.completeness).toBe(100);
    expect(result.words.every((w) => w.status === "GOOD")).toBe(true);
    expect(result.words.every((w) => w.errorType === "CORRECT")).toBe(true);
  });

  it("should score intermediate for slight phonetic mispronunciations", () => {
    const reference = "cappuccino";
    const spoken = "capuchino";

    const result = service.assess(reference, spoken);

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.words[0].word).toBe("cappuccino");
  });

  it("should detect omitted words and penalize completeness", () => {
    const reference = "I would like to order a hot coffee please";
    const spoken = "I order coffee";

    const result = service.assess(reference, spoken);

    expect(result.completeness).toBeLessThan(100);
    expect(result.overallScore).toBeLessThan(100);

    const omittedWords = result.words.filter((w) => w.errorType === "OMISSION");
    expect(omittedWords.length).toBeGreaterThan(0);
    expect(omittedWords.some((w) => w.word === "would")).toBe(true);
  });

  it("should provide phonetic IPA transcription for known words", () => {
    const ipa = service.getIpa("croissant");
    expect(ipa).toBe("krwɑːˈsɑ̃");

    const coffeeIpa = service.getIpa("coffee");
    expect(coffeeIpa).toBe("ˈkɔːfi");
  });

  it("should approximate phonetic IPA for unknown words", () => {
    const ipa = service.getIpa("photograph");
    expect(ipa).toContain("f");
  });

  it("should handle empty inputs gracefully", () => {
    const result = service.assess("", "");
    expect(result.overallScore).toBe(0);
    expect(result.words.length).toBe(0);
  });
});
