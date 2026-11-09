import {
  Injectable,
  BadRequestException,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { ShopItem } from "@linguaflow/shared-types";

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: "HEART_REFILL",
    name: "Hồi Phục Toàn Bộ Tim (Full Hearts)",
    description: "Hồi sinh ngay lập tức 5 Tim để bạn tiếp tục chinh phục các bài học mới mà không cần chờ đợi.",
    costGems: 50,
    icon: "❤️",
    category: "HEALTH"
  },
  {
    id: "STREAK_FREEZE",
    name: "Bình Đóng Băng Chuỗi (Streak Freeze)",
    description: "Bảo vệ chuỗi ngày học của bạn không bị gián đoạn nếu bạn vô tình bỏ lỡ 1 ngày học (tối đa giữ 3 bình).",
    costGems: 100,
    icon: "🧊",
    category: "STREAK"
  },
  {
    id: "DOUBLE_XP_BOOST",
    name: "Thuốc Nhân Đôi Điểm XP (Double XP 15m)",
    description: "Nhân đôi toàn bộ điểm kinh nghiệm nhận được từ các bài học và ôn tập trong vòng 15 phút tới.",
    costGems: 80,
    icon: "⚡",
    category: "BOOST"
  }
];

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  getCatalog(): ShopItem[] {
    return SHOP_CATALOG;
  }

  async buyItem(userId: string, itemId: string) {
    const item = SHOP_CATALOG.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException("Vật phẩm không tồn tại trong cửa hàng");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { streakData: true }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.gems < item.costGems) {
      throw new BadRequestException(
        `Không đủ Gems! Bạn cần ${item.costGems} Gems nhưng hiện chỉ có ${user.gems} Gems.`
      );
    }

    // Process purchase in database transaction
    const remainingGems = user.gems - item.costGems;

    if (item.id === "HEART_REFILL") {
      if (user.hearts >= 5) {
        throw new BadRequestException("Số Tim của bạn hiện tại đã đầy (5/5).");
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          gems: remainingGems,
          hearts: 5
        }
      });

      return {
        success: true,
        itemPurchased: item.name,
        remainingGems,
        effectApplied: "Số Tim đã được hồi phục đầy đủ (5/5)."
      };
    }

    if (item.id === "STREAK_FREEZE") {
      const currentFreeze = user.streakData?.freezeCount ?? user.streakFreezeCount ?? 0;
      if (currentFreeze >= 3) {
        throw new BadRequestException("Bạn đã đạt giới hạn tối đa 3 bình Đóng Băng Chuỗi.");
      }

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: {
            gems: remainingGems,
            streakFreezeCount: currentFreeze + 1
          }
        }),
        this.prisma.userStreak.upsert({
          where: { userId },
          create: {
            userId,
            freezeCount: currentFreeze + 1
          },
          update: {
            freezeCount: currentFreeze + 1
          }
        })
      ]);

      return {
        success: true,
        itemPurchased: item.name,
        remainingGems,
        effectApplied: `Bạn hiện có ${currentFreeze + 1} bình Đóng Băng Chuỗi.`
      };
    }

    if (item.id === "DOUBLE_XP_BOOST") {
      // Activate double XP boost in Redis with 15 minutes TTL (900s)
      await this.redis.getClient().set(`boost:double_xp:${userId}`, "active", "EX", 900);

      await this.prisma.user.update({
        where: { id: userId },
        data: { gems: remainingGems }
      });

      return {
        success: true,
        itemPurchased: item.name,
        remainingGems,
        effectApplied: "Kích hoạt hiệu ứng Nhân đôi XP trong vòng 15 phút!"
      };
    }

    throw new BadRequestException("Vật phẩm chưa được hỗ trợ kích hoạt");
  }

  async isDoubleXpActive(userId: string): Promise<boolean> {
    const active = await this.redis.getClient().get(`boost:double_xp:${userId}`);
    return active === "active";
  }
}
