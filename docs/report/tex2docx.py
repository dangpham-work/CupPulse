# -*- coding: utf-8 -*-
"""Chuyển báo cáo LaTeX (main.tex + chapters/) sang Word (.docx).

Chạy:  python tex2docx.py   (trong thư mục docs/report)
Kết quả: BrewLite-Assignment2-Report.docx

Bộ chuyển chỉ hỗ trợ đúng tập lệnh LaTeX mà báo cáo này dùng (section, bảng tabularx/longtable,
figure, itemize/description, lstlisting, tikz dạng chuỗi hộp, thebibliography...).
Sau khi tạo file, mở bằng Word và chọn "Yes" khi được hỏi cập nhật trường (mục lục, danh sách hình/bảng).
"""
import os
import re
import sys
from copy import deepcopy

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor, Emu
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'BrewLite-Assignment2-Report.docx')
TMP = os.path.join(HERE, '.docx-tmp')

BODY_FONT = 'Times New Roman'
CODE_FONT = 'Consolas'
BODY_PT = 12
TABLE_PT = 10.5
SMALL_PT = 9
BREW = RGBColor(122, 74, 30)
HEAD_FILL = 'EBEBEB'
BREW_LIGHT = 'FFF8EE'

PAGE_W, PAGE_H = 21.0, 29.7
MARGIN_L, MARGIN_R, MARGIN_T, MARGIN_B = 2.5, 2.0, 2.5, 2.0
TEXT_W = PAGE_W - MARGIN_L - MARGIN_R          # 16.5 cm
TEXT_H = PAGE_H - MARGIN_T - MARGIN_B - 2.5    # trừ header/footer, ước lượng

# ---------------------------------------------------------------------------
# Đọc và tiền xử lý nguồn LaTeX
# ---------------------------------------------------------------------------

def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def strip_comments(s):
    out = []
    for line in s.split('\n'):
        m = re.search(r'(?<!\\)%', line)
        if m:
            line = line[:m.start()]
            out.append(line)
            out.append('\x00')  # nối dòng (như % cuối dòng trong LaTeX)
        else:
            out.append(line)
            out.append('\n')
    s = ''.join(out)
    # dòng chỉ có comment không được tạo dòng trống
    s = re.sub(r'\n?\x00', '', s)
    return s


def expand_inputs(s):
    def rep(m):
        p = os.path.join(HERE, m.group(1))
        if not p.endswith('.tex'):
            p += '.tex'
        return expand_inputs(strip_comments(read(p)))
    return re.sub(r'\\input\{([^}]*)\}', rep, s)


def match_brace(s, i):
    """s[i] == '{' → trả về chỉ số của '}' tương ứng."""
    depth = 0
    j = i
    while j < len(s):
        c = s[j]
        if c == '\\':
            j += 2
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return j
        j += 1
    raise ValueError('Ngoặc không cân bằng tại %d: %r' % (i, s[i:i + 80]))


def match_bracket(s, i):
    depth = 0
    j = i
    while j < len(s):
        c = s[j]
        if c == '{':
            j = match_brace(s, j) + 1
            continue
        if c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                return j
        j += 1
    raise ValueError('Ngoặc vuông không cân bằng')


def read_args(s, i, n, opt=True):
    """Đọc [opt] (tùy chọn) và n tham số {..} bắt đầu từ i. Trả (opt, args, chỉ số kế tiếp)."""
    o = None
    j = i
    while j < len(s) and s[j] in ' \t\n':
        j += 1
    if opt and j < len(s) and s[j] == '[':
        k = match_bracket(s, j)
        o = s[j + 1:k]
        i = k + 1
    args = []
    for _ in range(n):
        j = i
        while j < len(s) and s[j] in ' \t\n':
            j += 1
        if j < len(s) and s[j] == '{':
            k = match_brace(s, j)
            args.append(s[j + 1:k])
            i = k + 1
        else:
            args.append('')
    return o, args, i


def find_env_end(s, name, start):
    """start: chỉ số ngay sau \\begin{name}. Trả (chỉ số bắt đầu \\end, chỉ số sau \\end{name})."""
    pat = re.compile(r'\\(begin|end)\{' + re.escape(name) + r'\}')
    depth = 1
    for m in pat.finditer(s, start):
        depth += 1 if m.group(1) == 'begin' else -1
        if depth == 0:
            return m.start(), m.end()
    raise ValueError('Không thấy \\end{%s}' % name)


def wrap_small_groups(s):
    """{\\footnotesize ...} ở mức khối → \\begin{smallblock}...\\end{smallblock}."""
    while True:
        m = re.search(r'\{\\footnotesize\s*\n', s)
        if not m:
            return s
        k = match_brace(s, m.start())
        s = s[:m.start()] + '\\begin{smallblock}\n' + s[m.end():k] + '\\end{smallblock}' + s[k + 1:]


# ---------------------------------------------------------------------------
# Đánh số mục / hình / bảng và nhãn (lượt 1)
# ---------------------------------------------------------------------------

LEVELS = {'section': 1, 'subsection': 2, 'subsubsection': 3, 'paragraph': 4}


def collect_labels(body):
    labels = {}
    counters = [0, 0, 0, 0, 0]
    fig = tab = 0
    current = None
    tok = re.compile(r'\\(section|subsection|subsubsection|paragraph)(\*?)\{|\\begin\{(figure|table|longtable)\}|\\caption\{|\\label\{([^}]*)\}')
    env_stack = []
    pos = 0
    for m in tok.finditer(body):
        if m.group(1):
            if m.group(2):
                continue
            lv = LEVELS[m.group(1)]
            counters[lv - 1] += 1
            for k in range(lv, 5):
                counters[k] = 0
            current = '.'.join(str(c) for c in counters[:lv])
        elif m.group(3):
            env_stack.append(m.group(3))
        elif m.group(0).startswith('\\caption'):
            # xác định caption này thuộc hình hay bảng: xem env bao gần nhất
            before = body[:m.start()]
            last_fig = max(before.rfind('\\begin{figure}'), -1)
            last_tab = max(before.rfind('\\begin{table}'), before.rfind('\\begin{longtable}'))
            if last_fig > last_tab:
                fig += 1
                current = str(fig)
            else:
                tab += 1
                current = str(tab)
        elif m.group(4) is not None:
            labels[m.group(4)] = current
    return labels


# ---------------------------------------------------------------------------
# Inline LaTeX → các run
# ---------------------------------------------------------------------------

MATH = {
    r'\rightarrow': '→', r'\le': '≤', r'\ge': '≥', r'\times': '×', r'\Sigma': 'Σ',
    r'\leftarrow': '←', r'\dots': '…', r'\ldots': '…', '-': '−',
}

SIMPLE = {
    '%': '%', '_': '_', '&': '&', '#': '#', '$': '$', '{': '{', '}': '}', ' ': ' ', ',': '\u2009',
}

IGNORE_CMDS = {'centering', 'noindent', 'sloppy', 'normalfont', 'ttfamily', 'bfseries', 'scriptsize',
               'footnotesize', 'small', 'large', 'Large', 'Huge', 'huge', 'normalsize', 'hfill', 'par',
               'mbox', 'medskip', 'smallskip', 'bigskip', 'raggedright', 'protect'}


class Ctx:
    def __init__(self, labels):
        self.labels = labels


def math_text(m):
    m = m.strip()
    out = ''
    i = 0
    while i < len(m):
        if m[i] == '\\':
            j = i + 1
            while j < len(m) and m[j].isalpha():
                j += 1
            name = m[i:j]
            out += MATH.get(name, '')
            i = j
        elif m[i] == '-':
            out += '−'
            i += 1
        elif m[i] in '{}':
            i += 1
        else:
            out += m[i]
            i += 1
    return out


