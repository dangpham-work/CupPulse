# Tài liệu BrewLite

Mọi tạo phẩm của đồ án nằm trong thư mục này và được quản lý phiên bản bằng git. Thay đổi yêu cầu, sơ đồ hoặc kiến trúc phải đi qua pull request và ghi lý do (xem [CONTRIBUTING.md](../CONTRIBUTING.md) mục 2).

## Mục lục

| Task | Tạo phẩm | Tệp |
|---|---|---|
| 1 | Bối cảnh, stakeholder, phạm vi, giả định, ràng buộc, rủi ro | [requirements/context-and-scope.md](requirements/context-and-scope.md) |
| 1 | SRS rút gọn (FR, NFR, MoSCoW, tiêu chí chấp nhận, user story, API) | [requirements/srs.md](requirements/srs.md) |
| 1 | Đặc tả use-case UC-01 Đặt và thanh toán đơn | [requirements/use-case-checkout.md](requirements/use-case-checkout.md) |
| 1 | Use-case diagram tổng quát và UC-01 | [diagrams/usecase-overview.svg](diagrams/usecase-overview.svg), [diagrams/usecase-checkout.svg](diagrams/usecase-checkout.svg) |
| 2 | Activity, sequence, class, state diagram | [diagrams/](diagrams/README.md) |
| 3 | Mô tả kiến trúc (C4, phân lớp) | [architecture/architecture.md](architecture/architecture.md) |
| 3 | Quyết định kiến trúc ADR-001 → ADR-009 | [architecture/adr/](architecture/adr/README.md) |
| 3 | Deployment diagram và truy vết node → mã nguồn | [architecture/deployment-view.md](architecture/deployment-view.md) |
| 1–5 | Ma trận truy vết | [traceability-matrix.md](traceability-matrix.md) |
| 4 | Product Backlog | [process/product-backlog.md](process/product-backlog.md) |
| 4 | Sprint 1: mục tiêu, kết quả, minh chứng CI | [process/sprint-1.md](process/sprint-1.md) |
| — | Báo cáo tổng hợp (LaTeX → PDF) | [report/main.pdf](report/main.pdf) |

## Lịch sử thay đổi tài liệu

| Ngày | Pull request | Thay đổi | Lý do |
|---|---|---|---|
| 01/11/2026 | [#1](https://github.com/dangpham-work/CupPulse/pull/1) | Task 1: bối cảnh, SRS, use-case | Khởi tạo yêu cầu |
| 01/11/2026 | [#2](https://github.com/dangpham-work/CupPulse/pull/2) | Task 2: activity, sequence, class, state diagram; ma trận truy vết v0.2 | Mô hình hóa từ SRS |
| 02/11/2026 | [#3](https://github.com/dangpham-work/CupPulse/pull/3) | Task 3: C4, 9 ADR, deployment diagram; ma trận truy vết v0.3 | Thiết kế kiến trúc trước khi hiện thực |
| 02/11/2026 | Task 4 (PR Sprint 1) | Thêm `process/`, mục lục này; ma trận truy vết v0.4 (cột Code/Test trỏ tới mã nguồn thật) | Sprint 1 hiện thực FR-01, FR-02 (API) |
