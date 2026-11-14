# Kiểm thử BrewLite

| Loại | Công cụ | Vị trí | Lệnh |
|---|---|---|---|
| Unit – API | Jest | `apps/api/src/**/*.spec.ts` | `pnpm --filter @brewlite/api test` |
| API test (Prisma giả lập) | Jest + supertest | `apps/api/test/*.api-spec.ts` | `pnpm --filter @brewlite/api test` |
| Integration (PostgreSQL thật) | Jest + supertest | `apps/api/test/*.int-spec.ts` | `pnpm --filter @brewlite/api test:int` |
| Component – web | Vitest + Testing Library | `apps/web/src/**/*.test.tsx` | `pnpm --filter @brewlite/web test` |
| Unit – shared | node:test | `packages/shared/src/*.test.ts` | `pnpm --filter @brewlite/shared test` |
| End-to-end (Sprint 2) | Playwright, viewport mobile | `tests/e2e/` | `pnpm test:e2e` (Sprint 2) |

Thư mục `tests/` dành cho kiểm thử **xuyên ứng dụng** (web + API + DB cùng chạy), ví dụ E2E luồng menu → đặt đơn → xác nhận (PB-17). Test gắn với một ứng dụng nằm cạnh mã nguồn của ứng dụng đó.

Mã test (API-T01, INT-T08, UI-T01…) khớp với cột Test của [ma trận truy vết](../docs/traceability-matrix.md).
