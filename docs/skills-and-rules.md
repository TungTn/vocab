# LinguaFlow — Project Skills & Engineering Rules

> **Tài liệu đặc tả các AI Skills cần sử dụng và Bộ Quy tắc Kỹ thuật chuẩn mực dành cho dự án Nền tảng Học Ngoại ngữ Đa nền tảng (LinguaFlow).**

---

## 1. Tổng quan Kiến trúc Dự án (Architecture Overview)

LinguaFlow là hệ sinh thái học ngoại ngữ thông minh đa nền tảng, tổ chức theo cấu trúc **Turborepo Monorepo** với các thành phần:
- **`apps/api`**: Backend REST & WebSocket API bằng **NestJS** (TypeScript), **Prisma ORM**, **PostgreSQL** (pgcrypto, pgvector), **Redis** (caching, BullMQ, leaderboards), **MinIO** (S3-compatible object storage).
- **`apps/web`**: Frontend Web & PWA bằng **Next.js 15 (App Router)**, **Tailwind CSS**, **shadcn/ui**, **TanStack Query**, **Zustand**.
- **`apps/mobile`**: Ứng dụng di động iOS/Android bằng **React Native (Expo SDK 52+)**, **Expo Audio/AV**, **Offline SQLite / WatermelonDB sync**.
- **`packages/shared-types`**: Zod schemas, TypeScript types & DTOs dùng chung xuyên suốt client và server.
- **`packages/srs-engine`**: Thuật toán lặp lại ngắt quãng độc lập (**FSRS v4** / **SuperMemo SM-2**).
- **AI Core**: Tích hợp **Google Gemini API** (Interactions API / Multimodal) cho AI Speaking Partner và chấm điểm phát âm ngữ âm (Phoneme/IPA).

---

## 2. Danh mục AI Agent Skills Cần Thiết (Required Skills)

Khi phát triển hoặc phân công subagent thực thi các phase của dự án, các skills sau đây là bắt buộc và tối ưu:

| Nhóm Năng Lực | Skill ID | Mục Đích & Phạm Vi Áp Dụng |
| :--- | :--- | :--- |
| **Backend & API** | `ck:backend-development` | Xây dựng NestJS modules, REST API controllers, WebSocket gateways, middleware, guard, JWT auth, BullMQ worker queues. |
| **Database & Cache** | `ck:databases` | Thiết kế schema Prisma, viết câu truy vấn PostgreSQL, tối ưu index, quản lý migrations, cấu hình Redis Sorted Sets cho bảng xếp hạng. |
| **Web Frontend** | `ck:frontend-development` | Xây dựng giao diện Next.js 15 (RSC + Client components), TanStack Query caching, custom hooks, state management với Zustand. |
| **Mobile App** | `ck:mobile-development` | Phát triển ứng dụng React Native / Expo, tối ưu hiệu năng render danh sách từ vựng, xử lý âm thanh Expo Audio, cơ chế đồng bộ offline SQLite. |
| **UI/UX & Styling** | `ck:ui-styling`<br>`ck:ui-ux-pro-max` | Áp dụng shadcn/ui + Tailwind CSS, thiết kế giao diện tương tác cao (Gamification, quiz controls, flashcard swipe, dark mode chuẩn quốc tế). |
| **AI & Multimodal** | `gemini-api-dev`<br>`gemini-interactions-api`<br>`ck:ai-multimodal` | Tích hợp Google Gemini SDK, xây dựng kịch bản hội thoại AI Speaking Partner, chấm điểm phát âm và sinh nội dung học tập tự động. |
| **Kiểm Thử (Testing)** | `ck:test`<br>`ck:web-testing` | Viết Unit Test cho thuật toán SRS, Integration Test cho NestJS API (Supertest), E2E test cho Web/Mobile (Vitest, Playwright). |
| **DevOps & Hạ Tầng** | `ck:devops`<br>`ck:deploy` | Cấu hình `docker-compose.yml` (Postgres, Redis, MinIO), thiết lập CI/CD pipeline, Dockerize NestJS backend và Next.js web app. |
| **Bảo Mật & Rà Soát** | `ck:security`<br>`ck:code-review` | Quét lỗ hổng bảo mật OWASP, kiểm tra rò rỉ secret/API key, đánh giá logic auth và phân quyền RBAC. |
| **Lập Kế Hoạch** | `ck:plan`<br>`ck:project-management` | Quản lý tiến độ từng Phase, cập nhật status và tài liệu kỹ thuật đồng bộ. |

