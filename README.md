# BrewLite (CupPulse)

Ứng dụng đặt cà phê **mobile-first/PWA** có thanh toán mô phỏng: xem menu → chọn tùy chọn → giỏ hàng → đặt đơn → thanh toán → theo dõi đơn.
Đồ án *Công nghệ Phần mềm – Assignment 2: Requirements to Deployment*, Trường Đại học Sài Gòn.

| Thành phần | Công nghệ | Thư mục |
|---|---|---|
| Frontend | Next.js 15 (App Router), React 19, TanStack Query, Tailwind CSS 4 | [`apps/web`](apps/web) |
| Backend | NestJS 11, Prisma 6 | [`apps/api`](apps/api) |
| Dùng chung | TypeScript (kiểu dữ liệu, định dạng tiền) | [`packages/shared`](packages/shared) |
| Cơ sở dữ liệu | PostgreSQL 16 | `apps/api/prisma` |
| Đóng gói, CI | Docker, Docker Compose, GitHub Actions | `docker-compose.yml`, [`.github/workflows`](.github/workflows) |

**Trạng thái:** Sprint 1 – MVP xem menu (`GET /products`, `GET /products/:id`, màn menu có loading/empty/error) và CI. Xem [docs/process/sprint-1.md](docs/process/sprint-1.md).

## Cấu trúc repository

```text
apps/
  web/                 # Next.js mobile-first/PWA
  api/                 # NestJS: src/modules/<domain>, prisma/ (schema, migrations, seed), test/
packages/shared/       # Kiểu dữ liệu và hàm dùng chung web ↔ API
docs/
  requirements/        # Task 1 – bối cảnh, SRS, use-case
  diagrams/            # Task 2 – activity, sequence, class, state (.puml + .svg)
  architecture/        # Task 3 – C4, ADR, deployment diagram
  process/             # Task 4 – Product Backlog, Sprint
  traceability-matrix.md
  report/              # Báo cáo LaTeX (main.pdf)
tests/                 # Integration/E2E xuyên ứng dụng (Sprint 2)
.github/workflows/     # CI
docker-compose.yml
.env.example
```

Mục lục tài liệu và lịch sử thay đổi: [docs/README.md](docs/README.md).

## Chạy ở local

### Cách 1 – Docker Compose (web + API + DB, một lệnh)

Yêu cầu: Docker Desktop.

```bash
cp .env.example .env
```

```bash
docker compose up --build
```

- Web: <http://localhost:3000>
- API: <http://localhost:4000/api/v1/products>
- Health check: <http://localhost:4000/health>

Container API tự chạy `prisma migrate deploy` rồi seed dữ liệu mẫu (13 sản phẩm, 4 danh mục). Xóa dữ liệu: `docker compose down -v`.

### Cách 2 – Chạy trực tiếp bằng pnpm

Yêu cầu: Node.js 22+, pnpm 10 (`npm install -g pnpm@10`), một PostgreSQL 16 đang chạy (ví dụ `docker compose up -d db`).

```bash
pnpm install
```

```bash
cp .env.example apps/api/.env
```

```bash
pnpm build:shared && pnpm --filter @brewlite/api db:migrate && pnpm --filter @brewlite/api db:seed
```

Chạy API (cổng 4000) và web (cổng 3000) ở hai terminal:

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

## Kiểm tra chất lượng

| Lệnh | Việc làm |
|---|---|
| `pnpm lint` | ESLint cho web và API |
| `pnpm typecheck` | Kiểm tra kiểu TypeScript |
| `pnpm test` | Unit test và API test (Jest cho API, Vitest + Testing Library cho web, node:test cho shared) |
| `pnpm --filter @brewlite/api test:int` | Integration test với PostgreSQL thật (cần DB đã migrate + seed) |
| `pnpm build` | Build shared, API và web |

CI chạy đúng các bước này trên mỗi pull request: **Install → Lint → Unit Test → Build**, cùng job integration test với PostgreSQL ([ci.yml](.github/workflows/ci.yml)).

## API Sprint 1

| Method | Đường dẫn | Mô tả | Yêu cầu |
|---|---|---|---|
| GET | `/api/v1/products` | Danh sách món đang bán; lọc `?category=<slug>` | FR-01 |
| GET | `/api/v1/products/:id` | Chi tiết món kèm size, topping; 404 `PRODUCT_NOT_FOUND`, 400 khi id sai | FR-02 |
| GET | `/health` | Trạng thái API và DB | NFR-14 |

Lỗi trả về dạng `{ "statusCode", "code", "message", "details"? }` (SRS mục 1.3).

## Quy trình làm việc

Chiến lược branch, pull request, quy ước commit và Definition of Done: [CONTRIBUTING.md](CONTRIBUTING.md).

Triển khai production (Vercel + Render), CD và rollback: Sprint 2, sẽ mô tả trong `docs/deployment.md`.

## Tác giả

Phạm Duy Đăng – MSSV 3124410068 – DCT1245 – Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn.