def inline(s, ctx, fmt=None):
    """Trả danh sách (text, fmt) với fmt là dict: b, i, code, link, br."""
    fmt = dict(fmt or {})
    runs = []

    def add(t, f=None):
        if t:
            runs.append((t, dict(f if f is not None else fmt)))

    i = 0
    buf = ''
    code = fmt.get('code')

    def flush():
        nonlocal buf
        if buf:
            add(buf)
            buf = ''

    while i < len(s):
        c = s[i]
        if c == '\\':
            if i + 1 < len(s) and s[i + 1] == '\\':
                flush()
                runs.append(('\n', {'br': True}))
                i += 2
                # bỏ [..] khoảng cách sau \\
                if i < len(s) and s[i] == '[':
                    i = match_bracket(s, i) + 1
                continue
            if i + 1 < len(s) and not s[i + 1].isalpha():
                buf += SIMPLE.get(s[i + 1], s[i + 1])
                i += 2
                continue
            j = i + 1
            while j < len(s) and s[j].isalpha():
                j += 1
            name = s[i + 1:j]
            if j < len(s) and s[j] == '*':
                j += 1
            i = j
            if name in ('textbf', 'bf') and name == 'textbf':
                _, a, i = read_args(s, i, 1, opt=False)
                flush(); runs.extend(inline(a[0], ctx, {**fmt, 'b': True}))
            elif name in ('textit', 'emph'):
                _, a, i = read_args(s, i, 1, opt=False)
                flush(); runs.extend(inline(a[0], ctx, {**fmt, 'i': True}))
            elif name in ('code', 'texttt'):
                _, a, i = read_args(s, i, 1, opt=False)
                flush(); runs.extend(inline(a[0], ctx, {**fmt, 'code': True}))
            elif name == 'href':
                _, a, i = read_args(s, i, 2, opt=False)
                flush(); runs.extend(inline(a[1], ctx, {**fmt, 'link': a[0]}))
            elif name == 'url':
                _, a, i = read_args(s, i, 1, opt=False)
                flush(); add(a[0], {**fmt, 'link': a[0]})
            elif name in ('ref', 'pageref'):
                _, a, i = read_args(s, i, 1, opt=False)
                buf += ctx.labels.get(a[0], '??')
            elif name == 'textcolor':
                _, a, i = read_args(s, i, 2, opt=False)
                flush(); runs.extend(inline(a[1], ctx, {**fmt, 'color': a[0]}))
            elif name == 'todo':
                _, a, i = read_args(s, i, 1, opt=False)
                flush(); runs.extend(inline('[' + a[0] + ']', ctx, {**fmt, 'color': 'red'}))
            elif name == 'must':
                flush(); add('Must', {**fmt, 'b': True})
            elif name == 'should':
                flush(); add('Should', {**fmt, 'i': True})
            elif name == 'could':
                buf += 'Could'
            elif name == 'wont':
                buf += "Won't"
            elif name == 'bf':
                fmt['b'] = True
            elif name in ('label', 'hspace', 'vspace', 'addcontentsline', 'thispagestyle', 'rowcolor'):
                n = 3 if name == 'addcontentsline' else 1
                _, a, i = read_args(s, i, n, opt=False)
            elif name == 'thead':
                pass
            elif name in ('newline', 'linebreak'):
                flush(); runs.append(('\n', {'br': True}))
            elif name in MATH:
                buf += MATH['\\' + name] if ('\\' + name) in MATH else ''
            elif name in IGNORE_CMDS:
                pass
            else:
                # lệnh lạ: giữ nội dung tham số nếu có
                if i < len(s) and s[i] == '{':
                    _, a, i = read_args(s, i, 1, opt=False)
                    flush(); runs.extend(inline(a[0], ctx, fmt))
            # bỏ khoảng trắng ngay sau lệnh không tham số
            continue
        if c == '{':
            k = match_brace(s, i)
            flush(); runs.extend(inline(s[i + 1:k], ctx, fmt))
            i = k + 1
            continue
        if c == '}':
            i += 1
            continue
        if c == '$':
            k = s.index('$', i + 1)
            buf += math_text(s[i + 1:k])
            i = k + 1
            continue
        if c == '~':
            buf += '\u00a0'
            i += 1
            continue
        if not code:
            if s.startswith('---', i):
                buf += '—'; i += 3; continue
            if s.startswith('--', i):
                buf += '–'; i += 2; continue
            if s.startswith('``', i):
                buf += '“'; i += 2; continue
            if s.startswith("''", i):
                buf += '”'; i += 2; continue
            if c == '`':
                buf += '‘'; i += 1; continue
        if c in '\n\t':
            c = ' '
        buf += c
        i += 1
    flush()
    return runs


def normalize_runs(runs):
    """Gộp khoảng trắng liên tiếp, bỏ khoảng trắng đầu/cuối đoạn."""
    out = []
    prev_space = True
    for t, f in runs:
        if f.get('br'):
            # bỏ khoảng trắng cuối trước ngắt dòng
            if out and not out[-1][1].get('br'):
                out[-1] = (out[-1][0].rstrip(' '), out[-1][1])
            out.append((t, f))
            prev_space = True
            continue
        t = re.sub(r'[ ]+', ' ', t)
        if prev_space and t.startswith(' '):
            t = t[1:]
        if not t:
            continue
        prev_space = t.endswith(' ')
        out.append((t, f))
    while out and not out[-1][1].get('br') and out[-1][0].endswith(' '):
        t = out[-1][0].rstrip(' ')
        if t:
            out[-1] = (t, out[-1][1])
            break
        out.pop()
    while out and out[-1][1].get('br'):
        out.pop()
    while out and out[0][1].get('br'):
        out.pop(0)
    return out


# ---------------------------------------------------------------------------
# Tiện ích python-docx
# ---------------------------------------------------------------------------

def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    tcPr.append(shd)


def set_cell_margins(table, top=40, bottom=40, left=80, right=80):
    tblPr = table._tbl.tblPr
    mar = OxmlElement('w:tblCellMar')
    for k, v in (('top', top), ('left', left), ('bottom', bottom), ('right', right)):
        e = OxmlElement('w:' + k)
        e.set(qn('w:w'), str(v))
        e.set(qn('w:type'), 'dxa')
        mar.append(e)
    tblPr.append(mar)


def set_table_borders(table, on=True, color='000000', sz=4):
    tblPr = table._tbl.tblPr
    b = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement('w:' + edge)
        if on:
            e.set(qn('w:val'), 'single')
            e.set(qn('w:sz'), str(sz))
            e.set(qn('w:space'), '0')
            e.set(qn('w:color'), color)
        else:
            e.set(qn('w:val'), 'nil')
        b.append(e)
    tblPr.append(b)