---

## 3. Bộ Quy Tắc Kỹ Thuật Dự Án (Engineering Rules & Guidelines)

### 3.1. Monorepo & Architectural Boundary Rules
1. **Single Source of Truth cho Types**: Mọi interface, DTO, enum dùng chung giữa API và Client (Web/Mobile) **bắt buộc** phải khai báo tại `packages/shared-types`. Tuyệt đối không copy-paste type giữa các `apps/`.
2. **Contract-First Validation**: Mọi schema payload HTTP phải được định nghĩa bằng **Zod** trong `packages/shared-types`. Backend dùng `ZodValidationPipe`, Frontend dùng Zod schema để validate form (React Hook Form).
3. **Tách biệt SRS Core**: Package `packages/srs-engine` phải là pure TypeScript package, không phụ thuộc vào framework, database hay I/O để có thể chạy mượt mà cả ở Client (offline mode) lẫn Backend Server.
4. **Dependency Direction**:
   - `apps/api` $\rightarrow$ `packages/shared-types`, `packages/srs-engine`.
   - `apps/web` $\rightarrow$ `packages/shared-types`, `packages/srs-engine`, `packages/ui`.
   - `apps/mobile` $\rightarrow$ `packages/shared-types`, `packages/srs-engine`.
   - Cấm import chéo giữa các `apps/` (ví dụ: `apps/web` không bao giờ được import từ `apps/api`).

### 3.2. TypeScript & Code Quality Rules
1. **Strict Type Safety**: Cấu hình `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`. Tuyệt đối cấm sử dụng kiểu `any` (dùng `unknown` kèm type guard nếu chưa xác định type).
2. **Code Style**:
   - Tên file & thư mục: `kebab-case` (ví dụ: `auth.service.ts`, `flashcard-deck.tsx`).
   - Tên Component / Class: `PascalCase`.
   - Tên biến / hàm: `camelCase`.
   - Tên hằng số / Enum value: `UPPER_SNAKE_CASE`.
3. **Error Handling Chuẩn Hóa**: Mọi response lỗi từ Backend API phải tuân theo chuẩn format:
   ```json
   {
     "statusCode": 400,
     "message": "Validation failed",
     "error": "Bad Request",
     "timestamp": "2026-11-09T11:30:00.000Z",
     "path": "/api/v1/auth/login",
     "details": []
   }
   ```

### 3.3. Database & Caching Rules (PostgreSQL & Redis)
1. **Prisma Migrations**: Mọi thay đổi schema đều phải thông qua `prisma migrate dev --name <descriptive_name>`. Không sửa DB trực tiếp trên database server.
2. **Index Optimization**:
   - Mọi foreign key (`userId`, `deckId`, `lessonId`) đều phải được đánh index (`@@index`).
   - Các trường tìm kiếm thường xuyên (`email`, `username`, `slug`) phải có `unique index`.
3. **Redis Key Naming Convention**:
   - Format: `<domain>:<entity>:<id>` (Ví dụ: `user:session:123`, `leaderboard:weekly:2026-W45`).
   - Leaderboard: Dùng Redis Sorted Sets (`ZADD`, `ZREVRANGEBYSCORE`, `ZREVRANK`) để cập nhật điểm XP theo thời gian thực với độ phức tạp $O(\log(N))$.
   - Caching: Luôn thiết lập TTL (Time-To-Live) cho mọi key tạm thời; không lưu trữ cache vô hạn.

### 3.4. SRS & Learning Engine Invariants
1. **Idempotent Review Submission**: Request ghi nhận kết quả ôn thẻ flashcard phải có `idempotencyKey` hoặc timestamp xác định để tránh tính toán lặp lại khoảng cách ôn tập khi mạng chập chờn.
2. **Thuật toán FSRS / SM-2**:
   - Khoảng thời gian ôn tập (`interval`) tối thiểu là 1 ngày sau khi đã qua giai đoạn học (`learning state`).
   - Factor dễ/khó (`easeFactor`) không được thấp hơn $1.3$.
