# Báo cáo Word – BrewLite

`BrewLite-BaoCao.docx` là bản Word của báo cáo (tương đương `docs/report/main.pdf`), được **sinh tự động** từ các tài liệu Markdown trong `docs/`. Khi sửa nội dung, hãy sửa file Markdown nguồn rồi sinh lại, không sửa tay file `.docx`.

| Chương | Nguồn |
|---|---|
| Bìa, thông tin sinh viên, lịch sử phiên bản, Chương 1, Chương 4–6, tài liệu tham khảo | `build-docx.js` |
| Chương 2 – Task 1 | `docs/requirements/context-and-scope.md`, `srs.md`, `use-case-checkout.md` |
| Chương 3 – Task 2 | `docs/diagrams/README.md` + hình trong `docs/report/figures/` |
| Chương 7 – Ma trận truy vết | `docs/traceability-matrix.md` |

## Sinh lại

```bash
cd docs/report/word
npm install
npm run build
```

Hình quá cao (sequence diagram) được cắt sẵn thành 2 phần trong `figures/`. Khi sơ đồ thay đổi, xuất lại PNG vào `docs/report/figures/` rồi cắt lại (cần PyMuPDF):

```bash
python -I split_figures.py
```

## Sau khi mở bằng Word

Mục lục là trường (field) của Word. Khi mở file, Word hỏi cập nhật trường: chọn **Yes**. Hoặc bấm chuột phải vào mục lục → **Update Field** → **Update entire table**.
