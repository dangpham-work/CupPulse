# BrewLite – Sơ đồ mô hình hóa

Mỗi sơ đồ có **tệp nguồn PlantUML (`.puml`)** và **ảnh kết xuất (`.svg`)**. Mã sơ đồ (`Activity-01`, `Sequence-01`…) được dùng trong [ma trận truy vết](../traceability-matrix.md).

| Mã | Task | Sơ đồ | Nguồn | Ảnh |
|---|---|---|---|---|
| UseCase-01 | 1.2 | Use-case tổng quát | [usecase-overview.puml](usecase-overview.puml) | [svg](usecase-overview.svg) |
| UseCase-02 | 1.3 | Use-case phạm vi UC-01 | [usecase-checkout.puml](usecase-checkout.puml) | [svg](usecase-checkout.svg) |
| **Activity-01** | **2.1** | Luồng end-to-end: Xem menu → Theo dõi đơn (có swimlane) | [activity-order-e2e.puml](activity-order-e2e.puml) | [svg](activity-order-e2e.svg) |
| **Sequence-01** | **2.2** | UC-01 Đặt và thanh toán đơn hàng | [sequence-checkout.puml](sequence-checkout.puml) | [svg](sequence-checkout.svg) |
| **Class-01** | **2.3** | Mô hình domain | [class-domain.puml](class-domain.puml) | [svg](class-domain.svg) |
| State-01 | 2 (bổ trợ) | Vòng đời Order và Payment | [state-order-payment.puml](state-order-payment.puml) | [svg](state-order-payment.svg) |

## Xuất lại ảnh

Cần Java và PlantUML (`plantuml.jar`, bản 1.2026.9 trở lên):

```bash
java -jar plantuml.jar -charset UTF-8 -tsvg docs/diagrams/*.puml
```

Bản PNG cho báo cáo LaTeX:

```bash
java -jar plantuml.jar -charset UTF-8 -Sdpi=200 -tpng -o ../report/figures docs/diagrams/*.puml
```

---

## Activity-01 – đối chiếu yêu cầu đề bài (Task 2.1)

| Yêu cầu của đề | Thể hiện trong sơ đồ |
|---|---|
| Điểm bắt đầu và kết thúc | 1 điểm bắt đầu; 2 điểm kết thúc hoạt động (đơn hoàn tất, đơn bị hủy sau 3 lần thất bại); 1 flow-final (dừng vì hết hàng, quay lại sửa giỏ) |
| Hành động của người dùng và hệ thống | Làn *Khách hàng*, *Nhân viên quầy* (người dùng); *Next.js UI*, *NestJS API*, *Payment Service* (hệ thống) |
| Decision / merge | Tải menu thành công?, Còn hàng?, Chọn thêm món?, Đã đăng nhập?, Đủ tồn kho?, Kết quả thanh toán (switch 3 nhánh), Đã thất bại 3 lần?, Cần gửi lại?, Đơn đã thanh toán? |
| Swimlane | 5 làn |
| Hết hàng | 2 chỗ: ở màn chi tiết (FR-01 AC-01.4, không cho thêm vào giỏ) và khi tạo đơn (BR-07, 409 `OUT_OF_STOCK`) |
| Chưa đăng nhập | Chuyển `/login?returnUrl=/checkout`, giữ giỏ (A1, AC-04.1) |
| Thanh toán thất bại | FAILED → thử lại bằng key mới; lần thứ 3 → hủy đơn, hoàn kho (A4, E6, BR-09); timeout → gửi lại cùng key (A5) |

## Sequence-01 – đối chiếu yêu cầu đề bài (Task 2.2)

| Yêu cầu của đề | Bước trong sơ đồ |
|---|---|
| Lifeline Customer → Next.js UI → NestJS API → Database → Payment Service | Đủ 5 lifeline, đúng thứ tự |
| Request/response và thứ tự gọi API | `POST /orders` (bước 2–22) → `POST /payments` (bước 26 trở đi) → `GET /orders/:id` (giai đoạn 3) |
| Kiểm tra JWT và validate dữ liệu | `JwtAuthGuard` (bước 3, nhánh 401), `ValidationPipe` (bước 6, nhánh 400); validate lại ở `POST /payments` |
| Transaction tạo đơn và cập nhật tồn kho | Khối *Transaction – tạo đơn và cập nhật tồn kho*: `UPDATE … WHERE stock >= :qty`, nhánh `ROLLBACK` + 409 |
| Nhánh `alt` thành công / thất bại | `alt` *Thanh toán thành công* / *thất bại* / *timeout* |
| Idempotency khi client gửi lại | `alt` *Đã có bản ghi K1*: trả response cũ, 409 đang xử lý, 422 khác body, gọi lại cổng cùng khóa sau timeout |
| Thông báo kết quả cuối cùng | Bước "Thanh toán thành công" / lý do thất bại; giai đoạn 3 hiển thị dòng thời gian trạng thái |

