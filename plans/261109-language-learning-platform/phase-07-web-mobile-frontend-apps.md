---
phase: 7
title: "Web & Mobile Frontend Apps"
status: pending
priority: P1
effort: "4d"
dependencies: [1, 2, 3, 4, 5, 6]
---

# Phase 7: Web & Mobile Frontend Apps

## Overview
Phat trien dong bo hai giao dien nguoi dung hoan chinh: Web Application (Next.js 15 App Router + Tailwind CSS + shadcn/ui + PWA) va Mobile Application (React Native voi Expo SDK 52 + NativeWind + Expo Audio), ket noi truc tiep vao toan bo cac API nghiep vu da xay dung (Auth, SRS Flashcards, Bite-sized Quiz Runner, Gamification, AI Speaking Partner).

## Requirements
- **Functional Requirements:**
  - **Shared Client Logic (`@lingua/api-client` & `@lingua/ui`)**:
    - TanStack Query (React Query) cho caching du lieu va optimistic updates.
    - Zustand store quan ly phien dang nhap, trang thai Tim (Hearts), XP, va cai dat am thanh.
  - **Web Application (`apps/web`)**:
    - *Learning Path Screen*: Ban do lo trinh hoc dang cay (Learning Tree / Path) hien thi cac Unit va Lesson node co animation mo khoa.
    - *SRS Flashcard Reviewer*: Hieu ung lat the 3D muot ma bang Framer Motion, ho tro phim tat (1: Again, 2: Hard, 3: Good, 4: Easy), nut nghe phat am.
    - *Interactive Quiz Screen*: Giao dien lam bai tap tuong tac, sap xep word chips, phat am thanh khi dung/sai, thanh tien do (Progress Bar).
    - *Leaderboard & Shop*: Bang xep hang League hang tuan va cua hang vat pham.
    - *AI Voice Chat Screen*: Giao dien tro chuyen voi AI co hieu ung song am (Audio Waveform) va hop thoai cham diem ngu am.
  - **Mobile Application (`apps/mobile`)**:
    - Toan bo man hinh nhu Web nhung duoc toi uu cho man hinh cam ung tren iOS va Android.
    - Haptic feedback (rung xuc giac) qua `expo-haptics` khi nguoi dung tra loi dung/sai hoac mo khoa huy hieu.
    - Push notification nhac nho giu streak vao 20h00 hang ngay qua Expo Notifications.
    - Ho tro offline review: cache the SRS vao local SQLite de nguoi dung on tap khi khong co mang va tu dong sync khi co internet tro lai.
- **Non-functional Requirements:**
  - Giao dien dat chuan UI/UX hien dai, mau sac sinh dong, tieu chuan WCAG ve do tuong phan va kha nang tiep can.
  - Dat chi so 60 FPS trong cac animation tren dien thoai tam trung.

## Architecture
```
        ┌──────────────────────────────────────────────┐
        │        Shared TypeScript Types & Schemas      │
        └──────────────────────┬───────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [apps/web (Next.js 15)]       [apps/mobile (Expo RN)]
       ├── App Router                ├── Expo Router
       ├── shadcn/ui + Tailwind      ├── NativeWind + Tamagui
       ├── Framer Motion 3D Cards    ├── Expo Haptics & Audio
       └── TanStack Query Cache      └── Local SQLite Sync
               │                               │
               └───────────────┬───────────────┘
                               │ (REST + WebSocket)
                               ▼
                        [apps/api (NestJS)]
```

## Related Code Files
- Create: `apps/web/app/(auth)/login/page.tsx`, `apps/web/app/(main)/learn/page.tsx`
- Create: `apps/web/app/(main)/flashcards/page.tsx`, `apps/web/app/(main)/speaking/page.tsx`
- Create: `apps/web/app/(main)/leaderboard/page.tsx`, `apps/web/app/(main)/shop/page.tsx`
- Create: `apps/web/components/quiz/quiz-runner.tsx`, `apps/web/components/flashcard/card-3d.tsx`
- Create: `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/(tabs)/flashcards.tsx`
- Create: `apps/mobile/app/(tabs)/speaking.tsx`, `apps/mobile/app/(tabs)/leaderboard.tsx`
- Create: `apps/mobile/components/audio-recorder.tsx`, `apps/mobile/services/notification.service.ts`

## Implementation Steps
1. Thiet lap `apps/web`:
   - Cai dat Tailwind CSS, shadcn/ui components (`Button`, `Card`, `Progress`, `Dialog`, `Tabs`, `Avatar`).
   - Cai dat sound effect player (`use-sound` hoac Howler.js) voi bo am thanh phan hoi: correct, wrong, level-up, streak-complete.
2. Xay dung `apps/web` man hinh hoc tap:
   - `LearningPath`: hien thi cay bai hoc theo level; Lesson da hoan thanh (vang), Lesson dang mo (xanh), Lesson bi khoa (xam).
   - `QuizRunner`: Component dieu phoi lan luot 10-15 cau hoi trong bai, xu ly animaton lua chon dap an va thanh status header (So Tim, Thanh % tien do).
   - `SRSReviewer`: Man hinh lat the 3D, hien thi tu, nghia, phien am IPA, nut play audio, va 4 nut danh gia FSRS kem thoi gian interval du kien.
   - `SpeakingScreen`: Tich hop Web Audio API Record, hien thi hoi thoai voi AI Partner, modal phan tich phat am.
3. Thiet lap `apps/mobile` voi Expo:
   - Cau hinh `expo-av` / `expo-audio` de ghi am am thanh chuan 16kHz mono (toi uu cho AI STT).
   - Thiet lap navigation voi Expo Router (Tabs: Learn, Review, Speaking, Leaderboard, Profile).
   - Tich hop `expo-haptics` phan hoi rung khi bam nut.
4. Trien khai co che Offline Sync tren Mobile:
   - Luu 50 the SRS can on tap vao SQLite local storage.
   - Khi off-line: tinh toan interval tam thoi bang `@lingua/srs-engine` chay truc tiep trong JS runtime.
   - Khi online: gui mang `pendingReviews` len Backend de dong bo lai.
5. Thiet lap Push Notification voi Expo Notifications de gui canh bao "Dung de mat chuoi Streak 5 ngay cua ban!".

## Success Criteria
- [ ] Chay ca Web (`pnpm dev:web`) va Mobile (`pnpm dev:mobile`) tren Expo Go / iOS Simulator / Android Emulator khong gap loi.
- [ ] Luong hoc bai (Quiz) hoat dong tron ven tu chon dap an -> am thanh phan hoi -> tru tim neu sai -> ket thuc bai cong XP.
- [ ] The Flashcard lat 3D muot ma, phat duoc audio phat am chuan.
- [ ] Tinh nang luyen noi (Speaking) ghi duoc am tu ca trinh duyet Web va dien thoai Mobile, gui ve Backend tra ket qua cham diem.
- [ ] Thong bao day (Push notification) duoc len lich va kich hoat thanh cong.

## Risk Assessment
- **Quyen truy cap Micro tren trinh duyet va thiet bi di dong bi tu choi:** Can co man hinh Onboarding giai thich ro ly do can quyen Micro truoc khi goi lenh yeu cau cap quyen he thong.
- **Hieu nang audio playback tren cac trinh duyet cu:** Preload cac file am thanh ngan (correct.mp3, wrong.mp3) vao bo nho dem cua client.

## Security Considerations
- Luu tru Secure Token: Web dung HttpOnly cookies de tranh XSS; Mobile dung `expo-secure-store` (Keychain tren iOS va Keystore tren Android).
