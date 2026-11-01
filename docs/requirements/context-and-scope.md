# BrewLite – Bối cảnh, Stakeholder và Phạm vi (Task 1.1)

| Thuộc tính | Giá trị |
|---|---|
| Dự án | BrewLite (repo: CupPulse) – Hệ thống đặt cà phê mobile-first/PWA và thanh toán mô phỏng |
| Tài liệu | `docs/requirements/context-and-scope.md` |
| Phiên bản | 1.0 |
| Ngày | 2026-11-01 |
| Trạng thái | Bản nháp – chờ nhóm duyệt |
| Tài liệu liên quan | [SRS](srs.md) · [Đặc tả UC-01](use-case-checkout.md) |

---

## 1. Bối cảnh và vấn đề nghiệp vụ

BrewLite là một quán cà phê mang đi quy mô nhỏ (một cửa hàng, 2–4 nhân viên quầy). Hiện quán bán theo cách truyền thống: khách xếp hàng, gọi món bằng lời, nhân viên ghi tay và thu tiền tại quầy. Giờ cao điểm (7:00–9:00 và 11:30–13:00) xảy ra các vấn đề sau:

| # | Vấn đề hiện tại | Hậu quả |
|---|---|---|
| P1 | Khách phải xếp hàng để gọi món và trả tiền | Thời gian chờ dài, khách bỏ về, mất doanh thu |
| P2 | Gọi món bằng lời, ghi tay | Sai món, sai size/topping, sai tiền |
| P3 | Không biết món nào sắp hết | Nhận đơn rồi mới báo hết, khách phàn nàn |
| P4 | Khách không biết đơn đã xong chưa | Khách đứng chờ quanh quầy, nhân viên bị hỏi liên tục |
| P5 | Không lưu lịch sử mua hàng | Không chạy được khuyến mãi hay tích điểm để giữ chân khách |
| P6 | Doanh thu và đơn hàng ghi tay | Quản lý khó đối soát và thống kê |

**Mục tiêu của BrewLite:** cho khách tự xem menu, chọn tùy chọn, đặt và thanh toán trên điện thoại (PWA, không cần cài app từ store), rồi theo dõi trạng thái đơn. Nhân viên nhận đơn đã thanh toán và cập nhật trạng thái. Quản lý kiểm soát sản phẩm, tồn kho và khuyến mãi.

Luồng nghiệp vụ tối thiểu (theo đề bài):

```
Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn
```

### 1.1 Mục tiêu đo được

| Mã | Mục tiêu | Chỉ số | Ngưỡng đạt |
|---|---|---|---|
| G1 | Giảm thời gian gọi món | Thời gian từ mở app đến thanh toán xong (người dùng mới) | ≤ 3 phút |
| G2 | Đơn chính xác | Tỷ lệ đơn sai size/topping so với lựa chọn của khách | 0% (dữ liệu đi thẳng từ khách) |
| G3 | Không bán hàng đã hết | Số đơn được tạo khi món đã hết tồn kho | 0 |
| G4 | Khách biết trạng thái đơn | Thời gian trạng thái mới hiển thị cho khách | ≤ 5 giây |
| G5 | Hệ thống truy cập được để nghiệm thu | URL production HTTPS hoạt động lúc chấm | 100% |

---

## 2. Stakeholder

### 2.1 Bảng stakeholder

