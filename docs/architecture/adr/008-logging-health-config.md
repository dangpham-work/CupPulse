# ADR-008: Log JSON, health check, cấu hình kiểm tra khi khởi động

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** NFR-06, NFR-14, NFR-17, NFR-19

## Bối cảnh

Đề yêu cầu kiến trúc có logging, health check và quản lý cấu hình; CD phải gọi health check/smoke test. Production chỉ xem được log qua dashboard Render/Vercel.

## Quyết định

- **Logging:** `nestjs-pino`, log JSON một dòng. Mỗi request có `requestId` (nhận từ header `x-request-id` hoặc tự sinh), method, path, status, `responseTime`. Dùng `redact` cho `authorization`, `password`, `card.number`, `card.cvv`. Lỗi 5xx ghi stack trace vào log nhưng không trả cho client.
- **Health check:** `@nestjs/terminus`, `GET /health` ping DB (`SELECT 1`): `200 {status:"ok", db:"up"}` hoặc `503`. Dùng cho Docker `HEALTHCHECK`, Render health check path và smoke test sau deploy.
- **Cấu hình:** `@nestjs/config` đọc biến môi trường, kiểm tra bằng schema zod khi khởi động. Thiếu hoặc sai thì **dừng ngay** (fail fast). `.env.example` liệt kê mọi biến, không chứa giá trị thật.

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Logger mặc định của NestJS | Không có JSON và redact, khó lọc theo `requestId` |
| Winston | Dùng được; pino nhanh hơn và có module NestJS gọn hơn |
| Dịch vụ log ngoài (Datadog, Logtail) | Thêm chi phí, thêm secret; log của nền tảng là đủ cho đồ án |
| Health check chỉ trả 200 | Không phát hiện mất kết nối DB |

## Hệ quả

- (+) Truy được một request qua `requestId`; không lộ dữ liệu nhạy cảm (NFR-19).
- (+) Deploy lỗi cấu hình sẽ hỏng ngay ở health check, không chạy nửa vời.
- (−) Log chỉ lưu theo thời hạn của gói miễn phí.
