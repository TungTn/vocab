---
phase: 5
title: "Gamification & Engagement"
status: completed
priority: P1
effort: "3d"
dependencies: [2, 4]
---

# Phase 5: Gamification & Engagement

## Overview
Xay dung he thong Gamification toan dien kieu Duolingo nham toi da hoa ty le giu chan nguoi dung (Retention Rate), bao gom: Chuoi ngay hoc lien tuc (Streaks co co che Freeze), Diem kinh nghiem (XP) & Cap do (Levels), Bang xep hang hang tuan theo cac League (Redis Sorted Sets), He thong kinh te ao (Gems & Hearts Refill), va Bo huy hieu thanh tuu (Achievements Engine).

## Requirements
- **Functional Requirements:**
  - **Streak Engine**:
    - Ghi nhan hoat dong hoc hang ngay theo timezone dia phuong cua User.
    - Tang chuoi streak neu hoc lien tiep; neu lo 1 ngay se bi dut streak tru phi da mua vat pham "Streak Freeze".
    - Ho tro "Streak Recovery" (lam thu thach dac biet de lay lai streak trong vong 24 gio).
  - **Weekly Leaderboard (Bang xep hang theo League)**:
    - 5 hang giai: Bronze -> Silver -> Gold -> Obsidian -> Diamond.
    - Moi nhom xep hang gom 30 nguoi ngau nhien cung League.
    - Tinh diem XP tich luy tu Thu Hai 00:00 UTC den Chu Nhat 23:59 UTC.
    - Top 7 thang hang (Promote), 5 nguoi cuoi rot hang (Demote).
  - **Virtual Economy (Gems / Lingots & Shop)**:
    - Nhan Gems khi len cap, hoan thanh chuoi streak 7 ngay, hoac dat top 3 bang xep hang.
    - Cua hang vat pham: Mua Streak Freeze (dong bang chuoi), Mua Heart Refill (day 5 tim), Mua trang phuc avatar.
  - **Achievements System**:
    - Tu dong theo doi va trao huy hieu khi thoa man dieu kien (vi du: "On Fire" - dat 30 ngay streak, "Sage" - dat 5000 XP, "Night Owl" - hoc sau 22h dem).
- **Non-functional Requirements:**
  - Truy van bang xep hang thoi gian thuc phai dat thoi gian phan hoi duoi 20ms bang Redis Sorted Sets.
  - Cron job tong ket tuan chay bat dong bo, dam bao khong gay khoa bang database khi co hang trieu ban ghi.

## Architecture
```
[User Action: Complete Lesson / Review]
                  │
                  ▼
         [Gamification Service]
         ├── 1. Streak Tracker (Check date, timezone, freeze item)
         ├── 2. Award XP & Check Level Up
         ├── 3. Increment Redis Sorted Set: ZINCRBY league:{id} {xp} {userId}
         └── 4. Check Achievements Triggers
                  │
                  ▼
         [PostgreSQL DB & Redis Cache]
         ├── UserStreak (currentStreak, longestStreak, lastActiveDate)
         ├── UserGems (balance)
         └── UserAchievements (unlockedAt)
```

## Related Code Files
- Create: `apps/api/src/gamification/gamification.module.ts`, `apps/api/src/gamification/gamification.service.ts`
- Create: `apps/api/src/gamification/streak.service.ts`
- Create: `apps/api/src/gamification/leaderboard.service.ts`
- Create: `apps/api/src/gamification/shop.service.ts`
- Create: `apps/api/src/gamification/achievements.service.ts`
- Create: `apps/api/src/cron/weekly-reset.cron.ts`
- Modify: `apps/api/prisma/schema.prisma`

## Implementation Steps
1. Cap nhat Schema Prisma cho he thong Gamification:
   ```prisma
   model UserStreak {
     userId         String    @id
     currentStreak  Int       @default(0)
     longestStreak  Int       @default(0)
     lastActivityAt DateTime?
     freezeCount    Int       @default(1)
     user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
   }

   model UserEconomy {
     userId         String    @id
     gems           Int       @default(100)
     hearts         Int       @default(5)
     lastHeartLoss  DateTime?
     user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
   }

   model Achievement {
     id             String    @id
     title          String
     description    String
     badgeIcon      String
     requirement    Int
     category       String    // STREAK, XP, ACCURACY
   }

   model UserAchievement {
     id             String       @id @default(uuid())
     userId         String
     achievementId  String
     unlockedAt     DateTime     @default(now())
     achievement    Achievement  @relation(fields: [achievementId], references: [id])
     @@unique([userId, achievementId])
   }
   ```
2. Trien khai `StreakService`:
   - So sanh `lastActivityAt` voi thoi diem hien tai theo local timezone cua user.
   - Neu trong cung 1 ngay: khong tang streak.
   - Neu la ngay tiep theo: `currentStreak += 1`.
   - Neu cach > 1 ngay: kiem tra neu co `freezeCount > 0` thi tieu thu 1 freeze de bao ve streak; neu khong thi reset ve 1.
3. Trien khai `LeaderboardService` su dung Redis:
   - Moi tuan tao mot key Redis: `leaderboard:league:{leagueId}:week:{year}_{weekNum}`.
   - Cap nhat diem bang lenh: `redis.zincrby(key, xpGained, userId)`.
   - Lay top bang xep hang: `redis.zrevrange(key, 0, 29, 'WITHSCORES')`.
   - Lay rank cua user hien tai: `redis.zrevrank(key, userId)`.
4. Viet cron job hang tuan voi BullMQ / `@nestjs/schedule`:
   - Quet cac bang xep hang vao 00:00 UTC sang thu Hai.
   - Thang hang cho top 7, giu hang cho nhom giua, ha hang cho 5 nguoi cuoi.
   - Thuong Gems cho top 3.
5. Trien khai `ShopService`: Mua vat pham tru Gems trong database transaction.

## Success Criteria
- [x] Streak duoc cap nhat chinh xac sau khi hoc xong bai dau tien trong ngay.
- [x] Streak Freeze hoat dong on dinh: bao ve duoc chuoi khi nguoi dung quen hoc 1 ngay.
- [x] Leaderboard tren Redis tra ve danh sach top 30 nguoi va rank cua user voi do tre < 15ms.
- [x] Mua vat pham trong shop tru gems an toan, tu choi giao dich neu so du khong du.
- [x] Cron job thu hai hang tuan tong ket va chuyen doi League chinh xac.

## Risk Assessment
- **Loi lech mui gio (Timezone Cheating):** Nguoi dung co the thay doi gio thiet bi tren dien thoai de gian lan streak.
  - *Giai phap:* Luon lay moc gio UTC tu may chu Backend ket hop voi timezone offset duoc gui tu client da qua kiem tra hop le.

## Security Considerations
- Diem XP phai do Backend tinh toan va ghi nhan khi submit ket qua bai hoc, khong chap nhan request client gui thong so XP tuy y.