| Mã | Stakeholder | Vai trò | Mục tiêu | Kỳ vọng với hệ thống | Mức ảnh hưởng | Mức quan tâm |
|---|---|---|---|---|---|---|
| SH-01 | **Khách hàng** | Người dùng cuối, đặt và trả tiền | Mua đồ uống nhanh, đúng món, không xếp hàng | Menu rõ giá; chọn size/topping dễ; thanh toán Ví/Thẻ nhanh; biết lúc nào đơn xong; xem lại đơn cũ; được khuyến mãi và tích điểm | Trung bình | Cao |
| SH-02 | **Nhân viên quầy** | Nhận và chế biến đơn, cập nhật trạng thái | Làm đúng món, ít bị hỏi, thao tác nhanh giờ cao điểm | Chỉ thấy đơn **đã thanh toán**; chi tiết đơn rõ (size, topping, ghi chú); đổi trạng thái 1 chạm | Trung bình | Cao |
| SH-03 | **Quản lý cửa hàng** | Chủ nghiệp vụ, quản lý menu, kho, khuyến mãi | Tăng doanh thu, kiểm soát tồn kho, giữ chân khách | Sửa sản phẩm, giá, tồn kho; tạo mã khuyến mãi; xem doanh thu cơ bản; không bán món đã hết | Cao | Cao |
| SH-04 | **Giảng viên / khách hàng nghiệm thu** | Đánh giá và nghiệm thu sản phẩm | Kiểm chứng nhóm đi đúng quy trình từ yêu cầu đến triển khai | Tạo phẩm đủ, đúng đường dẫn, truy vết được; CI/CD chạy; URL production hoạt động; clone về chạy được theo README | Rất cao | Cao |
| SH-05 | **Nhóm phát triển** | Phân tích, thiết kế, lập trình, kiểm thử, triển khai | Hoàn thành đúng hạn, đạt điểm tối đa, học quy trình chuẩn | Yêu cầu rõ ràng và ổn định; stack bắt buộc (Next.js, NestJS, PostgreSQL); hạ tầng miễn phí | Cao | Cao |
| SH-06 | **Đơn vị thanh toán** (mô phỏng) | Hệ thống bên ngoài xử lý giao dịch Ví/Thẻ | Giao dịch hợp lệ, không trừ tiền trùng | API rõ ràng; mỗi giao dịch có idempotency key; trả kết quả thành công/thất bại kèm mã lỗi; không nhận dữ liệu thẻ thừa | Trung bình | Trung bình |

### 2.2 Ma trận quyền lực – quan tâm

| | **Quan tâm thấp** | **Quan tâm cao** |
|---|---|---|
| **Ảnh hưởng cao** | — | SH-03 Quản lý cửa hàng, SH-04 Giảng viên, SH-05 Nhóm phát triển → *quản lý chặt, duyệt mọi thay đổi phạm vi* |
| **Ảnh hưởng thấp/TB** | SH-06 Đơn vị thanh toán → *theo dõi, tuân thủ hợp đồng API* | SH-01 Khách hàng, SH-02 Nhân viên quầy → *cập nhật thường xuyên, thử nghiệm khả dụng* |

---

## 3. Phạm vi

Mức ưu tiên dùng MoSCoW và khớp với mã yêu cầu trong [SRS](srs.md).

### 3.1 In-scope – MVP (Must)

| # | Hạng mục | Yêu cầu |
|---|---|---|
| S1 | Xem menu theo danh mục, có trạng thái loading/empty/error | FR-01 |
| S2 | Chi tiết sản phẩm: chọn size và topping, giá cập nhật theo lựa chọn | FR-02 |
| S3 | Giỏ hàng và tính tổng tiền | FR-03 |
| S4 | Đặt đơn: kiểm tra và trừ tồn kho trong một transaction | FR-04 |
| S5 | Thanh toán Ví/Thẻ qua dịch vụ thanh toán mô phỏng | FR-05 |
| S6 | Idempotency khi client gửi lại yêu cầu thanh toán | FR-06 |
| S7 | Xác nhận và theo dõi trạng thái đơn | FR-07 |
| S8 | Lịch sử đơn của khách | FR-08 |
| S9 | Đăng ký, đăng nhập/đăng xuất bằng JWT | FR-09, FR-10 |
| S10 | Phân quyền theo vai trò Khách hàng / Nhân viên / Quản lý | FR-11 |
| S11 | Nhân viên cập nhật trạng thái đơn | FR-12 |
| S12 | PWA mobile-first, health check, Docker Compose, CI/CD, production HTTPS | NFR-09, NFR-11, NFR-14 → NFR-17 |

### 3.2 Phạm vi mở rộng (Should / Could)

