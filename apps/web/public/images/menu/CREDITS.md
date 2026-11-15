# Nguồn ảnh menu

Ảnh món (`*.webp` trong thư mục này) và ảnh banner `../hero.webp` được tạo bằng AI trong Figma
(`generate_image`, mô hình gpt-image-2.5-flare) ngày 15/11/2026, file Figma "Brew House – Ảnh menu".
Ảnh không chứa logo hay nhãn hiệu của bên thứ ba và chỉ minh họa món ăn, không phải ảnh chụp sản phẩm thật của quán.

Quy cách chung: ly nhựa trong có nắp vòm và ống hút giấy (bánh: đĩa sứ trắng), ánh sáng studio dịu,
nền trơn màu kem `#F6E7D8` trùng `--color-tint` của giao diện. Ảnh món 800×800 WebP; banner 1536×864 WebP.

| Món | Tệp |
|---|---|
| Cà phê sữa đá | `ca-phe-sua-da.webp` |
| Cà phê đen đá | `ca-phe-den-da.webp` |
| Bạc xỉu | `bac-xiu.webp` |
| Latte | `latte.webp` |
| Cold brew cam sả | `cold-brew-cam-sa.webp` |
| Trà đào cam sả | `tra-dao-cam-sa.webp` |
| Trà sữa trân châu | `tra-sua-tran-chau.webp` |
| Trà xanh matcha latte | `matcha-latte.webp` |
| Cà phê đá xay | `ca-phe-da-xay.webp` |
| Socola đá xay | `socola-da-xay.webp` |
| Bánh croissant bơ | `croissant-bo.webp` |
| Bánh tiramisu | `tiramisu.webp` |
| Trà vải (ngừng bán) | `tra-vai.webp` |

Muốn tạo thêm món mới cùng phong cách: dùng mô tả mẫu "Professional café menu product photo of …, served in a clear
plastic takeaway cup with a clear dome lid and a brown paper straw … plain seamless warm cream background color #F6E7D8 …
No text, no logo".

`coffee.svg`, `tea.svg`, `frappe.svg`, `cake.svg` là ảnh minh họa cũ, vẫn giữ vì dữ liệu test (`apps/api/test/fixtures.ts`) dùng tới.
