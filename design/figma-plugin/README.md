# Plugin dựng Figma BrewLite

Plugin này dựng file Figma của Brew House (BrewLite) khớp với giao diện thật trong `apps/web`: token, component có biến thể và màn hình MVP. Plugin chạy cục bộ bằng Figma Plugin API nên **không tốn lượt gọi Figma MCP** (gói Starter rất ít lượt).

## Plugin tạo gì

| Trang | Nội dung |
|---|---|
| `BrewLite · 0 Foundations` | Bìa; bảng màu (biến `BrewLite Tokens/color/*`); 22 text style `BrewLite/*` (font Be Vietnam Pro); khoảng cách `space/*`, bo góc `radius/*` |
| `BrewLite · 1 Components` | Button (Primary/Secondary/Tint/Disabled × Large/Medium), Chip, CartBadge, StatusBadge (6 trạng thái đơn), Alert, TextField (Default/Filled/Focus/Error), PaymentMethod, QtyStepper, Header (Mobile/Desktop × Guest/Signed in), ProductCard (In stock/Sold out, đổi ảnh bằng Instance swap), SizeOption, ToppingRow, CartLine, OrderLineItem, OrderCard, StaffTicket, ảnh món |
| `BrewLite · 2 Screens (MVP)` | 17 màn hình. Mỗi màn có nhãn FR/AC phía trên. Có prototype nối luồng menu → chi tiết → giỏ → xác nhận → thanh toán → theo dõi đơn → lịch sử |

Màu, cỡ chữ, khoảng cách và nội dung chữ lấy đúng từ `apps/web/src` (`globals.css`, các `*View.tsx`) và dữ liệu seed (`apps/api/prisma/seed.ts`).

Plugin chỉ ghi vào 3 trang có tiền tố `BrewLite ·`. Các trang khác, ví dụ trang "App Screens" cũ, giữ nguyên. Chạy lại sẽ xóa rồi dựng lại 3 trang đó; biến và text style được dùng lại, không bị nhân đôi.

## Cách chạy (Figma desktop)

1. Mở file Figma cần dựng bằng **ứng dụng Figma desktop**. Trình duyệt không import được plugin phát triển.
2. Menu **Plugins → Development → Import plugin from manifest…**, chọn `design/figma-plugin/manifest.json`.
3. **Plugins → Development → BrewLite – Dựng Figma từ code** để chạy. Khoảng 10–30 giây; khi xong, thanh dưới báo số layer đã dựng.
4. Mở trang `BrewLite · 2 Screens (MVP)`. Muốn xem prototype: chọn khung `01 — Thực đơn` → **Present**, rồi bấm thẻ "Cà phê sữa đá".

Nếu máy không có font Be Vietnam Pro, plugin tự dùng Inter và báo trong thông điệp kết thúc.

## Kiểm thử

```bash
node design/figma-plugin/test/mock-figma.test.mjs
```

Bài test chạy plugin hai lần trên Figma Plugin API giả lập. Nó kiểm tra các ràng buộc hay sai của API thật: `FILL`/`HUG` chỉ dùng trong auto-layout, font phải nạp trước khi gán chữ, màu trong khoảng 0–1, thuộc tính component không gắn vào node nằm trong instance, tên biến thể hợp lệ, SVG có `width`/`height`. Bài test cũng kiểm tra chạy lại không nhân đôi biến/style, đủ 17 màn hình và 6 liên kết prototype.
