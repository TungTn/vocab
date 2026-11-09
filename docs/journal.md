
## [2026-11-09] Phase 09: Triển khai Hệ thống Xác Thực Người Dùng Toàn Diện (Auth UI, OAuth, Profile Modal)
- **Tác vụ**: Phát triển giao diện và luồng xác thực người dùng cho LinguaFlow Web (Next.js 15) kết nối với NestJS JWT.
- **Thành phần phát triển**:
  1. `apps/api/src/auth/auth.controller.ts` & `auth.service.ts`: Endpoint `POST /api/auth/oauth` hỗ trợ Google và Facebook; cấp JWT token và lưu refresh token.
  2. `apps/web/src/components/auth/auth-modal.tsx`: Modal đăng nhập/đăng ký với tabs, xem/ẩn mật khẩu, nút Social OAuth và nút "Đăng nhập 1-click Demo".
  3. `apps/web/src/app/login/page.tsx` & `apps/web/src/app/register/page.tsx`: 2 trang độc lập fullscreen cho người dùng truy cập trực tiếp qua URL.
  4. `apps/web/src/components/layout/navbar.tsx`: Nâng cấp Navbar hiển thị Avatar, tên người dùng, huy hiệu Role, Dropdown Menu xem hồ sơ, đổi mật khẩu và đăng xuất.
  5. `apps/web/src/components/auth/profile-modal.tsx`: Modal xem chỉ số (Streak, Tim, Đá quý, Hạng) và form đổi mật khẩu bảo mật (`POST /api/auth/change-password`).
  6. `apps/web/src/store/user-store.ts` & `api-client.ts`: Quản lý phiên đăng nhập và token trong `localStorage`.
- **Kết quả kiểm thử**:
  - 86/86 unit tests pass (`pnpm test`).
  - Next.js 15 build thành công 16 route tĩnh (`pnpm build`).
  - Commit & Push: `6e60f6b`.