| # | Hạng mục | Ưu tiên | Yêu cầu |
|---|---|---|---|
| E1 | Hủy đơn chưa thanh toán, tự hủy đơn quá hạn 15 phút, hoàn lại tồn kho | Should | FR-13 |
| E2 | Áp mã khuyến mãi (Promotion) | Should | FR-14 |
| E3 | Tích điểm thành viên (LoyaltyTransaction) | Should | FR-15 |
| E4 | Quản lý sản phẩm và tồn kho cho Quản lý | Should | FR-16 |
| E5 | Tìm kiếm, lọc menu | Should | FR-17 |
| E6 | Dùng điểm để giảm giá | Could | FR-18 |
| E7 | Báo cáo doanh thu theo ngày | Could | FR-19 |
| E8 | Thông báo đẩy (Web Push) khi đơn sẵn sàng | Could | FR-20 |

### 3.3 Out-of-scope – không thực hiện (Won't)

| # | Nội dung | Lý do |
|---|---|---|
| O1 | Tích hợp cổng thanh toán thật (VNPay, MoMo, Stripe…) | Đề bài yêu cầu mô phỏng; cần hợp đồng pháp lý và tài khoản merchant (FR-21) |
| O2 | Giao hàng tận nơi, theo dõi shipper | Ngoài nghiệp vụ quán mang đi (FR-22) |
| O3 | Nhiều chi nhánh | Quán chỉ có một cửa hàng (FR-23) |
| O4 | Đăng nhập Google/Facebook | Không cần cho MVP, tăng rủi ro cấu hình OAuth (FR-24) |
| O5 | Ứng dụng native iOS/Android | Đã có PWA thay thế |
| O6 | Quản lý nguyên liệu (định lượng sữa, hạt cà phê…) | Tồn kho chỉ tính theo số ly bán được của từng sản phẩm |
| O7 | Hoàn tiền tự động | Đơn chỉ hủy được khi chưa thanh toán |
| O8 | Hạ tầng đa vùng, tính sẵn sàng cao | Vượt nguồn lực của đồ án (NFR-20) |

---

## 4. Giả định

| Mã | Giả định |
|---|---|
| A1 | Quán có một cửa hàng; mọi đơn là **mang đi hoặc dùng tại quán**, khách tự đến quầy nhận. |
| A2 | Khách có smartphone, trình duyệt hiện đại (Chrome Android, Safari iOS) và có Internet khi đặt đơn. |
| A3 | Tiền tệ là VND, số nguyên, giá đã gồm VAT. |
| A4 | **Tồn kho tính theo sản phẩm** (số ly còn bán được trong ngày). Size và topping không có tồn kho riêng. |
| A5 | Đơn vị thanh toán là **dịch vụ mô phỏng** trả kết quả theo bộ dữ liệu test cố định (ví dụ thẻ `4242…` thành công, `4000…0002` bị từ chối). Không có tiền thật. |
| A6 | Khách **phải đăng nhập** mới đặt đơn được. Khách vãng lai chỉ xem menu, chi tiết sản phẩm và giỏ hàng. |
| A7 | Tài khoản Nhân viên và Quản lý được tạo sẵn bằng seed hoặc do Quản lý tạo. Không có đăng ký công khai cho các vai trò này. |
| A8 | Đơn chưa thanh toán giữ tồn kho tối đa **15 phút**, sau đó tự hủy và trả lại tồn kho. |
| A9 | Nhóm dùng gói miễn phí của các nền tảng cloud. Cold start vài giây ở lần gọi đầu là chấp nhận được. |

## 5. Ràng buộc

