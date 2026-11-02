# Sprint 1 – Nền tảng và MVP xem menu (Task 4)

| Thuộc tính | Giá trị |
|---|---|
| Thời gian | 02/11/2026 → 15/11/2026 (2 tuần) |
| Sprint Goal | Repository, tài liệu có kiểm soát phiên bản, CI trên pull request và MVP xem menu chạy được |
| Backlog | PB-01 → PB-09 trong [product-backlog.md](product-backlog.md) |
| Nhánh / PR | `feat/task4-sprint1` → `main` |

## 1. Task 4.1 – Thiết lập repository

| Yêu cầu của đề | Hiện thực |
|---|---|
| Cấu trúc `apps/web`, `apps/api`, `docs` | Monorepo pnpm: `apps/web` (Next.js), `apps/api` (NestJS), `packages/shared`, `docs/` (ADR-001) |
| Chiến lược branch và pull request | GitHub Flow, `main` được bảo vệ: [CONTRIBUTING.md](../../CONTRIBUTING.md) mục 1–2, [PR template](../../.github/pull_request_template.md) |
| `README.md`, `.gitignore`, `.env.example` | [README.md](../../README.md), [.gitignore](../../.gitignore), [.env.example](../../.env.example) |
| Issue board / Product Backlog cho Sprint 1, 2 | [product-backlog.md](product-backlog.md) + GitHub Issues theo milestone `Sprint 1`, `Sprint 2`; [issue templates](../../.github/ISSUE_TEMPLATE) |
| Quy ước commit, Definition of Done | [CONTRIBUTING.md](../../CONTRIBUTING.md) mục 3–4 |

## 2. Task 4.2 – Quản lý tài liệu

- Toàn bộ tạo phẩm Task 1–3 nằm trong `docs/`; mục lục và bảng lịch sử thay đổi ở [docs/README.md](../README.md).
- Mỗi task vào `main` qua một pull request riêng (PR #1 Task 1, #2 Task 2, #3 Task 3, PR Sprint 1 cho Task 4); PR template bắt buộc mục **Lý do thay đổi**.
- Thay đổi quyết định kiến trúc ghi bằng ADR mới.

## 3. Task 4.3 – MVP Sprint 1

| Hạng mục | Hiện thực | Mã nguồn |
|---|---|---|
| `GET /products` | Danh sách món `isActive = true`, `inStock = stock > 0`, lọc `?category=` | `apps/api/src/modules/catalog/` |
| `GET /products/:id` | Chi tiết kèm `sizes`, `toppings`; 404 `PRODUCT_NOT_FOUND`; 400 khi id không phải UUID | `catalog.controller.ts`, `catalog.service.ts` |
| Định dạng lỗi chung, validate whitelist | `{ statusCode, code, message, details? }`; query lạ → 400 | `apps/api/src/common/`, `app.setup.ts` |
| Màn menu mobile-first | Lưới 2 cột ở 360 px, tab danh mục, nhãn "Hết hàng" | `apps/web/src/features/menu/` |
| Loading / empty / error | Skeleton; "Chưa có món nào"; thông báo lỗi + nút "Thử lại" gọi lại API | `MenuView.tsx` |
| Dữ liệu mẫu | Migration Prisma + seed idempotent: 4 danh mục, 13 sản phẩm (1 hết hàng, 1 đã ẩn), 4 topping | `apps/api/prisma/` |
| Health check | `GET /health` ping DB, 200 hoặc 503 | `apps/api/src/modules/health/` |
| Chạy local | `docker compose up --build` chạy web + API + DB | `docker-compose.yml`, `apps/*/Dockerfile` |

### Kiểm thử

| Mã test | Loại | Nội dung | Tệp |
|---|---|---|---|
| UNIT-T07 | Unit (Jest) | `CatalogService`: lọc isActive, lọc danh mục, ánh xạ `inStock`, bỏ topping ngừng bán, `PRODUCT_NOT_FOUND` | `apps/api/src/modules/catalog/catalog.service.spec.ts` |
| UNIT-T08 | Unit (Jest) | Kiểm tra biến môi trường (fail fast) | `apps/api/src/config/env.spec.ts` |
| API-T01 | API (Jest + supertest, Prisma giả lập) | `GET /products`: 200 không token, lọc danh mục, query lạ → 400, lỗi DB → 500 không lộ chi tiết | `apps/api/test/products.api-spec.ts` |
| API-T02 | API | `GET /products/:id`: 200, 404 `PRODUCT_NOT_FOUND`, 400 id sai | `apps/api/test/products.api-spec.ts` |
| SMOKE-T01 (local) | API | `GET /health` 200 / 503 | `apps/api/test/products.api-spec.ts` |
| INT-T08 | Integration (PostgreSQL thật) | Migrate + seed tái tạo DB; API đọc đúng 12 món đang bán, size, topping, món ẩn → 404 | `apps/api/test/catalog.int-spec.ts` |
| UI-T01 | Component (Vitest + Testing Library) | Màn menu: skeleton, danh sách, empty, error + Thử lại, mất mạng, "Hết hàng", tab danh mục | `apps/web/src/features/menu/MenuView.test.tsx` |
| UNIT-T09 | Unit (node:test) | `formatVnd` | `packages/shared/src/format.test.ts` |

## 4. Task 4.4 – Continuous Integration

Workflow [ci.yml](../../.github/workflows/ci.yml) chạy khi mở/cập nhật pull request vào `main` và khi push lên `main`:

```text
quality:      Install → Chuẩn bị → Lint → Typecheck → Unit Test → Build
integration:  Install → Migrate + seed (PostgreSQL service) → Integration Test
docker:       Build image API → Build image Web
```

Job `docker` build image web và API (chưa push; push lên registry ở Sprint 2). Branch protection của `main` yêu cầu các job trên pass mới được merge (cấu hình ở CONTRIBUTING.md mục 2).

### Minh chứng

| Lần chạy | Kết quả | Link |
|---|---|---|
| PR Sprint 1 | Pass | _(điền sau khi CI chạy)_ |
| PR minh chứng lỗi lint | Fail ở bước Lint, PR bị chặn merge | _(điền sau khi CI chạy)_ |

## 5. Sprint Review và Retrospective

Ghi ở cuối Sprint (Task 5 gộp Sprint Review/Retrospective của cả hai Sprint).
