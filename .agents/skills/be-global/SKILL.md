---
name: be-global
description: "Cẩm nang kỹ thuật Backend toàn diện cho LinguaFlow apps/api. Áp dụng cho NestJS, Prisma ORM, PostgreSQL + pgvector, Redis + BullMQ + Sorted Sets, MinIO S3, Google Gemini AI API, WebSocket gateways, JWT/Cookie Auth, và Security OWASP."
user-invocable: true
---

# LinguaFlow — Cẩm Nang Kỹ Thuật Backend Toàn Cục (BE Global Skill)

Tài liệu này định hình toàn bộ chuẩn mực kỹ thuật, quy trình phát triển và các bất biến kiến trúc cho tầng **Backend API** (`apps/api`) của hệ thống **LinguaFlow**.

---

## 1. Kiến Trúc Tổng Thể Backend (`apps/api`)

Backend của LinguaFlow được xây dựng trên nền tảng **NestJS** kết hợp **Clean Architecture** và nguyên lý **Dependency Injection (DI)**:

```text
apps/api/src/
├── admin/          # Quản trị viên: duyệt từ vựng, quản lý khóa học, người dùng, số liệu
├── ai/             # AI Engine: tích hợp Google Gemini (Speaking Partner, Phoneme IPA scoring)
├── analytics/      # Thống kê học tập, telemetry, báo cáo tiến độ
├── auth/           # Đăng ký, đăng nhập, JWT + Cookie Refresh Token, Argon2id, Guards
├── common/         # Filters (HttpExceptionFilter), Pipes (ZodValidationPipe), Interceptors, Decorators
├── courses/        # Khóa học, lộ trình học tập, cấu trúc chủ đề (topics)
├── gamification/   # Streaks, Hearts/Lives, XP, Bảng xếp hạng tuần (Leaderboards), Shop
├── health/         # Healthcheck endpoint (Terminus: DB, Redis, Memory, Disk)
├── lessons/        # Bài học tương tác bite-sized, câu hỏi trắc nghiệm, bài tập
├── placement/      # Bài kiểm tra trình độ đầu vào (Placement Test) & phân lớp CEFR
├── prisma/         # PrismaService kết nối PostgreSQL (pgcrypto, pgvector)
├── progress/       # Tiến độ học tập của người dùng theo từng bài học/chủ đề
├── redis/          # RedisService kết nối Cache, BullMQ và Sorted Sets
├── srs/            # Quản lý thẻ ghi nhớ (Flashcards), tính toán Spaced Repetition (FSRS/SM-2)
├── users/          # Quản lý hồ sơ người dùng, cài đặt cá nhân, timezone
├── vocabulary/     # Từ điển, kho từ vựng, nghĩa, ví dụ, phiên âm IPA, audio pronunciation
├── app.module.ts   # Root Module kết nối toàn bộ hệ thống
└── main.ts         # Bootstrap ứng dụng, cấu hình CORS, Global Pipes, Filters, Swagger
```

---

## 2. Quy Chuẩn Cơ Sở Dữ Liệu & Prisma ORM (PostgreSQL & pgvector)

### 2.1. Quy Trình Thay Đổi Schema & Migration
- **Nghiêm cấm sửa DB trực tiếp**: Mọi thay đổi schema bảng bắt buộc phải thực hiện trong `apps/api/prisma/schema.prisma`.
- **Tạo migration chuẩn**:
  ```bash
  cd apps/api
  npx prisma migrate dev --name <ten_mo_ta_ngan_gon_bang_tieng_anh>
  ```
- **Sinh Prisma Client**: Sau mỗi lần sửa schema, tự động hoặc chạy thủ công `npx prisma generate` để đồng bộ type.

### 2.2. Chỉ Mục (Index) & Hiệu Năng Truy Vấn
- **Đánh index mọi khóa ngoại**: Toàn bộ trường tham chiếu (`userId`, `deckId`, `lessonId`, `courseId`) bắt buộc phải có `@@index([fieldName])`.
- **Unique Index**: Áp dụng cho các trường định danh duy nhất (`email`, `username`, `slug`).
- **Composite Index**: Đánh chỉ mục kết hợp cho các truy vấn lọc thường xuyên (ví dụ: `@@index([userId, nextReviewAt])` trong bảng `UserCardReview`).
- **Không thực hiện N+1 Queries**: Sử dụng `include` hoặc `select` có chọn lọc trong Prisma, tránh load dữ liệu thừa.

