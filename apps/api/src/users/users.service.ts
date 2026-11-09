import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole, LanguageLevel } from "@linguaflow/shared-types";
import { UpdateProfile } from "@linguaflow/shared-types";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: { profile: true }
    });
  }

  async createUser(data: {
    email: string;
    username: string;
    passwordHash?: string;
    role?: UserRole;
    targetLang?: string;
    nativeLang?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role || UserRole.USER,
        profile: {
          create: {
            displayName: data.username,
            targetLang: data.targetLang || "en",
            nativeLang: data.nativeLang || "vi",
            currentLevel: LanguageLevel.A1,
            dailyGoalMinutes: 15,
            dailyGoalXp: 30
          }
        }
      },
      include: { profile: true }
    });
  }

  async updateProfile(userId: string, data: UpdateProfile) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: data.displayName || user.username,
        targetLang: data.targetLang || "en",
        nativeLang: data.nativeLang || "vi",
        currentLevel: (data.currentLevel as LanguageLevel) || LanguageLevel.A1,
        dailyGoalMinutes: data.dailyGoalMinutes ?? 15,
        dailyGoalXp: data.dailyGoalXp ?? 30,
        bio: data.bio
      },
      update: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.targetLang && { targetLang: data.targetLang }),
        ...(data.nativeLang && { nativeLang: data.nativeLang }),
        ...(data.currentLevel && { currentLevel: data.currentLevel as LanguageLevel }),
        ...(data.dailyGoalMinutes !== undefined && { dailyGoalMinutes: data.dailyGoalMinutes }),
        ...(data.dailyGoalXp !== undefined && { dailyGoalXp: data.dailyGoalXp }),
        ...(data.bio !== undefined && { bio: data.bio })
      }
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        xp: true,
        streak: true,
        hearts: true,
        streakFreezeCount: true,
        timezone: true,
        profile: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}
