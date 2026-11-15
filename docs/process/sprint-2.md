# Sprint 2 – Hoàn thiện MVP, CI/CD và Delivery (Task 5)

| Thuộc tính | Giá trị |
|---|---|
| Thời gian | 14/11/2026 → hạn nộp |
| Sprint Goal | Luồng end-to-end menu → giỏ → đăng nhập → đặt đơn → thanh toán → theo dõi đơn chạy được; tự động đóng gói và triển khai production |
| Backlog | PB-10 → PB-19, PB-25 (Must) trong [product-backlog.md](product-backlog.md) |
| Nhánh / PR | `feat/task5-sprint2` → `main` |

## 1. Task 5.1 – Hoàn thiện MVP

| Hạng mục (đề) | Hiện thực | Mã nguồn |
|---|---|---|
| Chi tiết sản phẩm, size, topping | Chọn size/topping, giá cập nhật ngay (BR-02) | `apps/web/src/features/product/` |
| Giỏ hàng và tính tổng tiền | Sửa/xóa, gộp dòng, tối đa 20 ly, lưu localStorage | `apps/web/src/features/cart/` |
| Đăng ký, đăng nhập, JWT | bcrypt cost 12, HS256 60 phút, `RolesGuard` (CUSTOMER/STAFF/MANAGER) | `apps/api/src/modules/auth/`, `apps/web/src/features/auth/` |
| Tạo đơn hàng | Transaction: tính lại giá ở server, trừ kho có điều kiện, snapshot, mã `BL-YYMMDD-NNNN`, giữ kho 15 phút | `apps/api/src/modules/orders/` |
| Thanh toán Ví/Thẻ mô phỏng | `POST /payments`, `Idempotency-Key`, 201/402/202, hủy + hoàn kho sau 3 lần lỗi | `apps/api/src/modules/payments/` |
| Xác nhận, trạng thái, lịch sử | Polling 3 s, timeline, phân trang | `apps/web/src/features/orders/` |
| Nhân viên đổi trạng thái | Bảng 3 cột, máy trạng thái BR-12 | `staff.controller.ts`, `apps/web/src/features/staff/` |
| Xử lý lỗi và validate FE/BE | Luhn, hạn dùng, SĐT dùng chung `packages/shared/src/payment.ts` | `packages/shared` |
| PWA | `public/sw.js`, trang `/offline` | `apps/web/public/`, `apps/web/src/app/offline/` |

Thẻ thử của Payment Service mô phỏng: `4242424242424242` thành công · `4000000000000002` bị từ chối · `4000000000009995` thiếu số dư · `4000000000000119` chậm (202, tự chốt sau 5 giây). Ví: `0912345678` thành công · `0900000000` từ chối · `0900000001` chậm. Tài khoản demo (seed): `khach@`, `nhanvien@`, `quanly@brewlite.test`.

## 2. Task 5.2 – Tích hợp và kiểm thử

| Mã test | Loại | Nội dung | Tệp |
|---|---|---|---|
| UNIT-T10 | Unit | Tạo đơn: giá, snapshot, mã đơn, `PRICE_CHANGED`, `OUT_OF_STOCK`, `PRODUCT_UNAVAILABLE`, giới hạn 20 ly | `orders.service.spec.ts` |
| UNIT-T11 | Unit | Payment Service mô phỏng, đếm số lần gọi | `mock-gateway.spec.ts` |
| UNIT-T12 → T14 | Unit | Đăng ký/đăng nhập, JWT (kể cả `alg=none`), phân quyền | `auth.service.spec.ts`, `token.service.spec.ts`, `roles.guard.spec.ts` |
| API-T03 → T07 | API (Prisma giả lập) | Auth, 401/403, validate body đơn, 404 đơn người khác | `test/auth-orders.api-spec.ts` |
| INT-T01 → T09 | Integration (PostgreSQL thật) | Trừ kho, thiếu kho rollback, đặt đồng thời, idempotency, 3 lần lỗi, 202, hết hạn giữ kho | `test/orders-payments.int-spec.ts` |
| UI-T02 → T08 | Component (Vitest) | Giá, giỏ, auth, checkout, đơn, nhân viên, service worker | `apps/web/src/**/*.test.tsx` |
| E2E-T01 | End-to-end (Playwright) | Menu → giỏ → đăng ký/đăng nhập → thẻ 4242 → xác nhận đơn | `tests/e2e/checkout.spec.ts` |

Migration và seed: `apps/api/prisma/migrations/20261114010000_sprint2_orders/`, `prisma/seed.ts` (idempotent). `docker-compose.yml` chạy web + API + DB. `GET /health` ping DB.

Kết quả chạy cục bộ ngày 14/11/2026: API 50/50 test (unit + API), integration 14/14 trên PostgreSQL 16, web 48/48, shared 7/7, E2E-T01 qua trên stack thật (web + API + PostgreSQL).

## 3. Task 5.3 – CI/CD

`ci.yml` (PR và `main`): quality, integration, **e2e**, docker. `cd.yml` (push `main`, tag `v*`, `workflow_dispatch`): quality gate → build image API, tag `:<sha>` và `:vX.Y.Z` → push GHCR → deploy API (Render hook) và web (Vercel CLI) → smoke test có retry → tự rollback về SHA trước nếu smoke test lỗi. Migration chạy trong `docker-entrypoint.sh` khi container khởi động (DB production không public nên runner không kết nối được); lỗi migration thì Render giữ bản cũ. Chi tiết và rollback: [docs/deployment.md](../deployment.md).

## 4. Task 5.4 – Triển khai và bàn giao

| Hạng mục | Trạng thái |
|---|---|
| URL frontend production (HTTPS) | **Chưa có** – cần tạo Vercel project, điền vào `docs/deployment.md` |
| URL API và `/health` production | **Chưa có** – cần tạo Render Web Service + PostgreSQL |
| Database không public | Cấu hình theo `docs/deployment.md` mục 3 (tắt external access) |
| Secret không nằm trong repo/log | Chỉ dùng GitHub Secrets; `.env` bị ignore |
| Release notes, tag v1.0.0 | [release-notes-v1.0.0.md](../release-notes-v1.0.0.md); tag tạo sau khi production xanh |
| README (local, test, build, deploy, rollback) | Có |
| Video demo | Cần quay |

## 5. Sprint Review

- **Hoàn thành:** toàn bộ mục Must PB-10 → PB-17 và PB-25 chạy được ở local, có test.
- **Chưa hoàn thành:** triển khai production thật và smoke test (PB-18 chạy thực tế, PB-19), vì cần tài khoản Render/Vercel do chủ dự án tạo. Các mục Should PB-20 → PB-24 và Could PB-26 **không làm**; ma trận truy vết đánh dấu rõ.
- **Demo:** luồng E2E-T01 là kịch bản demo; thêm kịch bản thẻ bị từ chối 3 lần và thanh toán chậm (202).

## 6. Sprint Retrospective

| Tốt | Cần cải thiện | Hành động |
|---|---|---|
| Hợp đồng chung ở `packages/shared` giúp web và API khớp nhau (Luhn, trạng thái đơn) | Bắt đầu chạy integration test muộn vì mạng chậm kéo image PostgreSQL | Kéo image/cài dependency sớm, tách bước chạy nền |
| Test viết trước giúp lộ lỗi DI của `MockGateway` ngay khi chạy integration | Đã commit thanh toán trước khi integration test chạy xong | Chạy integration trước khi commit tính năng chạm DB |
| Idempotency và trừ kho có điều kiện được kiểm bằng test đồng thời | Sửa nhiều file song song dễ chồng chéo | Một người/agent một thư mục; commit nhỏ |
