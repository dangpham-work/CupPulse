// Sinh báo cáo Word BrewLite (docs/report/word/BrewLite-BaoCao.docx) từ tài liệu Markdown trong docs/.
// Chạy: cd docs/report/word && npm install && npm run build
// Hình lấy từ docs/report/figures; hình quá cao được cắt sẵn bằng split_figures.py vào ./figures.
"use strict";

const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
} = require("docx");

// ---------------------------------------------------------------- Đường dẫn
const WORD_DIR = __dirname;
const REPORT_DIR = path.resolve(WORD_DIR, "..");
const DOCS_DIR = path.resolve(REPORT_DIR, "..");
const FIGURES = path.join(REPORT_DIR, "figures");
const SPLIT_FIGURES = path.join(WORD_DIR, "figures");
const OUTPUT = path.join(WORD_DIR, "BrewLite-BaoCao.docx");

// ---------------------------------------------------------------- Trang và kiểu chữ
const FONT = "Times New Roman";
const MONO = "Consolas";
const BODY_SIZE = 26; // 13 pt (đơn vị nửa point)
const TABLE_SIZE = 21; // 10,5 pt
const PAGE = { width: 11906, height: 16838 }; // A4 (DXA)
const MARGIN = { top: 1418, bottom: 1418, left: 1701, right: 1134 }; // 2,5 / 2,5 / 3 / 2 cm
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right; // 9071 DXA
const MAX_IMG_W = 600; // px (~15,9 cm)
const MAX_IMG_H = 820; // px (~21,7 cm)
const BROWN = "7A4A1E";
const HEAD_FILL = "E8E8E8";

// ---------------------------------------------------------------- Đánh số mục, hình, danh sách
const counters = [0, 0, 0, 0];
let figureNo = 0;
let listInstance = 0;

function headingNumber(level) {
  counters[level - 1] += 1;
  for (let i = level; i < counters.length; i++) counters[i] = 0;
  return counters.slice(0, level).join(".");
}

const HEADING_LEVELS = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];

function heading(text, level, { numbered = true, pageBreak = false } = {}) {
  const lvl = Math.min(Math.max(level, 1), 4);
  const label = numbered ? `${headingNumber(lvl)}  ${text}` : text;
  return new Paragraph({
    heading: HEADING_LEVELS[lvl - 1],
    pageBreakBefore: pageBreak,
    children: inline(label),
  });
}

// ---------------------------------------------------------------- Inline Markdown
// Hỗ trợ **đậm**, *nghiêng*, `code`, [chữ](link), <br>.
function inline(text, base = {}) {
  const runs = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\s][^*]*\*|<br\s*\/?>)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const tok = m[0];
    if (tok.startsWith("**")) {
      runs.push(...inline(tok.slice(2, -2), { ...base, bold: true }));
    } else if (tok.startsWith("`")) {
      runs.push(new TextRun({ text: tok.slice(1, -1), ...base, font: MONO, size: base.size ? base.size - 2 : BODY_SIZE - 4 }));
    } else if (tok.startsWith("[")) {
      const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (/^https?:\/\//.test(href)) {
        runs.push(new ExternalHyperlink({ link: href, children: [new TextRun({ text: label, ...base, style: "Hyperlink" })] }));
      } else {
        runs.push(...inline(label, base)); // link nội bộ repo: giữ chữ
      }
    } else if (tok.startsWith("<br")) {
      runs.push(new TextRun({ break: 1, ...base }));
    } else {
      runs.push(...inline(tok.slice(1, -1), { ...base, italics: true }));
    }
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), ...base }));
  return runs;
}

function para(text, opts = {}) {
  return new Paragraph({ children: inline(text, opts.run || {}), alignment: opts.alignment ?? AlignmentType.JUSTIFIED, ...opts.para });
}

