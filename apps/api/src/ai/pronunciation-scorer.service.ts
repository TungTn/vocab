import { Injectable } from "@nestjs/common";
import {
  PronunciationAssessmentResult,
  PronunciationWordScore
} from "@linguaflow/shared-types";

// Common English words phonetic IPA dictionary
const COMMON_IPA_DICTIONARY: Record<string, string> = {
  hello: "həˈloʊ",
  world: "wɜːrld",
  good: "ɡʊd",
  morning: "ˈmɔːrnɪŋ",
  afternoon: "ˌæftərˈnuːn",
  evening: "ˈiːvnɪŋ",
  welcome: "ˈwɛlkəm",
  coffee: "ˈkɔːfi",
  cappuccino: "ˌkæpəˈtʃiːnoʊ",
  espresso: "ɛˈsprɛsoʊ",
  latte: "ˈlɑːteɪ",
  tea: "tiː",
  milk: "mɪlk",
  oat: "oʊt",
  sugar: "ˈʃʊɡər",
  croissant: "krwɑːˈsɑ̃",
  pastry: "ˈpeɪstri",
  water: "ˈwɔːtər",
  please: "pliːz",
  thank: "θæŋk",
  you: "juː",
  thanks: "θæŋks",
  yes: "jɛs",
  no: "noʊ",
  could: "kʊd",
  can: "kæn",
  i: "aɪ",
  have: "hæv",
  a: "ə",
  an: "æn",
  the: "ðə",
  large: "lɑːrdʒ",
  small: "smɔːl",
  medium: "ˈmiːdiəm",
  much: "mʌtʃ",
  is: "ɪz",
  it: "ɪt",
  how: "haʊ",
  what: "wʌt",
  where: "wɛər",
  who: "huː",
  why: "waɪ",
  card: "kɑːrd",
  cash: "kæʃ",
  pay: "peɪ",
  bill: "bɪl",
  check: "tʃɛk",
  hotel: "hoʊˈtɛl",
  reservation: "ˌrɛzərˈveɪʃən",
  room: "ruːm",
  breakfast: "ˈbrɛkfəst",
  wifi: "ˈwaɪfaɪ",
  key: "kiː",
  shibuya: "ʃɪˈbuːjə",
  tokyo: "ˈtoʊkioʊ",
  station: "ˈsteɪʃən",
  train: "treɪn",
  subway: "ˈsʌbweɪ",
  street: "striːt",
  turn: "tɜːrn",
  left: "lɛft",
  right: "raɪt",
  straight: "streɪt",
  near: "nɪər",
  far: "fɑːr",
  help: "hɛlp",
  excuse: "ɪkˈskjuːz",
  me: "miː",
  interview: "ˈɪntərvjuː",
  experience: "ɪkˈspɪəriəns",
  software: "ˈsɔːftwɛər",
  engineer: "ˌɛndʒɪˈnɪər",
  developer: "dɪˈvɛləpər",
  project: "ˈprɒdʒɛkt",
  team: "tiːm",
  challenge: "ˈtʃælɪndʒ",
  company: "ˈkʌmpəni"
};

@Injectable()
export class PronunciationScorerService {
  /**
   * Assesses pronunciation by comparing spoken text to the target reference text.
   */
  assess(referenceText: string, spokenText: string): PronunciationAssessmentResult {
    const refWords = this.tokenize(referenceText);
    const spokenWords = this.tokenize(spokenText);

    if (refWords.length === 0) {
      return {
        overallScore: 0,
        accuracy: 0,
        fluency: 0,
        completeness: 0,
        words: []
      };
    }

    const wordScores: PronunciationWordScore[] = [];
    let matchedWordsCount = 0;
    let totalScoreSum = 0;

    // Word alignment using sliding window search
    let spokenIndex = 0;

    for (let i = 0; i < refWords.length; i++) {
      const refWord = refWords[i];
      const expectedIpa = this.getIpa(refWord);

      // Look ahead up to 3 positions in spoken words to find the best match
      let bestMatchIdx = -1;
      let highestSimilarity = 0;

      for (let j = spokenIndex; j < Math.min(spokenIndex + 4, spokenWords.length); j++) {
        const similarity = this.calculateWordSimilarity(refWord, spokenWords[j]);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatchIdx = j;
        }
      }

      if (bestMatchIdx !== -1 && highestSimilarity >= 0.4) {
        // Matched a spoken word
        const actualWord = spokenWords[bestMatchIdx];
        const actualIpa = this.getIpa(actualWord);
        const score = Math.round(highestSimilarity * 100);

        let status: "GOOD" | "OK" | "BAD" = "BAD";
        let errorType: "CORRECT" | "MISPRONOUNCED" | "OMISSION" | "INSERTION" = "MISPRONOUNCED";

        if (score >= 80) {
          status = "GOOD";
          errorType = "CORRECT";
        } else if (score >= 50) {
          status = "OK";
          errorType = "MISPRONOUNCED";
        } else {
          status = "BAD";
          errorType = "MISPRONOUNCED";
        }

        wordScores.push({
          word: refWord,
          expectedIpa,
          actualIpa,
          score,
          status,
          errorType
        });

        matchedWordsCount += 1;
        totalScoreSum += score;
        spokenIndex = bestMatchIdx + 1;
      } else {
        // Word was omitted or spoken completely unintelligibly
        wordScores.push({
          word: refWord,
          expectedIpa,
          actualIpa: undefined,
          score: 0,
          status: "BAD",
          errorType: "OMISSION"
        });
      }
    }

    const accuracy = refWords.length > 0 ? Math.round(totalScoreSum / refWords.length) : 0;
    const completeness = refWords.length > 0 ? Math.round((matchedWordsCount / refWords.length) * 100) : 0;

    // Fluency accounts for accuracy plus word order consistency
    const fluency = Math.min(
      100,
      Math.max(0, Math.round(accuracy * 0.7 + completeness * 0.3))
    );

    const overallScore = Math.round(accuracy * 0.5 + fluency * 0.3 + completeness * 0.2);

    return {
      overallScore,
      accuracy,
      fluency,
      completeness,
      words: wordScores
    };
  }

  /**
   * Tokenizes text into lowercase words stripped of punctuation.
   */
  tokenize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, "")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
  }

  /**
   * Retrieves or estimates IPA phonetic transcription for a word.
   */
  getIpa(word: string): string {
    const clean = word.toLowerCase().trim();
    if (COMMON_IPA_DICTIONARY[clean]) {
      return COMMON_IPA_DICTIONARY[clean];
    }
    // Simple phonetic fallback approximation
    return this.approximateIpa(clean);
  }

  /**
   * Levenshtein similarity ratio between two words (0.0 to 1.0).
   */
  calculateWordSimilarity(wordA: string, wordB: string): number {
    const a = wordA.toLowerCase();
    const b = wordB.toLowerCase();
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;

    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    return Math.max(0, (maxLength - distance) / maxLength);
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  private approximateIpa(word: string): string {
    return `/${word
      .replace(/ph/g, "f")
      .replace(/ck/g, "k")
      .replace(/th/g, "θ")
      .replace(/sh/g, "ʃ")
      .replace(/ch/g, "tʃ")
      .replace(/ee/g, "iː")
      .replace(/oo/g, "uː")
      .replace(/ea/g, "iː")}/`;
  }
}
