---
name: linguaflow-core
description: "Cẩm nang quy chuẩn toàn diện cho dự án LinguaFlow. Hướng dẫn kiến trúc Monorepo Turborepo, ranh giới giữa các package/app, luồng Contract-First (Zod/shared-types), quy tắc Git, quy trình kiểm thử và điều hướng đến BE/FE Global skills."
user-invocable: true
---

# LinguaFlow — Cẩm Nang Kỹ Thuật & Quy Chuẩn Chung Toàn Dự Án

Tài liệu này là chuẩn mực kiến trúc cốt lõi áp dụng cho toàn bộ dự án **LinguaFlow** (Hệ sinh thái học ngoại ngữ đa nền tảng kết hợp Thuật toán Lặp lại ngắt quãng SRS, Gamification tương tác cao, và AI Speaking Partner thời gian thực). Mọi lập trình viên và AI Agent khi tham gia phát triển dự án bắt buộc phải tuân thủ nghiêm ngặt các quy tắc dưới đây.

---

## 1. Bản Đồ Kiến Trúc & Cấu Trúc Monorepo

Dự án được tổ chức theo mô hình **Turborepo Monorepo** với trình quản lý gói `pnpm`:

```text
vocab/
├── apps/
│   ├── api/             # Backend REST & WebSocket API (NestJS, Prisma, PostgreSQL, Redis, BullMQ)
│   ├── web/             # Frontend Web & PWA (Next.js 15 App Router, Tailwind CSS, shadcn/ui)
│   └── mobile/          # Ứng dụng Di động iOS/Android (React Native, Expo SDK 52+, Offline SQLite)
├── packages/
│   ├── shared-types/    # Zod schemas, TypeScript interfaces & DTOs dùng chung toàn hệ thống
│   ├── srs-engine/      # Thuật toán Spaced Repetition thuần túy (FSRS v4 / SuperMemo SM-2)
│   └── tsconfig/        # Cấu hình TypeScript cơ sở dùng chung
├── docker/              # Docker Compose chạy PostgreSQL (pgvector), Redis 7, MinIO S3
├── docs/                # Tài liệu kỹ thuật, kiến trúc và hướng dẫn nghiệp vụ
├── plans/               # Kế hoạch chi tiết theo từng Phase phát triển dự án
└── .agents/skills/      # Bộ AI Skills chuyên sâu cho từng mảng nghiệp vụ (Core, BE, FE)
```

---

## 2. Các Bất Biến Kiến Trúc Bắt Buộc (Architectural Invariants)

1. **Nguồn Chân Lý Duy Nhất (Single Source of Truth cho Types & DTOs)**:
   - Mọi interface, enum, type và request/response payload dùng chung giữa client (`apps/web`, `apps/mobile`) và server (`apps/api`) **bắt buộc** phải khai báo tại `packages/shared-types`.
   - **Tuyệt đối cấm** tự định nghĩa lại hoặc copy-paste types giữa các ứng dụng.

2. **Nguyên Tắc Contract-First Validation (Zod Schemas)**:
   - Toàn bộ dữ liệu trao đổi qua HTTP/WebSocket phải có schema Zod tương ứng trong `packages/shared-types`.
   - Backend sử dụng `ZodValidationPipe` để xác thực payload đầu vào.
   - Frontend sử dụng Zod schema kết hợp React Hook Form để xác thực form ngay tại client trước khi gửi request.

3. **Tính Độc Lập Hoàn Toàn của SRS Engine**:
   - `packages/srs-engine` phải là **Pure TypeScript Package** (không phụ thuộc bất kỳ thư viện I/O, database hay framework UI nào).
   - Đảm bảo thuật toán FSRS / SM-2 chạy đồng nhất trên cả máy chủ (NestJS) và thiết bị ngoại tuyến (Expo SQLite).

4. **Chiều Phụ Thuộc (Dependency Direction) & Cách Ly Tuyệt Đối Giữa Các App**:
   - `apps/api` $\rightarrow$ `packages/shared-types`, `packages/srs-engine`.
   - `apps/web` $\rightarrow$ `packages/shared-types`, `packages/srs-engine`.
   - `apps/mobile` $\rightarrow$ `packages/shared-types`, `packages/srs-engine`.
   - **Cấm nhập khẩu chéo (Cross-import)**: Không bao giờ được import mã nguồn trực tiếp giữa `apps/web`, `apps/api` và `apps/mobile`.

---

## 3. Quy Chuẩn Code & TypeScript Chuẩn Mực