// ---------------------------------------------------------------- Bảng
function plainLength(s) {
  return s.replace(/\*\*|`|\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").length;
}

function columnWidths(rows) {
  const n = rows[0].length;
  const weights = [];
  for (let c = 0; c < n; c++) {
    let longest = 0;
    let longestWord = 0;
    for (const r of rows) {
      const cell = r[c] || "";
      longest = Math.max(longest, plainLength(cell));
      for (const w of cell.split(/\s+/)) longestWord = Math.max(longestWord, plainLength(w));
    }
    weights.push({ longest, longestWord });
  }
  // Cột ngắn giữ đủ chỗ cho từ dài nhất; phần còn lại chia theo độ dài nội dung (căn bậc hai để bớt chênh lệch).
  const minW = weights.map((w) => Math.min(Math.max(w.longestWord * 120 + 200, 700), 2600));
  let remaining = CONTENT_WIDTH - minW.reduce((a, b) => a + b, 0);
  const extra = weights.map((w) => Math.sqrt(Math.max(w.longest - w.longestWord, 0)));
  const sumExtra = extra.reduce((a, b) => a + b, 0) || 1;
  if (remaining < 0) {
    const scale = CONTENT_WIDTH / minW.reduce((a, b) => a + b, 0);
    return fixRounding(minW.map((w) => Math.floor(w * scale)));
  }
  return fixRounding(minW.map((w, i) => Math.floor(w + (remaining * extra[i]) / sumExtra)));
}

function fixRounding(widths) {
  const diff = CONTENT_WIDTH - widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += diff;
  return widths;
}

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "808080" };

function table(rows, { widths } = {}) {
  const colWidths = widths ? fixRounding(widths.map((w) => Math.round(w * CONTENT_WIDTH))) : columnWidths(rows);
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map(
      (cells, r) =>
        new TableRow({
          tableHeader: r === 0,
          cantSplit: true,
          children: cells.map(
            (text, c) =>
              new TableCell({
                width: { size: colWidths[c], type: WidthType.DXA },
                shading: r === 0 ? { type: ShadingType.CLEAR, color: "auto", fill: HEAD_FILL } : undefined,
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 40, bottom: 40, left: 80, right: 80 },
                borders: { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER },
                children: [
                  new Paragraph({
                    spacing: { before: 0, after: 0, line: 260 },
                    children: inline(text, { size: TABLE_SIZE, bold: r === 0 ? true : undefined }),
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function splitRow(line) {
  const cells = [];
  let cur = "";
  const body = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && body[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (body[i] === "|") {
      cells.push(cur.trim());
      cur = "";
    } else cur += body[i];
  }
  cells.push(cur.trim());
  return cells;
}

// ---------------------------------------------------------------- Hình
function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), data: buf };
}

function figure(file, caption, { maxH = MAX_IMG_H } = {}) {
  const { width, height, data } = pngSize(file);
  const scale = Math.min(MAX_IMG_W / width, maxH / height);
  figureNo += 1;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: "png", data, transformation: { width: Math.round(width * scale), height: Math.round(height * scale) } })],
    }),
    new Paragraph({
      style: "Caption",
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Hình ${figureNo}: `, bold: true }), ...inline(caption)],
    }),
  ];
}

// Ảnh trong Markdown trỏ tới ../diagrams/*.svg → PNG trong docs/report/figures.
function figureFromMarkdown(alt, src) {
  const base = path.basename(src).replace(/\.svg$/i, ".png");
  return figure(path.join(FIGURES, base), alt);
}