## Class-01 – đối chiếu yêu cầu đề bài (Task 2.3)

| Yêu cầu của đề | Thể hiện |
|---|---|
| Lớp tối thiểu: User, Product, Order, OrderItem, Payment, Promotion, LoyaltyTransaction | Đủ 7 lớp |
| Lớp bổ trợ để khớp SRS | Category, ProductSize (BR-01), Topping (BR-01, BR-03), OrderItemTopping (snapshot BR-06), OrderStatusHistory (AC-12.4), IdempotencyRecord (BR-11, FR-06) |
| Thuộc tính chính | Có kiểu và ràng buộc (`{unique}`, `{>= 0}`, `{1..10}`, `<<snapshot>>`) |
| Quan hệ và multiplicity | 16 quan hệ có multiplicity hai đầu; composition cho Order–OrderItem, Product–ProductSize, OrderItem–OrderItemTopping, Order–OrderStatusHistory |
| Enum trạng thái | `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `PromotionType`, `LoyaltyType`, `Role`, `SizeCode`, `IdempotencyStatus` |

## Kiểm tra nhất quán giữa các sơ đồ và SRS

Tiêu chí nghiệm thu Task 2: *ba loại sơ đồ không mâu thuẫn với SRS, use-case hoặc mô hình dữ liệu.*

| Khái niệm | SRS / Use-case | Activity-01 | Sequence-01 | Class-01 / State-01 |
|---|---|---|---|---|
| Trạng thái đơn | BR-12: `PENDING_PAYMENT → PAID → PREPARING → READY → COMPLETED`, `→ CANCELLED` | Đúng thứ tự, nhân viên đổi trạng thái | `PENDING_PAYMENT` khi tạo, `PAID` khi thanh toán xong, `CANCELLED` sau 3 lần | `OrderStatus` có đúng 6 giá trị; State-01 đúng 7 chuyển trạng thái |
| Trạng thái thanh toán | `PENDING`, `SUCCEEDED`, `FAILED` (AC-05.4 → 05.7) | 3 nhánh switch | 3 nhánh `alt` | `PaymentStatus` 3 giá trị |
| Trừ kho | BR-07: trong transaction tạo đơn | "Mở transaction: kiểm tra và trừ tồn kho" | Khối Transaction, `UPDATE … stock >= qty` | `Product.stock {>= 0}` |
| Giữ kho, hết hạn | BR-08: 15 phút | "giữ kho 15 phút" | `expires_at = now + 15'` | `Order.expiresAt`, State-01 |
| Thất bại tối đa 3 lần | BR-09 | "Đã thất bại 3 lần?" | `opt failed_payment_count = 3` | `Order.failedPaymentCount {<= 3}` |
| 1 payment thành công / đơn | BR-10 | — | `ORDER_ALREADY_PAID` | Ghi chú trên `Payment` |
| Idempotency | BR-11, FR-06 | "Sinh / dùng lại Idempotency-Key" | `alt` đã có bản ghi K1 | `IdempotencyRecord`, `UNIQUE(userId, key)` |
| Khuyến mãi | BR-13, FR-14 | Nhập mã ở bước thanh toán | `used_count + 1` khi PAID | `Promotion.usedCount`, `Promotion 0..1 — 0..* Order` |
| Tích điểm | BR-14, FR-15 | "cộng điểm" khi PAID | `INSERT loyalty_transactions (EARN…)` | `LoyaltyTransaction`, `UNIQUE(orderId, type)` |
| Snapshot giá | BR-06 | — | `order_items (snapshot giá)` | `<<snapshot>>` trên OrderItem, OrderItemTopping |
| Không lưu số thẻ | BR-18 | — | `card_last4` | `Payment.cardLast4`, không có trường số thẻ / CVV |
| Đăng nhập bắt buộc | A6, AC-04.1 | Nhánh "chưa đăng nhập" | Nhánh 401 | `User.role` |
