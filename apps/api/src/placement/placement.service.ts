import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LanguageLevel, PlacementQuestion, PlacementTestSubmission, PlacementTestResult } from "@linguaflow/shared-types";

@Injectable()
export class PlacementService {
  constructor(private readonly prisma: PrismaService) {}

  // 20 Standard Diagnostic Questions spanning A1 to C1
  private readonly questions: PlacementQuestion[] = [
    // A1
    { id: 1, level: LanguageLevel.A1, prompt: "What ___ your name?", options: ["is", "are", "am", "be"], correctAnswer: "is" },
    { id: 2, level: LanguageLevel.A1, prompt: "She ___ to school every morning.", options: ["go", "goes", "going", "gone"], correctAnswer: "goes" },
    { id: 3, level: LanguageLevel.A1, prompt: "They ___ not at home yesterday.", options: ["was", "were", "are", "be"], correctAnswer: "were" },
    { id: 4, level: LanguageLevel.A1, prompt: "There is ___ apple on the table.", options: ["a", "an", "the", "two"], correctAnswer: "an" },

    // A2
    { id: 5, level: LanguageLevel.A2, prompt: "I have lived here ___ 2020.", options: ["since", "for", "in", "from"], correctAnswer: "since" },
    { id: 6, level: LanguageLevel.A2, prompt: "If it rains tomorrow, we ___ stay home.", options: ["will", "would", "must", "did"], correctAnswer: "will" },
    { id: 7, level: LanguageLevel.A2, prompt: "This car is ___ than that one.", options: ["faster", "more fast", "fastest", "as fast"], correctAnswer: "faster" },
    { id: 8, level: LanguageLevel.A2, prompt: "He hasn't finished his homework ___.", options: ["already", "yet", "still", "just"], correctAnswer: "yet" },

    // B1
    { id: 9, level: LanguageLevel.B1, prompt: "The bridge ___ built in 1995.", options: ["was", "has been", "is", "were"], correctAnswer: "was" },
    { id: 10, level: LanguageLevel.B1, prompt: "She asked me where I ___.", options: ["lived", "live", "am living", "have lived"], correctAnswer: "lived" },
    { id: 11, level: LanguageLevel.B1, prompt: "I regret ___ you that the flight has been cancelled.", options: ["to tell", "telling", "told", "tell"], correctAnswer: "to tell" },
    { id: 12, level: LanguageLevel.B1, prompt: "You ___ better see a doctor right away.", options: ["had", "would", "should", "could"], correctAnswer: "had" },

    // B2
    { id: 13, level: LanguageLevel.B2, prompt: "Scarcely ___ arrived when the phone rang.", options: ["had he", "he had", "did he", "he was"], correctAnswer: "had he" },
    { id: 14, level: LanguageLevel.B2, prompt: "It's high time you ___ thinking about your career.", options: ["started", "start", "starting", "would start"], correctAnswer: "started" },
    { id: 15, level: LanguageLevel.B2, prompt: "She succeeded ___ passing the examination.", options: ["in", "at", "for", "on"], correctAnswer: "in" },
    { id: 16, level: LanguageLevel.B2, prompt: "Had I known about the party, I ___ attended.", options: ["would have", "will have", "would", "had"], correctAnswer: "would have" },

    // C1
    { id: 17, level: LanguageLevel.C1, prompt: "The proposal was met with fierce opposition, ___ the negotiations were suspended.", options: ["whereupon", "whereas", "wherever", "whereby"], correctAnswer: "whereupon" },
    { id: 18, level: LanguageLevel.C1, prompt: "Under no circumstances ___ leave the laboratory unattended.", options: ["should students", "students should", "students must", "do students"], correctAnswer: "should students" },
    { id: 19, level: LanguageLevel.C1, prompt: "His eloquent speech gave ___ to widespread debate.", options: ["rise", "way", "birth", "cause"], correctAnswer: "rise" },
    { id: 20, level: LanguageLevel.C1, prompt: "The data is subject to statistical fluctuations, ___ making conclusions provisional.", options: ["thereby", "therein", "thereof", "therefore"], correctAnswer: "thereby" }
  ];

  getQuestions(): Omit<PlacementQuestion, "correctAnswer">[] {
    // Strip correct answers when sending to client
    return this.questions.map(({ id, level, prompt, options }) => ({
      id,
      level,
      prompt,
      options
    }));
  }

  async evaluateTest(userId: string, submission: PlacementTestSubmission): Promise<PlacementTestResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    let correctCount = 0;
    const answerMap = new Map(submission.answers.map((a) => [a.questionId, a.selectedAnswer]));

    for (const q of this.questions) {
      const selected = answerMap.get(q.id);
      if (selected && selected.trim().toLowerCase() === q.correctAnswer.toLowerCase()) {
        correctCount += 1;
      }
    }

    const totalQuestions = this.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    let assessedLevel: LanguageLevel = LanguageLevel.A1;
    let recommendation = "Bắt đầu với Khóa học Nhập môn A1 để xây dựng nền tảng từ vựng và ngữ pháp vững chắc.";

    if (score >= 90) {
      assessedLevel = LanguageLevel.C1;
      recommendation = "Trình độ Cao cấp (C1): Tự tin hội thoại chuyên sâu, luyện ngữ âm nâng cao và mở rộng vốn từ học thuật.";
    } else if (score >= 75) {
      assessedLevel = LanguageLevel.B2;
      recommendation = "Trình độ Trung cao cấp (B2): Bạn có thể bắt đầu với các chủ đề tranh luận, podcast và đọc hiểu phức tạp.";
    } else if (score >= 55) {
      assessedLevel = LanguageLevel.B1;
      recommendation = "Trình độ Trung cấp (B1): Tập trung vào phản xạ giao tiếp tình huống và từ vựng thông dụng.";
    } else if (score >= 35) {
      assessedLevel = LanguageLevel.A2;
      recommendation = "Trình độ Sơ cấp (A2): Củng cố các thì cơ bản, mẫu câu hỏi đáp hàng ngày và luyện nghe quen tai.";
    }

    // Save test result
    await this.prisma.placementTestResult.create({
      data: {
        userId,
        targetLang: submission.targetLang,
        score,
        assessedLevel,
        answersJson: submission.answers as unknown as object
      }
    });

    // Update user's profile with the assessed level
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: user.username,
        targetLang: submission.targetLang,
        currentLevel: assessedLevel,
        dailyGoalMinutes: 15,
        dailyGoalXp: 30
      },
      update: {
        targetLang: submission.targetLang,
        currentLevel: assessedLevel
      }
    });

    return {
      score,
      assessedLevel,
      correctCount,
      totalQuestions,
      recommendation
    };
  }

  async getLatestTest(userId: string) {
    return this.prisma.placementTestResult.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }
}