### 2.3. Hỗ Trợ Vector Search (`pgvector`)
- Cột lưu trữ vector đặc trưng ngữ nghĩa: kiểu `Unsupported("vector(768)")` hoặc `Unsupported("vector(1536)")`.
- Sử dụng câu lệnh Raw Query an toàn qua `prisma.$queryRaw` khi thực hiện tính khoảng cách cosine (`<=>`) để tìm kiếm từ vựng hoặc câu tương đồng ngữ nghĩa:
  ```typescript
  const similarWords = await this.prisma.$queryRaw`
    SELECT id, word, meaning, 1 - (embedding <=> ${targetVector}::vector) AS similarity
    FROM "Vocabulary"
    WHERE 1 - (embedding <=> ${targetVector}::vector) > 0.82
    ORDER BY similarity DESC
    LIMIT 10;
  `;
  ```

---

## 3. Caching & Message Queue (Redis & BullMQ)

### 3.1. Chuẩn Đặt Tên Redis Key
Cấu trúc quy chuẩn: `<domain>:<entity>:<id_hoac_scope>`

| Nghiệp Vụ | Định Dạng Key | Ví Dụ | Thời Gian Sống (TTL) |
| :--- | :--- | :--- | :--- |
| **User Session / Revocation** | `auth:session:<userId>` | `auth:session:usr_9981` | 7 ngày |
| **User Rate Limiting** | `ratelimit:<ip_hoac_userId>:<route>` | `ratelimit:127.0.0.1:auth_login` | 60 giây |
| **Flashcard Deck Cache** | `cache:deck:<deckId>` | `cache:deck:deck_ielts_8` | 1 giờ |
| **Weekly Leaderboard** | `leaderboard:<tier>:<year>-W<week>` | `leaderboard:gold:2026-W45` | 14 ngày |
| **Streak Freeze Buffer** | `streak:freeze:<userId>` | `streak:freeze:usr_9981` | 24 giờ |

> [!IMPORTANT]
> Mọi key lưu trữ trong Redis (trừ Sorted Sets Leaderboard có cơ chế lưu trữ theo mùa giải) **bắt buộc phải có TTL**. Tuyệt đối không để key vĩnh viễn gây tràn RAM máy chủ.

### 3.2. Bảng Xếp Hạng Hàng Tuần Bằng Redis Sorted Sets
- Sử dụng các lệnh tối ưu độ phức tạp $O(\log N)$:
  - `ZADD` / `ZINCRBY`: Cập nhật điểm XP khi người dùng hoàn thành bài học.
  - `ZREVRANGEBYSCORE` / `ZREVRANGE`: Lấy danh sách Top 10 / Top 50 người dẫn đầu.
  - `ZREVRANK`: Lấy thứ hạng hiện tại của chính người dùng.
  - `ZSCORE`: Lấy tổng XP hiện tại trong tuần.

### 3.3. Xử Lý Tác Vụ Ngầm Với BullMQ (Background Jobs)
- **Hàng đợi `srs-queue`**: Quét và lập chỉ mục các thẻ cần ôn tập hàng ngày theo múi giờ người dùng.
- **Hàng đợi `notification-queue`**: Gửi thông báo đẩy (Push Notification / FCM) nhắc nhở duy trì Streak lúc 20:00 tối theo timezone của từng user.
- **Hàng đợi `audio-process-queue`**: Nén âm thanh và trích xuất phát âm ngữ âm khi người dùng nộp bài nói.

---

## 4. Ràng Buộc Hợp Đồng Dữ Liệu (Contract-First Validation)

- Toàn bộ DTO của API nhận vào từ Client phải sử dụng Schema Zod được định nghĩa tại `@linguaflow/shared-types`.
- Sử dụng `ZodValidationPipe` tại tầng Controller hoặc Global Pipe:
  ```typescript
  @Post('review')
  @UsePipes(new ZodValidationPipe(submitCardReviewSchema))
  async submitReview(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitCardReviewDto,
  ) {
    return this.srsService.recordReview(userId, dto);
  }
  ```

