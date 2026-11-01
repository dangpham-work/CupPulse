"""Cắt các hình quá cao trong docs/report/figures thành nhiều phần để vừa trang A4 trong bản Word.

Chạy:  python -I split_figures.py   (cần PyMuPDF: pip install pymupdf)
Kết quả ghi vào docs/report/word/figures/.
"""
from pathlib import Path

import pymupdf

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "figures"
OUT = HERE / "figures"

# Tên hình → các mốc cắt (tỉ lệ chiều cao). sequence-checkout cắt ngay trên vạch "Giai đoạn 2" (≈ 37,5%).
SPLITS = {
    "sequence-checkout.png": [0.373],
}


def crop(src: Path, top: int, bottom: int, dest: Path) -> None:
    pix = pymupdf.Pixmap(str(src))
    doc = pymupdf.open()
    page = doc.new_page(width=pix.width, height=pix.height)
    page.insert_image(page.rect, filename=str(src))
    clip = pymupdf.Rect(0, top, pix.width, bottom)
    page.get_pixmap(clip=clip).save(str(dest))


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for name, cuts in SPLITS.items():
        src = SRC / name
        height = pymupdf.Pixmap(str(src)).height
        edges = [0] + [round(c * height) for c in cuts] + [height]
        for i in range(len(edges) - 1):
            dest = OUT / f"{src.stem}-{i + 1}.png"
            crop(src, edges[i], edges[i + 1], dest)
            print(f"{dest.name}: y {edges[i]}–{edges[i + 1]}")


if __name__ == "__main__":
    main()
