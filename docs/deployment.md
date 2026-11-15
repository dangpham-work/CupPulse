# Triển khai production và rollback

| Thuộc tính | Giá trị |
|---|---|
| Phạm vi | Task 5.3 (CD) và Task 5.4 (triển khai, bàn giao) |
| Quyết định liên quan | [ADR-009](architecture/adr/009-deployment-vercel-render.md), [ADR-004](architecture/adr/004-prisma-migrations.md), [deployment-view](architecture/deployment-view.md) |
| Workflow | [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) (CI cho pull request: [`ci.yml`](../.github/workflows/ci.yml)) |

## 1. URL production

| Thành phần | URL |
|---|---|
| Web (HTTPS, Vercel) | `<điền sau khi tạo>` |
| API (HTTPS, Render) | `<điền sau khi tạo>` |
| Health check | `<API>/health` |
| Danh sách món (smoke test) | `<API>/api/v1/products` |
| Container image | `ghcr.io/<chủ repo, chữ thường>/brewlite-api:<commit sha>` |
| Release | `<điền sau khi tạo tag v1.0.0>` |

Tài khoản demo (do `prisma db seed` tạo): `khach@brewlite.test` (khách), `nhanvien@brewlite.test` (nhân viên), `quanly@brewlite.test` (quản lý). Mật khẩu lấy từ biến `SEED_DEMO_PASSWORD` (mặc định `Brewlite123`, **nên đổi** trên production).

## 2. Kiến trúc production

```text
Developer ── push main / tag v* ──▶ GitHub Actions (cd.yml)
                                      │  Lint → Test → Build
                                      │  docker build → push GHCR  (tag :<sha>, :vX.Y.Z)
                                      │
                                      ├── POST deploy hook (imgURL=ghcr.io/…:<sha>) ──▶ Render Web Service (API)
                                      │                                                   │  entrypoint: prisma migrate deploy
                                      │                                                   │  → node dist/main.js
                                      │                                                   └─ nội bộ ─▶ Render PostgreSQL (external access: TẮT)
                                      ├── vercel pull/build/deploy --prebuilt --prod ──▶ Vercel (Next.js web, HTTPS + CDN)
                                      └── Smoke test: /health, /api/v1/products, trang web ── lỗi ──▶ Rollback
Người dùng ── HTTPS ──▶ Vercel (web) ── HTTPS ──▶ Render (API)
```

- Database **không có địa chỉ public**: chỉ API trong cùng region Render dùng *Internal Database URL*. Vì vậy runner GitHub không kết nối được DB; migration chạy trong container API (mục 5).
- Mọi secret nằm ở GitHub Secrets, Render Environment hoặc Vercel Environment. Không có secret trong repository hay log CI.

## 3. Thiết lập một lần (việc của chủ repo)

### 3.1 Render PostgreSQL

1. Render Dashboard → **New → PostgreSQL**. Tên `brewlite-db`, Region **Singapore**, phiên bản **16**.
2. Trong mục **Access Control** của database, **xóa mọi nguồn ngoài** (để trống danh sách IP) nhằm tắt external access.
3. Sao chép **Internal Database URL** (dạng `postgresql://…@dpg-xxxx-a/brewlite`) để dùng ở bước 3.2. Không dùng *External Database URL*.

### 3.2 Render Web Service (API)

1. Đưa image đầu tiên lên GHCR: merge vào `main` để `cd.yml` build, hoặc chạy workflow *CD* bằng **Run workflow** với `skip_deploy = true`. Kiểm tra gói `brewlite-api` ở trang Packages của GitHub.
2. Cho Render kéo được image:
   - Cách đơn giản: đổi gói `brewlite-api` thành **Public** (Package settings → Danger Zone → Change visibility). Image không chứa secret.
   - Hoặc để Private, rồi ở Render → **Account Settings → Registry Credentials** thêm `ghcr.io`, username GitHub, mật khẩu là PAT (classic) chỉ có quyền `read:packages`.
3. Render → **New → Web Service → Existing Image**. Image URL `ghcr.io/<chủ repo, chữ thường>/brewlite-api:<sha của lần build đầu>`. Tên `brewlite-api`, Region **Singapore** (cùng DB), Instance Type Free.
4. Mục **Advanced**: Health Check Path `/health`; **Auto-Deploy: No** (deploy do `cd.yml` điều khiển qua hook).
5. Thêm biến môi trường theo mục 4.
6. Vào **Settings → Deploy Hook**, sao chép URL (dạng `https://api.render.com/deploy/srv-xxxx?key=yyyy`) để dùng ở mục 3.4. Coi URL này là secret.
7. Ghi lại **Service ID** (`srv-xxxx`, nằm trong URL của service) nếu muốn bật chờ deploy chính xác (mục 3.4).

### 3.3 Vercel (web)