def set_table_fixed(table, widths_cm):
    tbl = table._tbl
    tblPr = tbl.tblPr
    layout = OxmlElement('w:tblLayout')
    layout.set(qn('w:type'), 'fixed')
    tblPr.append(layout)
    tblW = tblPr.find(qn('w:tblW'))
    if tblW is None:
        tblW = OxmlElement('w:tblW'); tblPr.append(tblW)
    tblW.set(qn('w:w'), str(int(sum(widths_cm) * 567)))
    tblW.set(qn('w:type'), 'dxa')
    grid = tbl.tblGrid
    for gc, w in zip(grid.findall(qn('w:gridCol')), widths_cm):
        gc.set(qn('w:w'), str(int(w * 567)))
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            pass
    for tr in tbl.tr_lst:
        col = 0
        for tc in tr.tc_lst:
            span = tc.grid_span
            w = sum(widths_cm[col:col + span])
            tcPr = tc.get_or_add_tcPr()
            tcW = tcPr.find(qn('w:tcW'))
            if tcW is None:
                tcW = OxmlElement('w:tcW'); tcPr.insert(0, tcW)
            tcW.set(qn('w:w'), str(int(w * 567)))
            tcW.set(qn('w:type'), 'dxa')
            col += span


def mark_header_row(row):
    trPr = row._tr.get_or_add_trPr()
    e = OxmlElement('w:tblHeader')
    e.set(qn('w:val'), 'true')
    trPr.append(e)


def cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    e = OxmlElement('w:cantSplit')
    e.set(qn('w:val'), 'true')
    trPr.append(e)


def add_field(paragraph, instr, placeholder='', size=None, bold=False):
    """Chèn một field Word (PAGE, NUMPAGES, TOC, SEQ ...)."""
    def r_el():
        r = OxmlElement('w:r')
        if size or bold:
            rPr = OxmlElement('w:rPr')
            if bold:
                rPr.append(OxmlElement('w:b'))
            if size:
                sz = OxmlElement('w:sz'); sz.set(qn('w:val'), str(int(size * 2))); rPr.append(sz)
            r.append(rPr)
        return r
    r1 = r_el(); fc = OxmlElement('w:fldChar'); fc.set(qn('w:fldCharType'), 'begin'); r1.append(fc)
    r2 = r_el(); it = OxmlElement('w:instrText'); it.set(qn('xml:space'), 'preserve'); it.text = ' %s ' % instr; r2.append(it)
    r3 = r_el(); fc = OxmlElement('w:fldChar'); fc.set(qn('w:fldCharType'), 'separate'); r3.append(fc)
    r4 = r_el(); t = OxmlElement('w:t'); t.set(qn('xml:space'), 'preserve'); t.text = placeholder; r4.append(t)
    r5 = r_el(); fc = OxmlElement('w:fldChar'); fc.set(qn('w:fldCharType'), 'end'); r5.append(fc)
    for r in (r1, r2, r3, r4, r5):
        paragraph._p.append(r)


def add_hyperlink(paragraph, url, text, fmt, size):
    part = paragraph.part
    rid = part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    h = OxmlElement('w:hyperlink')
    h.set(qn('r:id'), rid)
    r = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    if fmt.get('code'):
        rf = OxmlElement('w:rFonts')
        for k in ('w:ascii', 'w:hAnsi', 'w:cs'):
            rf.set(qn(k), CODE_FONT)
        rPr.append(rf)
    if fmt.get('b'):
        rPr.append(OxmlElement('w:b'))
    col = OxmlElement('w:color'); col.set(qn('w:val'), '0563C1'); rPr.append(col)
    u = OxmlElement('w:u'); u.set(qn('w:val'), 'single'); rPr.append(u)
    sz = OxmlElement('w:sz'); sz.set(qn('w:val'), str(int(round((size * 0.9 if fmt.get('code') else size) * 2)))); rPr.append(sz)
    r.append(rPr)
    t = OxmlElement('w:t'); t.set(qn('xml:space'), 'preserve'); t.text = text
    r.append(t)
    h.append(r)
    paragraph._p.append(h)


def write_runs(p, runs, size=BODY_PT, base=None):
    base = base or {}
    for t, f in runs:
        f = {**base, **f}
        if f.get('br'):
            p.add_run().add_break()
            continue
        if f.get('link'):
            add_hyperlink(p, f['link'], t, f, size)
            continue
        r = p.add_run(t)
        if f.get('b'):
            r.bold = True
        if f.get('i'):
            r.italic = True
        if f.get('code'):
            r.font.name = CODE_FONT
            r._element.rPr.rFonts.set(qn('w:hAnsi'), CODE_FONT)
            r.font.size = Pt(size * 0.9)
        else:
            r.font.size = Pt(size)
        if f.get('color') == 'red':
            r.font.color.rgb = RGBColor(0xC0, 0, 0)


def para_fmt(p, before=0, after=6, align=None, line=1.15, keep_next=False, indent_cm=None):
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    if align is not None:
        p.alignment = align
    if keep_next:
        pf.keep_with_next = True
    if indent_cm is not None:
        pf.left_indent = Cm(indent_cm)


# ---------------------------------------------------------------------------
# Bộ dựng tài liệu
# ---------------------------------------------------------------------------

