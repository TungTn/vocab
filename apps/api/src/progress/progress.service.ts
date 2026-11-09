import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { UpdateLessonProgress } from "@linguaflow/shared-types";

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async recordLessonProgress(userId: string, dto: UpdateLessonProgress) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: { unit: { include: { course: true } } }
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const xpEarned = dto.completed ? lesson.xpReward : Math.floor(lesson.xpReward * (dto.score / 100));

    // Upsert UserProgress
    const progress = await this.prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: dto.lessonId
        }
      },
      create: {
        userId,
        lessonId: dto.lessonId,
        unitId: dto.unitId,
        courseId: dto.courseId,
        completed: dto.completed,
        score: dto.score,
        completedAt: dto.completed ? new Date() : null
      },
      update: {
        completed: dto.completed,
        score: Math.max(dto.score, 0),
        ...(dto.completed && { completedAt: new Date() })
      }
    });

    // Update User XP & Streak
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (user) {
      const now = new Date();
      const updatedXp = user.xp + xpEarned;

      // Update Redis Leaderboard for current week
      const currentYear = now.getUTCFullYear();
      const currentWeek = this.getWeekNumber(now);
      const leaderboardKey = `leaderboard:weekly:${currentYear}-W${currentWeek}`;
      await this.redis.getClient().zincrby(leaderboardKey, xpEarned, userId);

      // Streak calculation
      let newStreak = user.streak;
      const lastUpdated = new Date(user.updatedAt);
      const isSameDay =
        lastUpdated.getUTCFullYear() === now.getUTCFullYear() &&
        lastUpdated.getUTCMonth() === now.getUTCMonth() &&
        lastUpdated.getUTCDate() === now.getUTCDate();

      if (!isSameDay) {
        const yesterday = new Date(now);
        yesterday.setUTCDate(now.getUTCDate() - 1);
        const isYesterday =
          lastUpdated.getUTCFullYear() === yesterday.getUTCFullYear() &&
          lastUpdated.getUTCMonth() === yesterday.getUTCMonth() &&
          lastUpdated.getUTCDate() === yesterday.getUTCDate();

        if (isYesterday || user.streak === 0) {
          newStreak = user.streak + 1;
        } else {
          // Check streak freeze
          if (user.streakFreezeCount > 0) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { streakFreezeCount: user.streakFreezeCount - 1 }
            });
            newStreak = user.streak + 1;
          } else {
            newStreak = 1;
          }
        }
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: updatedXp,
          streak: newStreak
        }
      });
    }

    return {
      progress,
      xpEarned
    };
  }

  async getCourseProgress(userId: string, courseId: string) {
    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({
        where: { unit: { courseId } }
      }),
      this.prisma.userProgress.count({
        where: {
          userId,
          courseId,
          completed: true
        }
      })
    ]);

    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      courseId,
      totalLessons,
      completedLessons,
      percentage
    };
  }

  async getUserProgressSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xp: true,
        streak: true,
        hearts: true,
        streakFreezeCount: true
      }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const completedLessonsCount = await this.prisma.userProgress.count({
      where: { userId, completed: true }
    });

    return {
      user,
      completedLessonsCount
    };
  }

  private getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
