# BrewLite – Ma trận truy vết

| Thuộc tính | Giá trị |
|---|---|
| Phiên bản | 0.5 (Task 5 – Sprint 2) |
| Trạng thái | Dòng có ✅ đã hiện thực (Sprint 1 và Sprint 2): cột **Code/API** trỏ tới mã nguồn, cột **Test** trỏ tới tệp test đang chạy trong CI. Các dòng khác vẫn là hợp đồng API từ SRS mục 8 và mã test **dự kiến**, cập nhật ở Task 5. |

**Quy ước mã test:** `UNIT-Txx` unit test · `API-Txx` integration test cho một endpoint · `INT-Txx` integration test nhiều bước (đặt đơn, thanh toán) · `E2E-Txx` end-to-end (Playwright) · `SMOKE-Txx` smoke test sau triển khai.

**Mã sơ đồ:** Task 2 xem [docs/diagrams/README.md](diagrams/README.md); Task 3 (C4-01 → C4-03, Deployment-01, ADR-001 → ADR-009) xem [docs/architecture/architecture.md](architecture/architecture.md).

## Yêu cầu chức năng

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code / API | Test |
|---|---|---|---|---|
| FR-01 ✅ | US-01 Xem menu · UC-02 · PB-04, PB-05 | Activity-01, Class-01 (Product, Category), C4-03 CatalogModule | `GET /products` → `apps/api/src/modules/catalog/catalog.controller.ts`; màn menu `apps/web/src/features/menu/MenuView.tsx` | API-T01, UNIT-T07 (`apps/api/test/products.api-spec.ts`, `catalog.service.spec.ts`), INT-T08 (`apps/api/test/catalog.int-spec.ts`), UI-T01 (`apps/web/src/features/menu/MenuView.test.tsx`); E2E-T01 ở Sprint 2 |
| FR-02 ✅ | US-02 · UC-02 · PB-04, PB-10 | Activity-01, Class-01 (Product, ProductSize, Topping) | `GET /products/:id` → `catalog.controller.ts`; màn chi tiết `apps/web/src/features/product/ProductDetailView.tsx`, giá `pricing.ts` | API-T02 (`products.api-spec.ts`), UI-T02 (`pricing.test.ts`) |
| FR-03 ✅ | US-03 · UC-03 · PB-11 | Activity-01 | Giỏ hàng phía client `apps/web/src/features/cart/` (`CartProvider.tsx`, `CartView.tsx`) | UI-T03 (`CartView.test.tsx`), E2E-T01 |
| FR-04 ✅ | US-05 · UC-01 · PB-13 | Activity-01, Sequence-01 (giai đoạn 1), Class-01 (Order, OrderItem), State-01, C4-03 OrdersModule, ADR-002 | `POST /orders` → `apps/api/src/modules/orders/orders.service.ts` (transaction, trừ kho có điều kiện); `checkout/CheckoutView.tsx` | UNIT-T10 (`orders.service.spec.ts`), API-T07, INT-T01, INT-T02 (hết hàng), INT-T03 (đồng thời), UI-T04 |
| FR-05 ✅ | US-05 · UC-01 Thanh toán · PB-14 | Sequence-01 (giai đoạn 2), Class-01 (Payment), State-01, C4-03 PaymentsModule + PaymentMockModule, ADR-005 | `POST /payments` → `modules/payments/payments.service.ts`, `mock-gateway.ts`; Luhn/hạn dùng ở `packages/shared/src/payment.ts`; `checkout/PaymentForm.tsx` | UNIT-T11 (`mock-gateway.spec.ts`), UNIT-T09b (`payment.test.ts`), INT-T04, INT-T06 (3 lần lỗi), INT-T07 (202), INT-T08 (validate) |
| FR-06 ✅ | US-05 · UC-01 · PB-14 | Sequence-01 (`alt` idempotency), Class-01 (IdempotencyRecord), ADR-004 (unique index), ADR-005 | `POST /payments` + header `Idempotency-Key`, bảng `idempotency_keys` | INT-T04 (phát lại), INT-T05 (422, 409) |
| FR-07 ✅ | US-06 · UC-06 · PB-15 | Activity-01, Sequence-01 (giai đoạn 3), State-01, ADR-007 (polling) | `GET /orders/:id` → `orders.controller.ts`; `orders/OrderDetailView.tsx` (polling 3 s) | API-T07 (404 người khác), INT-T09, UI-T05 (`OrdersViews.test.tsx`), E2E-T01 |
| FR-08 ✅ | US-07 · UC-07 · PB-15 | Class-01 (Order) | `GET /orders` → `orders.service.ts#list`; `orders/OrderHistoryView.tsx` | UI-T05, API-T07 |
| FR-09 ✅ | US-04 · UC-04 · PB-12 | Class-01 (User) | `POST /auth/register` → `modules/auth/auth.service.ts`; `auth/RegisterView.tsx` | UNIT-T12 (`auth.service.spec.ts`), API-T03, UI-T06 (`AuthViews.test.tsx`) |
| FR-10 ✅ | US-04 · UC-05 · PB-12 | Activity-01, Sequence-01 (JwtAuthGuard), C4-03 AuthModule, ADR-006 | `POST /auth/login`, `jwt-auth.guard.ts`, `token.service.ts`; `auth/AuthProvider.tsx` | UNIT-T13 (`token.service.spec.ts`), API-T04, API-T05 |
| FR-11 ✅ | Mọi use-case · PB-12 | Class-01 (Role) | `roles.guard.ts`, `@Roles()` (`/staff/*`) | UNIT-T14 (`roles.guard.spec.ts`), API-T06 |
| FR-12 ✅ | US-10 · UC-10 · PB-16 | Activity-01, State-01, Class-01 (OrderStatusHistory), ADR-007 | `GET /staff/orders`, `PATCH /staff/orders/:id/status` → `staff.controller.ts`, `orders.service.ts#advance`; `staff/StaffBoard.tsx` | API-T06, UI-T07 (`StaffBoard.test.tsx`) |
| FR-13 | US-12 · UC-12, UC-15 | Activity-01, State-01 | `POST /orders/:id/cancel`, tác vụ định kỳ | INT-T07 |
| FR-14 | US-08 · UC-08 | Sequence-01 (PricingService), Class-01 (Promotion) | `POST /promotions/validate`, `POST /orders` | UNIT-T05 |
| FR-15 | US-09 · UC-09 | Sequence-01 (khối ghi nhận thanh toán), Class-01 (LoyaltyTransaction) | `GET /me/loyalty` | INT-T03, UNIT-T06 |
| FR-16 | US-11 · UC-11 | Class-01 (Product) | `POST/PATCH /manager/products` | API-T09 |
| FR-17 | US-01 · UC-02 | Activity-01 | `GET /products?category=&q=` | API-T10 |
| FR-18 | US-09 · UC-09 (Could) | Class-01 (LoyaltyTransaction REDEEM) | `POST /orders` (`pointsToRedeem`) | Chỉ khi thực hiện |
| FR-19 | US-13 · UC-13 (Could) | — | `GET /manager/reports/daily` | Chỉ khi thực hiện |
| FR-20 | US-06 · UC-06 (Could) | — | Web Push | Chỉ khi thực hiện |
| FR-21 → FR-24 | Won't | — | Không có | Không áp dụng |

