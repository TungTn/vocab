---
phase: 1
title: "Architecture & Monorepo Setup"
status: pending
priority: P1
effort: "2d"
dependencies: []
---

# Phase 1: Architecture & Monorepo Setup

## Overview
Xay dung nen mong kien truc Monorepo hoan chinh voi Turborepo + pnpm workspaces, ha tang moi truong containerized bang Docker Compose (PostgreSQL 16, Redis 7, MinIO S3-compatible storage), thiet lap goi dung chung shared-types, linting/formatting, va khoi tao NestJS backend API san sang cho cac service nghiep vu.

## Requirements
- **Functional Requirements:**
  - Khoi tao Turborepo voi cau truc: `apps/api`, `apps/web`, `apps/mobile`, `packages/shared-types`, `packages/srs-engine`, `packages/config-eslint`, `packages/config-typescript`.
  - Cung cap `docker-compose.yml` khoi chay PostgreSQL (co bat extension `pgcrypto` & `vector`), Redis (cho caching va session), MinIO (object storage luu audio/hinh anh).
  - Tich hop Prisma ORM voi migrations tu dong, seed script co ban va ket noi ket qua kiem tra health-check.
  - Thiet lap shared types va validation schemas (Zod) dung chung giua Backend va cac Frontend clients.
- **Non-functional Requirements:**
  - Build cache cuc nhanh qua Turborepo caching.
  - Strict TypeScript configuration (`strict: true`, `noImplicitAny: true`).
  - Health check endpoint `/api/health` kiem tra DB va Redis latency duoi 50ms.

## Architecture
```
language-learning-platform/
├── apps/
│   ├── api/                   # NestJS Backend (REST + WebSocket)
│   ├── web/                   # Next.js 15 Web Client & PWA
│   └── mobile/                # React Native (Expo SDK 52)
├── packages/
│   ├── shared-types/          # TypeScript interfaces, DTOs, Zod schemas
│   ├── srs-engine/            # Spaced Repetition algorithms (FSRS & SM-2)
│   ├── ui/                    # Shared design tokens / Tailwind preset
│   └── tsconfig/              # Shared TSConfig base
├── docker/
│   ├── docker-compose.yml     # Postgres, Redis, MinIO
│   └── .env.example
├── turbo.json
└── package.json
```

## Related Code Files
- Create: `turbo.json`, `pnpm-workspace.yaml`, `package.json`, `.editorconfig`
- Create: `docker/docker-compose.yml`, `.env.example`
- Create: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/health/health.controller.ts`
- Create: `apps/api/prisma/schema.prisma`
- Create: `packages/shared-types/src/index.ts`, `packages/shared-types/src/user.ts`, `packages/shared-types/src/lesson.ts`

## Implementation Steps
1. Khoi tao `pnpm-workspace.yaml` va `turbo.json` quy dinh pipeline `build`, `lint`, `dev`, `test`.
2. Viet file `docker/docker-compose.yml` voi cac service:
   - `postgres`: port 5432, volume persistent, healthcheck.
   - `redis`: port 6379, password protected, volume persistent.
   - `minio`: port 9000 & 9001 (console), tao default bucket `lingua-media`.
3. Khoi tao `packages/shared-types` dinh nghia cac Enums (LanguageLevel: A1, A2, B1, B2, C1, C2; ExerciseType, UserRole).
4. Khoi tao du an NestJS tai `apps/api` voi Fastify hoac Express adapter, cai dat `@nestjs/config`, `@prisma/client`, `ioredis`, `zod`.
5. Cau hinh Prisma client trong NestJS Service module (`prisma.service.ts`) voi co che graceful shutdown va log truy van slow query (>200ms).
6. Xay dung endpoint `/health` tra ve trang thai song cua Postgres, Redis, Storage va memory usage.
7. Viet CI/CD workflow co ban (`.github/workflows/ci.yml`) kiem tra lint va typecheck toan monorepo.

## Success Criteria
- [ ] Chay `pnpm install` va `pnpm build` thanh cong xuyen suot tat ca cac package va app.
- [ ] Chay `docker compose up -d` khoi dong Postgres, Redis, MinIO khong loi.
- [ ] Goi `GET http://localhost:4000/api/health` tra ve HTTP 200 `{ status: "ok", postgres: "up", redis: "up" }`.
- [ ] `packages/shared-types` duoc import va su dung thanh cong ben trong `apps/api`.

## Risk Assessment
- **Xung dot phien ban phan mem Node/pnpm:** Can khoa phien ban thong qua `engines` trong `package.json` (Node >= 20, pnpm >= 9).
- **Hieu nang Docker tren moi truong Windows:** Can dung WSL2 backend cho Docker Desktop de dam bao toc do I/O cua volume Postgres.

## Security Considerations
- Luu tat ca credentials (`POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `MINIO_SECRET_KEY`) trong `.env`, cam tuyet doi hardcode mat khau trong git.
- Thiet lap `.gitignore` chat che ngay tu Phase 1.
