---
phase: 4
title: "Interactive Lessons & Quizzes"
status: pending
priority: P1
effort: "3d"
dependencies: [1, 2]
---

# Phase 4: Interactive Lessons & Quizzes

## Overview
Thiet ke va trien khai he thong bai hoc tuong tac ngan (Bite-sized Lessons) theo cay noi dung Course -> Unit -> Lesson -> Exercise, bo engine cham diem da dang dang bai tap (Multiple Choice, Listening, Sentence Reordering, Fill-in-the-blank, Match Pairs), co che phan hoi ngay lap tuc (Instant Feedback) kem giai thich ngu phap va he thong quan ly Heart/Lives khi tra loi sai.

## Requirements
- **Functional Requirements:**
  - Mo hinh du lieu cay noi dung:
    - Course (vi du: "Tieng Anh Giao tiep A1", "Tieng Nhat So cap N5").
    - Unit (vi du: "Unit 1: Chao hoi & Gioi thieu ban than").
    - Lesson (moi bai 5 - 10 phut gom 10 - 15 cau hoi/exercise).
  - Ho tro cac dang bai tap (Exercise Types):
    1. `MULTIPLE_CHOICE`: Chon 1 dap an dung trong 4 phuong an.
    2. `LISTEN_AND_PICK`: Nghe doan audio roi chon tu hoac hinh anh tuong ung.
    3. `SENTENCE_REORDER`: Xep cac bong tu (word chips) thanh cau dung ngu phap.
    4. `FILL_IN_BLANK`: Dien tu con thieu vao doan van / cau thoai.
    5. `MATCH_PAIRS`: Noi cap tu vung - nghia (vi du: 5 tu tieng Anh va 5 tu tieng Viet).
  - Evaluation Engine:
    - Kiem tra cau tra loi (ho tro ca fuzzy match chuoi cho phep sai sot dau cau/khoang trang nho).
    - Tra ve giai thich chi tiet ly do dung/sai va quy tac ngu phap lien quan.
  - Heart / Energy System:
    - Nguoi dung co 5 Tim (Hearts). Moi cau sai bi tru 1 Tim.
    - Het Tim: phai on tap the cu de hoi phuc tim hoac cho thoi gian hoi phuc (30 phut / 1 Tim).
- **Non-functional Requirements:**
  - Thoi gian phan hoi cham diem duoi 100ms.
  - Cau truc du lieu JSON Exercise linh hoat, de dang mo rong them kieu bai tap moi ma khong can sua schema Database.

## Architecture
```
[User Answers Exercise]
          │
          ▼
 [Exercise Grading Engine] ─── (Correct) ───► +XP, Progress Step Up
          │
      (Incorrect)
          ▼
 -1 Heart (Lives Engine) ───► Explanation Hint & Common Mistake Tip
```

## Related Code Files
- Create: `apps/api/src/courses/courses.module.ts`, `apps/api/src/courses/courses.service.ts`, `apps/api/src/courses/courses.controller.ts`
- Create: `apps/api/src/lessons/lessons.service.ts`, `apps/api/src/lessons/lessons.controller.ts`
- Create: `apps/api/src/lessons/grading-engine.service.ts`
- Create: `packages/shared-types/src/exercises.ts`
- Modify: `apps/api/prisma/schema.prisma` (Them Course, Unit, Lesson, Exercise, UserLessonProgress)

## Implementation Steps
1. Dinh nghia Prisma Schema cho he thong bai hoc:
   ```prisma
   model Course {
     id          String    @id @default(uuid())
     title       String
     language    String
     level       String    // A1, A2...
     units       Unit[]
     createdAt   DateTime  @default(now())
   }

   model Unit {
     id          String    @id @default(uuid())
     courseId    String
     course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
     title       String
     orderIndex  Int
     lessons     Lesson[]
   }

   model Lesson {
     id          String       @id @default(uuid())
     unitId      String
     unit        Unit         @relation(fields: [unitId], references: [id], onDelete: Cascade)
     title       String
     orderIndex  Int
     xpReward    Int          @default(15)
     exercises   Exercise[]
   }

   model Exercise {
     id          String       @id @default(uuid())
     lessonId    String
     lesson      Lesson       @relation(fields: [lessonId], references: [id], onDelete: Cascade)
     type        String       // MULTIPLE_CHOICE, SENTENCE_REORDER, etc.
     prompt      String
     audioUrl    String?
     content     Json         // options, correctAnswers, explanation, audioTokens
     orderIndex  Int
   }

   model UserLessonProgress {
     id          String       @id @default(uuid())
     userId      String
     lessonId    String
     completed   Boolean      @default(false)
     score       Int          @default(0)
     mistakes    Int          @default(0)
     completedAt DateTime?
     @@unique([userId, lessonId])
   }
   ```
2. Viet `GradingEngineService` xu ly logic kiem tra ket qua cho tung loai exercise:
   - Normalize string (bo khoang trang thua, bo dau cham cuoi cau, khong phan biet hoa thuong).
   - Xu ly `SENTENCE_REORDER`: kiem tra mang ID tu vung xep theo dung thu tu mong muon.
   - Xu ly `MATCH_PAIRS`: xac nhan tat ca cac cap duoc noi dung 100%.
3. Viet endpoint bat dau bai hoc `GET /api/lessons/:id/session`: tra ve danh sach exercises da xao tron ngau nhien phuong an.
4. Viet endpoint nop dap an tung cau `POST /api/lessons/:id/check-answer`:
   - Kiem tra tinh dung dan, tra ve `isCorrect`, `explanation`, `heartsRemaining`.
5. Viet endpoint hoan thanh bai hoc `POST /api/lessons/:id/complete`: ghi nhan ket qua, cong diem XP vao he thong Gamification.
6. Seed data mau: 1 khoa hoc Tieng Anh A1 gom 2 Units, moi Unit 3 Lessons, moi Lesson 10 Exercises da dang the loai.

## Success Criteria
- [ ] Ho tro day du 5 dang bai tap cot loi, cham diem chinh xac ca truong hop dung, sai, va bien the viet hoa/thuong.
- [ ] Giai thich chi tiet loi sai duoc tra ve tuc thi khi nguoi dung tra loi sai.
- [ ] Khi nguoi dung sai qua 5 lan (het tim), he thong chan khong cho tiep tuc lam bai moi va huong dan on tap phuc hoi tim.
- [ ] Hoan thanh toan bo cau hoi trong bai se danh dau bai hoc hoan tat va cong XP chinh xac.

## Risk Assessment
- **Loi font chu va ki tu dac biet (tieng Nhat/Trung/tieng Phap co dau):** Can dam bao collation cua PostgreSQL la UTF-8 (`utf8mb4` hoac `en_US.UTF-8`) va xu ly Unicode normalization (NFC) khi so sanh chuoi.

## Security Considerations
- Tuyet doi khong gui truong `correctAnswer` xuong client trong payload bat dau bai hoc de chong gian lan inspect network. Chi cham diem tai Backend hoac tra ve hash ma hoa.
