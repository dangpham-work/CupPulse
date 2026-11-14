# BrewLite – Product Backlog

| Thuộc tính | Giá trị |
|---|---|
| Product Owner / Scrum Master / Developer | Phạm Duy Đăng (nhóm một người) |
| Nguồn | User story US-01 → US-13 và yêu cầu FR/NFR trong [SRS](../requirements/srs.md) |
| Công cụ theo dõi | GitHub Issues + milestone `Sprint 1`, `Sprint 2` (mỗi mục dưới đây là một issue, mã PB-xx ở đầu tiêu đề) |
| Ước lượng | Story point (Fibonacci 1, 2, 3, 5, 8) |

Thứ tự trong bảng là thứ tự ưu tiên. Mục **Must** làm trước; **Should** làm sau khi luồng chính chạy end-to-end; **Could** chỉ làm khi còn thời gian.

## Sprint 1 – Nền tảng và MVP xem menu

**Sprint Goal:** có repository, tài liệu có kiểm soát phiên bản, CI tự động trên pull request và MVP xem menu chạy được (API + màn hình + dữ liệu seed).

| Mã | Mục backlog | Yêu cầu | Ưu tiên | Điểm | Trạng thái |
|---|---|---|---|---|---|
| [PB-01](https://github.com/dangpham-work/CupPulse/issues/4) | Thiết lập monorepo `apps/web`, `apps/api`, `packages/shared`, README, `.gitignore`, `.env.example` | Task 4.1, ADR-001 | Must | 2 | Done |
| [PB-02](https://github.com/dangpham-work/CupPulse/issues/5) | Quy trình: chiến lược branch, PR template, quy ước commit, Definition of Done, Product Backlog | Task 4.1, 4.2 | Must | 1 | Done |
| [PB-03](https://github.com/dangpham-work/CupPulse/issues/6) | Schema Prisma catalog (Category, Product, ProductSize, Topping), migration đầu tiên, seed dữ liệu mẫu | FR-01, FR-02, NFR-15 | Must | 3 | Done |
| [PB-04](https://github.com/dangpham-work/CupPulse/issues/7) | API `GET /products` (lọc theo danh mục), `GET /products/:id`, định dạng lỗi chung, validate whitelist | FR-01, FR-02 (API), NFR-05 | Must | 3 | Done |
| [PB-05](https://github.com/dangpham-work/CupPulse/issues/8) | US-01 (phần xem menu): màn menu mobile-first có loading / empty / error, nhãn "Hết hàng", tab danh mục | FR-01, AC-01.3 → 01.5, NFR-09 | Must | 5 | Done |
| [PB-06](https://github.com/dangpham-work/CupPulse/issues/9) | `GET /health` kiểm tra DB | NFR-14 | Must | 1 | Done |
| [PB-07](https://github.com/dangpham-work/CupPulse/issues/10) | Test tối thiểu: unit + API test cho catalog, component test cho màn menu, integration test với PostgreSQL | Task 4.3 | Must | 3 | Done |
| [PB-08](https://github.com/dangpham-work/CupPulse/issues/11) | CI GitHub Actions: Install → Lint → Unit Test → Build, integration test; branch protection `main` | NFR-16, Task 4.4 | Must | 2 | Done (branch protection do chủ repo bật) |
| [PB-09](https://github.com/dangpham-work/CupPulse/issues/12) | Docker: Dockerfile web, API; `docker-compose.yml` chạy web + API + DB | NFR-15 | Must | 2 | Done |

Tổng Sprint 1: 22 điểm.

## Sprint 2 – Hoàn thiện MVP, CI/CD và Delivery

**Sprint Goal (dự kiến):** hoàn thành luồng end-to-end menu → đặt đơn → thanh toán → theo dõi đơn, tự động đóng gói và triển khai production.

| Mã | Mục backlog | Yêu cầu | Ưu tiên | Điểm |
|---|---|---|---|---|
| [PB-10](https://github.com/dangpham-work/CupPulse/issues/13) | US-02: màn chi tiết sản phẩm, chọn size/topping, giá cập nhật ngay | FR-02, BR-01 → BR-03 | Must | 5 |
| [PB-11](https://github.com/dangpham-work/CupPulse/issues/14) | US-03: giỏ hàng (thêm/sửa/xóa, tổng tiền, lưu localStorage) | FR-03, BR-04 | Must | 5 |
| [PB-12](https://github.com/dangpham-work/CupPulse/issues/15) | US-04: đăng ký, đăng nhập, JWT, phân quyền theo vai trò | FR-09 → FR-11, NFR-04 | Must | 5 |
| [PB-13](https://github.com/dangpham-work/CupPulse/issues/16) | US-05: tạo đơn trong transaction, trừ kho, giữ kho 15 phút | FR-04, NFR-13, BR-07 | Must | 8 |
| [PB-14](https://github.com/dangpham-work/CupPulse/issues/17) | US-05: thanh toán Ví/Thẻ mô phỏng, idempotency, tối đa 3 lần thất bại | FR-05, FR-06, BR-10, BR-11 | Must | 8 |
| [PB-15](https://github.com/dangpham-work/CupPulse/issues/18) | US-06, US-07: xác nhận đơn, trạng thái (polling 3 s), lịch sử đơn | FR-07, FR-08, ADR-007 | Must | 5 |
| [PB-16](https://github.com/dangpham-work/CupPulse/issues/19) | US-10: màn nhân viên quầy đổi trạng thái đơn | FR-12 | Must | 3 |
| [PB-17](https://github.com/dangpham-work/CupPulse/issues/20) | Kiểm thử: integration test tạo đơn/thanh toán, E2E Playwright menu → xác nhận đơn | Task 5.2 | Must | 5 |
| [PB-18](https://github.com/dangpham-work/CupPulse/issues/21) | CD: build image tag SHA → GHCR → deploy Render + Vercel → migrate → smoke test, rollback | NFR-17, ADR-009 | Must | 5 |
| [PB-19](https://github.com/dangpham-work/CupPulse/issues/22) | Triển khai production, `docs/deployment.md`, release v1.0.0, Sprint Review/Retrospective, video demo | Task 5.4 | Must | 3 |
| [PB-20](https://github.com/dangpham-work/CupPulse/issues/23) | US-01: tìm kiếm không dấu `?q=` | FR-17 | Should | 2 |
| [PB-21](https://github.com/dangpham-work/CupPulse/issues/24) | US-08: mã khuyến mãi | FR-14 | Should | 3 |
| [PB-22](https://github.com/dangpham-work/CupPulse/issues/25) | US-09: tích điểm loyalty | FR-15 | Should | 3 |
| [PB-23](https://github.com/dangpham-work/CupPulse/issues/26) | US-12: hủy đơn chưa thanh toán, tự hủy khi hết hạn giữ kho | FR-13 | Should | 3 |
| [PB-24](https://github.com/dangpham-work/CupPulse/issues/27) | US-11: quản lý sản phẩm, giá, tồn kho | FR-16 | Should | 3 |
| [PB-25](https://github.com/dangpham-work/CupPulse/issues/28) | PWA service worker (Serwist), trang offline | NFR-11, ADR-003 | Must | 2 |
| [PB-26](https://github.com/dangpham-work/CupPulse/issues/29) | US-09 (Could): đổi điểm; US-13: báo cáo doanh thu ngày; Web Push | FR-18 → FR-20 | Could | — |
