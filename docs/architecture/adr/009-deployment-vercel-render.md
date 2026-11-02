# ADR-009: Triển khai Vercel + Render + GHCR

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** C7, C9, NFR-07, NFR-14, NFR-17, R1, R8, Deployment-01

## Bối cảnh

Đề yêu cầu production truy cập được qua HTTPS, database không public, image có tag theo commit SHA hoặc semver, push lên container registry, deploy bằng secret của CI, smoke test sau deploy và có cách rollback. Ngân sách gần như bằng 0.

## Quyết định

| Thành phần | Nền tảng |
|---|---|
| Next.js | **Vercel** (Hobby): CDN, HTTPS tự động, deploy bằng Vercel CLI từ GitHub Actions |
| NestJS API | **Render Web Service** chạy Docker image kéo từ **GHCR** (`ghcr.io/dangpham-work/brewlite-api:<sha>`), region Singapore, health check `/health` |
| PostgreSQL | **Render PostgreSQL 16**, cùng region, **tắt external access**, API dùng Internal Database URL |
| Registry | **GitHub Container Registry**, push bằng `GITHUB_TOKEN` |
| CI/CD | **GitHub Actions**: `ci.yml` cho PR, `cd.yml` cho `main`/tag `v*` |

Deploy API bằng **deploy hook** của Render kèm `imgURL` trỏ tới image SHA vừa build. Rollback bằng cách gọi lại hook với SHA trước đó.

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Neon cho PostgreSQL | Endpoint có địa chỉ public (giới hạn IP là tính năng trả phí), không đạt "DB không public" |
| Railway | Dùng được (private networking) nhưng hết credit dùng thử thì tính phí ngay |
| Fly.io | Cần thẻ thanh toán, cấu hình mạng phức tạp hơn |
| VPS + Docker Compose | Kiểm soát tốt nhưng phải tự lo TLS, cập nhật hệ điều hành, tên miền |
| API cũng lên Vercel (serverless) | NestJS + Prisma chạy serverless bị cold start và giới hạn kết nối DB; Render chạy container lâu dài hợp hơn |

## Hệ quả

- (+) HTTPS và CDN sẵn có; DB chỉ nối nội bộ; mọi secret nằm ở GitHub/Render/Vercel.
- (+) Image bất biến theo SHA nên rollback nhanh (NFR-17).
- (−) Render free ngủ sau 15 phút: smoke test cần retry, demo cần "đánh thức" trước (R8).
- (−) Render PostgreSQL free hết hạn sau 30 ngày (R1). Phải nâng lên gói Basic (~6 USD/tháng) trước khi hết hạn, hoặc tạo lại DB rồi migrate + seed.
- (−) Hai nhà cung cấp nên cấu hình CORS và URL ở hai nơi.