1. Vercel → **Add New → Project** → import repository. **Root Directory**: `apps/web`; Framework: Next.js. Bật *Include source files outside of the Root Directory* (monorepo).
2. **Settings → Git → Ignored Build Step / Disconnect**: tắt tự động deploy từ Git (chỉ cho `cd.yml` deploy), để mọi bản production đều qua cổng chất lượng.
3. **Settings → Environment Variables** (Production): `NEXT_PUBLIC_API_URL` = URL API Render (không có dấu `/` cuối).
4. Lấy `VERCEL_ORG_ID` và `VERCEL_PROJECT_ID` từ tệp `.vercel/project.json` sau khi chạy `npx vercel link` ở máy local (hoặc *Settings → General*). Tạo token ở *Account Settings → Tokens*.

### 3.4 GitHub: Secrets và Variables

Repository → **Settings → Environments → New environment** tên `production` (có thể thêm *Required reviewers* để tự duyệt thủ công trước mỗi lần deploy). Sau đó:

| Loại | Tên | Giá trị |
|---|---|---|
| Secret | `RENDER_DEPLOY_HOOK_URL` | Deploy Hook của Render (mục 3.2.6) |
| Secret | `VERCEL_TOKEN` | Token Vercel |
| Secret | `VERCEL_ORG_ID` | Org/Team ID |
| Secret | `VERCEL_PROJECT_ID` | Project ID |
| Secret (tùy chọn) | `RENDER_API_KEY` | API key Render, để chờ deploy báo `live` trước khi smoke test |
| Variable | `API_URL` | URL API production, ví dụ `https://brewlite-api.onrender.com` |
| Variable | `WEB_URL` | URL web production, ví dụ `https://brewlite.vercel.app` |
| Variable (tùy chọn) | `RENDER_SERVICE_ID` | `srv-xxxx`, đi cùng `RENDER_API_KEY` |

Nên đặt Secrets trong *Environment secrets* của `production`. Thiếu cấu hình bắt buộc thì job `deploy` dừng ngay với thông báo rõ ràng. Để branch protection cho phép merge, vẫn giữ job `quality` và `integration` của `ci.yml` là check bắt buộc.

## 4. Biến môi trường

| Biến | Nơi đặt | Giá trị production | Ghi chú |
|---|---|---|---|
| `NODE_ENV` | Render | `production` | |
| `PORT` | Render | `10000` | Cổng Render chuyển tiếp tới |
| `DATABASE_URL` | Render (secret) | Internal Database URL | Có `?schema=public` nếu cần; **không** commit |
| `JWT_SECRET` | Render (secret) | chuỗi ngẫu nhiên ≥ 32 ký tự | Tạo bằng `openssl rand -base64 48`. Thiếu thì API từ chối khởi động |
| `JWT_EXPIRES_IN` | Render | `3600` (giây) | ADR-006 |
| `CORS_ORIGIN` | Render | URL web Vercel, nhiều origin ngăn cách bằng dấu phẩy | Không dùng `*` |
| `PAYMENT_MOCK_ENABLED` | Render | `true` | Cổng thanh toán mô phỏng (ADR-005) |
| `PAYMENT_GATEWAY_URL` | Render | `<API>/api/v1/mock-gateway` | |
| `SEED_ON_START` | Render | `true` **chỉ lần đầu**, sau đó `false` | Seed đặt lại tồn kho về giá trị mẫu mỗi lần chạy, nên tắt sau khi có dữ liệu thật |
| `SEED_DEMO_PASSWORD` | Render (secret) | mật khẩu demo riêng | Dùng cho 3 tài khoản demo |
| `LOG_LEVEL` | Render | `info` | |
| `NEXT_PUBLIC_API_URL` | Vercel | URL API production | Nhúng vào bundle lúc build |

Mẫu đầy đủ cho local: [`.env.example`](../.env.example).

## 5. Quy trình CD và migration

`cd.yml` chạy khi push lên `main`, push tag `v*` hoặc bấm *Run workflow*:

| Bước | Job | Nội dung |
|---|---|---|
| 1 | `quality` | Install → Lint → Typecheck → Unit Test → Build (quality gate) |
| 2 | `integration` | Migrate + seed trên PostgreSQL service rồi integration test |
| 3 | `image` | `docker build` rồi push `ghcr.io/…/brewlite-api` với tag `:<commit sha 40 ký tự>`, thêm `:vX.Y.Z` khi có tag, `:latest` trên `main`. Chỉ dùng `GITHUB_TOKEN` |
| 4 | `deploy` | Gọi Render deploy hook kèm `imgURL=…:<sha>`, chờ Render, deploy web bằng Vercel CLI |
| 5 | `deploy` (smoke) | `GET /health`, `GET /api/v1/products`, `GET <WEB_URL>/` phải trả 200, thử lại tối đa 30 lần × 20 giây (Render free có thể đang ngủ) |
| 6 | `deploy` (rollback) | Smoke test lỗi thì gọi lại hook với SHA của bản triển khai tốt trước đó, rồi job thất bại |

