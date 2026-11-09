---
phase: 8
title: "Admin CMS & Deployment"
status: completed
priority: P1
effort: "3d"
dependencies: [1, 2, 3, 4, 5, 6, 7]
---

# Phase 8: Admin CMS & Deployment

## Overview
Xay dung he thong quan tri noi dung chuyen nghiep (Admin CMS) cho phep bien tap vien quan ly cay khoa hoc, nhap tu vung hang loat (Bulk Import), tao am thanh tu dong (Batch TTS Generator), he thong thong ke phan tich chuyen sau (Learning Analytics & Retention Dashboard), va dong goi trien khai he thong san sang van hanh Production tren moi truong Cloud (Docker, Nginx, CI/CD, Sentry Monitoring).

## Requirements
- **Functional Requirements:**
  - **Admin Content Management System (CMS)**:
    - Giao dien truc quan tao va sua Course, Unit, Lesson, va Exercise voi live preview.
    - Bo nhap tu vung tu CSV/Excel: tu dong tra cuu nghia va phien am IPA qua API tu dien, tao audio phat am hang loat bang TTS.
    - Quan ly nguoi dung: xem lich su hoc, mo khoa hoac reset tien trinh, cap quyen giao vien/admin.
  - **Learning Analytics & Telemetry Dashboard**:
    - Do luong chi so: DAU (Daily Active Users), MAU, D1/D7/D30 Retention rate.
    - Exercise Drop-off Heatmap: Phat hien nhung cau hoi co ty le lam sai cao bat thuong de giao vien dieu chinh do kho hoac bo sung giai thich.
    - Top tu vung va quy tac ngu phap hoc vien hay bi quen nhat.
  - **Production Packaging & DevOps**:
    - Dockerfile multi-stage toi uu dung luong cho `api` va `web`.
    - Cau hinh Nginx Reverse Proxy kem SSL Let's Encrypt, CORS, va Gzip/Brotli compression.
    - Backup co so du lieu PostgreSQL tu dong hang ngay len Cloud Storage.
    - Tich hop Sentry Error Tracking cho ca Backend va Client.
- **Non-functional Requirements:**
  - He thong chiu tai toi thieu 500 nguoi dung dong thoi (Concurrent Users) voi thoi gian dap ung P95 < 200ms.
  - Quy trinh CI/CD tu dong chay test va deploy len may chu trong vong duoi 5 phut.

## Architecture
```
[Internet Traffic]
       │
       ▼
 [Nginx Reverse Proxy / SSL Termination]
       │
       ├─── /api/* ───────────────► [Docker: NestJS API Cluster (PM2/K8s)]
       │                                  │
       │                                  ├──► [PostgreSQL Database + Backup]
       │                                  ├──► [Redis Cluster]
       │                                  └──► [MinIO / S3 Storage]
       │
       ├─── /admin/* & /* ────────► [Docker: Next.js Web & CMS]
       │
       └─── Log / Errors ─────────► [Sentry & Prometheus/Grafana]
```

## Related Code Files
- Create: `apps/web/app/admin/courses/page.tsx`, `apps/web/app/admin/vocabulary/page.tsx`
- Create: `apps/web/app/admin/analytics/page.tsx`, `apps/web/app/admin/users/page.tsx`
- Create: `apps/api/src/admin/admin.module.ts`, `apps/api/src/admin/admin.service.ts`
- Create: `apps/api/src/analytics/analytics.service.ts`
- Create: `docker/Dockerfile.api`, `docker/Dockerfile.web`, `docker/nginx.conf`
- Create: `.github/workflows/deploy.yml`, `scripts/backup-db.sh`

## Implementation Steps
1. Xay dung Admin API Module trong NestJS:
   - Dinh nghia `AdminGuard` chi cho phep nguoi dung co Role `ADMIN` hoac `TEACHER` truy cap.
   - Viet endpoint upload file Excel/CSV tu vung: parse file bang `xlsx`, goi Batch TTS tao file audio am thanh, luu vao MinIO va tao ban ghi Flashcard trong DB.
2. Xay dung man hinh Admin CMS tren Next.js:
   - Form keo tha (Drag-and-Drop) sap xep thu tu cac cau hoi trong Lesson.
   - Man hinh tao cau hoi voi trinh kiem tra truc quan (Live Playground Preview).
3. Trien khai Analytics Service:
   - Tinh toan ty le hoan thanh bai hoc theo tung Unit.
   - Thong ke ty le hoc vien quay lai (Cohort Retention Analysis).
   - Bieu do truc quan hoa bang Chart.js / Recharts tren giao dien Admin.
4. Viet `Dockerfile` multi-stage:
   - Stage 1: Build source code Turborepo voi pnpm.
   - Stage 2: Runner alpine sieu nhe, chi copy output `node_modules` can thiet, giam image size xuong duoi 150MB.
5. Cau hinh Nginx:
   - Gioi han kich thuoc file upload (toi da 20MB cho audio/image).
   - Thiet lap caching cho static assets va header bao mat (HSTS, X-Frame-Options, CSP).
6. Thiet lap Sentry SDK trong `apps/api`, `apps/web`, va `apps/mobile` de bat loi runtime va hieu nang cham query.

## Success Criteria
- [x] Admin co the nhap 1 file CSV 100 tu vung, he thong tu dong tao the flashcard va tao file audio phat am day du.
- [x] Bieu do Analytics hien thi day du chi so nguoi dung dang hoc, ty le dung/sai tung bai hoc.
- [x] Docker compose chay tren moi truong may chu thanh cong, Nginx dieu huong chuan xac API va Web.
- [x] Sentry ghi nhan day du loi neu xay ra exception va thong bao den kenh giam sat.

## Risk Assessment
- **Upload file CSV qua lon lam treo CPU cua Backend:** Xu ly import bang Background Job (BullMQ) thay vi xu ly dong bo tren HTTP request.
- **Dung luong MinIO/S3 tang nhanh do luu file audio:** Thiet lap chuan nen am thanh MP3 / Opus bitrate 64kbps giup giam 70% dung luong ma chat luong giong noi van ro rang.

## Security Considerations
- Phan quyen RBAC chat che o cap do Middleware: moi endpoint `/admin/*` bat buoc co chu ky JWT cua tai khoan Admin duoc xac thuc trong co so du lieu.
- Bao ve chong CSRF va tan cong Injection trong cac file upload.
