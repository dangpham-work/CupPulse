# ADR-002: Backend NestJS dạng modular monolith, phân lớp theo module

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** C1, C9, C11, NFR-13, NFR-18, BR-07, BR-10

## Bối cảnh

Luồng đặt và thanh toán cần **trừ kho, tạo đơn, ghi thanh toán, cộng điểm** một cách nguyên tử (NFR-13). Dự án chỉ có một người và không có ngân sách hạ tầng. NestJS là bắt buộc.

## Quyết định

Một ứng dụng NestJS duy nhất, chia **module theo domain**: `auth`, `catalog`, `pricing`, `orders`, `payments`, `loyalty`, `promotions`, `payment-mock`, `health`, cùng `prisma`, `config`, `common`.

Trong mỗi module phân lớp **Controller → Service → Domain logic thuần → Prisma**. Module chỉ gọi nhau qua service đã export. Transaction dùng `prisma.$transaction` và truyền transaction client qua các service tham gia.

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Microservices (orders, payments, catalog tách riêng) | Cần saga/outbox cho trừ kho + thanh toán; nhiều service vượt gói miễn phí; quá sức một người trong 2 Sprint |
| Monolith không chia module | Nhanh lúc đầu nhưng khó test, khó truy vết FR → mã |
| Clean/Hexagonal đầy đủ (port/adapter mọi nơi) | Quá nhiều lớp trừu tượng cho quy mô này; chỉ áp dụng port/adapter cho cổng thanh toán (ADR-005) |

## Hệ quả

- (+) Transaction DB cục bộ đảm bảo BR-07, BR-10 đơn giản và đúng.
- (+) Domain logic thuần (tính giá, máy trạng thái, khuyến mãi) dễ unit test, đạt NFR-18.
- (+) Module ánh xạ 1–1 với nhóm FR nên dễ truy vết.
- (−) Scale cả khối; một lỗi nặng ảnh hưởng mọi chức năng.
- (−) Cần kỷ luật để không gọi chéo bảng giữa module.