| Mã | Loại | Ràng buộc |
|---|---|---|
| C1 | Công nghệ | **Bắt buộc** Next.js (mobile-first/PWA), NestJS và PostgreSQL. Được bổ sung nhưng không được thay thế. |
| C2 | Công nghệ | Đóng gói bằng Docker. `docker-compose.yml` chạy web, API và DB ở local. |
| C3 | Quy trình | 5 task làm **tuần tự**. Tạo phẩm mỗi task phải có trên repo với lịch sử commit/PR rõ ràng trước khi sang task sau. |
| C4 | Quy trình | Mọi thay đổi yêu cầu, sơ đồ hoặc kiến trúc phải đi qua commit/PR và ghi lý do. |
| C5 | Quy trình | PR không được merge nếu lint, test hoặc build thất bại. |
| C6 | Cấu trúc | Repo theo cấu trúc `apps/web`, `apps/api`, `docs/…`, `tests/`, `.github/workflows/`. |
| C7 | Triển khai | Production phải có HTTPS. Database **không public**. Secret không nằm trong repo hay log CI. |
| C8 | Thời gian | Hai Sprint trong học kỳ I 2026–2027. Production phải hoạt động lúc chấm. |
| C9 | Chi phí | 0 đồng: chỉ dùng gói miễn phí (GitHub, GHCR, Vercel/Render/Neon hoặc tương đương). |
| C10 | Pháp lý | Không lưu số thẻ đầy đủ hay CVV, kể cả dữ liệu mô phỏng. Chỉ lưu 4 số cuối. |

## 6. Rủi ro ban đầu

Thang đo: Xác suất (X) và Tác động (T) từ 1 (thấp) đến 3 (cao). Điểm = X × T.

| Mã | Rủi ro | X | T | Điểm | Biện pháp giảm thiểu | Người theo dõi |
|---|---|---|---|---|---|---|
| R1 | Nền tảng miễn phí hết hạn hoặc ngủ đúng lúc chấm (ví dụ Render Postgres free hết hạn sau 30 ngày) | 2 | 3 | **6** | Dùng Postgres không hết hạn (Neon); smoke test định kỳ; ghi sẵn quy trình redeploy và rollback | DevOps |
| R2 | Bán vượt tồn kho khi nhiều khách đặt cùng lúc | 2 | 3 | **6** | Trừ kho bằng câu lệnh có điều kiện `stock >= qty` trong transaction; test đồng thời (NFR-17) | Backend |
| R3 | Trừ tiền hai lần khi khách bấm lại hoặc mạng chập chờn | 2 | 3 | **6** | Idempotency key cho mỗi yêu cầu thanh toán; mỗi đơn chỉ có tối đa 1 payment thành công (FR-06) | Backend |
| R4 | Phạm vi phình to (loyalty, báo cáo…) làm trễ luồng chính | 3 | 2 | **6** | Ưu tiên MoSCoW; làm Must trước; Should/Could chỉ làm khi luồng end-to-end đã chạy | PO / nhóm |
| R5 | Thành viên chưa quen NestJS, Docker hoặc CI/CD | 2 | 2 | 4 | Dựng khung và CI từ Sprint 1; pair programming; tài liệu README | Nhóm |
| R6 | Lộ secret (JWT secret, DB URL) lên GitHub | 1 | 3 | 3 | `.env` trong `.gitignore`; chỉ commit `.env.example`; secret để ở GitHub Secrets/nền tảng; quét secret trong CI | DevOps |
| R7 | Tài liệu và code lệch nhau giữa các task | 2 | 2 | 4 | Ma trận truy vết; mọi thay đổi yêu cầu đều qua PR | BA |
| R8 | Cold start làm smoke test hoặc demo chậm | 2 | 1 | 2 | Smoke test có retry và timeout hợp lý; gọi "đánh thức" trước buổi demo | DevOps |

---

## 7. Thuật ngữ

| Thuật ngữ | Giải thích |
|---|---|
| MVP | Phiên bản nhỏ nhất chạy được với tính năng cốt lõi để kiểm chứng giả thuyết |
| PWA | Progressive Web App: web app cài được lên màn hình chính, chạy toàn màn hình, có service worker |
| JWT | JSON Web Token dùng để xác thực các request tới API |
| Idempotency key | Khóa duy nhất do client tạo cho mỗi yêu cầu thanh toán. Gửi lại cùng khóa thì nhận lại cùng kết quả, không tạo giao dịch mới |
| Tồn kho (stock) | Số ly còn bán được của một sản phẩm |
| Promotion | Mã khuyến mãi giảm theo % hoặc số tiền cố định |
| LoyaltyTransaction | Bản ghi cộng/trừ điểm thành viên |
| MoSCoW | Mức ưu tiên Must / Should / Could / Won't |