---

## 5. Xác Thực, Phân Quyền & Bảo Mật (Auth & OWASP Guidelines)

1. **Chiến Lược Dual-Token**:
   - **Access Token (JWT)**: Thời hạn ngắn (15 phút), chứa `sub` (userId), `email`, `role`. Được client gửi qua Header `Authorization: Bearer <token>`.
   - **Refresh Token**: Chuỗi ngẫu nhiên cryptographically secure thời hạn 7 ngày, lưu trữ trong Cookie với các cờ `httpOnly: true`, `secure: true`, `sameSite: 'strict'`. Token hash được lưu trong Redis/DB để có thể thu hồi (revoke) ngay lập tức khi người dùng đăng xuất.

2. **Băm Mật Khẩu**:
   - Sử dụng thuật toán **Argon2id** (hoặc bcrypt với salt rounds $\ge 12$).
   - Tuyệt đối không bao giờ ghi log mật khẩu, token thô, hoặc API key ra console / log file.

3. **Chống Tấn Công Brute-Force (Rate Limiting)**:
   - Cấu hình `@nestjs/throttler` nghiêm ngặt:
     - Endpoints nhạy cảm (`/api/v1/auth/login`, `/api/v1/auth/forgot-password`, `/api/v1/auth/verify-otp`): Tối đa **5 requests / phút**.
     - Endpoints AI Speaking / Voice generation: Tối đa **20 requests / phút**.
     - API chung: Tối đa **120 requests / phút**.

4. **Phân Quyền Dựa Trên Vai Trò (RBAC)**:
   - Sử dụng Decorator `@Roles(UserRole.ADMIN)` kết hợp `RolesGuard` để bảo vệ các tuyến API trong module `admin/`.

---

## 6. Tích Hợp Trí Tuệ Nhân Tạo (Google Gemini AI & Voice Engine)

- **SDK Chính Thức**: Sử dụng `@google/genai` (hoặc Interactions API) với model `gemini-2.5-flash` / `gemini-2.5-pro`.
- **AI Speaking Partner (WebSocket Gateway `/speaking`)**:
  - Quản lý phiên hội thoại thời gian thực qua WebSockets (Socket.io hoặc native WS).
  - Duy trì ngữ cảnh hội thoại (Context Memory) tối đa 10 lượt giao tiếp gần nhất để tối ưu chi phí token và tránh trễ mạng (latency).
  - Tự động fallback sang kịch bản phản hồi định sẵn nếu kết nối Gemini gặp lỗi Rate Limit hoặc timeout quá 5 giây.
- **Chấm Điểm Phát Âm (Pronunciation Assessment)**:
  - Phân tích âm thanh giọng nói thành chuỗi ngữ âm IPA (International Phonetic Alphabet).
  - Đối chiếu với từ chuẩn và chấm theo 3 chỉ số từ 0 - 100:
    - `accuracyScore`: Độ chính xác từng âm vị (Phoneme accuracy).
    - `fluencyScore`: Độ lưu loát và ngắt nghỉ tự nhiên.
    - `completenessScore`: Tỷ lệ từ được nói đầy đủ.

---

## 7. Quy Chuẩn Kiểm Thử Backend (Testing Strategy)

Mọi logic nghiệp vụ cốt lõi đều phải có unit test và integration test tương ứng:

```bash
# Chạy Unit Tests cho Backend
pnpm --filter @linguaflow/api test

# Chạy E2E Tests (kiểm thử luồng API thực tế qua Supertest)
pnpm --filter @linguaflow/api test:e2e

# Kiểm tra độ bao phủ mã nguồn (Code Coverage)
pnpm --filter @linguaflow/api test:cov
```

- **Quy tắc Unit Test**: Mock toàn bộ `PrismaService` và `RedisService` khi kiểm thử các tầng Service thuần túy.
- **Quy tắc E2E Test**: Dùng database test riêng biệt (hoặc SQLite/Postgres test container), tự động chạy migration trước khi test và dọn sạch dữ liệu sau mỗi test suite.
