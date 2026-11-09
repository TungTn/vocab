import { z } from "zod";
import { LeagueTier } from "./enums";

export const StreakInfoSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  freezeCount: z.number().int().nonnegative(),
  isActiveToday: z.boolean(),
  lastActivityAt: z.date().optional().nullable()
});

export type StreakInfo = z.infer<typeof StreakInfoSchema>;

export const LeaderboardMemberSchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().url().optional().nullable(),
  xp: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
  zone: z.enum(["PROMOTE", "STAY", "DEMOTE"])
});

export type LeaderboardMember = z.infer<typeof LeaderboardMemberSchema>;

export const LeagueLeaderboardSchema = z.object({
  tier: z.nativeEnum(LeagueTier),
  weekIdentifier: z.string(),
  members: z.array(LeaderboardMemberSchema),
  currentUserRank: z.number().int().positive().optional().nullable(),
  currentUserXp: z.number().int().nonnegative().optional().nullable()
});

export type LeagueLeaderboard = z.infer<typeof LeagueLeaderboardSchema>;

export const ShopItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  costGems: z.number().int().positive(),
  icon: z.string(),
  category: z.enum(["HEALTH", "STREAK", "BOOST", "CUSTOMIZATION"])
});

export type ShopItem = z.infer<typeof ShopItemSchema>;

export const BuyShopItemRequestSchema = z.object({
  itemId: z.string()
});

export type BuyShopItemRequest = z.infer<typeof BuyShopItemRequestSchema>;

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  badgeIcon: z.string(),
  category: z.string(),
  requirement: z.number().int().positive(),
  gemReward: z.number().int().nonnegative(),
  unlocked: z.boolean().default(false),
  unlockedAt: z.date().optional().nullable(),
  progress: z.number().int().nonnegative().default(0)
});

export type Achievement = z.infer<typeof AchievementSchema>;