// ---------------------------------------------------------------- Markdown → khối Word
// opts.shift: số cấp heading cộng thêm; opts.skipTitle: bỏ "# tiêu đề" và bảng metadata ngay sau nó;
// opts.skipSections: regex tên mục cần bỏ cả mục; opts.rename: {regex: tên mới};
// opts.before: {regex: () => khối chèn trước heading đó}; opts.after: {regex: () => khối chèn sau heading}.
function markdown(file, opts = {}) {
  const src = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const out = [];
  let i = 0;
  let skipLevel = 0;

  if (opts.skipTitle) {
    while (i < lines.length && !lines[i].startsWith("# ")) i++;
    i++;
    while (i < lines.length && (lines[i].trim() === "" || lines[i].startsWith("|"))) i++;
  }

  const matchKey = (map, text) => Object.keys(map || {}).find((k) => new RegExp(k).test(text));

  while (i < lines.length) {
    const line = lines[i];
    const h = line.match(/^(#{1,6})\s+(.*)$/);

    if (h) {
      const level = h[1].length;
      let text = h[2].trim();
      if (skipLevel && level <= skipLevel) skipLevel = 0;
      if (skipLevel) {
        i++;
        continue;
      }
      if (opts.skipSections && opts.skipSections.some((re) => re.test(text))) {
        skipLevel = level;
        i++;
        continue;
      }
      const beforeKey = matchKey(opts.before, text);
      if (beforeKey) out.push(...opts.before[beforeKey]());
      const renameKey = matchKey(opts.rename, text);
      if (renameKey) text = opts.rename[renameKey];
      text = text.replace(/^\d+(\.\d+)*\.?\s+/, ""); // bỏ số mục có sẵn, script tự đánh số
      out.push(heading(text, level + (opts.shift || 0)));
      const afterKey = matchKey(opts.after, text);
      if (afterKey) out.push(...opts.after[afterKey]());
      i++;
      continue;
    }
    if (skipLevel) {
      i++;
      continue;
    }

    if (line.trim() === "" || /^-{3,}$/.test(line.trim())) {
      i++;
      continue;
    }

    // Bảng
    if (line.trim().startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        if (!/^\|?\s*:?-{3,}/.test(lines[i].trim().replace(/^\|/, "").trim())) rows.push(splitRow(lines[i]));
        i++;
      }
      out.push(table(rows));
      out.push(new Paragraph({ spacing: { before: 0, after: 60 }, children: [] }));
      continue;
    }

    // Khối code
    if (line.trim().startsWith("```")) {
      i++;
      const code = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      for (const c of code) {
        out.push(
          new Paragraph({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "F4F4F4" },
            spacing: { before: 0, after: 0 },
            indent: { left: 284 },
            children: [new TextRun({ text: c.replace(/^\s+/, (s) => " ".repeat(s.length)) || " ", font: MONO, size: 19 })],
          }),
        );
      }
      out.push(new Paragraph({ children: [] }));
      continue;
    }

    // Ảnh
    const img = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      out.push(...figureFromMarkdown(img[1], img[2]));
      i++;
      continue;
    }

    // Trích dẫn
    if (line.startsWith(">")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^>\s?/, ""));
      out.push(
        new Paragraph({
          indent: { left: 567 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: BROWN, space: 8 } },
          children: inline(quote.join(" "), { italics: true }),
        }),
      );
      continue;
    }

    // Danh sách (- hoặc 1.), hỗ trợ một cấp lồng (thụt 2+ khoảng trắng)
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      listInstance += 1;
      const ordered = /^\s*\d+\./.test(line);
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        const l = lines[i];
        const level = l.match(/^\s*/)[0].length >= 2 ? 1 : 0;
        const isOrdered = /^\s*\d+\./.test(l);
        const text = l.replace(/^\s*([-*]|\d+\.)\s+/, "").replace(/^\[ \]\s*/, "☐ ").replace(/^\[x\]\s*/i, "☑ ");
        out.push(
          new Paragraph({
            numbering: { reference: isOrdered && level === 0 ? "numbers" : "bullets", level, instance: ordered ? listInstance : 0 },
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 0, after: 40 },
            children: inline(text),
          }),
        );
        i++;
      }
      continue;
    }

    // Đoạn văn: gộp các dòng liền nhau
    const parts = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|\||```|>|!\[|\s*([-*]|\d+\.)\s+)/.test(lines[i]) &&
      !/^-{3,}$/.test(lines[i].trim())
    ) {
      parts.push(lines[i].trim());
      i++;
    }
    out.push(para(parts.join(" ")));
  }
  return out;
}

// ---------------------------------------------------------------- Bìa
const logo = fs.readFileSync(path.join(REPORT_DIR, "logoITSGU.png"));
const logoSmall = fs.readFileSync(path.join(REPORT_DIR, "logoITSGUsmall.png"));

function centered(text, run = {}, spacing = {}) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing, children: [new TextRun({ text, ...run })] });
}

function ruleParagraph() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
    indent: { left: 1700, right: 1700 },
    spacing: { after: 240 },
    children: [],
  });
}

function infoLine(label, value) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: 4300 }, { type: TabStopType.LEFT, position: 4500 }],
    spacing: { after: 40 },
    children: [new TextRun({ text: `\t${label}` }), new TextRun({ text: `\t${value}` })],
  });
}

const cover = [
  centered("TRƯỜNG ĐẠI HỌC SÀI GÒN", { size: 28 }, { after: 0 }),
  centered("KHOA CÔNG NGHỆ THÔNG TIN", { size: 28 }, { after: 480 }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new ImageRun({ type: "png", data: logo, transformation: { width: 113, height: 113 } })],
  }),
  centered("CÔNG NGHỆ PHẦN MỀM", { bold: true, size: 32 }, { after: 120 }),
  ruleParagraph(),
  centered("Bài tập lớn – Assignment 2", { bold: true, size: 30 }, { after: 240 }),
  centered("BrewLite", { bold: true, size: 52 }, { after: 240 }),
  centered("Hệ thống đặt cà phê mobile-first/PWA", { size: 28 }, { after: 0 }),
  centered("và thanh toán mô phỏng", { size: 28 }, { after: 240 }),
  centered("REQUIREMENTS TO DEPLOYMENT", { bold: true, size: 26 }, { after: 120 }),
  ruleParagraph(),
  new Paragraph({ spacing: { before: 900 }, children: [] }),
  infoLine("GVHD:", "Từ Lãng Phiêu"),
  infoLine("SV:", "Phạm Duy Đăng - 3124410068"),
  infoLine("Lớp:", "DCT1245 - K24"),
  infoLine("Ngành:", "Công nghệ Thông tin"),
  new Paragraph({ spacing: { before: 1400 }, children: [] }),
  centered("TP. HỒ CHÍ MINH, THÁNG 11/2026", { size: 22 }),
];

// ---------------------------------------------------------------- Phần đầu (không đánh số mục)
const REPO = "https://github.com/dangpham-work/CupPulse";

const frontMatter = [
  heading("Thông tin sinh viên và phân công", 1, { numbered: false }),
  para("Đề tài được thực hiện bởi một sinh viên, đảm nhận toàn bộ các vai trò của nhóm phát triển."),
  table(
    [
      ["STT", "Họ và tên", "MSSV", "Lớp", "Vai trò / nhiệm vụ", "Hoàn thành"],
      [
        "1",
        "Phạm Duy Đăng",
        "3124410068",
        "DCT1245",
        "Product Owner, phân tích yêu cầu, thiết kế, Backend NestJS, Frontend Next.js/PWA, kiểm thử, DevOps (CI/CD, triển khai)",
        "100%",
      ],
    ],
    { widths: [0.08, 0.18, 0.14, 0.12, 0.33, 0.15] },
  ),
  new Paragraph({ spacing: { before: 120 }, children: [] }),
  para("**Khóa – Ngành:** K24 – Công nghệ Thông tin", { alignment: AlignmentType.LEFT }),
  para("**Email liên hệ:** duydang.contact@gmail.com", { alignment: AlignmentType.LEFT }),
  para(`**Repository:** [${REPO}](${REPO})`, { alignment: AlignmentType.LEFT }),
  heading("Lịch sử phiên bản tài liệu", 1, { numbered: false }),
  table(
    [
      ["Phiên bản", "Ngày", "Nội dung thay đổi", "Người thực hiện"],
      ["1.0", "01/11/2026", "Task 1 – Khai thác và đặc tả yêu cầu (bối cảnh, stakeholder, phạm vi, SRS, use-case)", "Phạm Duy Đăng"],
      ["1.1", "02/11/2026", "Task 2 – Mô hình hóa hệ thống (activity, sequence, class, state diagram); ma trận truy vết v0.2", "Phạm Duy Đăng"],
    ],
    { widths: [0.12, 0.15, 0.53, 0.2] },
  ),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "MỤC LỤC", bold: true, size: 32 })] }),
  new TableOfContents("Mục lục", { hyperlink: true, headingStyleRange: "1-3" }),
];

// ---------------------------------------------------------------- Chương 1 – Tổng quan
const chapter1 = [
  heading("Tổng quan đề tài", 1, { pageBreak: true }),
  heading("Giới thiệu", 2),
  para(
    "Assignment 2 tiếp tục đề tài **BrewLite** của Assignment 1. Nhóm phát triển dự án theo một chuỗi công việc hoàn chỉnh: khai thác yêu cầu, mô hình hóa, thiết kế kiến trúc, hiện thực qua hai Sprint, thiết lập CI/CD và triển khai hệ thống lên môi trường có thể truy cập được.",
  ),
  para("Luồng nghiệp vụ tối thiểu của BrewLite:"),
  para("Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn", { alignment: AlignmentType.CENTER, run: { bold: true } }),
  para(
    "Công nghệ bắt buộc: **Next.js** (mobile-first/PWA) cho frontend, **NestJS** cho backend, **PostgreSQL** để lưu dữ liệu và **Docker** để đóng gói.",
  ),
  heading("Quy trình thực hiện", 2),
  para("Task 1 Yêu cầu → Task 2 Mô hình hóa → Task 3 Kiến trúc → Task 4 Sprint 1 → Task 5 Sprint 2 → CI/CD Production", {
    alignment: AlignmentType.CENTER,
    run: { bold: true, color: BROWN },
  }),
  table(
    [
      ["Task", "Giai đoạn", "Tạo phẩm chính", "Điểm", "Trạng thái"],
      ["1", "Khai thác và đặc tả yêu cầu", "Stakeholder, phạm vi, SRS, use-case tổng quát, đặc tả use-case", "2", "Hoàn thành"],
      ["2", "Mô hình hóa hệ thống", "Activity, sequence, class diagram", "2", "Hoàn thành"],
      ["3", "Thiết kế kiến trúc", "Kiến trúc, ADR, deployment diagram", "2", "Chưa thực hiện"],
      ["4", "Triển khai Sprint 1", "Repository, tài liệu, CI, MVP xem menu", "2", "Chưa thực hiện"],
      ["5", "Sprint 2, CI/CD, Delivery", "MVP hoàn chỉnh, CD, production, kiểm thử, bàn giao", "2", "Chưa thực hiện"],
    ],
    { widths: [0.07, 0.25, 0.4, 0.08, 0.2] },
  ),
  heading("Kho mã nguồn và tài liệu", 2),
  para(`Toàn bộ tạo phẩm được quản lý phiên bản trong repository [${REPO}](${REPO}). Bảng dưới ánh xạ các phần của báo cáo tới tệp tương ứng.`),
  table(
    [
      ["Phần báo cáo", "Tệp trong repository"],
      ["Mục 2.1", "`docs/requirements/context-and-scope.md`"],
      ["Mục 2.2", "`docs/requirements/srs.md`"],
      ["Mục 2.3", "`docs/requirements/use-case-checkout.md`"],
      ["Chương 3 (sơ đồ)", "`docs/diagrams/*.puml`, `docs/diagrams/*.svg`, `docs/diagrams/README.md`"],
      ["Chương 7", "`docs/traceability-matrix.md`"],
    ],
    { widths: [0.3, 0.7] },
  ),
];

// ---------------------------------------------------------------- Chương 2 – Task 1
const req = (f) => path.join(DOCS_DIR, "requirements", f);
const chapter2 = [
  heading("Task 1 – Khai thác và đặc tả yêu cầu", 1, { pageBreak: true }),
  heading("Task 1.1 – Bối cảnh, stakeholder và phạm vi", 2),
  ...markdown(req("context-and-scope.md"), { skipTitle: true, shift: 1 }),
  heading("Task 1.2 – Yêu cầu chức năng và phi chức năng (SRS)", 2, { pageBreak: true }),
  ...markdown(req("srs.md"), { skipTitle: true, shift: 1, skipSections: [/^Mục lục$/] }),
  heading("Task 1.3 – Đặc tả use-case trọng tâm: UC-01 Đặt và thanh toán đơn hàng", 2, { pageBreak: true }),
  ...markdown(req("use-case-checkout.md"), { skipTitle: true, shift: 1 }),
];

// ---------------------------------------------------------------- Chương 3 – Task 2
const fig = (f) => path.join(FIGURES, f);
const chapter3 = [
  heading("Task 2 – Mô hình hóa hệ thống", 1, { pageBreak: true }),
  para("Task 2 mô hình hóa hành vi và cấu trúc của BrewLite từ đặc tả ở Task 1; mọi sơ đồ được viết bằng PlantUML."),
  ...markdown(path.join(DOCS_DIR, "diagrams", "README.md"), {
    skipTitle: true,
    shift: 0,
    skipSections: [/^Xuất lại ảnh/],
    rename: {
      "^Activity-01": "Task 2.1 – Activity diagram",
      "^Sequence-01": "Task 2.2 – Sequence diagram",
      "^Class-01": "Task 2.3 – Class diagram",
      "^Kiểm tra nhất quán": "Kiểm tra nhất quán với SRS và use-case",
    },
    before: {
      "^Kiểm tra nhất quán": () => [
        heading("Sơ đồ trạng thái bổ trợ (State-01)", 2),
        para("State-01 cố định vòng đời Order và Payment để ba sơ đồ trên dùng chung một định nghĩa trạng thái."),
        ...figure(fig("state-order-payment.png"), "State-01 – Vòng đời Order và Payment"),
      ],
    },
    after: {
      "^Task 2.1": () => figure(fig("activity-order-e2e.png"), "Activity-01 – Luồng đặt món end-to-end (swimlane)"),
      "^Task 2.2": () => [
        ...figure(path.join(SPLIT_FIGURES, "sequence-checkout-1.png"), "Sequence-01 (phần 1/2) – Giai đoạn 1: tạo đơn, kiểm tra JWT, validate, transaction trừ kho"),
        ...figure(
          path.join(SPLIT_FIGURES, "sequence-checkout-2.png"),
          "Sequence-01 (phần 2/2) – Giai đoạn 2–3: thanh toán, idempotency, `alt` thành công/thất bại/timeout, thông báo kết quả",
        ),
      ],
      "^Task 2.3": () => figure(fig("class-domain.png"), "Class-01 – Mô hình domain BrewLite"),
    },
  }),
];

// ---------------------------------------------------------------- Chương 4–6 (khung) và 7
function placeholder(title, text) {
  return [
    heading(title, 1, { pageBreak: true }),
    new Paragraph({
      shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFF8EE" },
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: BROWN, space: 4 },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BROWN, space: 4 },
        left: { style: BorderStyle.SINGLE, size: 4, color: BROWN, space: 4 },
        right: { style: BorderStyle.SINGLE, size: 4, color: BROWN, space: 4 },
      },
      children: inline(text, { italics: true }),
    }),
  ];
}

const laterChapters = [
  ...placeholder("Task 3 – Thiết kế kiến trúc", "Phần này sẽ được bổ sung khi thực hiện Task 3: kiến trúc C4/phân lớp, các ADR và UML deployment diagram cho môi trường production."),
  ...placeholder("Task 4 – Triển khai Sprint 1", "Phần này sẽ được bổ sung khi thực hiện Task 4: thiết lập repository, quản lý tài liệu, MVP xem menu và Continuous Integration."),
  ...placeholder(
    "Task 5 – Triển khai Sprint 2, CI/CD và Delivery",
    "Phần này sẽ được bổ sung khi thực hiện Task 5: hoàn thiện MVP, kiểm thử, Continuous Delivery/Deployment, triển khai production và bàn giao.",
  ),
  heading("Ma trận truy vết", 1, { pageBreak: true }),
  ...markdown(path.join(DOCS_DIR, "traceability-matrix.md"), { skipTitle: true, shift: 0 }),
];

const references = [
  heading("Tài liệu tham khảo", 1, { numbered: false, pageBreak: true }),
  ...[
    "[1] Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn, *BrewLite – Assignment 2: Requirements to Deployment*, Ver 1.0, 2026.",
    "[2] IEEE, *IEEE Std 830-1998 – Recommended Practice for Software Requirements Specifications*, 1998.",
    "[3] A. Cockburn, *Writing Effective Use Cases*, Addison-Wesley, 2000.",
    "[4] PlantUML, https://plantuml.com, lần truy cập cuối: 01/11/2026.",
  ].map((t) => para(t, { para: { indent: { left: 567, hanging: 567 } } })),
];

// ---------------------------------------------------------------- Header / footer
const header = new Header({
  children: [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 4 } },
      children: [
        new ImageRun({ type: "png", data: logoSmall, transformation: { width: 30, height: 30 } }),
        new TextRun({ text: "  Trường Đại học Sài Gòn – Khoa Công Nghệ Thông Tin", font: MONO, size: 17, bold: true }),
        new TextRun({ text: "\tBrewLite – Assignment 2", font: MONO, size: 16 }),
      ],
    }),
  ],
});

const footer = new Footer({
  children: [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 4 } },
      children: [
        new TextRun({ text: "Bài tập lớn môn Công nghệ Phần mềm - Học kỳ I, năm học 2026-2027", font: MONO, size: 15 }),
        new TextRun({ children: ["\tTrang ", PageNumber.CURRENT, "/", PageNumber.TOTAL_PAGES], font: MONO, size: 15 }),
      ],
    }),
  ],
});

// ---------------------------------------------------------------- Tài liệu
const doc = new Document({
  creator: "Phạm Duy Đăng",
  title: "BrewLite – Báo cáo Assignment 2",
  description: "Báo cáo bài tập lớn Công nghệ Phần mềm – BrewLite",
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { after: 100, line: 300 } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 32, bold: true, color: "000000" }, paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 28, bold: true, color: "000000" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 26, bold: true, color: "000000" }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2, keepNext: true } },
      { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 26, bold: true, italics: true, color: "000000" }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 3, keepNext: true } },
      { id: "Caption", name: "Caption", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 22, italics: true }, paragraph: { spacing: { before: 60, after: 200 } } },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 283 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1134, hanging: 283 } } } },
        ],
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 340 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1134, hanging: 283 } } } },
        ],
      },
    ],
  },
  sections: [
    {
      properties: { page: { size: PAGE, margin: MARGIN } },
      children: cover,
    },
    {
      // Không đánh lại số trang: bìa là trang 1 (như bản LaTeX), để "Trang X/Y" khớp với tổng số trang.
      properties: { page: { size: PAGE, margin: MARGIN } },
      headers: { default: header },
      footers: { default: footer },
      children: [...frontMatter, ...chapter1, ...chapter2, ...chapter3, ...laterChapters, ...references],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUTPUT, buf);
  console.log(`Đã ghi ${path.relative(DOCS_DIR, OUTPUT)} (${(buf.length / 1024).toFixed(0)} KB, ${figureNo} hình)`);
});
