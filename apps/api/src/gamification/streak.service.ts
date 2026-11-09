import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StreakInfo } from "@linguaflow/shared-types";

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns date string YYYY-MM-DD for a given date and timezone.
   */
  private getDateKey(date: Date, timezone: string = "UTC"): string {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      return formatter.format(date);
    } catch {
      return date.toISOString().split("T")[0];
    }
  }

  /**
   * Calculates difference in calendar days between two dates.
   */
  private getDaysDiff(date1Str: string, date2Str: string): number {
    const d1 = new Date(date1Str + "T00:00:00Z");
    const d2 = new Date(date2Str + "T00:00:00Z");
    const diffMs = d2.getTime() - d1.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  async getStreakInfo(userId: string): Promise<StreakInfo> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { streakData: true }
    });

    if (!user) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        freezeCount: 0,
        isActiveToday: false,
        lastActivityAt: null
      };
    }

    const streakData = user.streakData;
    const now = new Date();
    const todayStr = this.getDateKey(now, user.timezone);

    let isActiveToday = false;
    if (streakData?.lastActivityAt) {
      const lastActiveStr = this.getDateKey(streakData.lastActivityAt, user.timezone);
      isActiveToday = lastActiveStr === todayStr;
    }

    return {
      currentStreak: streakData?.currentStreak || user.streak || 0,
      longestStreak: streakData?.longestStreak || user.streak || 0,
      freezeCount: streakData?.freezeCount ?? user.streakFreezeCount ?? 1,
      isActiveToday,
      lastActivityAt: streakData?.lastActivityAt || null
    };
  }

  /**
   * Records daily activity (lesson completion, vocabulary review).
   * Automatically handles streaks and streak freeze protection.
   */
  async recordActivity(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { streakData: true }
    });

    if (!user) return null;

    const now = new Date();
    const todayStr = this.getDateKey(now, user.timezone);
    const existing = user.streakData;

    let currentStreak = existing?.currentStreak || 0;
    let longestStreak = existing?.longestStreak || 0;
    let freezeCount = existing?.freezeCount ?? 1;
    let freezeUsed = false;

    if (!existing || !existing.lastActivityAt) {
      // First ever activity!
      currentStreak = 1;
      longestStreak = 1;
    } else {
      const lastActiveStr = this.getDateKey(existing.lastActivityAt, user.timezone);
      const daysDiff = this.getDaysDiff(lastActiveStr, todayStr);

      if (daysDiff === 0) {
        // Already active today, no streak change
        return {
          currentStreak,
          longestStreak,
          freezeCount,
          freezeUsed: false
        };
      } else if (daysDiff === 1) {
        // Consecutive day!
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (daysDiff === 2) {
        // Missed exactly 1 day: Check if user has streak freeze
        if (freezeCount > 0) {
          freezeCount -= 1;
          freezeUsed = true;
          currentStreak += 1; // Freeze protected the chain!
          longestStreak = Math.max(longestStreak, currentStreak);
          this.logger.log(`User ${userId} consumed 1 streak freeze. Streak saved at ${currentStreak}.`);
        } else {
          // No freeze available, reset streak to 1
          currentStreak = 1;
        }
      } else {
        // Missed 2 or more days, reset streak to 1
        currentStreak = 1;
      }
    }

    const updated = await this.prisma.userStreak.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak,
        longestStreak,
        freezeCount,
        lastActivityAt: now
      },
      update: {
        currentStreak,
        longestStreak,
        freezeCount,
        lastActivityAt: now
      }
    });

    // Sync back to User root fields
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        streak: currentStreak,
        streakFreezeCount: freezeCount
      }
    });

    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      freezeCount: updated.freezeCount,
      freezeUsed
    };
  }
}