## Yêu cầu phi chức năng then chốt

| Mã yêu cầu | Liên quan | Thiết kế / Sơ đồ | Code / Cấu hình | Test / Minh chứng |
|---|---|---|---|---|
| NFR-04 ✅ | FR-10 | Sequence-01 (JwtAuthGuard), ADR-006 | `modules/auth` (bcrypt cost 12, JWT HS256) | UNIT-T12, UNIT-T13, API-T04, API-T05 |
| NFR-05 ✅ | Mọi API | Sequence-01 (ValidationPipe) | `apps/api/src/app.setup.ts` (ValidationPipe whitelist), `common/http-exception.filter.ts` | API-T01, API-T02 (query lạ, id sai → 400) |
| NFR-13 ✅ | FR-04, FR-05 | Sequence-01 (2 khối Transaction), ADR-002, ADR-004 | `orders.service.ts`, `payments.service.ts` (`$transaction`), migration `sprint2_orders` (CHECK stock ≥ 0, unique payment SUCCEEDED) | INT-T03, INT-T06 |
| NFR-14 ✅ | — | Deployment-01 (Render health check), ADR-008 | `GET /health` → `apps/api/src/modules/health/health.controller.ts` | `products.api-spec.ts` (200/503), INT-T08; SMOKE-T01 sau deploy ở Sprint 2 |
| NFR-16 ✅ | — | Deployment-01 (GitHub Actions ci.yml), ADR-001 | `.github/workflows/ci.yml` | Log CI pass / fail: [docs/process/sprint-1.md](process/sprint-1.md) mục 4 |
| NFR-17 ✅ (viết) | — | Deployment-01 (cd.yml, GHCR, deploy hook), ADR-004, ADR-009 | `.github/workflows/cd.yml`, [docs/deployment.md](deployment.md) | Log CD, SMOKE-T01 (chạy sau khi có URL production) |
| NFR-07 | — | Deployment-01 (HTTPS, DB external access tắt), ADR-009 | Cấu hình Vercel, Render | Kiểm tra URL, cấu hình |
| NFR-11 ✅ | FR-01 | C4-02 Web App, ADR-003 | `apps/web/public/sw.js`, `components/ServiceWorkerRegister.tsx`, `app/offline/page.tsx`, `app/manifest.ts` | UI-T08 (`ServiceWorkerRegister.test.tsx`), Lighthouse PWA |
| NFR-19 | — | C4-03 Common, ADR-008 | `nestjs-pino` (Sprint 2), `HttpExceptionFilter` | Kiểm tra log production |
| NFR-15 ✅ (local) | — | Deployment-01 (Docker Engine local) | `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/api/prisma/migrations/`, `prisma/seed.ts` | CI job Integration Test (migrate + seed từ DB trống) |

## Thành phần triển khai

Truy vết node của Deployment-01 tới container C4 và mã nguồn: xem [docs/architecture/deployment-view.md](architecture/deployment-view.md) mục 2.