class Builder:
    def __init__(self, labels):
        self.ctx = Ctx(labels)
        self.doc = Document()
        self.counters = [0, 0, 0, 0, 0]
        self.fig = 0
        self.tab = 0
        self.small = False
        self.setup_styles()
        self.setup_numbering()
        os.makedirs(TMP, exist_ok=True)

    # ---- styles ----
    def setup_styles(self):
        st = self.doc.styles
        normal = st['Normal']
        normal.font.name = BODY_FONT
        normal.font.size = Pt(BODY_PT)
        rpr = normal.element.get_or_add_rPr()
        rf = rpr.find(qn('w:rFonts'))
        for k in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
            rf.set(qn(k), BODY_FONT)
        normal.paragraph_format.space_after = Pt(6)
        normal.paragraph_format.line_spacing = 1.15
        sizes = {1: 16, 2: 14, 3: 13, 4: 12}
        for lv, sz in sizes.items():
            h = st['Heading %d' % lv]
            h.font.name = BODY_FONT
            h.font.size = Pt(sz)
            h.font.bold = True
            h.font.italic = False
            h.font.color.rgb = RGBColor(0, 0, 0)
            hr = h.element.get_or_add_rPr()
            hf = hr.find(qn('w:rFonts'))
            if hf is None:
                hf = OxmlElement('w:rFonts'); hr.append(hf)
            for k in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
                hf.set(qn(k), BODY_FONT)
            for a in ('w:asciiTheme', 'w:hAnsiTheme', 'w:cstheme', 'w:eastAsiaTheme'):
                if hf.get(qn(a)) is not None:
                    del hf.attrib[qn(a)]
            h.paragraph_format.space_before = Pt({1: 18, 2: 14, 3: 10, 4: 8}[lv])
            h.paragraph_format.space_after = Pt(6)
            h.paragraph_format.keep_with_next = True
        cap = st['Caption']
        cap.font.name = BODY_FONT
        cap.font.size = Pt(11)
        cap.font.bold = False
        cap.font.italic = False
        cap.font.color.rgb = RGBColor(0, 0, 0)
        for name in ('TOC 1', 'TOC 2', 'TOC 3', 'Table of Figures'):
            try:
                s = st[name]
            except KeyError:
                from docx.enum.style import WD_STYLE_TYPE
                s = st.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
                s.base_style = normal
            s.font.name = BODY_FONT
            s.font.size = Pt(12)
        for k, ind in (('TOC 2', 0.6), ('TOC 3', 1.2)):
            st[k].paragraph_format.left_indent = Cm(ind)
        st['TOC 1'].font.bold = True

    def setup_numbering(self):
        """Tạo định nghĩa danh sách dấu đầu dòng 3 cấp (•, –, ∗)."""
        numbering = self.doc.part.numbering_part.element
        abs_id = 90
        an = OxmlElement('w:abstractNum')
        an.set(qn('w:abstractNumId'), str(abs_id))
        for lvl, (char, font) in enumerate((('•', 'Times New Roman'), ('–', 'Times New Roman'), ('∗', 'Times New Roman'))):
            l = OxmlElement('w:lvl'); l.set(qn('w:ilvl'), str(lvl))
            e = OxmlElement('w:start'); e.set(qn('w:val'), '1'); l.append(e)
            e = OxmlElement('w:numFmt'); e.set(qn('w:val'), 'bullet'); l.append(e)
            e = OxmlElement('w:lvlText'); e.set(qn('w:val'), char); l.append(e)
            e = OxmlElement('w:lvlJc'); e.set(qn('w:val'), 'left'); l.append(e)
            pPr = OxmlElement('w:pPr')
            ind = OxmlElement('w:ind'); ind.set(qn('w:left'), str(567 * (lvl + 1))); ind.set(qn('w:hanging'), '340')
            pPr.append(ind); l.append(pPr)
            rPr = OxmlElement('w:rPr'); rf = OxmlElement('w:rFonts')
            rf.set(qn('w:ascii'), font); rf.set(qn('w:hAnsi'), font); rPr.append(rf); l.append(rPr)
            an.append(l)
        # abstractNum phải đứng trước các w:num
        first_num = numbering.find(qn('w:num'))
        if first_num is not None:
            first_num.addprevious(an)
        else:
            numbering.append(an)
        num = OxmlElement('w:num'); num.set(qn('w:numId'), '90')
        a = OxmlElement('w:abstractNumId'); a.set(qn('w:val'), str(abs_id)); num.append(a)
        numbering.append(num)
        self.bullet_num = 90

    def set_bullet(self, p, level):
        pPr = p._p.get_or_add_pPr()
        numPr = OxmlElement('w:numPr')
        il = OxmlElement('w:ilvl'); il.set(qn('w:val'), str(level)); numPr.append(il)
        ni = OxmlElement('w:numId'); ni.set(qn('w:val'), str(self.bullet_num)); numPr.append(ni)
        pPr.append(numPr)

    # ---- page layout ----
    def setup_section(self, sec):
        sec.page_width = Cm(PAGE_W)
        sec.page_height = Cm(PAGE_H)
        sec.left_margin = Cm(MARGIN_L)
        sec.right_margin = Cm(MARGIN_R)
        sec.top_margin = Cm(MARGIN_T + 0.5)
        sec.bottom_margin = Cm(MARGIN_B + 0.3)
        sec.header_distance = Cm(1.0)
        sec.footer_distance = Cm(1.0)

    def build_header_footer(self, sec, text_w=TEXT_W):
        hdr = sec.header
        hdr.is_linked_to_previous = True   # bỏ tham chiếu header cũ (nếu sectPr được sao chép)
        hdr.is_linked_to_previous = False
        p = hdr.paragraphs[0]
        tbl = hdr.add_table(rows=1, cols=3, width=Cm(text_w))
        set_table_borders(tbl, on=False)
        widths = [1.2, 8.0, text_w - 9.2]
        c0, c1, c2 = tbl.rows[0].cells
        c0.paragraphs[0].add_run().add_picture(os.path.join(HERE, 'logoITSGUsmall.png'), width=Cm(0.9), height=Cm(0.9))
        for txt in ('Trường Đại học Sài Gòn', 'Khoa Công Nghệ Thông Tin'):
            q = c1.paragraphs[0] if not c1.paragraphs[0].text else c1.add_paragraph()
            r = q.add_run(txt); r.bold = True; r.font.size = Pt(10); r.font.name = CODE_FONT
            para_fmt(q, after=0, line=1.0)
        for idx, txt in enumerate(('BrewLite – Assignment 2', 'Requirements to Deployment')):
            q = c2.paragraphs[0] if idx == 0 else c2.add_paragraph()
            r = q.add_run(txt); r.font.size = Pt(8); r.font.name = CODE_FONT; r.bold = idx == 0
            para_fmt(q, after=0, line=1.0, align=WD_ALIGN_PARAGRAPH.RIGHT)
        for c in (c0, c1, c2):
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_table_fixed(tbl, widths)
        # đường kẻ dưới header
        hp = hdr.add_paragraph()
        para_fmt(hp, after=0, line=1.0)
        self.bottom_border(hp)
        hp.paragraph_format.space_after = Pt(0)
        rr = hp.add_run(); rr.font.size = Pt(2)
        p._p.getparent().remove(p._p)

        ftr = sec.footer
        ftr.is_linked_to_previous = True
        ftr.is_linked_to_previous = False
        fp = ftr.paragraphs[0]
        self.top_border(fp)
        fp.paragraph_format.tab_stops.add_tab_stop(Cm(text_w), WD_TAB_ALIGNMENT.RIGHT)
        r = fp.add_run('Bài tập lớn môn Công nghệ Phần mềm - Học kỳ I, năm học 2026-2027')
        r.font.size = Pt(8); r.font.name = CODE_FONT
        r = fp.add_run('\tTrang '); r.font.size = Pt(8); r.font.name = CODE_FONT
        add_field(fp, 'PAGE', '1', size=8)
        r = fp.add_run('/'); r.font.size = Pt(8); r.font.name = CODE_FONT
        add_field(fp, 'NUMPAGES', '1', size=8)

    def bottom_border(self, p, color='000000'):
        pPr = p._p.get_or_add_pPr()
        bdr = OxmlElement('w:pBdr')
        b = OxmlElement('w:bottom'); b.set(qn('w:val'), 'single'); b.set(qn('w:sz'), '4'); b.set(qn('w:space'), '1'); b.set(qn('w:color'), color)
        bdr.append(b); pPr.append(bdr)

    def top_border(self, p):
        pPr = p._p.get_or_add_pPr()
        bdr = OxmlElement('w:pBdr')
        b = OxmlElement('w:top'); b.set(qn('w:val'), 'single'); b.set(qn('w:sz'), '4'); b.set(qn('w:space'), '1'); b.set(qn('w:color'), '000000')
        bdr.append(b); pPr.append(bdr)

    # ---- title page ----
    def title_page(self):
        d = self.doc
        sec = d.sections[0]
        self.setup_section(sec)
        sec.different_first_page_header_footer = True
        self.build_header_footer(sec)

        def line(text, size=12, bold=False, before=0, after=0):
            p = d.add_paragraph()
            para_fmt(p, before=before, after=after, align=WD_ALIGN_PARAGRAPH.CENTER, line=1.15)
            r = p.add_run(text); r.bold = bold; r.font.size = Pt(size)
            return p
        line('TRƯỜNG ĐẠI HỌC SÀI GÒN', 13)
        line('KHOA CÔNG NGHỆ THÔNG TIN', 13, after=30)
        p = d.add_paragraph(); para_fmt(p, align=WD_ALIGN_PARAGRAPH.CENTER, after=30)
        p.add_run().add_picture(os.path.join(HERE, 'logoITSGU.png'), width=Cm(3.2))
        p = line('CÔNG NGHỆ PHẦN MỀM', 17, True, after=8)
        self.bottom_border(line('', 6))
        line('Bài tập lớn – Assignment 2', 17, True, before=14, after=12)
        line('BrewLite', 26, True, after=12)
        line('Hệ thống đặt cà phê mobile-first/PWA', 14)
        line('và thanh toán mô phỏng', 14, after=12)
        p = line('REQUIREMENTS TO DEPLOYMENT', 12, True, after=8)
        self.bottom_border(line('', 6))
        d.add_paragraph().paragraph_format.space_after = Pt(40)
        info = [('GVHD:', 'Từ Lãng Phiêu'), ('SV:', 'Phạm Duy Đăng - 3124410068'),
                ('Lớp:', 'DCT1245 - K24'), ('Ngành:', 'Công nghệ Thông tin')]
        t = d.add_table(rows=len(info), cols=2)
        set_table_borders(t, on=False)
        for row, (k, v) in zip(t.rows, info):
            row.cells[0].paragraphs[0].add_run(k).font.size = Pt(13)
            row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
            row.cells[1].paragraphs[0].add_run(v).font.size = Pt(13)
            for c in row.cells:
                para_fmt(c.paragraphs[0], after=2)
        set_table_fixed(t, [9.0, 7.0])
        sp = d.add_paragraph(); sp.paragraph_format.space_after = Pt(70)
        p = line('TP. HỒ CHÍ MINH, THÁNG 11/2026', 10)
        self.page_break()

    # ---- primitives ----
    def page_break(self):
        body = self.doc.element.body
        last = body[-2] if len(body) > 1 else None  # phần tử cuối trước sectPr
        if last is not None and last.tag == qn('w:p') and last.xpath('.//w:br[@w:type="page"]'):
            return
        if last is not None and last.tag == qn('w:p') and last.xpath('./w:pPr/w:sectPr'):
            return
        p = self.doc.add_paragraph()
        para_fmt(p, after=0, line=1.0)
        p.add_run().add_break(WD_BREAK.PAGE)

    def paragraph(self, text, align=None, indent=None, size=None):
        runs = normalize_runs(inline(text, self.ctx))
        if not runs:
            return None
        p = self.doc.add_paragraph()
        para_fmt(p, after=6, align=align if align is not None else WD_ALIGN_PARAGRAPH.JUSTIFY, indent_cm=indent)
        write_runs(p, runs, size or (SMALL_PT + 1 if self.small else BODY_PT))
        return p

    def heading(self, kind, star, title, label=None):
        lv = LEVELS[kind]
        runs = normalize_runs(inline(title, self.ctx))
        if star:
            num = ''
        else:
            self.counters[lv - 1] += 1
            for k in range(lv, 5):
                self.counters[k] = 0
            num = '.'.join(str(c) for c in self.counters[:lv])
        if kind == 'paragraph':
            return ('runin', num, runs)
        if star and kind == 'subsubsection':
            p = self.doc.add_paragraph()
            para_fmt(p, before=8, after=4, keep_next=True)
            write_runs(p, runs, 12.5, base={'b': True})
            return None
        p = self.doc.add_paragraph(style='Heading %d' % lv)
        if num:
            r = p.add_run(num + '\u2003')
        write_runs(p, runs, {1: 16, 2: 14, 3: 13}[lv])
        return None

    def caption(self, kind, text):
        if kind == 'fig':
            self.fig += 1; n = self.fig; word = 'Hình'
        else:
            self.tab += 1; n = self.tab; word = 'Bảng'
        p = self.doc.add_paragraph(style='Caption')
        para_fmt(p, before=4 if kind == 'fig' else 8, after=8 if kind == 'fig' else 4,
                 align=WD_ALIGN_PARAGRAPH.CENTER, keep_next=(kind == 'tab'), line=1.1)
        p.add_run(word + ' ')
        add_field(p, 'SEQ %s \\* ARABIC' % word, str(n))
        p.add_run(': ')
        write_runs(p, normalize_runs(inline(text, self.ctx)), 11)
        return p

    def image(self, path, width_cm, max_h_cm=None, crop=None, rotate=False):
        src = os.path.join(HERE, path)
        im = Image.open(src)
        name = os.path.basename(path)
        if crop or rotate:
            if crop:
                top, bottom = crop
                w, h = im.size
                im = im.crop((0, int(h * top), w, int(h * (1 - bottom))))
            if rotate:
                im = im.rotate(90, expand=True)
            name = '%s-%s%s.png' % (os.path.splitext(name)[0], 'crop%d' % int(crop[0] * 1000) if crop else '', 'rot' if rotate else '')
            src = os.path.join(TMP, name)
            if im.mode not in ('RGB', 'RGBA', 'L'):
                im = im.convert('RGB')
            im.save(src)
        w, h = im.size
        width = width_cm
        if max_h_cm and width * h / w > max_h_cm:
            width = max_h_cm * w / h
        p = self.doc.add_paragraph()
        para_fmt(p, before=4, after=2, align=WD_ALIGN_PARAGRAPH.CENTER, keep_next=True, line=1.0)
        p.add_run().add_picture(src, width=Cm(width))
        return p

    # ---- tables ----
    def parse_colspec(self, spec):
        cols = []
        bars = '|' in spec
        i = 0
        while i < len(spec):
            c = spec[i]
            if c in 'lcrX':
                cols.append((c, None))
            elif c in 'pmb' and i + 1 < len(spec) and spec[i + 1] == '{':
                k = match_brace(spec, i + 1)
                w = spec[i + 2:k]
                cols.append(('p', float(re.match(r'([\d.]+)', w).group(1))))
                i = k
            elif c == '>' or c == '<':
                k = match_brace(spec, i + 1); i = k
            i += 1
        return cols, bars

    def split_top(self, s, sep):
        parts, depth, cur, i = [], 0, '', 0
        while i < len(s):
            c = s[i]
            if c == '\\':
                if s.startswith('\\\\', i) and sep == '\\\\' and depth == 0:
                    parts.append(cur); cur = ''; i += 2
                    if i < len(s) and s[i] == '[':
                        i = match_bracket(s, i) + 1
                    continue
                cur += s[i:i + 2]; i += 2; continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
            elif c == '$' :
                k = s.index('$', i + 1); cur += s[i:k + 1]; i = k + 1; continue
            if sep == '&' and c == '&' and depth == 0:
                parts.append(cur); cur = ''; i += 1; continue
            cur += c
            i += 1
        parts.append(cur)
        return parts

    def table(self, spec, content, long=False, caption_text=None, center=True, small=False):
        cols, bars = self.parse_colspec(spec)
        # longtable: tách caption, bỏ phần header lặp
        cap = None
        if long:
            m = re.search(r'\\caption\{', content)
            if m and m.start() < (content.find('\\endfirsthead') if '\\endfirsthead' in content else len(content)):
                k = match_brace(content, m.end() - 1)
                cap = content[m.end():k]
                rest = content[k + 1:]
                rest = re.sub(r'^\s*\\label\{[^}]*\}', '', rest)
                rest = re.sub(r'^\s*\\\\', '', rest)
                content = content[:m.start()] + rest
            if '\\endfirsthead' in content:
                a, b = content.split('\\endfirsthead', 1)
                if '\\endhead' in b:
                    b = b.split('\\endhead', 1)[1]
                content = a + '\\\\' + b
            content = content.replace('\\endhead', '\\\\').replace('\\endfoot', '').replace('\\endlastfoot', '')
        if cap is not None:
            self.caption('tab', cap)
        elif caption_text is not None:
            self.caption('tab', caption_text)
        content = content.replace('\\hline', '').replace('\\toprule', '').replace('\\midrule', '').replace('\\bottomrule', '')
        rows_src = [r for r in self.split_top(content, '\\\\') if r.strip()]
        rows = []
        for r in rows_src:
            header = '\\thead' in r
            r = r.replace('\\thead', '')
            cells = self.split_top(r, '&')
            parsed = []
            for c in cells:
                c = c.strip()
                m = re.match(r'\\multicolumn\{(\d+)\}\{([^}]*)\}\{', c)
                if m:
                    k = match_brace(c, m.end() - 1)
                    al = re.sub(r'[|]', '', m.group(2))
                    parsed.append((int(m.group(1)), c[m.end():k], al))
                else:
                    parsed.append((1, c, None))
            rows.append((header, parsed))
        ncols = len(cols)
        # bề rộng cột
        fs = SMALL_PT if small else TABLE_PT
        char_cm = fs * 0.0185
        widths = [None] * ncols
        est = [0.0] * ncols
        for _, cells in rows:
            col = 0
            for span, txt, _ in cells:
                if span == 1 and col < ncols:
                    plain = ''.join(t for t, f in normalize_runs(inline(txt, self.ctx)) if not f.get('br'))
                    longest_line = max([len(x) for x in re.split(r'\n', plain)] or [0])
                    est[col] = max(est[col], longest_line * char_cm + 0.45)
                col += span
        for idx, (t, w) in enumerate(cols):
            if t == 'p':
                widths[idx] = w + 0.25
            elif t in 'lcr':
                widths[idx] = max(0.9, min(est[idx], 6.5))
        fixed = sum(w for w in widths if w is not None)
        nx = sum(1 for t, _ in cols if t == 'X')
        if nx:
            rem = max(TEXT_W - fixed, 2.5 * nx)
            for idx, (t, _) in enumerate(cols):
                if t == 'X':
                    widths[idx] = rem / nx
        total = sum(widths)
        if total > TEXT_W or (long and total > TEXT_W * 0.97):
            widths = [w * TEXT_W / total for w in widths]
        tbl = self.doc.add_table(rows=0, cols=ncols)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER if center else WD_TABLE_ALIGNMENT.LEFT
        set_table_borders(tbl, on=bars)
        set_cell_margins(tbl)
        header_done = False
        for ri, (header, cells) in enumerate(rows):
            row = tbl.add_row()
            if len(rows) <= 25 or header:
                cant_split(row)
            col = 0
            for span, txt, al in cells:
                if col >= ncols:
                    break
                cell = row.cells[col]
                if span > 1:
                    cell = cell.merge(row.cells[min(col + span - 1, ncols - 1)])
                kind = al or (cols[col][0] if col < ncols else 'l')
                p = cell.paragraphs[0]
                align = {'c': WD_ALIGN_PARAGRAPH.CENTER, 'r': WD_ALIGN_PARAGRAPH.RIGHT}.get(kind, WD_ALIGN_PARAGRAPH.LEFT)
                if header:
                    align = WD_ALIGN_PARAGRAPH.CENTER if kind != 'l' or bars else WD_ALIGN_PARAGRAPH.LEFT
                para_fmt(p, after=0, line=1.05, align=align)
                write_runs(p, normalize_runs(inline(txt, self.ctx)), fs)
                if header:
                    set_cell_shading(cell, HEAD_FILL)
                cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER if header else WD_CELL_VERTICAL_ALIGNMENT.TOP
                col += span
            if header and not header_done and ri == 0:
                mark_header_row(row)
                header_done = True
            if header or ri == 0:
                for c in row.cells:
                    for q in c.paragraphs:
                        q.paragraph_format.keep_with_next = True
        set_table_fixed(tbl, widths)
        after = self.doc.add_paragraph()
        para_fmt(after, after=2, line=1.0)
        after.add_run().font.size = Pt(4)
        return tbl

    # ---- tikz: chuỗi hộp ----
    def tikz(self, src):
        nodes = []
        for m in re.finditer(r'\\node\[([^\]]*)\]\s*\((\w+)\)\s*\{', src):
            k = match_brace(src, m.end() - 1)
            opts = m.group(1)
            style = opts.split(',')[0].strip()
            below = re.search(r'below=[^,]*of (\w+)', opts)
            nodes.append({'name': m.group(2), 'style': style, 'text': src[m.end():k],
                          'below': below.group(1) if below else None})
        row1 = [n for n in nodes if not n['below']]
        row2 = [n for n in nodes if n['below']]
        ncols = len(row1) * 2 - 1
        nrows = 1 + (2 if row2 else 0)
        tbl = self.doc.add_table(rows=nrows, cols=ncols)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, on=False)
        set_cell_margins(tbl, 60, 60, 40, 40)
        box_w = min(2.4, (TEXT_W - 0.6 * (len(row1) - 1)) / len(row1))
        widths = []
        for i in range(ncols):
            widths.append(box_w if i % 2 == 0 else 0.6)

        def fill_box(cell, node):
            fill, line = (BREW_LIGHT, '7A4A1E') if node['style'] != 'prod' else ('E6F2F2', '1F6F6F')
            set_cell_shading(cell, fill)
            tcPr = cell._tc.get_or_add_tcPr()
            b = OxmlElement('w:tcBorders')
            for e in ('top', 'left', 'bottom', 'right'):
                x = OxmlElement('w:' + e); x.set(qn('w:val'), 'single'); x.set(qn('w:sz'), '8'); x.set(qn('w:color'), line)
                b.append(x)
            tcPr.append(b)
            p = cell.paragraphs[0]
            para_fmt(p, after=0, line=1.0, align=WD_ALIGN_PARAGRAPH.CENTER)
            write_runs(p, normalize_runs(inline(node['text'], self.ctx)), 9, base={'b': True})
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

        for i, n in enumerate(row1):
            fill_box(tbl.rows[0].cells[i * 2], n)
            if i < len(row1) - 1:
                c = tbl.rows[0].cells[i * 2 + 1]
                p = c.paragraphs[0]; para_fmt(p, after=0, line=1.0, align=WD_ALIGN_PARAGRAPH.CENTER)
                r = p.add_run('→'); r.bold = True; r.font.size = Pt(14)
                c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        if row2:
            names = [n['name'] for n in row1]
            for n in row2:
                col = names.index(n['below']) * 2
                # hộp hàng dưới chiếm 3 ô (cột của node gốc ± 1)
                lo, hi = max(0, col - 1), min(ncols - 1, col + 1)
                cell = tbl.rows[2].cells[lo].merge(tbl.rows[2].cells[hi])
                fill_box(cell, n)
            for c in tbl.rows[1].cells:
                c.paragraphs[0].paragraph_format.space_after = Pt(0)
                c.paragraphs[0].add_run().font.size = Pt(3)
        set_table_fixed(tbl, widths)
        p = self.doc.add_paragraph(); para_fmt(p, after=4)

    # ---- lists ----
    def lst(self, content, level=0, description=False):
        # tách theo \item ở mức ngoài cùng
        items = []
        i = 0
        depth = 0
        pat = re.compile(r'\\begin\{(itemize|enumerate|description)\}|\\end\{(itemize|enumerate|description)\}|\\item\b')
        last = None
        for m in pat.finditer(content):
            if m.group(1):
                depth += 1
            elif m.group(2):
                depth -= 1
            elif depth == 0:
                if last is not None:
                    items.append(content[last:m.start()])
                last = m.end()
        if last is not None:
            items.append(content[last:])
        for it in items:
            label = None
            s = it
            if s.lstrip().startswith('['):
                s = s.lstrip()
                k = match_bracket(s, 0)
                label = s[1:k]
                s = s[k + 1:]
            # nội dung lồng danh sách con
            sub = re.search(r'\\begin\{(itemize|enumerate|description)\}', s)
            head, tail = (s, '') if not sub else (s[:sub.start()], s[sub.start():])
            if description:
                p = self.doc.add_paragraph()
                if label:
                    para_fmt(p, after=3, indent_cm=1.6, align=WD_ALIGN_PARAGRAPH.LEFT)
                    p.paragraph_format.first_line_indent = Cm(-1.6)
                    p.paragraph_format.tab_stops.add_tab_stop(Cm(1.6))
                    write_runs(p, normalize_runs(inline(label, self.ctx, {'code': True})), BODY_PT)
                    p.add_run('\t')
                else:
                    para_fmt(p, before=6, after=3, keep_next=True, align=WD_ALIGN_PARAGRAPH.LEFT)
                write_runs(p, normalize_runs(inline(head, self.ctx)), BODY_PT)
            else:
                p = self.doc.add_paragraph()
                self.set_bullet(p, level)
                para_fmt(p, after=2, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
                write_runs(p, normalize_runs(inline(head, self.ctx)), SMALL_PT + 1 if self.small else BODY_PT)
            if tail:
                self.blocks(tail, level=level + 1)

    def listing(self, code, size=8.5):
        lines = code.strip('\n').split('\n')
        tbl = self.doc.add_table(rows=1, cols=1)
        set_table_borders(tbl, on=True, color='808080')
        set_cell_margins(tbl, 60, 60, 100, 100)
        cell = tbl.rows[0].cells[0]
        set_cell_shading(cell, 'F7F7F7')
        p = cell.paragraphs[0]
        for li, ln in enumerate(lines):
            if li:
                p = cell.add_paragraph()
            para_fmt(p, after=0, line=1.0, align=WD_ALIGN_PARAGRAPH.LEFT)
            r = p.add_run(ln if ln else ' ')
            r.font.name = CODE_FONT
            r._element.rPr.rFonts.set(qn('w:hAnsi'), CODE_FONT)
            r.font.size = Pt(size)
        set_table_fixed(tbl, [TEXT_W])
        q = self.doc.add_paragraph(); para_fmt(q, after=4)

    # ---- float ----
    def figure(self, content):
        content = content.replace('\\centering', '')
        minis = list(re.finditer(r'\\begin\{minipage\}', content))
        caps = []
        if minis:
            imgs = re.findall(r'\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}', content)
            tbl = self.doc.add_table(rows=1, cols=len(imgs) * 2 - 1)
            set_table_borders(tbl, on=False)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            w = 4.6
            widths = []
            for i, path in enumerate(imgs):
                c = tbl.rows[0].cells[i * 2]
                p = c.paragraphs[0]; para_fmt(p, after=0, align=WD_ALIGN_PARAGRAPH.CENTER)
                p.add_run().add_picture(os.path.join(HERE, path), width=Cm(w))
                widths.append(w + 0.3)
                if i < len(imgs) - 1:
                    widths.append(1.0)
            set_table_fixed(tbl, widths)
        else:
            m = re.search(r'\\includegraphics(?:\[([^\]]*)\])?\{([^}]*)\}', content)
            a = re.search(r'\\adjustimage\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\{([^}]*)\}', content)
            if a:
                opts, path = a.group(1), a.group(2)
                t = re.search(r'trim=0 \{?([\d.]+)?\\?h?e?i?g?h?t?\}? 0 \{?([\d.]+)?', opts)
                tm = re.search(r'trim=(\S+) (\S+) (\S+) (\S+?),', opts)
                def frac(x):
                    mm = re.search(r'([\d.]+)\\height', x)
                    return float(mm.group(1)) if mm else 0.0
                bottom, top = frac(tm.group(2)), frac(tm.group(4))
                hfrac = re.search(r'height=([\d.]+)\\textheight', opts)
                self.image(path, TEXT_W, max_h_cm=(float(hfrac.group(1)) if hfrac else 0.85) * TEXT_H, crop=(top, bottom))
            elif m:
                opts = m.group(1) or ''
                path = m.group(2)
                wm = re.search(r'width=([\d.]*)\\(textwidth|linewidth)', opts)
                width = (float(wm.group(1)) if wm and wm.group(1) else 1.0) * TEXT_W if wm else TEXT_W
                hm = re.search(r'height=([\d.]+)\\textheight', opts)
                maxh = float(hm.group(1)) * TEXT_H if hm else TEXT_H * 0.92
                rotate = 'angle=90' in content
                if rotate:
                    self.landscape_image(path)
                else:
                    self.image(path, width, max_h_cm=maxh)
        cm = re.search(r'\\caption\{', content)
        if cm:
            k = match_brace(content, cm.end() - 1)
            self.caption('fig', content[cm.end():k])
            if 'angle=90' in content:
                self.end_landscape()

    def landscape_image(self, path):
        """Hình rất rộng: đặt vào một section ngang riêng."""
        d = self.doc
        new = d.add_section(WD_SECTION.NEW_PAGE)
        new.orientation = WD_ORIENT.LANDSCAPE
        new.different_first_page_header_footer = False
        new.page_width, new.page_height = Cm(PAGE_H), Cm(PAGE_W)
        new.left_margin = Cm(2.0); new.right_margin = Cm(2.0)
        new.top_margin = Cm(MARGIN_T + 0.5); new.bottom_margin = Cm(MARGIN_B + 0.3)
        self._landscape_w = PAGE_H - 4.0
        self.build_header_footer(new, self._landscape_w)
        # header/footer kế thừa section trước; chỉnh lại tab phải của footer theo khổ ngang
        src = os.path.join(HERE, path)
        im = Image.open(src)
        w, h = im.size
        width = self._landscape_w
        maxh = PAGE_W - MARGIN_T - MARGIN_B - 5.0
        if width * h / w > maxh:
            width = maxh * w / h
        p = d.add_paragraph()
        para_fmt(p, before=0, after=2, align=WD_ALIGN_PARAGRAPH.CENTER, keep_next=True, line=1.0)
        p.add_run().add_picture(src, width=Cm(width))

    def end_landscape(self):
        d = self.doc
        new = d.add_section(WD_SECTION.NEW_PAGE)
        new.orientation = WD_ORIENT.PORTRAIT
        new.different_first_page_header_footer = False
        self.setup_section(new)
        self.build_header_footer(new, TEXT_W)

    def float_table(self, content):
        content = content.replace('\\centering', '')
        cm = re.search(r'\\caption\{', content)
        cap = None
        if cm:
            k = match_brace(content, cm.end() - 1)
            cap = content[cm.end():k]
            content = content[:cm.start()] + content[k + 1:]
        m = re.search(r'\\begin\{(tabularx|tabular)\}', content)
        if not m:
            return
        env = m.group(1)
        i = m.end()
        n = 2 if env == 'tabularx' else 1
        _, args, j = read_args(content, i, n, opt=False)
        spec = args[-1]
        e0, e1 = find_env_end(content, env, j)
        self.table(spec, content[j:e0], caption_text=cap, small=self.small)

    # ---- bibliography ----
    def bibliography(self, content):
        p = self.doc.add_paragraph(style='Heading 1')
        p.add_run('Tài liệu tham khảo')
        items = re.split(r'\\bibitem\{[^}]*\}', content)[1:]
        for n, it in enumerate(items, 1):
            q = self.doc.add_paragraph()
            para_fmt(q, after=4, indent_cm=1.0, align=WD_ALIGN_PARAGRAPH.LEFT)
            q.paragraph_format.first_line_indent = Cm(-1.0)
            q.paragraph_format.tab_stops.add_tab_stop(Cm(1.0))
            q.add_run('[%d]\t' % n)
            write_runs(q, normalize_runs(inline(it, self.ctx)), BODY_PT)

    def toc_page(self):
        d = self.doc
        def title(t):
            p = d.add_paragraph()
            para_fmt(p, before=6, after=12)
            r = p.add_run(t); r.bold = True; r.font.size = Pt(18)
        title('Mục lục')
        p = d.add_paragraph()
        add_field(p, 'TOC \\o "1-3" \\h \\z \\u', 'Nhấn chuột phải → Update Field để tạo mục lục.')
        self.page_break()
        title('Danh sách hình vẽ')
        p = d.add_paragraph()
        add_field(p, 'TOC \\h \\z \\c "Hình"', 'Nhấn chuột phải → Update Field để tạo danh sách hình.')
        title('Danh sách bảng')
        p = d.add_paragraph()
        add_field(p, 'TOC \\h \\z \\c "Bảng"', 'Nhấn chuột phải → Update Field để tạo danh sách bảng.')

    # ---- bộ duyệt khối ----
    BLOCK = re.compile(
        r'\\begin\{([a-zA-Z*]+)\}'
        r'|\\(section|subsection|subsubsection|paragraph)(\*?)\{'
        r'|\\(newpage|clearpage|tableofcontents|listoffigures|listoftables)\b'
        r'|\n[ \t]*\n')

    def blocks(self, s, level=0, align=None):
        pos = 0
        buf = ''
        pending_runin = None

        def flush():
            nonlocal buf, pending_runin
            txt = buf
            buf = ''
            if pending_runin:
                num, runs = pending_runin
                pending_runin = None
                body = normalize_runs(inline(txt, self.ctx))
                p = self.doc.add_paragraph()
                para_fmt(p, before=6, after=6, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
                if num:
                    r = p.add_run(num + '\u2002'); r.bold = True
                write_runs(p, runs, BODY_PT, base={'b': True})
                if body:
                    p.add_run(' ')
                    write_runs(p, body, BODY_PT)
                else:
                    p.paragraph_format.keep_with_next = True
                return
            if txt.strip():
                self.paragraph(txt, align=align)

        while True:
            m = self.BLOCK.search(s, pos)
            if not m:
                buf += s[pos:]
                flush()
                return
            buf += s[pos:m.start()]
            if m.group(0).strip() == '':
                flush()
                pos = m.end()
                continue
            if m.group(2):
                flush()
                k = match_brace(s, m.end() - 1)
                title = s[m.end():k]
                pos = k + 1
                lm = re.match(r'\s*\\label\{([^}]*)\}', s[pos:])
                if lm:
                    pos += lm.end()
                res = self.heading(m.group(2), bool(m.group(3)), title)
                if res and res[0] == 'runin':
                    pending_runin = (res[1], res[2])
                continue
            if m.group(4):
                flush()
                cmd = m.group(4)
                if cmd in ('newpage', 'clearpage'):
                    self.page_break()
                pos = m.end()
                continue
            env = m.group(1)
            i = m.end()
            if env in ('tabularx', 'tabular', 'longtable', 'figure', 'table', 'center', 'itemize', 'enumerate',
                       'description', 'lstlisting', 'tikzpicture', 'thebibliography', 'adjustbox', 'smallblock',
                       'minipage', 'titlepage', 'document', 'notebox'):
                pass
            e0, e1 = find_env_end(s, env, i)
            inner = s[i:e0]
            pos = e1
            if env in ('itemize', 'enumerate', 'description'):
                flush()
                if inner.startswith('['):
                    inner = inner[match_bracket(inner, 0) + 1:]
                self.lst(inner, level=level if env != 'description' else 0, description=(env == 'description'))
            elif env == 'center':
                flush()
                self.blocks(inner, level, align=WD_ALIGN_PARAGRAPH.CENTER)
            elif env == 'smallblock':
                flush()
                old = self.small; self.small = True
                self.blocks(inner, level)
                self.small = old
            elif env in ('tabularx', 'tabular', 'longtable'):
                flush()
                n = 2 if env == 'tabularx' else 1
                o, args, j = read_args(inner, 0, n, opt=True)
                self.table(args[-1], inner[j:], long=(env == 'longtable'), center=True, small=self.small)
            elif env == 'table':
                flush()
                if inner.startswith('['):
                    inner = inner[match_bracket(inner, 0) + 1:]
                self.float_table(inner)
            elif env == 'figure':
                flush()
                if inner.startswith('['):
                    inner = inner[match_bracket(inner, 0) + 1:]
                self.figure(inner)
            elif env == 'lstlisting':
                flush()
                size = 8 if 'scriptsize' in inner[:60] else 9
                if inner.startswith('['):
                    inner = inner[match_bracket(inner, 0) + 1:]
                self.listing(inner, size)
            elif env == 'tikzpicture':
                flush()
                self.tikz(inner)
            elif env == 'thebibliography':
                flush()
                self.bibliography(inner)
            else:
                # môi trường lạ: xử lý nội dung như khối thường
                flush()
                self.blocks(inner, level, align)


def fix_page_breaks(doc):
    body = doc.element.body
    for p in list(body.iterchildren(qn('w:p'))):
        brs = p.xpath('.//w:br[@w:type="page"]')
        if not brs or p.xpath('.//w:t[normalize-space(.)!=""]') or p.xpath('.//w:drawing'):
            continue
        nxt = p.getnext()
        if nxt is None or nxt.tag != qn('w:p') or p.xpath('./w:pPr/w:sectPr'):
            continue
        pPr = nxt.get_or_add_pPr()
        e = OxmlElement('w:pageBreakBefore')
        pPr.insert(0 if pPr.find(qn('w:pStyle')) is None else 1, e)
        body.remove(p)


def main():
    src = strip_comments(read(os.path.join(HERE, 'main.tex')))
    src = expand_inputs(src)
    src = wrap_small_groups(src)
    b0 = src.index('\\begin{document}')
    t1 = src.index('\\end{titlepage}') + len('\\end{titlepage}')
    body = src[t1:src.index('\\end{document}')]
    body = body.replace('\\thispagestyle{empty}', '')
    # bỏ \addcontentsline (heading đã vào mục lục qua style Heading)
    body = re.sub(r'\\addcontentsline\{[^}]*\}\{[^}]*\}\{[^}]*\}', '', body)
    # thay cụm mục lục bằng một điểm đánh dấu
    body = re.sub(r'\\tableofcontents\s*\\newpage\s*\\listoffigures\s*\\listoftables', '\\\\begin{tocblock}\\\\end{tocblock}', body)

    labels = collect_labels(body)
    b = Builder(labels)
    b.title_page()

    # chèn trang mục lục đúng vị trí
    orig_blocks = b.blocks

    def blocks_with_toc(s, level=0, align=None):
        parts = s.split('\\begin{tocblock}\\end{tocblock}')
        for idx, part in enumerate(parts):
            if idx:
                b.page_break()
                b.toc_page()
            orig_blocks(part, level, align)
    blocks_with_toc(body)

    # yêu cầu Word cập nhật trường khi mở (mục lục, danh sách hình/bảng, số trang)
    settings = b.doc.settings.element
    uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true')
    settings.append(uf)
    core = b.doc.core_properties
    core.title = 'BrewLite – Assignment 2: Requirements to Deployment'
    core.author = 'Phạm Duy Đăng'
    core.subject = 'Bài tập lớn môn Công nghệ Phần mềm – HK I 2026-2027'
    out = sys.argv[1] if len(sys.argv) > 1 else OUT
    fix_page_breaks(b.doc)
    b.doc.save(out)
    print('Đã tạo', out, '| hình:', b.fig, '| bảng:', b.tab)


if __name__ == '__main__':
    main()
