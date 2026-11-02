# Quy trình làm việc – BrewLite

Nhóm một người (Phạm Duy Đăng) nhưng vẫn làm theo quy trình nhóm: mọi thay đổi đi qua pull request và CI.

## 1. Chiến lược branch

Dùng **GitHub Flow** với một nhánh chính được bảo vệ.

| Nhánh | Mục đích | Ví dụ |
|---|---|---|
| `main` | Luôn build được, chỉ nhận thay đổi qua pull request. Sprint 2: mỗi lần merge vào `main` sẽ deploy production | — |
| `feat/<mô-tả>` | Tính năng mới | `feat/task4-sprint1`, `feat/cart` |
| `fix/<mô-tả>` | Sửa lỗi | `fix/menu-empty-state` |
| `docs/<mô-tả>` | Tài liệu, sơ đồ, báo cáo | `docs/task3-architecture` |
| `chore/<mô-tả>`, `ci/<mô-tả>` | Cấu hình, CI, phụ thuộc | `ci/cache-pnpm` |

Quy tắc:

- Tách nhánh từ `main` mới nhất. Mỗi nhánh giải quyết một mục backlog (hoặc một task của đề).
- Nhánh sống ngắn, merge xong thì xóa.
- Phát hành bằng tag semver `vMAJOR.MINOR.PATCH` trên `main` (Sprint 2).

## 2. Pull request

1. Mở PR vào `main`, điền đủ mẫu [pull_request_template.md](.github/pull_request_template.md): **mục đích, lý do thay đổi, mã yêu cầu (FR/NFR/US), cách kiểm tra**.
2. CI phải xanh: job `Install → Lint → Unit Test → Build`, `Integration Test (PostgreSQL)` và `Docker build (web, api)`.
3. Tự review lại diff (nhóm một người) trước khi merge; dùng **Squash and merge** hoặc **Create a merge commit** để giữ lịch sử theo task.
4. Thay đổi yêu cầu, sơ đồ hoặc kiến trúc (`docs/`) cũng phải qua PR, ghi rõ lý do trong PR và trong bảng lịch sử ở [docs/README.md](docs/README.md). Thay đổi quyết định kiến trúc thì thêm ADR mới (không sửa ADR cũ, chỉ đổi trạng thái thành *Superseded*).

**Branch protection cho `main`** (Settings → Branches → Add rule):

- Require a pull request before merging.
- Require status checks to pass before merging: `Install → Lint → Unit Test → Build`, `Integration Test (PostgreSQL)`, `Docker build (web, api)`; bật *Require branches to be up to date*.
- Không cho force push và xóa nhánh.

## 3. Quy ước commit

Theo [Conventional Commits](https://www.conventionalcommits.org/), mô tả viết tiếng Việt:

```text
<type>(<scope>): <mô tả ngắn, thể mệnh lệnh>

[thân: lý do thay đổi, mã yêu cầu liên quan]
```

| type | Khi nào |
|---|---|
| `feat` | Thêm tính năng |
| `fix` | Sửa lỗi |
| `docs` | Tài liệu, sơ đồ, báo cáo |
| `test` | Thêm/sửa test |
| `refactor` | Đổi cấu trúc mã, không đổi hành vi |
| `ci`, `build`, `chore` | CI, Docker, phụ thuộc, cấu hình |

`scope` gợi ý: `web`, `api`, `shared`, `db`, `ci`, `task1`…`task5`, `report`. Ví dụ: `feat(api): thêm GET /products (FR-01)`.

## 4. Definition of Done

Một mục backlog chỉ được coi là **Done** khi:

- [ ] Đáp ứng mọi tiêu chí chấp nhận (AC) của yêu cầu liên quan trong [SRS](docs/requirements/srs.md).
- [ ] Có test tự động cho phần thay đổi (unit test cho logic, API/integration test cho endpoint, component test cho UI) và test pass ở local.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass; CI trên PR xanh.
- [ ] Validate đầu vào ở backend (whitelist) và hiển thị lỗi thân thiện ở frontend.
- [ ] Giao diện dùng tốt ở chiều rộng 360 px, không cuộn ngang (NFR-09).
- [ ] Không có secret trong mã nguồn hoặc log; biến mới được thêm vào `.env.example`.
- [ ] Cập nhật tài liệu liên quan: [ma trận truy vết](docs/traceability-matrix.md), README, sơ đồ/ADR nếu thiết kế đổi.
- [ ] Đã merge vào `main` qua PR; issue backlog được đóng và gắn link PR.

## 5. Product Backlog

Backlog gốc nằm ở [docs/process/product-backlog.md](docs/process/product-backlog.md) và được theo dõi trên GitHub Issues (milestone `Sprint 1`, `Sprint 2`; nhãn `type:*`, `priority:*`).
