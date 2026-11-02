# ADR-005: Payment Service mô phỏng chạy cùng API, ranh giới HTTP

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** FR-05, FR-06, FR-21, BR-11, BR-18, SH-06, Sequence-01

## Bối cảnh

Đề yêu cầu thanh toán Ví/Thẻ **mô phỏng** và sequence diagram có lifeline **Payment Service** riêng. Idempotency phải đúng cả khi cổng thanh toán bị timeout. Không có ngân sách cho service riêng. Render free sẽ cho service riêng ngủ, và cold start 30–60 giây sẽ gây timeout giả ở mọi lần thanh toán đầu tiên.

## Quyết định

- Viết Payment Service mô phỏng thành module **`PaymentMockModule`** trong `apps/api`, expose `POST /api/v1/mock-gateway/charges`.
- `PaymentsModule` **chỉ gọi nó qua HTTP** bằng `PaymentGatewayClient` (port/adapter), URL lấy từ `PAYMENT_GATEWAY_URL`, timeout 10 giây, header `Idempotency-Key`.
- Mock lưu giao dịch vào bảng riêng `mock_charges` theo khóa nên idempotent kể cả sau khi khởi động lại; kết quả theo bảng thẻ/ví test của SRS.
- Tách thành service riêng sau này chỉ cần đổi `PAYMENT_GATEWAY_URL`; thay bằng cổng thật chỉ cần viết adapter mới (FR-21 hiện là Won't).

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| App riêng `apps/payment-mock` trên Render | Thêm 1 service; gói free cho ngủ nên timeout giả; private service phải trả phí |
| Gọi hàm trực tiếp (không HTTP) | Mất ranh giới hệ thống ngoài; không mô phỏng được timeout, header idempotency như sequence diagram |
| Sandbox cổng thật (VNPay/Stripe test) | Cần đăng ký merchant, phụ thuộc bên ngoài, vượt phạm vi |

## Hệ quả

- (+) 0 chi phí, không có cold start riêng.
- (+) Giữ đúng hợp đồng HTTP + idempotency như một cổng thật.
- (−) Không độc lập về lỗi: API sập thì mock cũng sập.
- (−) Endpoint mock nằm chung domain API. Chỉ bật khi `PAYMENT_MOCK_ENABLED=true` và không nhận dữ liệu thẻ thật.