- **Strict Type Safety**: Mọi package và app đều phải bật `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
- **Tuyệt đối cấm kiểu `any`**: Sử dụng `unknown` kèm Type Guards hoặc Type Narrowing nếu dữ liệu chưa xác định trước cấu trúc.
- **Quy tắc đặt tên nhất quán**:
  - Tên file & thư mục: `kebab-case` (ví dụ: `auth.service.ts`, `flashcard-deck.tsx`, `offline-srs.service.ts`).
  - Tên Class / Component / Interface: `PascalCase` (ví dụ: `AuthService`, `FlashcardViewer`, `LessonResponseDto`).
  - Tên hàm & biến: `camelCase` (ví dụ: `calculateNextReview`, `currentUserSession`).
  - Hằng số & Enum: `UPPER_SNAKE_CASE` (ví dụ: `MAX_HEARTS_DEFAULT`, `CardRating.AGAIN`).

---

## 4. Chuẩn Hóa Phản Hồi API & Xử Lý Lỗi Toàn Cầu

Mọi response trả về từ backend API khi có lỗi phải tuân thủ định dạng chuẩn sau:

```json
{
  "statusCode": 400,
  "message": "Dữ liệu gửi lên không hợp lệ",
  "error": "Bad Request",
  "timestamp": "2026-11-09T14:30:00.000Z",
  "path": "/api/v1/auth/login",
  "details": [
    {
      "field": "email",
      "message": "Email không đúng định dạng"
    }
  ]
}
```

---

## 5. Bốn Trụ Cột Nghiệp Vụ Chính (Core Business Pillars)

| Trụ Cột | Trách Nhiệm Cốt Lõi | Công Nghệ / Thuật Toán |
| :--- | :--- | :--- |
| **1. SRS Flashcard** | Ghi nhớ từ vựng ngắt quãng, tính toán khoảng thời gian lặp lại tối ưu theo trí nhớ dài hạn | `packages/srs-engine`, FSRS v4, SM-2, Idempotent review |
| **2. Interactive Lessons** | Học bài theo đơn vị nhỏ (bite-sized), trắc nghiệm, điền từ, nghe - chọn, ghép cặp từ vựng | Zod Lesson schemas, Audio pronunciation playback |
| **3. Gamification** | Tăng độ gắn kết (retention) qua Streaks, Hearts/Lives, XP, Bảng xếp hạng tuần theo League | Redis Sorted Sets ($O(\log N)$), Streak Freeze item |
| **4. AI Speaking Partner** | Luyện giao tiếp phản xạ tự nhiên và chấm điểm phát âm ngữ âm (Phoneme/IPA) | Google Gemini API (Multimodal / Interactions), Web Speech / Whisper |

---

## 6. Lệnh Thao Tác Monorepo & Kiểm Thử Thường Dùng

```bash
# Cài đặt toàn bộ dependencies trong monorepo
pnpm install

# Khởi chạy toàn bộ hệ thống (API, Web, Mobile) ở chế độ phát triển
pnpm dev

# Chạy riêng từng ứng dụng
pnpm --filter @linguaflow/api dev      # Backend API (port 4000)
pnpm --filter @linguaflow/web dev      # Next.js Web (port 3000)
pnpm --filter @linguaflow/mobile start # Expo React Native

# Kiểm thử tự động trên toàn dự án
pnpm test

# Build toàn bộ packages và apps
pnpm build

# Khởi động dịch vụ hạ tầng Docker (Postgres, Redis, MinIO)
docker compose -f docker/docker-compose.yml up -d
```

---

## 7. Điều Hướng AI Skills Chuyên Sâu (Skill Routing)

Khi thực hiện nhiệm vụ chuyên biệt, hãy kích hoạt hoặc tham chiếu trực tiếp đến các skill tương ứng:

- **Khi phát triển Backend, API, Cơ sở dữ liệu, Cache, Auth hoặc AI Service**:
  👉 Kích hoạt: `be-global` (đọc file [`.agents/skills/be-global/SKILL.md`](file:///d:/vocab/.agents/skills/be-global/SKILL.md)).
- **Khi phát triển Giao diện Web (Next.js 15), Ứng dụng Di động (Expo/React Native), Trạng thái UI, Âm thanh hoặc Đồng bộ Offline**:
  👉 Kích hoạt: `fe-global` (đọc file [`.agents/skills/fe-global/SKILL.md`](file:///d:/vocab/.agents/skills/fe-global/SKILL.md)).
