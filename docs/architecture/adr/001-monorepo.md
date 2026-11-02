# ADR-001: Monorepo pnpm cho web, API và thư viện dùng chung

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** C3, C6, C11, NFR-05, NFR-16

## Bối cảnh

Đề bài yêu cầu repo có `apps/web`, `apps/api`, `docs` và CI/CD trong cùng repository. Một người phát triển cả frontend lẫn backend. Quy tắc validate (số lượng 1–10, ≤ 3 topping, định dạng thẻ…) phải giống nhau ở hai phía (NFR-05).

## Quyết định

Dùng **một repository** quản lý bằng **pnpm workspaces**:

```
apps/web        Next.js
apps/api        NestJS
packages/shared schema zod, kiểu DTO, hằng số (mã lỗi, trạng thái)
docs/  tests/  .github/workflows/  docker-compose.yml
```

Mỗi app có `lint`, `test`, `build` riêng; CI chạy bằng `pnpm -r` hoặc lọc theo thư mục thay đổi.

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Hai repository (web, api) | Đề yêu cầu cấu trúc một repo; thay đổi API + UI phải mở hai PR, khó truy vết |
| npm/yarn workspaces | Dùng được; pnpm nhanh hơn, tiết kiệm dung lượng, `--filter` tiện cho CI |
| Nx / Turborepo | Mạnh nhưng thêm cấu hình không cần cho 2 app |

## Hệ quả

- (+) Một PR cho thay đổi xuyên tầng; schema dùng chung loại bỏ lệch validate.
- (+) Lịch sử commit của tài liệu và mã nằm chung, đúng yêu cầu truy vết.
- (−) Dockerfile phải build từ root (cần `pnpm-workspace.yaml`, `packages/shared`).
- (−) CI cần cache pnpm store để giữ thời gian ≤ 10 phút (NFR-16).
