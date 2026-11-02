# BrewLite – Ma trận truy vết

| Thuộc tính | Giá trị |
|---|---|
| Phiên bản | 0.2 (sau Task 2) |
| Trạng thái | Cột **Code/API** là hợp đồng API từ SRS mục 8; cột **Test** là mã test **dự kiến**. Hai cột này được cập nhật thành đường dẫn mã nguồn và kết quả test thật ở Task 4–5. |

**Quy ước mã test:** `UNIT-Txx` unit test · `API-Txx` integration test cho một endpoint · `INT-Txx` integration test nhiều bước (đặt đơn, thanh toán) · `E2E-Txx` end-to-end (Playwright) · `SMOKE-Txx` smoke test sau triển khai.

**Mã sơ đồ:** xem [docs/diagrams/README.md](diagrams/README.md).

## Yêu cầu chức năng

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code / API | Test |
|---|---|---|---|---|
| FR-01 | US-01 Xem menu · UC-02 | Activity-01, Class-01 (Product, Category) | `GET /products` | API-T01, E2E-T01 |
| FR-02 | US-02 · UC-02 | Activity-01, Class-01 (Product, ProductSize, Topping) | `GET /products/:id` | API-T02, UNIT-T01 (tính giá) |
| FR-03 | US-03 · UC-03 | Activity-01 | Giỏ hàng phía client (`apps/web`) | UNIT-T02, E2E-T01 |
| FR-04 | US-05 · UC-01 | Activity-01, Sequence-01 (giai đoạn 1), Class-01 (Order, OrderItem), State-01 | `POST /orders` | INT-T01, INT-T02 (hết hàng), INT-T06 (đồng thời) |
| FR-05 | US-05 · UC-01 Thanh toán | Sequence-01 (giai đoạn 2), Class-01 (Payment), State-01 | `POST /payments` | INT-T03 (thành công), INT-T04 (thất bại, 3 lần) |
| FR-06 | US-05 · UC-01 | Sequence-01 (`alt` idempotency), Class-01 (IdempotencyRecord) | `POST /payments` + header `Idempotency-Key` | INT-T05 |
| FR-07 | US-06 · UC-06 | Activity-01, Sequence-01 (giai đoạn 3), State-01 | `GET /orders/:id` | API-T03, E2E-T01 |
| FR-08 | US-07 · UC-07 | Class-01 (Order) | `GET /orders` | API-T04 |
| FR-09 | US-04 · UC-04 | Class-01 (User) | `POST /auth/register` | API-T05 |
| FR-10 | US-04 · UC-05 | Activity-01, Sequence-01 (JwtAuthGuard) | `POST /auth/login` | API-T06, UNIT-T03 |
| FR-11 | Mọi use-case | Class-01 (Role) | Guard phân quyền (`/staff/*`, `/manager/*`) | API-T07 |
| FR-12 | US-10 · UC-10 | Activity-01, State-01, Class-01 (OrderStatusHistory) | `GET /staff/orders`, `PATCH /staff/orders/:id/status` | API-T08, UNIT-T04 (máy trạng thái) |
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
| NFR-04 | FR-10 | Sequence-01 (JwtAuthGuard) | Module auth | API-T06 |
| NFR-05 | Mọi API | Sequence-01 (ValidationPipe) | ValidationPipe toàn cục | API-T01 → API-T10 (ca dữ liệu sai) |
| NFR-13 | FR-04, FR-05 | Sequence-01 (2 khối Transaction) | Service đơn hàng, thanh toán | INT-T06 |
| NFR-14 | — | (Task 3: deployment diagram) | `GET /health` | SMOKE-T01 |
| NFR-16 | — | (Task 4) | `.github/workflows/ci.yml` | Log CI pass / fail |
| NFR-17 | — | (Task 3, Task 5) | `.github/workflows/cd.yml` | Log CD, SMOKE-T01 |