**Migration an toàn.** Database không public nên runner không chạy `prisma migrate deploy` trực tiếp được. Thay vào đó `apps/api/docker-entrypoint.sh` chạy `prisma migrate deploy` ngay khi container khởi động, trước `node dist/main.js`:

- Migration lỗi → container thoát, health check của Render không qua → **Render giữ nguyên bản cũ đang phục vụ** (không downtime).
- Migration viết theo kiểu *expand → contract* (ADR-004): chỉ thêm bảng/cột nullable ở bản này, xóa/đổi tên ở bản sau, nhờ đó bản API cũ vẫn chạy được trên schema mới khi rollback.
- Migration đã áp dụng **không** được hoàn tác tự động khi rollback; chỉ rollback image. Nếu cần hoàn tác schema, viết migration mới.

Deployment được ghi theo `environment: production`. Job `deploy` chỉ thành công (deployment trạng thái *success*) khi smoke test qua, nên "bản tốt trước đó" luôn là bản đã qua smoke test.

## 6. Smoke test thủ công

```bash
curl -fsS <API>/health
curl -fsS <API>/api/v1/products | head -c 300
curl -fsSI <WEB>/ | head -1
```

Render free ngủ sau 15 phút không có request: lần gọi đầu có thể mất 30–60 giây. **Trước buổi demo/chấm điểm, gọi `/health` khoảng một phút trước** để đánh thức dịch vụ.

## 7. Rollback

### 7.1 Tự động
Nếu smoke test sau deploy lỗi, `cd.yml` tự gọi lại Render hook với SHA của deployment production thành công gần nhất rồi đánh dấu pipeline thất bại. Xem log bước *Rollback API về bản tốt trước đó*.

### 7.2 Thủ công bằng workflow (khuyến nghị)
1. Xác định SHA tốt: *Actions → CD → lượt chạy xanh gần nhất*, hoặc *Settings → Environments → production → Deployments*, hoặc trang Packages của GHCR (tag `:<sha>`).
2. *Actions → CD → Run workflow*, nhập `image_sha` = SHA 40 ký tự. Workflow bỏ qua build, gọi Render hook với image đó rồi chạy smoke test.
3. Rollback này chỉ đổi **API**. Web luôn tương thích ngược với API; nếu cần lùi web, xem 7.4.

### 7.3 Thủ công trên Render (khi GitHub không dùng được)
Render → `brewlite-api` → **Manual Deploy → Deploy an existing image** hoặc **Events → Rollback** về lần deploy trước.

### 7.4 Web
Vercel → Project → **Deployments** → chọn bản tốt trước đó → **Promote to Production** (hoặc `vercel rollback`).

### 7.5 Database
Nếu migration mới gây lỗi dữ liệu: rollback image (7.2), sau đó viết migration sửa tiếp (không sửa tay bảng `_prisma_migrations`). Bản sao lưu: Render PostgreSQL gói trả phí có point-in-time recovery; gói free không có, nên dữ liệu production phải chấp nhận được việc tạo lại bằng migrate + seed.

## 8. Rủi ro vận hành

| Rủi ro | Xử lý |
|---|---|
| Render PostgreSQL free **hết hạn sau 30 ngày** (R1) | Trước hạn: nâng lên gói Basic (~6 USD/tháng), hoặc tạo DB mới, cập nhật `DATABASE_URL`, deploy lại (migrate tự chạy) và `SEED_ON_START=true` một lần |
| Render free ngủ (R8) | Smoke test có thử lại; đánh thức trước khi demo (mục 6) |
| CORS sai sau khi đổi domain | Cập nhật `CORS_ORIGIN` ở Render và `NEXT_PUBLIC_API_URL` ở Vercel, rồi deploy lại web (biến này nhúng lúc build) |
| Lộ secret | Xoay `JWT_SECRET` (đăng xuất mọi người dùng), tạo lại deploy hook, thu hồi token Vercel/PAT |

## 9. Checklist nghiệm thu triển khai (Task 5.4)

- [ ] URL web production mở được bằng HTTPS, đi hết luồng menu → giỏ → đăng nhập → thanh toán → xác nhận đơn
- [ ] `GET <API>/health` trả 200 và báo DB kết nối được
- [ ] Database production không có địa chỉ public (Render → Access Control rỗng, API dùng Internal URL)
- [ ] `cd.yml` chạy xanh từ push → smoke test; có ảnh/link lượt chạy ở báo cáo
- [ ] Đã thử rollback (7.2) ít nhất một lần và chụp kết quả
- [ ] Không có secret trong repository và log CI (`git grep -n "postgresql://"`, kiểm tra log)
- [ ] Tag `v1.0.0` và release notes
- [ ] README mô tả chạy local, test, build, deploy, rollback
- [ ] Người ngoài nhóm clone repository, chạy theo README và truy cập được bản production
