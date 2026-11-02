# ADR-006: Xác thực JWT Bearer, hết hạn 60 phút

- **Trạng thái:** Chấp nhận
- **Ngày:** 2026-11-02
- **Liên quan:** FR-09 → FR-11, NFR-03, NFR-04, NFR-08, AC-10.1 → AC-10.5

## Bối cảnh

Đề yêu cầu đăng ký, đăng nhập và JWT. Frontend (Vercel) và API (Render) **khác domain**, nên cookie phải dùng `SameSite=None` kèm cấu hình CORS credentials, và dễ bị trình duyệt chặn cookie bên thứ ba.

## Quyết định

- `POST /auth/login` trả **access token JWT** ký **HS256** (`JWT_SECRET` ≥ 32 byte), hết hạn **60 phút**, claim `sub`, `role`.
- Client gửi token qua header `Authorization: Bearer`. Token được giữ trong bộ nhớ và `localStorage` để còn sau khi tải lại trang.
- Mật khẩu hash **bcrypt cost 12**. Đăng nhập giới hạn 5 lần/phút/IP.
- `JwtAuthGuard` + `RolesGuard` kiểm tra mọi endpoint cần quyền ở server.
- Chưa có refresh token: hết hạn thì đăng nhập lại, giỏ hàng vẫn giữ (AC-10.5).

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| JWT trong cookie `httpOnly` | An toàn hơn trước XSS, nhưng khác domain cần `SameSite=None` và cookie bên thứ ba bị chặn trên Safari; để cải tiến sau (proxy `/api` qua Vercel rồi dùng cookie `SameSite=Lax`) |
| Access + refresh token xoay vòng | Phức tạp hơn, không bắt buộc trong đề |
| Session phía server | Cần store chung; không hợp với API stateless |

## Hệ quả

- (+) Đơn giản, không phụ thuộc cookie, hợp CORS khác domain.
- (−) Token trong `localStorage` có thể bị đánh cắp nếu có lỗ XSS. Giảm thiểu: React tự escape, không dùng `dangerouslySetInnerHTML`, có Content-Security-Policy, token sống ngắn (60 phút).
- (−) Không thu hồi token trước hạn được: đăng xuất chỉ xóa phía client.
