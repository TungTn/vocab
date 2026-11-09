import { Injectable } from "@nestjs/common";
import { ExerciseType, ExerciseContent, MatchPairItem } from "@linguaflow/shared-types";

export interface GradingResult {
  isCorrect: boolean;
  canonicalAnswer: string | string[] | MatchPairItem[];
  explanation: string;
}

@Injectable()
export class GradingEngineService {
  /**
   * Normalizes strings for robust comparison:
   * - Unicode normalization Form C (NFC)
   * - Strip trailing punctuation (. , ! ? ¿ ¡ ;)
   * - Trim excess whitespace
   * - Lowercase
   */
  normalizeText(input: string): string {
    if (!input) return "";
    return input
      .normalize("NFC")
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  evaluate(
    type: string | ExerciseType,
    content: ExerciseContent,
    userAnswer: unknown
  ): GradingResult {
    const explanation =
      content.explanation || "Hãy ghi nhớ cấu trúc và từ vựng này cho các bài học tiếp theo!";

    switch (type) {
      case ExerciseType.MULTIPLE_CHOICE:
      case ExerciseType.LISTEN_AND_PICK:
      case ExerciseType.LISTENING_CHOICE: {
        return this.evaluateMultipleChoice(content, userAnswer, explanation);
      }

      case ExerciseType.FILL_IN_BLANK: {
        return this.evaluateFillInBlank(content, userAnswer, explanation);
      }

      case ExerciseType.SENTENCE_REORDER: {
        return this.evaluateSentenceReorder(content, userAnswer, explanation);
      }

      case ExerciseType.MATCH_PAIRS: {
        return this.evaluateMatchPairs(content, userAnswer, explanation);
      }

      default: {
        // Fallback exact/trimmed check
        const isCorrect =
          typeof userAnswer === "string" &&
          typeof content.correctAnswer === "string" &&
          this.normalizeText(userAnswer) === this.normalizeText(content.correctAnswer);

        return {
          isCorrect,
          canonicalAnswer: content.correctAnswer || "",
          explanation
        };
      }
    }
  }

  private evaluateMultipleChoice(
    content: ExerciseContent,
    userAnswer: unknown,
    explanation: string
  ): GradingResult {
    const rawCorrect = content.correctAnswer;
    const canonical = typeof rawCorrect === "string" ? rawCorrect : (rawCorrect?.[0] || "");

    const isCorrect =
      typeof userAnswer === "string" &&
      this.normalizeText(userAnswer) === this.normalizeText(canonical);

    return {
      isCorrect,
      canonicalAnswer: canonical,
      explanation: isCorrect ? "Chính xác! " + explanation : "Chưa chính xác. " + explanation
    };
  }

  private evaluateFillInBlank(
    content: ExerciseContent,
    userAnswer: unknown,
    explanation: string
  ): GradingResult {
    if (typeof userAnswer !== "string") {
      return {
        isCorrect: false,
        canonicalAnswer: content.correctAnswer || "",
        explanation: "Dữ liệu trả lời không hợp lệ."
      };
    }

    const normalizedUser = this.normalizeText(userAnswer);

    // Accept multiple alternative answers if array provided
    const validAnswers: string[] = Array.isArray(content.correctAnswer)
      ? content.correctAnswer
      : [content.correctAnswer as string];

    const isCorrect = validAnswers.some(
      (valid) => this.normalizeText(valid) === normalizedUser
    );

    return {
      isCorrect,
      canonicalAnswer: validAnswers[0] || "",
      explanation: isCorrect ? "Rất tốt! " + explanation : "Đáp án đúng là: " + validAnswers[0] + ". " + explanation
    };
  }

  private evaluateSentenceReorder(
    content: ExerciseContent,
    userAnswer: unknown,
    explanation: string
  ): GradingResult {
    let userSentence = "";
    if (Array.isArray(userAnswer)) {
      userSentence = (userAnswer as string[]).join(" ");
    } else if (typeof userAnswer === "string") {
      userSentence = userAnswer;
    }

    const rawCorrect = content.correctAnswer;
    const canonical = typeof rawCorrect === "string" ? rawCorrect : (rawCorrect?.[0] || "");

    const isCorrect =
      this.normalizeText(userSentence) === this.normalizeText(canonical);

    return {
      isCorrect,
      canonicalAnswer: canonical,
      explanation: isCorrect
        ? "Xuất sắc! Câu đã được sắp xếp chính xác."
        : "Thứ tự câu đúng là: \"" + canonical + "\". " + explanation
    };
  }

  private evaluateMatchPairs(
    content: ExerciseContent,
    userAnswer: unknown,
    explanation: string
  ): GradingResult {
    const canonicalPairs = content.pairs || [];

    if (!userAnswer || typeof userAnswer !== "object") {
      return {
        isCorrect: false,
        canonicalAnswer: canonicalPairs,
        explanation: "Dữ liệu ghép cặp không hợp lệ."
      };
    }

    // userAnswer can be Record<string, string> or Array<{ left: string, right: string }>
    let userMap: Record<string, string> = {};
    if (Array.isArray(userAnswer)) {
      for (const item of userAnswer as MatchPairItem[]) {
        userMap[this.normalizeText(item.left)] = this.normalizeText(item.right);
      }
    } else {
      for (const [k, v] of Object.entries(userAnswer as Record<string, string>)) {
        userMap[this.normalizeText(k)] = this.normalizeText(v);
      }
    }

    // Check all canonical pairs match
    let allMatched = canonicalPairs.length > 0;
    for (const pair of canonicalPairs) {
      const left = this.normalizeText(pair.left);
      const right = this.normalizeText(pair.right);
      if (userMap[left] !== right) {
        allMatched = false;
        break;
      }
    }

    return {
      isCorrect: allMatched,
      canonicalAnswer: canonicalPairs,
      explanation: allMatched
        ? "Chính xác! Bạn đã ghép đúng toàn bộ các cặp từ."
        : "Một số cặp từ chưa chính xác. " + explanation
    };
  }
}
