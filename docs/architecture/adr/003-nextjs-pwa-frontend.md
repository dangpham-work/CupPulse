# ADR-003: Frontend Next.js App Router + PWA (Serwist)

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** C1, NFR-02, NFR-09 → NFR-12, FR-01 → FR-03

## Bối cảnh

Next.js là bắt buộc. Khách dùng điện thoại nên cần tải nhanh (NFR-02), cài được lên màn hình chính và có trang offline (NFR-11). Giỏ hàng phải còn sau khi tải lại trang (AC-03.4).

## Quyết định

- **Next.js App Router**, TypeScript. Trang menu là Server Component, phần tương tác là Client Component.
- **TanStack Query** cho dữ liệu từ API (cache, retry, trạng thái loading/error).
- **Zustand** + `localStorage` cho giỏ hàng.
- **react-hook-form + zod** (schema từ `packages/shared`).
- **Tailwind CSS**, thiết kế mobile-first từ 360 px.
- **Serwist** cho PWA: manifest, precache tài nguyên tĩnh, cache menu kiểu *stale-while-revalidate*, **không cache** API đơn hàng, thanh toán, xác thực; trang offline dự phòng.

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Next.js Pages Router | Cũ hơn, không có Server Component |
| `next-pwa` | Ít được bảo trì; Serwist là bản kế nhiệm hỗ trợ App Router |
| Redux Toolkit | Nặng hơn cần thiết cho một giỏ hàng |
| SPA thuần (Vite + React) | Không thỏa ràng buộc Next.js; mất SSR |

## Hệ quả

- (+) Trang menu render phía server, tải nhanh, tốt cho Lighthouse.
- (+) Cài được như ứng dụng, có trang offline.
- (−) Service worker có thể giữ bản cũ: cần thông báo "có phiên bản mới" (FR-20 liên quan) hoặc `skipWaiting` có kiểm soát.
- (−) Không được cache dữ liệu đơn hàng/thanh toán, nếu không sẽ hiển thị trạng thái sai.