3. **Timezone & Day Boundary**: Toàn bộ mốc thời gian ôn tập và reset streak được lưu trữ dưới dạng UTC (`DateTime` trong DB). Việc hiển thị theo ngày tính toán dựa trên `user.timezone` của người dùng.

### 3.5. Gamification Invariants
1. **Streak Integrity**:
   - Streak chỉ tăng 1 đơn vị mỗi ngày khi người dùng hoàn thành ít nhất 1 bài học hoặc 10 thẻ ôn tập.
   - Hỗ trợ cơ chế "Streak Freeze" (Bảo vệ streak) trừ số lượng vật phẩm freeze trước khi reset streak về 0 nếu người dùng bỏ lỡ 1 ngày.
2. **Hearts / Lives Mechanism**:
   - Số tim tối đa mặc định: 5.
   - Mỗi câu trả lời sai trong bài học trừ 1 tim.
   - Hồi 1 tim sau mỗi khoảng thời gian cấu hình (ví dụ: 30 phút), hoặc nạp lại đầy đủ khi hoàn thành bài ôn tập từ vựng cũ.

### 3.6. Security & Authentication Rules
1. **Token Strategy**:
   - Access Token: JWT thời hạn ngắn (15 phút), chứa `sub` (userId), `role`, `email`.
   - Refresh Token: Mã băm ngẫu nhiên có thời hạn dài (7 ngày), lưu trữ trong `httpOnly`, `Secure`, `SameSite=Strict` cookie và được đối chiếu trong Redis/DB để hỗ trợ cơ chế revoke từ xa.
2. **Password Security**: Băm mật khẩu bằng **Argon2id** (hoặc bcrypt với cost factor $\ge 12$). Tuyệt đối không log thông tin nhạy cảm (passwords, tokens, secret keys).
3. **Rate Limiting**: Bật rate limiting tại API Gateway / NestJS Throttler cho các endpoint nhạy cảm (Đăng nhập, Quên mật khẩu, Gửi mã OTP) tối đa 5 requests/phút.

### 3.7. Git & Development Workflow
1. **Branch Naming**:
   - `main`: Nhánh production ổn định.
   - `feat/<phase-number>-<feature-name>`: Nhánh phát triển tính năng mới.
   - `fix/<issue-description>`: Nhánh sửa lỗi.
2. **Conventional Commits**:
   - Format: `<type>(<scope>): <short description>`
   - Ví dụ: `feat(api): add auth module with jwt strategy`, `fix(srs): correct ease factor calculation`.

---

## 4. Phân Bổ Skills Theo Từng Phase Triển Khai

| Phase | Nội Dung Triển Khai | Primary Skills | Supporting Skills |
| :---: | :--- | :--- | :--- |
| **Phase 1** | Monorepo Setup, Docker Compose, NestJS Boilerplate, Shared Types | `ck:backend-development`<br>`ck:devops` | `ck:databases` |
| **Phase 2** | Authentication, JWT, RBAC, User Profiles, Progress Engine | `ck:backend-development`<br>`ck:databases` | `ck:security` |
| **Phase 3** | Vocabulary Core & Spaced Repetition (SRS Engine: FSRS/SM-2) | `ck:backend-development`<br>`ck:test` | `ck:databases` |
| **Phase 4** | Interactive Bite-sized Lessons & Quiz Evaluation Engine | `ck:backend-development`<br>`ck:frontend-development` | `ck:test` |
| **Phase 5** | Gamification Engine (Streaks, XP, Lives, Redis Leaderboards) | `ck:backend-development`<br>`ck:databases` | `ck:test` |
| **Phase 6** | AI Speaking Partner, Audio Processing & Gemini Integration | `gemini-api-dev`<br>`ck:ai-multimodal` | `ck:backend-development` |
| **Phase 7** | Web (Next.js 15) & Mobile (React Native / Expo SDK 52) Clients | `ck:frontend-development`<br>`ck:mobile-development` | `ck:ui-styling`<br>`ck:ui-ux-pro-max` |
| **Phase 8** | Admin CMS, Telemetry & Production Deployment | `ck:frontend-development`<br>`ck:deploy` | `ck:devops` |

---
*Tài liệu này là quy chuẩn kỹ thuật chính thức của dự án LinguaFlow. Mọi Agent và Developer tham gia dự án cần tuân thủ nghiêm ngặt.*
