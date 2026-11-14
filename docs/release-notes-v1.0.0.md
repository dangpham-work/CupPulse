# BrewLite v1.0.0 – Release notes

**Trạng thái:** bản nháp. Gắn tag `v1.0.0` sau khi production đã triển khai và smoke test xanh.

## Tính năng
- Xem menu, tìm kiếm không dấu, lọc danh mục (FR-01, FR-17 phần giao diện).
- Chi tiết sản phẩm, chọn size và tối đa 3 topping, giá cập nhật ngay (FR-02).
- Giỏ hàng lưu trên thiết bị, giới hạn 20 ly (FR-03).
- Đăng ký, đăng nhập JWT, phân quyền CUSTOMER / STAFF / MANAGER (FR-09 → FR-11).
- Đặt đơn: tính giá ở server, trừ kho trong transaction, giữ kho 15 phút (FR-04).
- Thanh toán Ví/Thẻ mô phỏng, Idempotency-Key, tối đa 3 lần thất bại (FR-05, FR-06).
- Xác nhận và theo dõi đơn, lịch sử đơn (FR-07, FR-08).
- Màn nhân viên quầy đổi trạng thái đơn (FR-12).
- PWA: service worker, trang offline (NFR-11).

## Hạ tầng
- CI: lint, typecheck, unit, build, integration (PostgreSQL), E2E (Playwright), docker build.
- CD: image GHCR theo commit SHA / semver, deploy Render + Vercel, smoke test, rollback.

## Chưa có (không làm trong v1.0.0)
Khuyến mãi (FR-14), tích điểm (FR-15), hủy đơn thủ công (FR-13), quản lý sản phẩm (FR-16), tìm kiếm phía API `?q=`, báo cáo doanh thu (FR-19), Web Push (FR-20).

## Giới hạn đã biết
- Payment Service là mô phỏng nằm trong API, không xử lý tiền thật.
- Render gói miễn phí ngủ sau 15 phút không dùng; PostgreSQL miễn phí hết hạn sau 30 ngày (xem `docs/deployment.md`).
- Rollback chỉ lùi image API; schema DB chỉ đi theo hướng expand → contract (ADR-004).

## Nâng cấp / Rollback
Xem [docs/deployment.md](deployment.md).
