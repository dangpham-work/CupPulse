# ADR-007: Cập nhật trạng thái đơn bằng polling 3 giây

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** FR-07 (AC-07.3), FR-12 (AC-12.2), G4

## Bối cảnh

Khách phải thấy trạng thái mới, và nhân viên phải thấy đơn mới, trong **≤ 5 giây**. API chạy trên Render free (có thể ngủ, khởi động lại), frontend trên Vercel.

## Quyết định

Dùng **polling** bằng TanStack Query (`refetchInterval: 3000`):
- màn theo dõi đơn của khách: chỉ khi đơn chưa `COMPLETED`/`CANCELLED`;
- màn bảng đơn của nhân viên: luôn bật khi tab đang mở.

Tạm dừng khi tab bị ẩn (`refetchIntervalInBackground: false`) để giảm tải.

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Server-Sent Events | Đẹp hơn, nhưng kết nối dài bị ngắt khi Render khởi động lại; cần xử lý reconnect và test khó hơn |
| WebSocket (Socket.IO) | Thêm hạ tầng, khó hơn với nhiều instance; vượt nhu cầu |
| Web Push | Là FR-20 (Could), không thay được màn hình theo dõi |

## Hệ quả

- (+) Đơn giản, chạy ổn trên mọi nền tảng, dễ viết E2E test.
- (+) Độ trễ tối đa khoảng 3 giây, đạt ≤ 5 giây.
- (−) Nhiều request hơn: với khoảng 20 người dùng đồng thời là ~7 request/giây, nằm trong giới hạn NFR-01 và rate limit.
- Có thể thay bằng SSE sau mà không đổi API hiện có.
