# Architecture Decision Records (ADR)

Mỗi quyết định kiến trúc quan trọng được ghi thành một ADR ngắn theo mẫu: **Bối cảnh → Quyết định → Phương án đã cân nhắc → Hệ quả**. Muốn thay đổi một quyết định, tạo ADR mới đánh dấu "Thay thế ADR-xxx" và mở pull request ghi rõ lý do (ràng buộc C4).

| ADR | Tiêu đề | Trạng thái | Ngày |
|---|---|---|---|
| [001](001-monorepo.md) | Monorepo pnpm cho web, API và thư viện dùng chung | Chấp nhận | 2026-11-02 |
| [002](002-modular-monolith-nestjs.md) | Backend NestJS dạng modular monolith, phân lớp theo module | Chấp nhận | 2026-11-02 |
| [003](003-nextjs-pwa-frontend.md) | Frontend Next.js App Router + PWA (Serwist) | Chấp nhận | 2026-11-02 |
| [004](004-prisma-migrations.md) | PostgreSQL + Prisma, migration chạy khi container khởi động | Chấp nhận | 2026-11-02 |
| [005](005-payment-mock-service.md) | Payment Service mô phỏng chạy cùng API, ranh giới HTTP | Chấp nhận | 2026-11-02 |
| [006](006-jwt-authentication.md) | Xác thực JWT Bearer, hết hạn 60 phút | Chấp nhận | 2026-11-02 |
| [007](007-order-status-polling.md) | Cập nhật trạng thái đơn bằng polling 3 giây | Chấp nhận | 2026-11-02 |
| [008](008-logging-health-config.md) | Log JSON, health check, cấu hình kiểm tra khi khởi động | Chấp nhận | 2026-11-02 |
| [009](009-deployment-vercel-render.md) | Triển khai Vercel + Render + GHCR | Chấp nhận | 2026-11-02 |
