import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Achievement } from "@linguaflow/shared-types";

export const SYSTEM_ACHIEVEMENTS = [
  {
    id: "STREAK_3",
    title: "Cháy Bỏng Khởi Đầu (Wildfire)",
    description: "Duy trì chuỗi học tập liên tục 3 ngày.",
    badgeIcon: "🔥",
    category: "STREAK",
    requirement: 3,
    gemReward: 20
  },
  {
    id: "STREAK_7",
    title: "Ý Chí Bất Diệt (On Fire)",
    description: "Đạt mốc chuỗi học tập 7 ngày liên tục.",
    badgeIcon: "⚡",
    category: "STREAK",
    requirement: 7,
    gemReward: 50
  },
  {
    id: "STREAK_30",
    title: "Bậc Thầy Kỷ Luật (Unstoppable)",
    description: "Chinh phục chuỗi học tập 30 ngày kiên trì.",
    badgeIcon: "🏆",
    category: "STREAK",
    requirement: 30,
    gemReward: 100
  },
  {
    id: "XP_100",
    title: "Bước Chân Đầu Tiên (First Steps)",
    description: "Tích lũy được 100 điểm kinh nghiệm (XP).",
    badgeIcon: "🌱",
    category: "XP",
    requirement: 100,
    gemReward: 30
  },
  {
    id: "XP_500",
    title: "Người Chăm Chỉ (Diligent Learner)",
    description: "Tích lũy được 500 điểm kinh nghiệm (XP).",
    badgeIcon: "⭐",
    category: "XP",
    requirement: 500,
    gemReward: 60
  },
  {
    id: "XP_1000",
    title: "Hiền Triết Ngôn Ngữ (Sage)",
    description: "Tích lũy được 1000 điểm kinh nghiệm (XP).",
    badgeIcon: "👑",
    category: "XP",
    requirement: 1000,
    gemReward: 100
  },
  {
    id: "LESSON_1",
    title: "Khởi Đầu Mới (New Horizon)",
    description: "Hoàn thành bài học tương tác đầu tiên.",
    badgeIcon: "🎯",
    category: "LESSON",
    requirement: 1,
    gemReward: 20
  },
  {
    id: "LESSON_10",
    title: "Tăng Tốc (Full Throttle)",
    description: "Vượt qua 10 bài học tương tác xuất sắc.",
    badgeIcon: "🚀",
    category: "LESSON",
    requirement: 10,
    gemReward: 50
  }
];

@Injectable()
export class AchievementsService implements OnModuleInit {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Seed default achievements if not exists
    for (const ach of SYSTEM_ACHIEVEMENTS) {
      await this.prisma.achievement.upsert({
        where: { id: ach.id },
        update: {},
        create: ach
      });
    }
  }

  async checkAndUnlock(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        streakData: true,
        achievements: true
      }
    });

    if (!user) return [];

    const completedLessonCount = await this.prisma.userLessonProgress.count({
      where: { userId, completed: true }
    });

    const currentStreak = user.streakData?.currentStreak || user.streak || 0;
    const totalXp = user.xp || 0;

    const unlockedSet = new Set(user.achievements.map((ua) => ua.achievementId));
    const newlyUnlocked: string[] = [];
    let totalGemsAwarded = 0;

    for (const ach of SYSTEM_ACHIEVEMENTS) {
      if (unlockedSet.has(ach.id)) continue;

      let satisfied = false;
      if (ach.category === "STREAK" && currentStreak >= ach.requirement) {
        satisfied = true;
      } else if (ach.category === "XP" && totalXp >= ach.requirement) {
        satisfied = true;
      } else if (ach.category === "LESSON" && completedLessonCount >= ach.requirement) {
        satisfied = true;
      }

      if (satisfied) {
        await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: ach.id
          }
        });
        totalGemsAwarded += ach.gemReward;
        newlyUnlocked.push(ach.title);
      }
    }

    if (totalGemsAwarded > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          gems: { increment: totalGemsAwarded }
        }
      });
      this.logger.log(`Unlocked ${newlyUnlocked.length} achievements for user ${userId}, awarded ${totalGemsAwarded} gems.`);
    }

    return newlyUnlocked;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        streakData: true,
        achievements: true
      }
    });

    const completedLessonCount = await this.prisma.userLessonProgress.count({
      where: { userId, completed: true }
    });

    const currentStreak = user?.streakData?.currentStreak || user?.streak || 0;
    const totalXp = user?.xp || 0;
    const unlockedMap = new Map(
      user?.achievements.map((ua) => [ua.achievementId, ua.unlockedAt]) || []
    );

    return SYSTEM_ACHIEVEMENTS.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.id);
      let currentValue = 0;
      if (ach.category === "STREAK") currentValue = currentStreak;
      else if (ach.category === "XP") currentValue = totalXp;
      else if (ach.category === "LESSON") currentValue = completedLessonCount;

      const progress = isUnlocked ? 100 : Math.min(100, Math.round((currentValue / ach.requirement) * 100));

      return {
        id: ach.id,
        title: ach.title,
        description: ach.description,
        badgeIcon: ach.badgeIcon,
        category: ach.category,
        requirement: ach.requirement,
        gemReward: ach.gemReward,
        unlocked: isUnlocked,
        unlockedAt: unlockedMap.get(ach.id) || null,
        progress
      };
    });
  }
}
