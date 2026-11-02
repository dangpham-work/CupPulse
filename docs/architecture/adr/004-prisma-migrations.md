# ADR-004: PostgreSQL + Prisma, migration chạy khi container khởi động

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** C1, C7, NFR-13, NFR-15, NFR-17, BR-07, BR-10, BR-11, BR-14

## Bối cảnh

PostgreSQL là bắt buộc. Đề yêu cầu migration/seed tái tạo được database và CD phải "chạy migration theo cách an toàn". Database production **không public** (C7), nên runner CI không kết nối trực tiếp được.

## Quyết định

- Dùng **Prisma**: schema `apps/api/prisma/schema.prisma`, migration SQL sinh bởi `prisma migrate dev`, được commit và review qua PR.
- Ràng buộc mà Prisma không biểu diễn được viết bằng SQL trong migration: `CHECK (stock >= 0)`, partial unique `payments(order_id) WHERE status = 'SUCCEEDED'`.
- Production chạy `prisma migrate deploy` **trong entrypoint của container**, trước khi khởi động app. Migration lỗi thì container không lên, health check fail và Render giữ bản cũ.
- Tuân thủ quy tắc **expand → contract**: một release chỉ thêm (cột nullable/có default, bảng mới, index); xóa hoặc đổi tên ở release sau. Nhờ vậy image cũ vẫn chạy được với schema mới khi rollback.
- Seed `prisma db seed` dùng `upsert` nên chạy lại nhiều lần không lỗi.

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| TypeORM | Migration sinh tự động kém ổn định hơn; kiểu dữ liệu kém chặt hơn Prisma |
| Chạy migration từ CI | DB không public nên CI không tới được; mở public sẽ vi phạm C7 |
| Render pre-deploy command | Chỉ có ở gói trả phí |
| `prisma db push` | Không có lịch sử migration, không đạt yêu cầu tái tạo được |

## Hệ quả

- (+) Schema có version, tái tạo được từ đầu (NFR-15).
- (+) Không cần mở DB ra ngoài.
- (−) Nhiều instance cùng khởi động có thể chạy migration đồng thời. Prisma dùng advisory lock nên an toàn; hiện cũng chỉ có 1 instance.
- (−) Migration chạy lâu làm chậm khởi động. Chấp nhận được với quy mô dữ liệu này.
