import { describe, it, expect } from "vitest";
import { GradingEngineService } from "../src/lessons/grading-engine.service";
import { ExerciseType } from "@linguaflow/shared-types";

describe("GradingEngineService", () => {
  const engine = new GradingEngineService();

  describe("String Normalization", () => {
    it("should strip punctuation, trim whitespace, and normalize case and unicode", () => {
      const raw = "  Hello, World!  ";
      expect(engine.normalizeText(raw)).toBe("hello world");

      const accented = "Café au lait.";
      expect(engine.normalizeText(accented)).toBe("café au lait");
    });
  });

  describe("MULTIPLE_CHOICE & LISTEN_AND_PICK", () => {
    const content = {
      options: ["Hello", "Goodbye", "Thanks"],
      correctAnswer: "Hello",
      explanation: "'Hello' means Xin chào."
    };

    it("should evaluate correct answer with case-insensitivity", () => {
      const res = engine.evaluate(ExerciseType.MULTIPLE_CHOICE, content, "hello");
      expect(res.isCorrect).toBe(true);
      expect(res.canonicalAnswer).toBe("Hello");
      expect(res.explanation).toContain("Chính xác!");
    });

    it("should reject incorrect answer and provide explanation", () => {
      const res = engine.evaluate(ExerciseType.MULTIPLE_CHOICE, content, "Goodbye");
      expect(res.isCorrect).toBe(false);
      expect(res.explanation).toContain("Chưa chính xác");
    });
  });

  describe("FILL_IN_BLANK", () => {
    const content = {
      correctAnswer: ["meet", "see"],
      explanation: "Nice to meet you."
    };

    it("should accept primary correct answer", () => {
      const res = engine.evaluate(ExerciseType.FILL_IN_BLANK, content, "meet");
      expect(res.isCorrect).toBe(true);
    });

    it("should accept alternative correct answer", () => {
      const res = engine.evaluate(ExerciseType.FILL_IN_BLANK, content, " see ");
      expect(res.isCorrect).toBe(true);
    });

    it("should reject wrong word", () => {
      const res = engine.evaluate(ExerciseType.FILL_IN_BLANK, content, "hear");
      expect(res.isCorrect).toBe(false);
      expect(res.canonicalAnswer).toBe("meet");
    });
  });

  describe("SENTENCE_REORDER", () => {
    const content = {
      words: ["name", "is", "My", "David"],
      correctAnswer: "My name is David",
      explanation: "Subject + verb + name."
    };

    it("should accept array of words in correct sequence", () => {
      const res = engine.evaluate(
        ExerciseType.SENTENCE_REORDER,
        content,
        ["My", "name", "is", "David"]
      );
      expect(res.isCorrect).toBe(true);
      expect(res.explanation).toContain("Xuất sắc!");
    });

    it("should accept string input with minor punctuation differences", () => {
      const res = engine.evaluate(
        ExerciseType.SENTENCE_REORDER,
        content,
        "my name is David."
      );
      expect(res.isCorrect).toBe(true);
    });

    it("should reject incorrect sequence", () => {
      const res = engine.evaluate(
        ExerciseType.SENTENCE_REORDER,
        content,
        ["My", "David", "is", "name"]
      );
      expect(res.isCorrect).toBe(false);
      expect(res.canonicalAnswer).toBe("My name is David");
    });
  });

  describe("MATCH_PAIRS", () => {
    const content = {
      pairs: [
        { left: "Hello", right: "Xin chào" },
        { left: "Goodbye", right: "Tạm biệt" }
      ],
      explanation: "Basic greetings."
    };

    it("should pass when all pairs match correctly", () => {
      const res = engine.evaluate(ExerciseType.MATCH_PAIRS, content, {
        Hello: "Xin chào",
        Goodbye: "Tạm biệt"
      });
      expect(res.isCorrect).toBe(true);
    });

    it("should fail when any pair is mismatched", () => {
      const res = engine.evaluate(ExerciseType.MATCH_PAIRS, content, {
        Hello: "Tạm biệt",
        Goodbye: "Xin chào"
      });
      expect(res.isCorrect).toBe(false);
    });
  });
});
