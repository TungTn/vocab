import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { GradingEngineService } from "./grading-engine.service";
import {
  CheckAnswerRequest,
  CheckAnswerResponse,
  CompleteLessonRequest,
  ExerciseContent
} from "@linguaflow/shared-types";

@Injectable()
export class LessonsService {
  private readonly logger = new Logger(LessonsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly gradingEngine: GradingEngineService
  ) {}

  /**
   * Starts a lesson session.
   * Strips correct answers to prevent client inspection.
   */
  async getLessonSession(lessonId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, hearts: true }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.hearts <= 0) {
      throw new ForbiddenException(
        "Bạn đã hết Tim (0/5)! Hãy hoàn thành bài ôn tập từ vựng cũ hoặc chờ thời gian hồi phục để tiếp tục bài học mới."
      );
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        exercises: {
          orderBy: { orderIndex: "asc" }
        }
      }
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    // Security invariant: Strip correctAnswer from each exercise content payload
    const safeExercises = lesson.exercises.map((ex) => {
      const content = { ...(ex.content as unknown as ExerciseContent) };
      delete content.correctAnswer;

      // Shuffle options for multiple choice so order is randomized
      if (content.options && Array.isArray(content.options)) {
        content.options = [...content.options].sort(() => Math.random() - 0.5);
      }

      // Shuffle words for sentence reorder
      if (content.words && Array.isArray(content.words)) {
        content.words = [...content.words].sort(() => Math.random() - 0.5);
      }

      return {
        id: ex.id,
        lessonId: ex.lessonId,
        type: ex.type,
        prompt: ex.prompt,
        audioUrl: ex.audioUrl,
        content,
        orderIndex: ex.orderIndex
      };
    });

    return {
      lessonId: lesson.id,
      title: lesson.title,
      xpReward: lesson.xpReward,
      heartsRemaining: user.hearts,
      totalExercises: safeExercises.length,
      exercises: safeExercises
    };
  }

  /**
   * Evaluates an individual exercise answer and manages hearts.
   */
  async checkAnswer(
    lessonId: string,
    userId: string,
    dto: CheckAnswerRequest
  ): Promise<CheckAnswerResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.hearts <= 0) {
      throw new ForbiddenException("Bạn đã hết Tim! Hãy ôn tập để hồi phục tim.");
    }

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: dto.exerciseId }
    });

    if (!exercise || exercise.lessonId !== lessonId) {
      throw new NotFoundException("Exercise not found in this lesson");
    }

    const content = exercise.content as unknown as ExerciseContent;
    const grading = this.gradingEngine.evaluate(exercise.type, content, dto.answer);

    let heartsRemaining = user.hearts;

    if (!grading.isCorrect) {
      heartsRemaining = Math.max(0, user.hearts - 1);
      await this.prisma.user.update({
        where: { id: userId },
        data: { hearts: heartsRemaining }
      });

      // Track mistake count
      await this.prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: {
          userId,
          lessonId,
          mistakes: 1
        },
        update: {
          mistakes: { increment: 1 }
        }
      });
    }

    return {
      isCorrect: grading.isCorrect,
      correctAnswer: grading.canonicalAnswer,
      explanation: grading.explanation,
      heartsRemaining,
      isGameOver: heartsRemaining === 0
    };
  }

  /**
   * Completes a lesson, records score, awards XP and updates streaks.
   */
  async completeLesson(
    lessonId: string,
    userId: string,
    dto: CompleteLessonRequest
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: true }
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const now = new Date();
    let xpEarned = lesson.xpReward;
    if (dto.score === 100) {
      xpEarned += 5; // Perfect score bonus XP!
    }

    // 1. Upsert UserLessonProgress
    const progress = await this.prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        completed: true,
        score: dto.score,
        mistakes: dto.mistakes,
        completedAt: now
      },
      update: {
        completed: true,
        score: Math.max(dto.score, 0),
        mistakes: dto.mistakes,
        completedAt: now
      }
    });

    // 2. Also sync to global UserProgress
    await this.prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        unitId: lesson.unitId,
        courseId: lesson.unit.courseId,
        completed: true,
        score: dto.score,
        completedAt: now
      },
      update: {
        completed: true,
        score: Math.max(dto.score, 0),
        completedAt: now
      }
    });

    // 3. Update User XP & Streak
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpEarned }
        }
      });

      // Update Redis weekly leaderboard
      const currentYear = now.getUTCFullYear();
      const weekNumber = this.getWeekNumber(now);
      const leaderboardKey = `leaderboard:weekly:${currentYear}-W${weekNumber}`;
      await this.redis.getClient().zincrby(leaderboardKey, xpEarned, userId);
    }

    return {
      success: true,
      lessonId,
      score: dto.score,
      xpEarned,
      completedAt: now
    };
  }

  /**
   * Refill hearts (e.g. after completing a vocabulary review or bonus)
   */
  async refillHearts(userId: string, count: number = 5) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const newHearts = Math.min(5, user.hearts + count);
    return this.prisma.user.update({
      where: { id: userId },
      data: { hearts: newHearts },
      select: { id: true, hearts: true }
    });
  }

  private getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
