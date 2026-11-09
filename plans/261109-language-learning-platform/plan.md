---
title: "Xay dung Nen tang Hoc Ngoai ngu Da nen tang (LinguaFlow)"
description: "He sinh thai hoc ngoai ngu toan dien da nen tang (Web + Mobile App) tich hop SRS Flashcards, Gamification Duolingo-style, va AI Speaking Partner thoi gian thuc"
status: pending
priority: P1
branch: "main"
tags: [language-learning, full-stack, turborepo, nestjs, react-native-expo, nextjs, postgresql, redis, gemini-ai, srs]
blockedBy: []
blocks: []
created: "2026-11-09T04:17:18.627Z"
createdBy: "ck:plan"
source: skill
---

# Xay dung Nen tang Hoc Ngoai ngu Da nen tang (LinguaFlow)

## Overview

LinguaFlow la he thong hoc ngoai ngu thong minh da nen tang (Full-stack Multiplatform: Web PWA + Mobile App React Native/Expo) voi backend tap trung (NestJS/Node.js + PostgreSQL + Redis + MinIO/S3). Du an dap ung toan dien 4 tru cot:
1. **Flashcard & Thuat toan SRS (Spaced Repetition System)**: Toi uu hoa ghi nho tu vung lau dai dua tren thuat toan FSRS/SM-2.
2. **Interactive Lessons & Quizzes**: Bai hoc chia nho (bite-sized), truyen cam hung theo dang hoi dap, dien khuyet, sap xep cau, nghe chon dap an.
3. **Gamification & Retention Mechanics**: He thong Streaks, XP, Tim/Mang (Lives), Huy hieu (Achievements), va Bang xep hang hang tuan theo League (Redis Sorted Sets).
4. **AI Speaking Partner & Pronunciation Scoring**: Luyen giao tiep phan xa va danh gia phat am ngu am (IPA/phoneme) thoi gian thuc bang Google Gemini Multimodal / Web Speech API.
5. **Admin Content Management & Learning Analytics**: Quan ly kho noi dung, tu dien, bai giang va telemetry do luong tien trinh nguoi dung.

## Tech Stack Architecture

- **Monorepo**: Turborepo + pnpm workspaces (`apps/api`, `apps/web`, `apps/mobile`, `packages/shared-types`, `packages/srs-engine`, `packages/ui`).
- **Backend API**: NestJS (TypeScript), Prisma ORM, PostgreSQL (Vector extension ho tro tim kiem ngu nghia), Redis (Cache + Sorted Sets cho Leaderboards + Queue BullMQ).
- **Frontend Web**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui, TanStack Query, Zustand.
- **Frontend Mobile**: React Native (Expo SDK 52+), Expo Audio/AV, Tamagui/Tailwind (NativeWind), Offline SQLite/WatermelonDB sync.
- **AI & Media**: Google Gemini API (Interactions / Multimodal), Whisper / Web Speech API (STT), Edge-TTS / Google Cloud TTS, Object Storage S3/MinIO cho audio snippets.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Architecture & Monorepo Setup](./phase-01-architecture-monorepo-setup.md) | Completed |
| 2 | [Auth & User Progress Engine](./phase-02-auth-user-progress-engine.md) | Completed |
| 3 | [Vocabulary & SRS Engine](./phase-03-vocabulary-srs-engine.md) | Completed |
| 4 | [Interactive Lessons & Quizzes](./phase-04-interactive-lessons-quizzes.md) | Completed |
| 5 | [Gamification & Engagement](./phase-05-gamification-engagement.md) | Completed |
| 6 | [AI Speaking & Pronunciation](./phase-06-ai-speaking-pronunciation.md) | Completed |
| 7 | [Web & Mobile Frontend Apps](./phase-07-web-mobile-frontend-apps.md) | Completed |
| 8 | [Admin CMS & Deployment](./phase-08-admin-cms-deployment.md) | Completed |
| 9 | [User Authentication UI & OAuth](./phase-09-user-authentication-ui.md) | Completed |

## Dependencies

- **Infrastructure**: Docker Compose (PostgreSQL 16, Redis 7, MinIO), Node.js >= 20.x, pnpm >= 9.x.
- **External Services**: Google Gemini API Key, Firebase Cloud Messaging / Expo Push Notifications.
- **Cross-Phase Order**: Phase 1 la nen tang chung -> Phase 2 & 3 chay song song -> Phase 4 xay tren Phase 2/3 -> Phase 5 & 6 tich hop -> Phase 7 hoan thien UI hai dau client -> Phase 8 dong goi & van hanh.
