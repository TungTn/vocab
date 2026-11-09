---
phase: 2
title: "Auth & User Progress Engine"
status: pending
priority: P1
effort: "3d"
dependencies: [1]
---

# Phase 2: Auth & User Progress Engine

## Overview
Xay dung he thong xac thuc nguoi dung toan dien (Email/Password, Google OAuth2, Apple Sign-in), co che phan quyen RBAC (User, Teacher, Admin), quan ly phien dang nhap Access Token (ngan han) + Refresh Token (dai han) luu tru voi Redis blacklist, cung he thong quan ly ho so hoc vien (Target Language, Daily Goal, Placement Test Assessment) va tien trinh hoc tap toan cuc.

## Requirements
- **Functional Requirements:**
  - Dang ky / Dang nhap bang Email va Mat khau voi validation Zod, ma hoa Argon2id.
  - Ho tro Social Sign-in (Google, Apple) su dung Passport.js / OAuth2 flow.
  - Co che Refresh token rotation chong replay attacks; thu hoi token ngay lap tuc khi user logout hoac doi mat khau qua Redis blacklist.
  - Quan ly Profile: Chon ngon ngu dich (Target Language: Tieng Anh, Nhat, Han, Trung, Phap...), thiet lap muc tieu hang ngay (vi du: 15 phut/ngay hoac 30 XP/ngay).
  - Bai kiem tra dau vao (Placement Test Engine): Danh gia trinh do A1 - C1 de de xuat lo trinh hoc phu hop.
  - Endpoint luu vet tien trinh tong the cua User theo tung Course, Unit va Topic.
- **Non-functional Requirements:**
  - Token refresh flow chay muot ma ngam (silent refresh) ca tren Web va Mobile ma khong gay ngat quang trai nghiem nguoi dung.
  - Password hashing phai dung Argon2id voi cost parameters dam bao bao mat chong brute-force.

## Architecture
```
[Client (Web/Mobile)]
       │
   JWT Authorization Bearer (Access: 15m)
       ▼
[NestJS AuthGuard] ─── Cache check ───► [Redis Blacklist]
       │ (Valid)
[User / Progress Service] ─────────────► [PostgreSQL Database]
                                          ├── User
                                          ├── UserProfile (Goal, Level)
                                          ├── PlacementTestResult
                                          └── CourseProgress
```

## Related Code Files
- Create: `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/strategies/jwt.strategy.ts`, `apps/api/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/users/users.service.ts`, `apps/api/src/users/users.controller.ts`
- Create: `apps/api/src/progress/progress.service.ts`, `apps/api/src/progress/progress.controller.ts`
- Modify: `apps/api/prisma/schema.prisma` (Them models: User, UserProfile, RefreshToken, PlacementTest)

## Implementation Steps
1. Mo rong `schema.prisma`:
   ```prisma
   model User {
     id            String       @id @default(uuid())
     email         String       @unique
     passwordHash  String?
     role          Role         @default(USER)
     profile       UserProfile?
     progress      UserProgress[]
     createdAt     DateTime     @default(now())
     updatedAt     DateTime     @updatedAt
   }
   model UserProfile {
     id            String       @id @default(uuid())
     userId        String       @unique
     user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
     displayName   String
     avatarUrl     String?
     targetLang    String       // en, ja, ko, zh
     nativeLang    String       @default("vi")
     currentLevel  String       @default("A1") // A1, A2, B1, B2...
     dailyGoalMinutes Int       @default(15)
   }
   ```
2. Thuc hien migration Prisma `pnpm prisma migrate dev --name init_auth_and_user_models`.
3. Viet `AuthService` voi cac method: `register`, `login`, `refreshToken`, `logout`, `googleLogin`.
4. Cai dat Passport JWT Strategy, trich xuat Bearer token va kiem tra payload claims.
5. Thiet lap Redis session storage de luu Refresh Token hash va danh dau revoked tokens.
6. Xay dung Placement Test Engine: Bo 20 cau hoi da cap do, cham diem thuat toan heuristic de phan lop trinh do khoi diem.
7. Viet Unit tests cho AuthService va E2E test cho luong `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`.

## Success Criteria
- [ ] User co the dang ky bang email va mat khau, mat khau duoc hash an toan bang Argon2.
- [ ] Dang nhap tra ve cap `accessToken` (song 15 phut) va `refreshToken` (song 7 ngay).
- [ ] Endpoint `/api/auth/refresh` cap token moi va vo hieu hoa refresh token cu.
- [ ] User thiet lap duoc muc tieu hoc tap va lam xong bai Placement Test de nhan trinh do khoi diem.
- [ ] Unit & E2E tests bao phu toi thieu 85% cac case cua Auth & User module.

## Risk Assessment
- **Ro ri token phia Client:** Su dung `httpOnly`, `SameSite=Lax`, `Secure` cookies tren Web; su dung `expo-secure-store` tren Mobile.
- **Doi mat khau nhung phien dang nhap cu van ton tai:** Phai cap nhat token version hoac huy toan bo session ID trong Redis khi doi mat khau.

## Security Considerations
- Rate limiting cho cac route auth (`@nestjs/throttler`): gioi han 5 lan thu dang nhap trong 1 phut tren moi IP.
- Xoa bo thong tin nhay cam (nhu `passwordHash`) truoc khi tra ket qua ve cho client thong qua Prisma Select / DTO Serialization.
