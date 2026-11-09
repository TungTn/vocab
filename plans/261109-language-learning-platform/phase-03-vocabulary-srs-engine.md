---
phase: 3
title: "Vocabulary & SRS Engine"
status: completed
priority: P1
effort: "3d"
dependencies: [1, 2]
---

# Phase 3: Vocabulary & SRS Engine

## Overview
Xay dung thu vien loi `@lingua/srs-engine` trien khai thuat toan lap lai ngat quang toi tan FSRS (Free Spaced Repetition Scheduler) / SM-2 toi uu, cung module quan ly kho tu vung (Vocabulary Dictionary, Decks, Flashcards), he thong tinh toan hang doi the can on tap (Due Cards Queue), va co che gan am thanh phat am (IPA + Audio stream).

## Requirements
- **Functional Requirements:**
  - Dong goi thuat toan FSRS (hoac SM-2 cai tien) trong `packages/srs-engine`:
    - Tinh toan thoi gian on tap tiep theo dua tren danh gia nguoi dung: Again (1), Hard (2), Good (3), Easy (4).
    - Cap nhat he so on dinh (Stability), do kho (Difficulty), so lan lap lai (Reps), va so lan quen (Lapses).
  - Quan ly Decks (Bo tu vung) va Flashcards:
    - Thuoc tinh the: Tu vung (Term), Phien am (IPA), Nghia (Definition), Tu loai (POS), Cau vi du (Examples), Hinh anh minh hoa, Audio phat am chuan.
    - Ho tro Decks he thong (System Curated: Oxford 3000, HSK 1-6, JLPT N5-N1) va Custom User Decks.
  - API danh sach the den han on tap trong ngay (`GET /api/srs/review-queue?deckId=...`).
  - API nop ket qua danh gia the (`POST /api/srs/review`): cap nhat state the va tra ve the tiep theo ngay lap tuc.
- **Non-functional Requirements:**
  - Logic tinh toan FSRS phai thuc thi cuc nhanh (<1ms moi the), chay duoc o ca Backend NestJS va Client Mobile (khi offline).
  - Tich hop cache Redis cho hang doi on tap de tranh tinh toan lai database lien tuc trong cung mot ngay.

## Architecture
```
[User Review Action: Again / Hard / Good / Easy]
                      │
                      ▼
             [@lingua/srs-engine]
      (FSRS / SM-2 Algorithm Calculator)
        ├── Stability (S)
        ├── Difficulty (D)
        └── Next Review Date (Interval)
                      │
                      ▼
          [PostgreSQL Database]
        ├── Deck (System / Custom)
        ├── Flashcard (Word, IPA, Audio, Example)
        └── CardReviewState (CardId, UserId, DueDate, State)
```

## Related Code Files
- Create: `packages/srs-engine/src/fsrs.ts`, `packages/srs-engine/src/sm2.ts`, `packages/srs-engine/src/types.ts`
- Create: `apps/api/src/srs/srs.module.ts`, `apps/api/src/srs/srs.service.ts`, `apps/api/src/srs/srs.controller.ts`
- Create: `apps/api/src/vocabulary/vocabulary.service.ts`, `apps/api/src/vocabulary/vocabulary.controller.ts`
- Modify: `apps/api/prisma/schema.prisma` (Them Deck, Flashcard, CardReviewState)

## Implementation Steps
1. Xay dung `packages/srs-engine`:
   - Dinh nghia interface `ReviewLog` va `CardState` (New, Learning, Review, Relearning).
   - Viet thuat toan FSRS voi cong thuc tinh toan khoang cach ngay on tap (Intervals) va do quen (Retrievability).
   - Viet bo unit test voi 100+ case kiem thu do chinh xac cua thuat toan qua thoi gian.
2. Dinh nghia Prisma Schema cho Vocabulary & SRS:
   ```prisma
   model Deck {
     id          String       @id @default(uuid())
     title       String
     description String?
     language    String
     isSystem    Boolean      @default(false)
     cards       Flashcard[]
     createdAt   DateTime     @default(now())
   }

   model Flashcard {
     id          String            @id @default(uuid())
     deckId      String
     deck        Deck              @relation(fields: [deckId], references: [id], onDelete: Cascade)
     term        String
     ipa         String?
     meaning     String
     examples    Json?             // Array of { text: string, translation: string, audioUrl?: string }
     audioUrl    String?
     imageUrl    String?
     reviewStates CardReviewState[]
   }

   model CardReviewState {
     id          String       @id @default(uuid())
     userId      String
     cardId      String
     card        Flashcard    @relation(fields: [cardId], references: [id], onDelete: Cascade)
     stability   Float        @default(0)
     difficulty  Float        @default(0)
     reps        Int          @default(0)
     lapses      Int          @default(0)
     state       String       @default("NEW") // NEW, LEARNING, REVIEW
     dueAt       DateTime     @default(now())
     lastReview  DateTime?
     @@unique([userId, cardId])
     @@index([userId, dueAt])
   }
   ```
3. Chay migration Prisma va tao seed script nap 500 tu vung Oxford thong dung nhat kem phien am IPA va vi du.
4. Xay dung Service tinh toan hang doi the on tap: gom cac the co `dueAt <= now()` ket hop them the moi (New Cards) theo quota hang ngay cua User (vi du: toi da 20 the moi/ngay).
5. Xay dung API submit danh gia review the (`POST /api/srs/review`) thuc hien trong Database Transaction de dam bao tinh toan toan ven.

## Success Criteria
- [x] Thuat toan SRS trong `@lingua/srs-engine` vuot qua 100% test cases (kiem thu ca 4 nut danh gia: Again, Hard, Good, Easy; retrievability decay over time).
- [x] API tra ve danh sach the can on tap trong ngay theo dung thu tu uu tien: the bi quen -> the den han -> the moi (kem Catch-up Mode).
- [x] Danh gia the lap tuc cap nhat ngay review tiep theo chinh xac (vi du: the danh gia Easy co khoang on tap tang tu 1 ngay len 3-4 ngay).
- [x] Ho tro tai va phat audio phat am cua tu vung chuan xac kem vi du song ngu.

## Risk Assessment
- **Hien tuong don u the on tap (Review Hell):** Neu nguoi dung nghi hoc vai ngay, hang tram the bi don lai gay nan chi.
  - *Giai phap:* Thiet lap co che "Catch-up Mode" gioi han toi da 50 the review/ngay va phan bo so con lai ra cac ngay sau.

## Security Considerations
- Validate user so huu card review state, tranh viec gui request review card cua user khac thong qua ID injection.
