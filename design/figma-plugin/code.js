// BrewLite (Brew House) – dựng file Figma khớp với apps/web.
// Chạy được theo hai cách: plugin Figma desktop (manifest.json) hoặc dán vào use_figma của Figma MCP.
// Chỉ ghi vào 3 trang có tiền tố "BrewLite ·"; trang khác trong file giữ nguyên. Chạy lại = dựng lại từ đầu.

const PAGES = ['BrewLite · 0 Foundations', 'BrewLite · 1 Components', 'BrewLite · 2 Screens (MVP)'];

const COLORS = {
  cream: ['#faf6f1', 'Nền trang'], brand: ['#6f3b1f', 'Nút chính, giá, logo'], accent: ['#c8773a', 'Nhãn, badge giỏ hàng, "Bắt buộc"'],
  tint: ['#f6e7d8', 'Nền nút giỏ, ảnh món, ô chọn'], line: ['#eadfd4', 'Viền thẻ, input, header'], ink: ['#2b1a12', 'Chữ chính'],
  muted: ['#7a6a60', 'Chữ phụ'], faint: ['#a89a90', 'Placeholder'], disabled: ['#d9cfc6', 'Nút bị khóa'], soldout: ['#5e5a57', 'Nhãn Hết hàng'],
  white: ['#ffffff', 'Bề mặt thẻ'], danger: ['#c0392b', 'Viền/chữ lỗi trường nhập'], 'danger-text': ['#8a1c10', 'Chữ thông báo lỗi'],
  'danger-bg': ['#fdecea', 'Nền thông báo lỗi'], 'row-selected': ['#fdf8f3', 'Dòng topping đã chọn'], checkbox: ['#8a7f78', 'Viền checkbox'],
};
const SPACE = [4, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 80];
const RADIUS = { 10: 'radius/10', 12: 'radius/12', 16: 'radius/16', 24: 'radius/24', 999: 'radius/full' };
const TYPE = {
  'Display/48': [48, 'Bold'], 'Heading/40': [40, 'Bold'], 'Heading/32': [32, 'Bold'], 'Heading/28': [28, 'Bold'],
  'Heading/24': [24, 'Bold'], 'Heading/20': [20, 'Bold'], 'Title/18': [18, 'Bold'], 'Title/18 Semibold': [18, 'SemiBold'],
  'Title/17': [17, 'SemiBold'], 'Body/16': [16, 'Regular', 26], 'Body/16 Semibold': [16, 'SemiBold'], 'Body/15': [15, 'Regular'],
  'Body/15 Medium': [15, 'Medium'], 'Body/15 Semibold': [15, 'SemiBold'], 'Label/14': [14, 'SemiBold'], 'Body/14': [14, 'Regular'],
  'Body/14 Medium': [14, 'Medium'], 'Caption/13': [13, 'Regular'], 'Caption/13 Medium': [13, 'Medium'], 'Micro/12': [12, 'SemiBold'],
  'Micro/12 Regular': [12, 'Regular'], 'Micro/12 Bold': [12, 'Bold'],
};
const IMG = {
  coffee: '<ellipse cx="60" cy="108" rx="34" ry="6" fill="#000000" fill-opacity="0.08"/><path d="M32 34h56l-7 70a6 6 0 0 1-6 5H45a6 6 0 0 1-6-5z" fill="#8b5a2b"/><rect x="28" y="26" width="64" height="10" rx="5" fill="#4a2c12"/><path d="M60 26V10" stroke="#4a2c12" stroke-width="4" stroke-linecap="round"/><path d="M42 62h36" stroke="#f6e7d2" stroke-width="5" stroke-linecap="round"/>',
  tea: '<ellipse cx="60" cy="108" rx="34" ry="6" fill="#000000" fill-opacity="0.08"/><path d="M34 30h52l-6 74a6 6 0 0 1-6 5H46a6 6 0 0 1-6-5z" fill="#e8a54b"/><rect x="30" y="22" width="60" height="10" rx="5" fill="#a8641e"/><circle cx="50" cy="90" r="5" fill="#3b2412"/><circle cx="66" cy="94" r="5" fill="#3b2412"/><circle cx="58" cy="82" r="5" fill="#3b2412"/>',
  frappe: '<ellipse cx="60" cy="108" rx="34" ry="6" fill="#000000" fill-opacity="0.08"/><path d="M36 40h48l-6 64a6 6 0 0 1-6 5H48a6 6 0 0 1-6-5z" fill="#6b3f22"/><path d="M34 40c0-14 12-22 26-22s26 8 26 22z" fill="#fff4e6"/><path d="M62 18l8-12" stroke="#c8773a" stroke-width="4" stroke-linecap="round"/>',
  cake: '<ellipse cx="60" cy="104" rx="40" ry="6" fill="#000000" fill-opacity="0.08"/><path d="M22 66l38-30 38 30v30a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z" fill="#f3d9b1"/><path d="M22 66h76v10H22z" fill="#6f3b1f"/><circle cx="60" cy="30" r="7" fill="#c0392b"/>',
};
const ICON = {
  bag: '<svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 5.5h11l-.9 9.5H3.4L2.5 5.5Z" stroke="#6f3b1f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="#6f3b1f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6.5" cy="6.5" r="5" stroke="#7a6a60" stroke-width="1.5"/><path d="m10.5 10.5 3.5 3.5" stroke="#7a6a60" stroke-width="1.5" stroke-linecap="round"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m3 7.5 2.5 2.5L11 4.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wifi: '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10.5 10.5 0 0 1 14 0M8.5 15.5a5.5 5.5 0 0 1 7 0" stroke="#a89a90" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="19" r="1.4" fill="#a89a90"/><path d="M3 3l18 18" stroke="#c0392b" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

const V = { color: {}, space: {}, radius: {} };
const TS = {};
let FONT = { family: 'Be Vietnam Pro', styles: {} };
const LOG = { created: 0, warnings: [] };

// ---------- tiện ích ----------
function rgb(hex) { const n = parseInt(hex.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; }
function paint(c, opacity) {
  const p = { type: 'SOLID', color: rgb(COLORS[c][0]) };
  if (opacity != null) p.opacity = opacity;
  return V.color[c] ? figma.variables.setBoundVariableForPaint(p, 'color', V.color[c]) : p;
}
function bindNum(node, field, value, table) {
  const v = table[value];
  if (v) { try { node.setBoundVariable(field, v); return; } catch (e) { /* rơi xuống gán số */ } }
  node[field] = value;
}
function radius(node, r) {
  if (r === 'full') r = 999;
  if (V.radius[r]) { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) bindNum(node, k, r, V.radius); }
  else node.cornerRadius = r;
}
function style(node, o) {
  if (o.w != null || o.h != null) {
    node.resize(o.w != null ? o.w : node.width, o.h != null ? o.h : node.height);
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      if (o.w != null) node.layoutSizingHorizontal = 'FIXED';
      if (o.h != null) node.layoutSizingVertical = 'FIXED';
    }
  }
  if (o.fill !== undefined) node.fills = o.fill ? [paint(o.fill, o.fillOpacity)] : [];
  if (o.stroke) { node.strokes = [paint(o.stroke)]; node.strokeWeight = o.strokeW || 1; node.strokeAlign = 'INSIDE'; }
  if (o.r != null) radius(node, o.r);
  if (o.p != null) {
    const p = Array.isArray(o.p) ? (o.p.length === 2 ? [o.p[0], o.p[1], o.p[0], o.p[1]] : o.p) : [o.p, o.p, o.p, o.p];
    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach((k, i) => bindNum(node, k, p[i], V.space));
  }
  if (o.gap != null) bindNum(node, 'itemSpacing', o.gap, V.space);
  if (o.align) node.counterAxisAlignItems = o.align;
  if (o.justify) node.primaryAxisAlignItems = o.justify;
  if (o.opacity != null) node.opacity = o.opacity;
  if (o.clip != null) node.clipsContent = o.clip;
  if (o.wrap) { node.layoutWrap = 'WRAP'; bindNum(node, 'counterAxisSpacing', o.wrap, V.space); }
  return node;
}
function box(name, dir, o = {}) {
  const f = o.component ? figma.createComponent() : figma.createFrame();
  f.name = name; f.fills = [];
  if (dir) { f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; }
  f.clipsContent = false;
  LOG.created++;
  return style(f, o);
}
function card(name, dir, o = {}) { return box(name, dir, Object.assign({ fill: 'white', stroke: 'line', r: 16 }, o)); }
function add(parent, child, o = {}) {
  parent.appendChild(child);
  if (o.fillW) { child.layoutSizingHorizontal = 'FILL'; if (child.type === 'TEXT') child.textAutoResize = 'HEIGHT'; }
  if (o.fillH) child.layoutSizingVertical = 'FILL';
  if (o.abs) { child.layoutPositioning = 'ABSOLUTE'; child.x = o.abs[0]; child.y = o.abs[1]; }
  return child;
}
function adds(parent, kids, o) { for (const k of kids) add(parent, k, o); return parent; }
async function text(chars, ts, color, o = {}) {
  const t = figma.createText();
  const [size, weight, lh] = TYPE[ts];
  t.fontName = { family: FONT.family, style: FONT.styles[weight] };
  t.characters = chars;
  t.fontSize = size;
  if (lh) t.lineHeight = { unit: 'PIXELS', value: lh };
  if (TS[ts]) { try { await t.setTextStyleIdAsync(TS[ts].id); } catch (e) { /* giữ định dạng tay */ } }
  t.fills = [paint(color || 'ink')];
  t.name = o.name || chars.slice(0, 40);
  if (o.center) t.textAlignHorizontal = 'CENTER';
  if (o.underline) t.textDecoration = 'UNDERLINE';
  LOG.created++;
  return t;
}
// Nhấn mạnh một đoạn trong text (đậm/màu/gạch chân).
function emph(t, part, weight, color, underline) {
  const i = t.characters.indexOf(part);
  if (i < 0) return t;
  if (weight) t.setRangeFontName(i, i + part.length, { family: FONT.family, style: FONT.styles[weight] });
  if (color) t.setRangeFills(i, i + part.length, [paint(color)]);
  if (underline) t.setRangeTextDecoration(i, i + part.length, 'UNDERLINE');
  return t;
}
function svg(markup, name, size) {
  const n = figma.createNodeFromSvg(markup);
  n.name = name; n.fills = [];
  if (size) n.resize(size, size);
  return n;
}
function divider(w) { const r = figma.createRectangle(); r.name = 'Divider'; r.resize(w || 100, 1); r.fills = [paint('line')]; return r; }
function vnd(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫'; }

// Bộ component có biến thể: specs = [{Prop: value,...}], build(values) -> ComponentNode.
async function variantSet(name, specs, build, textProps = {}, parent) {
  const comps = [];
  for (const s of specs) {
    const c = await build(s);
    c.name = Object.entries(s).map(([k, v]) => `${k}=${v}`).join(', ');
    parent.appendChild(c);
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, parent);
  set.name = name;
  set.layoutMode = 'HORIZONTAL'; set.layoutWrap = 'WRAP'; set.primaryAxisSizingMode = 'FIXED'; set.counterAxisSizingMode = 'AUTO';
  set.itemSpacing = 24; set.counterAxisSpacing = 24; set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 24;
  set.resize(Math.min(1400, Math.max(...comps.map((c) => c.width)) * Math.min(specs.length, 4) + 24 * Math.min(specs.length, 4) + 24), set.height);
  set.fills = [paint('white')]; set.strokes = [paint('line')]; set.dashPattern = [6, 4]; set.cornerRadius = 16;
  const keys = bindTextProps(set, comps, textProps);
  const pick = (vals) => comps.find((c) => Object.entries(vals).every(([k, v]) => c.name.includes(`${k}=${v}`))) || comps[0];
  return { set, keys, comps, pick };
}
function bindTextProps(owner, comps, textProps) {
  const keys = {};
  for (const [prop, def] of Object.entries(textProps)) {
    keys[prop] = owner.addComponentProperty(prop, 'TEXT', def);
    for (const c of comps) {
      for (const t of c.findAll((n) => n.type === 'TEXT' && n.name === prop && !insideInstance(n, c))) t.componentPropertyReferences = { characters: keys[prop] };
    }
  }
  return keys;
}
function insideInstance(node, root) {
  for (let p = node.parent; p && p !== root; p = p.parent) if (p.type === 'INSTANCE') return true;
  return false;
}
function inst(comp, props, keys) {
  const i = comp.createInstance();
  if (props && keys) {
    const p = {};
    for (const [k, v] of Object.entries(props)) if (keys[k]) p[keys[k]] = v;
    if (Object.keys(p).length) i.setProperties(p);
  }
  return i;
}

// ---------- nền tảng: font, biến, text style ----------
async function setupFonts() {
  const all = await figma.listAvailableFontsAsync();
  const find = (fam) => {
    const styles = {};
    for (const w of ['Regular', 'Medium', 'SemiBold', 'Bold']) {
      const f = all.find((x) => x.fontName.family === fam && x.fontName.style.replace(/\s/g, '').toLowerCase() === w.toLowerCase());
      if (f) styles[w] = f.fontName.style;
    }
    return Object.keys(styles).length === 4 ? styles : null;
  };
  let styles = find('Be Vietnam Pro');
  if (!styles) { FONT.family = 'Inter'; styles = find('Inter') || { Regular: 'Regular', Medium: 'Medium', SemiBold: 'Semi Bold', Bold: 'Bold' }; LOG.warnings.push('Không có Be Vietnam Pro, dùng Inter'); }
  FONT.styles = styles;
  for (const s of Object.values(styles)) await figma.loadFontAsync({ family: FONT.family, style: s });
}
async function setupVariables() {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  let col = cols.find((c) => c.name === 'BrewLite Tokens');
  if (!col) col = figma.variables.createVariableCollection('BrewLite Tokens');
  const mode = col.modes[0].modeId;
  try { col.renameMode(mode, 'Light'); } catch (e) { /* bỏ qua */ }
  const existing = {};
  for (const v of await figma.variables.getLocalVariablesAsync()) if (v.variableCollectionId === col.id) existing[v.name] = v;
  const make = (name, type, value, scopes, desc) => {
    const v = existing[name] || figma.variables.createVariable(name, col, type);
    v.setValueForMode(mode, value); v.scopes = scopes; if (desc) v.description = desc;
    return v;
  };
  for (const [k, [hex, desc]] of Object.entries(COLORS)) V.color[k] = make(`color/${k}`, 'COLOR', Object.assign(rgb(hex), { a: 1 }), ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'], desc);
  for (const s of SPACE) V.space[s] = make(`space/${s}`, 'FLOAT', s, ['GAP', 'WIDTH_HEIGHT'], `${s}px`);
  for (const [r, name] of Object.entries(RADIUS)) V.radius[r] = make(name, 'FLOAT', Number(r), ['CORNER_RADIUS'], `${r}px`);
}
async function setupTextStyles() {
  const existing = {};
  for (const s of await figma.getLocalTextStylesAsync()) existing[s.name] = s;
  for (const [name, [size, weight, lh]] of Object.entries(TYPE)) {
    const s = existing[`BrewLite/${name}`] || figma.createTextStyle();
    s.name = `BrewLite/${name}`;
    s.fontName = { family: FONT.family, style: FONT.styles[weight] };
    s.fontSize = size;
    s.lineHeight = lh ? { unit: 'PIXELS', value: lh } : { unit: 'AUTO' };
    TS[name] = s;
  }
}
async function preparePage(name) {
  let page = figma.root.children.find((p) => p.name === name);
  if (!page) { page = figma.createPage(); page.name = name; }
  await figma.setCurrentPageAsync(page);
  for (const c of [...page.children]) c.remove();
  page.backgrounds = [{ type: 'SOLID', color: rgb('#efe9e2') }];
  return page;
}
function placeRow(nodes, x0, y0, gap = 80) {
  let x = x0, h = 0;
  for (const n of nodes) { n.x = x; n.y = y0; x += n.width + gap; h = Math.max(h, n.height); }
  return y0 + h;
}

// ---------- trang 0: Foundations ----------
async function buildFoundations(page) {
  const cover = card('Cover', 'VERTICAL', { w: 1200, p: 48, gap: 12, fill: 'brand', stroke: null, r: 24 });
  cover.strokes = [];
  adds(cover, [
    await text('Brew House · BrewLite', 'Heading/40', 'white'),
    await text('Assignment 2 – Requirements to Deployment · Design system & màn hình MVP đồng bộ với apps/web (Next.js, mobile-first/PWA)', 'Body/16', 'tint'),
    await text('Trang 1 Components: thư viện component có biến thể · Trang 2 Screens: 15 màn hình + prototype luồng đặt món', 'Body/14', 'tint'),
  ], { fillW: true });

  const colors = card('Colors', 'VERTICAL', { w: 1200, p: 32, gap: 20 });
  add(colors, await text('Màu (biến BrewLite Tokens/color/*)', 'Heading/24'));
  const grid = box('Swatches', 'HORIZONTAL', { gap: 16, wrap: 16 });
  add(colors, grid, { fillW: true });
  for (const [k, [hex, desc]] of Object.entries(COLORS)) {
    const sw = box(`Swatch/${k}`, 'VERTICAL', { w: 196, gap: 6 });
    const chip = figma.createRectangle(); chip.name = 'Chip'; chip.resize(196, 80); chip.fills = [paint(k)]; chip.strokes = [paint('line')]; chip.cornerRadius = 12;
    add(sw, chip);
    add(sw, await text(`color/${k}`, 'Label/14'));
    add(sw, await text(`${hex} · ${desc}`, 'Caption/13', 'muted'), { fillW: true });
    add(grid, sw);
  }

  const type = card('Typography', 'VERTICAL', { w: 1200, p: 32, gap: 14 });
  add(type, await text(`Chữ (${FONT.family}) – text style BrewLite/*`, 'Heading/24'));
  for (const [name, [size, weight]] of Object.entries(TYPE)) {
    const row = box(`Type/${name}`, 'HORIZONTAL', { gap: 24, align: 'CENTER' });
    const label = await text(`${name} · ${size}/${weight}`, 'Caption/13', 'muted'); label.resize(240, label.height); label.textAutoResize = 'HEIGHT';
    adds(row, [label, await text('Thực đơn hôm nay – Cà phê sữa đá 35.000 ₫', name)]);
    add(type, row, { fillW: true });
  }

  const sp = card('Spacing & Radius', 'VERTICAL', { w: 1200, p: 32, gap: 16 });
  add(sp, await text('Khoảng cách và bo góc', 'Heading/24'));
  const srow = box('Spacing', 'HORIZONTAL', { gap: 16, align: 'MAX', wrap: 16 });
  for (const s of SPACE) {
    const it = box(`space/${s}`, 'VERTICAL', { gap: 6, align: 'CENTER' });
    const bar = figma.createRectangle(); bar.resize(Math.max(s, 4), 32); bar.fills = [paint('accent')];
    adds(it, [bar, await text(`space/${s}`, 'Micro/12 Regular', 'muted')]);
    add(srow, it);
  }
  add(sp, srow, { fillW: true });
  const rrow = box('Radius', 'HORIZONTAL', { gap: 24 });
  for (const [r, name] of Object.entries(RADIUS)) {
    const it = box(name, 'VERTICAL', { gap: 6, align: 'CENTER' });
    const b = box('Sample', null, { w: 72, h: 72, fill: 'tint', stroke: 'brand', r: Number(r) === 999 ? 999 : Number(r) });
    adds(it, [b, await text(name, 'Micro/12 Regular', 'muted')]);
    add(rrow, it);
  }
  add(sp, rrow);
  let y = 0;
  for (const n of [cover, colors, type, sp]) { n.x = 0; n.y = y; y += n.height + 48; }
}

// ---------- trang 1: Components ----------
const C = {};
async function buildComponents(page) {
  const lane = [];
  const group = async (title, build) => {
    const g = box(`§ ${title}`, 'VERTICAL', { gap: 16 });
    add(g, await text(title, 'Heading/20', 'brand'));
    await build(g);
    lane.push(g);
  };

  await group('Ảnh món', async (g) => {
    const row = box('Images', 'HORIZONTAL', { gap: 24 });
    add(g, row);
    for (const [k, body] of Object.entries(IMG)) {
      const c = figma.createComponent(); c.name = `Img/${k}`; c.resize(120, 120); c.fills = [];
      const s = svg(`<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`, 'art');
      c.appendChild(s); s.x = 0; s.y = 0; s.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
      c.description = `Ảnh minh họa món (apps/web/public/images/menu/${k}.svg)`;
      add(row, c); C[`img_${k}`] = c;
    }
  });

  await group('Button', async (g) => {
    const specs = [];
    for (const Variant of ['Primary', 'Secondary', 'Tint', 'Disabled']) for (const Size of ['Large', 'Medium']) specs.push({ Variant, Size });
    C.button = await variantSet('Button', specs, async ({ Variant, Size }) => {
      const L = Size === 'Large';
      const look = { Primary: ['brand', 'white'], Secondary: ['white', 'brand'], Tint: ['tint', 'brand'], Disabled: ['disabled', 'white'] }[Variant];
      const c = box('b', 'HORIZONTAL', { component: true, h: L ? 48 : 44, p: [0, L ? 22 : 24], fill: look[0], r: 10, align: 'CENTER', justify: 'CENTER' });
      if (Variant === 'Secondary') style(c, { stroke: 'line' });
      const t = await text('Đặt hàng', L ? 'Body/15 Semibold' : 'Label/14', look[1], { name: 'Label', center: true });
      add(c, t);
      c.description = 'min-h-12 (Large) / min-h-11 (Medium), rounded-[10px] – vùng chạm ≥ 44px (NFR-09)';
      return c;
    }, { Label: 'Đặt hàng' }, g);
  });

  await group('Chip danh mục · Badge · Alert', async (g) => {
    C.chip = await variantSet('Chip', [{ State: 'Active' }, { State: 'Default' }], async ({ State }) => {
      const on = State === 'Active';
      const c = box('c', 'HORIZONTAL', { component: true, h: 44, p: [0, 18], fill: on ? 'brand' : 'white', r: 'full', align: 'CENTER' });
      if (!on) style(c, { stroke: 'line' });
      add(c, await text('Tất cả', 'Label/14', on ? 'white' : 'ink', { name: 'Label' }));
      return c;
    }, { Label: 'Tất cả' }, g);

    C.cartBadge = box('CartBadge', 'HORIZONTAL', { component: true, p: [1, 7], fill: 'accent', r: 'full', align: 'CENTER' });
    add(C.cartBadge, await text('3', 'Micro/12 Bold', 'white', { name: 'Count' }));
    C.cartBadgeKeys = bindTextProps(C.cartBadge, [C.cartBadge], { Count: '3' });
    add(g, C.cartBadge);

    const statuses = ['Chờ thanh toán', 'Đã thanh toán', 'Đang pha chế', 'Sẵn sàng nhận', 'Hoàn tất', 'Đã hủy'];
    C.status = await variantSet('StatusBadge', statuses.map((s) => ({ Status: s })), async ({ Status }) => {
      const cancelled = Status === 'Đã hủy';
      const c = box('s', 'HORIZONTAL', { component: true, p: [4, 12], fill: cancelled ? 'danger-bg' : 'tint', r: 'full' });
      add(c, await text(Status, 'Label/14', cancelled ? 'danger-text' : 'brand', { name: 'Label' }));
      return c;
    }, {}, g);

    C.alert = await variantSet('Alert', [{ Type: 'Error' }, { Type: 'Info' }], async ({ Type }) => {
      const err = Type === 'Error';
      const c = box('a', 'HORIZONTAL', { component: true, w: 358, p: [10, 14], fill: err ? 'danger-bg' : 'tint', r: 10 });
      add(c, await text(err ? 'Thanh toán thất bại. Vui lòng thử lại hoặc đổi phương thức.' : 'Đăng ký thành công. Hãy đăng nhập để tiếp tục.', 'Body/14 Medium', err ? 'danger-text' : 'brand', { name: 'Message' }), { fillW: true });
      return c;
    }, { Message: 'Thông báo' }, g);
  });

  await group('TextField', async (g) => {
    C.field = await variantSet('TextField', ['Default', 'Filled', 'Focus', 'Error'].map((State) => ({ State })), async ({ State }) => {
      const c = box('f', 'VERTICAL', { component: true, w: 310, gap: 6 });
      add(c, await text('Email', 'Label/14', 'ink', { name: 'Label' }));
      const input = box('Input', 'HORIZONTAL', { h: 48, p: [0, 16], fill: 'white', stroke: State === 'Error' ? 'danger' : State === 'Focus' ? 'brand' : 'line', r: 12, align: 'CENTER' });
      add(input, await text(State === 'Default' ? 'ban@vidu.vn' : 'khach@brewlite.test', 'Body/15', State === 'Default' ? 'faint' : 'ink', { name: 'Value' }), { fillW: true });
      add(c, input, { fillW: true });
      if (State === 'Error') add(c, await text('Email không hợp lệ', 'Caption/13 Medium', 'danger', { name: 'Error' }), { fillW: true });
      c.description = 'Nhãn liên kết input, lỗi gắn aria-describedby (NFR-09). Kiểm tra cả ở FE và BE.';
      return c;
    }, { Label: 'Email', Value: 'khach@brewlite.test', Error: 'Email không hợp lệ' }, g);

    C.method = await variantSet('PaymentMethod', [{ State: 'Selected' }, { State: 'Default' }], async ({ State }) => {
      const on = State === 'Selected';
      const c = box('m', 'HORIZONTAL', { component: true, w: 150, h: 48, fill: on ? 'tint' : 'white', stroke: on ? 'brand' : 'line', r: 12, align: 'CENTER', justify: 'CENTER' });
      if (on) c.strokeWeight = 2;
      add(c, await text('Thẻ', 'Body/15 Semibold', on ? 'brand' : 'ink', { name: 'Label' }));
      return c;
    }, { Label: 'Thẻ' }, g);

    C.stepper = box('QtyStepper', 'HORIZONTAL', { component: true, fill: 'white', stroke: 'line', r: 10, align: 'CENTER' });
    for (const [n, ch, ts] of [['Minus', '−', 'Body/16'], ['Value', '1', 'Body/16 Semibold'], ['Plus', '+', 'Body/16']]) {
      const cell = box(n, 'HORIZONTAL', { w: 44, h: 44, align: 'CENTER', justify: 'CENTER' });
      add(cell, await text(ch, ts, n === 'Value' ? 'ink' : 'brand', { name: n === 'Value' ? 'Value' : n }));
      add(C.stepper, cell);
    }
    C.stepperKeys = bindTextProps(C.stepper, [C.stepper], { Value: '1' });
    C.stepper.description = 'Số lượng 1–10 mỗi dòng; giỏ tối đa 20 ly (BR-03)';
    add(g, C.stepper);
  });

  await group('Header', async (g) => {
    const specs = [];
    for (const Device of ['Mobile', 'Desktop']) for (const Auth of ['Guest', 'Signed in']) specs.push({ Device, Auth });
    C.header = await variantSet('Header', specs, async ({ Device, Auth }) => {
      const m = Device === 'Mobile';
      const c = box('h', 'HORIZONTAL', { component: true, w: m ? 390 : 1280, h: 72, p: [0, m ? 16 : 80], fill: 'white', align: 'CENTER', justify: 'SPACE_BETWEEN' });
      c.strokes = [paint('line')]; c.strokeAlign = 'INSIDE'; c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1;
      const logo = box('Logo', 'HORIZONTAL', { gap: 10, align: 'CENTER' });
      const mark = box('Mark', 'HORIZONTAL', { w: 36, h: 36, fill: 'brand', r: 10, align: 'CENTER', justify: 'CENTER' });
      add(mark, await text('B', 'Title/18', 'white'));
      adds(logo, [mark, await text('Brew House', 'Heading/20', 'brand')]);
      add(c, logo);
      if (!m) {
        const nav = box('Nav', 'HORIZONTAL', { gap: 32, align: 'CENTER' });
        add(nav, await text('Thực đơn', 'Body/15 Semibold', 'brand'));
        if (Auth !== 'Guest') { add(nav, await text('Đơn hàng của tôi', 'Body/15 Medium', 'muted')); add(nav, await text('Quầy', 'Body/15 Medium', 'muted')); }
        add(c, nav);
      }
      const right = box('Actions', 'HORIZONTAL', { gap: m ? 12 : 16, align: 'CENTER' });
      const cart = box('CartButton', 'HORIZONTAL', { h: 44, p: [0, 14], gap: 8, fill: 'tint', r: 10, align: 'CENTER' });
      add(cart, svg(ICON.bag, 'icon/bag'));
      if (!m) add(cart, await text('Giỏ hàng', 'Label/14', 'brand'));
      add(cart, inst(C.cartBadge));
      add(right, cart);
      if (Auth === 'Guest') add(right, inst(C.button.pick({ Variant: 'Primary', Size: 'Medium' }), { Label: 'Đăng nhập' }, C.button.keys));
      else {
        if (!m) add(right, await text('Nguyễn Văn An', 'Body/14 Medium', 'ink'));
        add(right, inst(C.button.pick({ Variant: 'Secondary', Size: 'Medium' }), { Label: 'Đăng xuất' }, C.button.keys));
      }
      add(c, right);
      c.description = 'Header dùng chung (components/Header.tsx). Mobile ẩn nav; mục nav hiện theo vai trò (AC-11.4).';
      return c;
    }, {}, g);
  });

  await group('Menu & chi tiết món', async (g) => {
    C.product = await variantSet('ProductCard', [{ Stock: 'In stock' }, { Stock: 'Sold out' }], async ({ Stock }) => {
      const ok = Stock === 'In stock';
      const c = box('p', 'VERTICAL', { component: true, w: 173, fill: 'white', stroke: 'line', r: 16, clip: true });
      const media = box('Media', null, { w: 173, h: 200, fill: 'tint' });
      const img = inst(C.img_coffee); img.name = 'Image'; img.x = 26; img.y = 40; if (!ok) img.opacity = 0.6;
      media.appendChild(img); img.constraints = { horizontal: 'CENTER', vertical: 'CENTER' };
      if (!ok) {
        const tag = box('SoldOutTag', 'HORIZONTAL', { p: [4, 10], fill: 'soldout', r: 'full' });
        add(tag, await text('Hết hàng', 'Micro/12', 'white'));
        media.appendChild(tag); tag.x = 14; tag.y = 14;
      }
      add(c, media, { fillW: true });
      const body = box('Body', 'VERTICAL', { p: 16, gap: 12 });
      add(body, await text(ok ? 'Cà phê sữa đá' : 'Cold brew cam sả', 'Title/17', ok ? 'ink' : 'muted', { name: 'Name' }), { fillW: true });
      const row = box('PriceRow', 'HORIZONTAL', { align: 'CENTER', justify: 'SPACE_BETWEEN' });
      add(row, await text(ok ? '35.000 ₫' : '49.000 ₫', 'Title/18', ok ? 'brand' : 'muted', { name: 'Price' }));
      const plus = box('AddButton', 'HORIZONTAL', { w: 36, h: 36, fill: ok ? 'brand' : 'disabled', r: 'full', align: 'CENTER', justify: 'CENTER' });
      add(plus, await text('+', 'Heading/20', 'white'));
      add(row, plus);
      add(body, row, { fillW: true });
      add(c, body, { fillW: true });
      c.description = 'Thẻ món (FR-01). Hết hàng: nhãn + nút xám, vẫn xem chi tiết được (AC-01.4, AC-01.5).';
      return c;
    }, { Name: 'Cà phê sữa đá', Price: '35.000 ₫' }, g);
    C.product.keys.Image = C.product.set.addComponentProperty('Image', 'INSTANCE_SWAP', C.img_coffee.id);
    for (const c of C.product.comps) { const im = c.findOne((n) => n.type === 'INSTANCE' && n.name === 'Image'); if (im) im.componentPropertyReferences = { mainComponent: C.product.keys.Image }; }

    C.size = await variantSet('SizeOption', [{ State: 'Selected' }, { State: 'Default' }], async ({ State }) => {
      const on = State === 'Selected';
      const c = box('s', 'VERTICAL', { component: true, w: 111, p: [14, 16], gap: 4, fill: on ? 'tint' : 'white', stroke: on ? 'brand' : 'line', r: 12 });
      if (on) c.strokeWeight = 2;
      add(c, await text('M', 'Heading/20', on ? 'brand' : 'ink', { name: 'Code' }));
      add(c, await text('Vừa', 'Caption/13', 'muted', { name: 'Size name' }));
      add(c, await text('+5.000 ₫', 'Label/14', on ? 'brand' : 'ink', { name: 'Extra' }));
      return c;
    }, { Code: 'M', 'Size name': 'Vừa', Extra: '+5.000 ₫' }, g);

    C.topping = await variantSet('ToppingRow', ['Checked', 'Unchecked', 'Locked'].map((State) => ({ State })), async ({ State }) => {
      const on = State === 'Checked';
      const c = box('t', 'HORIZONTAL', { component: true, w: 358, p: [14, 16], gap: 12, fill: on ? 'row-selected' : 'white', align: 'CENTER' });
      if (State === 'Locked') c.opacity = 0.5;
      const cb = box('Checkbox', 'HORIZONTAL', { w: 22, h: 22, r: 4, fill: on ? 'brand' : 'white', align: 'CENTER', justify: 'CENTER' });
      if (!on) style(cb, { stroke: 'checkbox', strokeW: 1.5 });
      else add(cb, svg(ICON.check, 'icon/check'));
      add(c, cb);
      add(c, await text('Thạch cà phê', on ? 'Body/15 Semibold' : 'Body/15', 'ink', { name: 'Name' }), { fillW: true });
      add(c, await text('+5.000 ₫', 'Body/15 Medium', on ? 'brand' : 'muted', { name: 'Price' }));
      c.description = 'Tối đa 3 topping; đủ 3 thì các dòng còn lại bị khóa (BR-02).';
      return c;
    }, { Name: 'Thạch cà phê', Price: '+5.000 ₫' }, g);
  });

  await group('Giỏ hàng & đơn hàng', async (g) => {
    C.cartLine = box('CartLine', 'HORIZONTAL', { component: true, w: 358, p: 12, gap: 12, fill: 'white', stroke: 'line', r: 16 });
    const th = box('Thumb', 'HORIZONTAL', { w: 80, h: 80, fill: 'tint', r: 12, align: 'CENTER', justify: 'CENTER' });
    const ti = inst(C.img_coffee); ti.name = 'Image'; ti.rescale(0.53); add(th, ti);
    add(C.cartLine, th);
    const col = box('Info', 'VERTICAL', { gap: 4 });
    const top = box('Top', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', align: 'CENTER' });
    adds(top, [await text('Cà phê sữa đá', 'Body/16 Semibold', 'ink', { name: 'Name' }), await text('Xóa', 'Body/14 Medium', 'muted')]);
    add(col, top, { fillW: true });
    add(col, await text('Size M · Thạch cà phê · “Ít đá”', 'Caption/13', 'muted', { name: 'Options' }), { fillW: true });
    const bottom = box('Bottom', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', align: 'CENTER' });
    adds(bottom, [inst(C.stepper, { Value: '2' }, C.stepperKeys), await text('90.000 ₫', 'Body/16 Semibold', 'brand', { name: 'Line total' })]);
    add(col, bottom, { fillW: true });
    add(C.cartLine, col, { fillW: true });
    C.cartLineKeys = bindTextProps(C.cartLine, [C.cartLine], { Name: 'Cà phê sữa đá', Options: 'Size M', 'Line total': '90.000 ₫' });
    C.cartLineKeys.Image = C.cartLine.addComponentProperty('Image', 'INSTANCE_SWAP', C.img_coffee.id);
    ti.componentPropertyReferences = { mainComponent: C.cartLineKeys.Image };
    add(g, C.cartLine);

    C.lineItem = box('OrderLineItem', 'HORIZONTAL', { component: true, w: 358, p: 16, gap: 12, justify: 'SPACE_BETWEEN' });
    const li = box('Text', 'VERTICAL', { gap: 2 });
    adds(li, [await text('2 × Cà phê sữa đá', 'Body/16 Semibold', 'ink', { name: 'Title' }), await text('Size M · Thạch cà phê', 'Caption/13', 'muted', { name: 'Options' })], { fillW: true });
    add(C.lineItem, li, { fillW: true });
    add(C.lineItem, await text('90.000 ₫', 'Body/16 Semibold', 'brand', { name: 'Amount' }));
    C.lineItemKeys = bindTextProps(C.lineItem, [C.lineItem], { Title: '2 × Cà phê sữa đá', Options: 'Size M', Amount: '90.000 ₫' });
    add(g, C.lineItem);

    C.orderCard = box('OrderCard', 'HORIZONTAL', { component: true, w: 358, p: 16, gap: 12, fill: 'white', stroke: 'line', r: 16, align: 'CENTER', justify: 'SPACE_BETWEEN' });
    const oc = box('Left', 'VERTICAL', { gap: 2 });
    adds(oc, [await text('BL-261115-0027', 'Body/16 Semibold', 'ink', { name: 'Code' }), await text('15/11 08:42 · 3 ly', 'Caption/13', 'muted', { name: 'Meta' })]);
    const or = box('Right', 'VERTICAL', { gap: 2, align: 'MAX' });
    adds(or, [await text('145.000 ₫', 'Body/16 Semibold', 'brand', { name: 'Total' }), await text('Đang pha chế', 'Caption/13', 'muted', { name: 'Status' })]);
    adds(C.orderCard, [oc, or]);
    C.orderCardKeys = bindTextProps(C.orderCard, [C.orderCard], { Code: 'BL-261115-0027', Meta: '15/11 08:42 · 3 ly', Total: '145.000 ₫', Status: 'Đang pha chế' });
    add(g, C.orderCard);

    C.ticket = box('StaffTicket', 'VERTICAL', { component: true, w: 360, p: 12, gap: 8, fill: 'white', stroke: 'line', r: 12 });
    const tr = box('Head', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', align: 'BASELINE' });
    adds(tr, [await text('27', 'Heading/24', 'brand', { name: 'Call number' }), await text('08:43', 'Micro/12 Regular', 'muted', { name: 'Time' })]);
    add(C.ticket, tr, { fillW: true });
    add(C.ticket, await text('2 × Cà phê sữa đá · Size M · Thạch cà phê', 'Body/14', 'ink', { name: 'Items' }), { fillW: true });
    add(C.ticket, inst(C.button.pick({ Variant: 'Primary', Size: 'Medium' }), { Label: 'Bắt đầu pha' }, C.button.keys), { fillW: true });
    C.ticketKeys = bindTextProps(C.ticket, [C.ticket], { 'Call number': '27', Time: '08:43', Items: '2 × Cà phê sữa đá · Size M' });
    C.ticket.description = 'Thẻ đơn ở màn quầy (FR-12): nút chuyển trạng thái theo máy trạng thái BR-12.';
    add(g, C.ticket);
  });

  let y = 0;
  for (const g of lane) { g.x = 0; g.y = y; y += g.height + 96; }
}

// ---------- trang 2: Screens ----------
async function screen(name, o = {}) {
  const w = o.w || 390;
  const s = box(name, 'VERTICAL', { w, fill: 'cream', clip: true });
  try { s.minHeight = o.minH || (w === 390 ? 844 : 800); } catch (e) { /* phiên bản cũ */ }
  if (o.header) add(s, inst(C.header.pick({ Device: w === 390 ? 'Mobile' : 'Desktop', Auth: o.header })), { fillW: true });
  const body = box('Content', 'VERTICAL', { p: w === 390 ? [24, 16, 32, 16] : [32, 80], gap: o.gap != null ? o.gap : 20 });
  if (o.center) body.counterAxisAlignItems = 'CENTER';
  add(s, body, { fillW: true });
  return { s, body };
}
const btn = (variant, size, label) => inst(C.button.pick({ Variant: variant, Size: size }), { Label: label }, C.button.keys);
const field = (state, label, value, error) => inst(C.field.pick({ State: state }), { Label: label, Value: value, Error: error || '' }, C.field.keys);
const lineItem = (t, opt, amt) => inst(C.lineItem, { Title: t, Options: opt, Amount: amt }, C.lineItemKeys);
function listCard(items, w = 358, r = 16) {
  const l = card('Items', 'VERTICAL', { clip: true, r });
  items.forEach((it, i) => { if (i) add(l, divider(w), { fillW: true }); add(l, it, { fillW: true }); });
  return l;
}
async function totalCard(label, amount, note) {
  const c = card('Total', 'VERTICAL', { p: 16, gap: 4 });
  const r = box('Row', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', align: 'CENTER' });
  adds(r, [await text(label, 'Body/16', 'muted'), await text(amount, 'Heading/20', 'brand')]);
  add(c, r, { fillW: true });
  if (note) add(c, await text(note, 'Body/14', 'muted'));
  return c;
}
async function formCard(title) {
  const f = card('Form', 'VERTICAL', { p: 24, gap: 16 });
  add(f, await text(title, 'Heading/24'));
  return f;
}
function setFlow(from, to) {
  if (!from || !to) return;
  const r = [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: to.id, navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', duration: 0.2, easing: { type: 'EASE_OUT' } }, preserveScrollPosition: false }] }];
  return from.setReactionsAsync(r).catch((e) => LOG.warnings.push(`prototype: ${e.message}`));
}

async function buildScreens(page) {
  const S = {}; const hot = {};
  const products = [
    ['Cà phê sữa đá', 35000, 'coffee', true], ['Bạc xỉu', 39000, 'coffee', true], ['Cold brew cam sả', 49000, 'coffee', false],
    ['Trà đào cam sả', 45000, 'tea', true], ['Cà phê đá xay', 55000, 'frappe', true], ['Bánh tiramisu', 42000, 'cake', true],
  ];

  // 01 Thực đơn
  { const { s, body } = await screen('01 — Thực đơn', { header: 'Guest', gap: 24 });
    const head = box('Heading', 'VERTICAL', { gap: 16 });
    const tg = box('Title', 'VERTICAL', { gap: 8 });
    adds(tg, [await text('Thực đơn hôm nay', 'Heading/28'), await text('Chọn món yêu thích — tùy chỉnh size và topping ở bước tiếp theo.', 'Body/16', 'muted')], { fillW: true });
    add(head, tg, { fillW: true });
    const search = box('Search', 'HORIZONTAL', { h: 48, p: [0, 16], gap: 10, fill: 'white', stroke: 'line', r: 12, align: 'CENTER' });
    adds(search, [svg(ICON.search, 'icon/search'), await text('Tìm món: latte, trà đào…', 'Body/15', 'faint')]);
    add(head, search, { fillW: true });
    add(body, head, { fillW: true });
    const chips = box('Categories', 'HORIZONTAL', { gap: 10, clip: true });
    for (const [i, c] of ['Tất cả', 'Cà phê', 'Trà', 'Đá xay', 'Bánh'].entries()) add(chips, inst(C.chip.pick({ State: i ? 'Default' : 'Active' }), { Label: c }, C.chip.keys));
    add(body, chips, { fillW: true });
    const grid = box('Grid', 'HORIZONTAL', { gap: 12, wrap: 12 });
    add(body, grid, { fillW: true });
    for (const [n, p, img, ok] of products) {
      const card1 = inst(C.product.pick({ Stock: ok ? 'In stock' : 'Sold out' }), { Name: n, Price: vnd(p), Image: C[`img_${img}`].id }, C.product.keys);
      card1.name = `ProductCard/${n}`; add(grid, card1);
      if (n === 'Cà phê sữa đá') hot.card = card1;
    }
    S.menu = s; }

  // 02 Chi tiết món
  { const { s, body } = await screen('02 — Chi tiết món', { header: 'Guest', gap: 24 });
    add(body, emph(await text('Thực đơn / Cà phê / Cà phê sữa đá', 'Body/14 Medium', 'muted'), 'Cà phê sữa đá', null, 'ink'));
    const media = box('Media', 'HORIZONTAL', { w: 358, h: 358, fill: 'tint', r: 24, align: 'CENTER', justify: 'CENTER' });
    const big = inst(C.img_coffee); big.rescale(2.3); add(media, big);
    add(body, media, { fillW: true });
    const info = box('Info', 'VERTICAL', { gap: 10 });
    const pill = box('Category', 'HORIZONTAL', { p: [4, 10], fill: 'tint', r: 'full' }); add(pill, await text('Cà phê', 'Micro/12', 'accent'));
    add(info, pill);
    add(info, await text('Cà phê sữa đá', 'Heading/32'));
    add(info, await text('Cà phê phin đậm vị pha sữa đặc, uống cùng đá.', 'Body/16', 'muted'), { fillW: true });
    add(info, await text('35.000 ₫', 'Heading/32', 'brand'));
    add(body, info, { fillW: true });
    const legend = async (a, b, bc) => { const r = box('Legend', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', align: 'BASELINE' }); adds(r, [await text(a, 'Title/17'), await text(b, 'Caption/13 Medium', bc)]); return r; };
    const sizeSet = box('Size', 'VERTICAL', { gap: 12 });
    add(sizeSet, await legend('Chọn size', 'Bắt buộc', 'accent'), { fillW: true });
    const opts = box('Options', 'HORIZONTAL', { gap: 12 });
    for (const [code, nm, ex] of [['S', 'Nhỏ', 0], ['M', 'Vừa', 5000], ['L', 'Lớn', 10000]]) add(opts, inst(C.size.pick({ State: code === 'M' ? 'Selected' : 'Default' }), { Code: code, 'Size name': nm, Extra: `+${vnd(ex)}` }, C.size.keys), { fillW: true });
    add(sizeSet, opts, { fillW: true });
    add(body, sizeSet, { fillW: true });
    const top = box('Toppings', 'VERTICAL', { gap: 12 });
    add(top, await legend('Thêm topping', 'Tùy chọn · tối đa 3', 'muted'), { fillW: true });
    add(top, listCard([
      inst(C.topping.pick({ State: 'Checked' }), { Name: 'Thạch cà phê', Price: '+5.000 ₫' }, C.topping.keys),
      inst(C.topping.pick({ State: 'Unchecked' }), { Name: 'Thêm shot espresso', Price: '+10.000 ₫' }, C.topping.keys),
    ], 358, 12), { fillW: true });
    add(body, top, { fillW: true });
    const note = box('Note', 'VERTICAL', { gap: 8 });
    add(note, await text('Ghi chú', 'Title/17'));
    const ta = box('Textarea', 'HORIZONTAL', { h: 96, p: [14, 16], fill: 'white', stroke: 'line', r: 12 });
    add(ta, await text('Ghi chú cho barista (ít đá, ít ngọt…)', 'Body/15', 'faint'));
    add(note, ta, { fillW: true });
    add(body, note, { fillW: true });
    const act = box('Actions', 'HORIZONTAL', { gap: 16, align: 'CENTER' });
    add(act, inst(C.stepper, { Value: '1' }, C.stepperKeys));
    hot.addToCart = add(act, btn('Primary', 'Large', 'Thêm vào giỏ · 45.000 ₫'), { fillW: true });
    add(body, act, { fillW: true });
    const priceNote = box('PriceExplain', 'HORIZONTAL', { p: [10, 14], fill: 'tint', r: 10 });
    add(priceNote, emph(await text('Giá tự cập nhật: 35.000 (Cà phê sữa đá) + 5.000 (size M) + 5.000 (Thạch cà phê) = 45.000 × 1', 'Caption/13', 'brand'), 'Giá tự cập nhật:', 'SemiBold'), { fillW: true });
    add(body, priceNote, { fillW: true });
    S.detail = s; }

  // 03 Giỏ hàng
  { const { s, body } = await screen('03 — Giỏ hàng', { header: 'Guest' });
    add(body, await text('Giỏ hàng', 'Heading/28'));
    const lines = box('Lines', 'VERTICAL', { gap: 12 });
    add(lines, inst(C.cartLine, { Name: 'Cà phê sữa đá', Options: 'Size M · Thạch cà phê · “Ít đá”', 'Line total': '90.000 ₫' }, C.cartLineKeys), { fillW: true });
    const l2 = add(lines, inst(C.cartLine, { Name: 'Trà đào cam sả', Options: 'Size L', 'Line total': '55.000 ₫', Image: C.img_tea.id }, C.cartLineKeys), { fillW: true });
    const st = l2.findOne((n) => n.type === 'INSTANCE' && n.name === 'QtyStepper'); if (st) st.setProperties({ [C.stepperKeys.Value]: '1' });
    add(body, lines, { fillW: true });
    const sub = card('Subtotal', 'HORIZONTAL', { p: 16, justify: 'SPACE_BETWEEN', align: 'CENTER' });
    adds(sub, [await text('Tạm tính (3 ly)', 'Body/16', 'muted'), await text('145.000 ₫', 'Heading/20', 'brand')]);
    add(body, sub, { fillW: true });
    hot.cartOrder = add(body, btn('Primary', 'Large', 'Đặt hàng'), { fillW: true });
    S.cart = s; }

  // 03b Giỏ trống
  { const { s, body } = await screen('03b — Giỏ hàng trống', { header: 'Guest' });
    const c = card('Empty', 'VERTICAL', { p: 32, gap: 8, align: 'CENTER' });
    adds(c, [await text('Giỏ hàng trống', 'Title/18 Semibold'), await text('Hãy chọn vài món từ thực đơn nhé.', 'Body/14', 'muted')]);
    const b = box('Buttons', 'VERTICAL', { gap: 12, p: [12, 0, 0, 0], align: 'CENTER' });
    add(b, btn('Primary', 'Medium', 'Xem thực đơn')); add(b, btn('Disabled', 'Medium', 'Đặt hàng'), { fillW: true });
    add(c, b, { fillW: true });
    add(body, c, { fillW: true });
    S.cartEmpty = s; }

  // 04 Đăng nhập
  { const { s, body } = await screen('04 — Đăng nhập', { header: 'Guest' });
    const f = await formCard('Đăng nhập');
    add(f, inst(C.alert.pick({ Type: 'Info' }), { Message: 'Đăng ký thành công. Hãy đăng nhập để tiếp tục.' }, C.alert.keys), { fillW: true });
    add(f, field('Filled', 'Email', 'khach@brewlite.test'), { fillW: true });
    add(f, field('Focus', 'Mật khẩu', '••••••••••'), { fillW: true });
    add(f, btn('Primary', 'Large', 'Đăng nhập'), { fillW: true });
    add(f, emph(await text('Chưa có tài khoản? Đăng ký', 'Body/14', 'muted', { center: true }), 'Đăng ký', 'SemiBold', 'brand', true), { fillW: true });
    add(body, f, { fillW: true });
    S.login = s; }

  // 05 Đăng ký
  { const { s, body } = await screen('05 — Đăng ký', { header: 'Guest' });
    const f = await formCard('Tạo tài khoản');
    add(f, field('Filled', 'Email', 'an@brewlite.test'), { fillW: true });
    add(f, field('Error', 'Mật khẩu', '••••', 'Mật khẩu tối thiểu 8 ký tự, gồm chữ và số'), { fillW: true });
    add(f, field('Filled', 'Họ tên', 'Nguyễn Văn An'), { fillW: true });
    add(f, field('Default', 'Số điện thoại (không bắt buộc)', '0912345678'), { fillW: true });
    add(f, btn('Primary', 'Large', 'Đăng ký'), { fillW: true });
    add(f, emph(await text('Đã có tài khoản? Đăng nhập', 'Body/14', 'muted', { center: true }), 'Đăng nhập', 'SemiBold', 'brand', true), { fillW: true });
    add(body, f, { fillW: true });
    S.register = s; }

  const items = () => [lineItem('2 × Cà phê sữa đá', 'Size M · Thạch cà phê · “Ít đá”', '90.000 ₫'), lineItem('1 × Trà đào cam sả', 'Size L', '55.000 ₫')];
  // 06 Xác nhận đơn hàng
  { const { s, body } = await screen('06 — Xác nhận đơn hàng', { header: 'Signed in', gap: 16 });
    add(body, await text('Xác nhận đơn hàng', 'Heading/28'));
    add(body, listCard(items()), { fillW: true });
    add(body, await totalCard('Tổng cộng', '145.000 ₫'), { fillW: true });
    hot.confirm = add(body, btn('Primary', 'Large', 'Xác nhận đặt hàng'), { fillW: true });
    add(body, await text('Quay lại giỏ hàng', 'Body/14 Medium', 'muted', { center: true, underline: true }), { fillW: true });
    S.review = s; }

  // 07 Thanh toán
  const payForm = async (failed) => {
    const { s, body } = await screen(failed ? '07b — Thanh toán thất bại' : '07 — Thanh toán', { header: 'Signed in' });
    const f = await formCard('Thanh toán');
    const r = box('Order', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', align: 'CENTER' });
    adds(r, [await text('BL-261115-0027', 'Body/16 Semibold'), await text('145.000 ₫', 'Heading/20', 'brand')]);
    add(f, r, { fillW: true });
    add(f, emph(await text('Giữ món còn 14:32', 'Body/14 Medium', 'accent'), '14:32', 'Bold'));
    const pm = box('PaymentForm', 'VERTICAL', { gap: 16 });
    const mg = box('Method', 'VERTICAL', { gap: 8 });
    add(mg, await text('Phương thức thanh toán', 'Label/14'));
    const mr = box('Options', 'HORIZONTAL', { gap: 12 });
    add(mr, inst(C.method.pick({ State: 'Selected' }), { Label: 'Thẻ' }, C.method.keys), { fillW: true });
    add(mr, inst(C.method.pick({ State: 'Default' }), { Label: 'Ví điện tử' }, C.method.keys), { fillW: true });
    add(mg, mr, { fillW: true });
    add(pm, mg, { fillW: true });
    add(pm, field('Filled', 'Số thẻ', failed ? '4000 0000 0000 0002' : '4242 4242 4242 4242'), { fillW: true });
    const two = box('Row', 'HORIZONTAL', { gap: 12 });
    add(two, field('Filled', 'Hết hạn (MM/YY)', '12/30'), { fillW: true }); add(two, field('Filled', 'CVV', '•••'), { fillW: true });
    add(pm, two, { fillW: true });
    if (failed) add(pm, inst(C.alert.pick({ Type: 'Error' }), { Message: 'Thanh toán thất bại. Vui lòng thử lại hoặc đổi phương thức.' }, C.alert.keys), { fillW: true });
    const pay = add(pm, btn('Primary', 'Large', 'Thanh toán'), { fillW: true });
    add(f, pm, { fillW: true });
    add(body, f, { fillW: true });
    return { s, pay };
  };
  { const r = await payForm(false); S.pay = r.s; hot.pay = r.pay; }
  { const r = await payForm(true); S.payFail = r.s; }

  // 08 Theo dõi đơn
  { const { s, body } = await screen('08 — Theo dõi đơn', { header: 'Signed in', gap: 16 });
    const hero = card('CallNumber', 'VERTICAL', { p: 24, gap: 6, align: 'CENTER' });
    adds(hero, [await text('Số gọi món', 'Body/14', 'muted'), await text('27', 'Display/48', 'brand'), await text('BL-261115-0027', 'Body/16 Semibold'), inst(C.status.pick({ Status: 'Đang pha chế' }))]);
    add(body, hero, { fillW: true });
    add(body, listCard(items()), { fillW: true });
    add(body, await totalCard('Tổng cộng', '145.000 ₫', 'Thẻ •••• 4242'), { fillW: true });
    const tl = card('Timeline', 'VERTICAL', { p: 16, gap: 8 });
    for (const [st, t] of [['Chờ thanh toán', '08:42'], ['Đã thanh toán', '08:43'], ['Đang pha chế', '08:45']]) {
      const r = box(st, 'HORIZONTAL', { justify: 'SPACE_BETWEEN' });
      adds(r, [await text(st, 'Body/14 Medium'), await text(t, 'Body/14', 'muted')]);
      add(tl, r, { fillW: true });
    }
    add(body, tl, { fillW: true });
    add(body, await text('Trạng thái tự cập nhật mỗi 3 giây (polling, FR-07)', 'Caption/13', 'faint', { center: true }), { fillW: true });
    hot.history = add(body, await text('Xem lịch sử đơn', 'Body/14 Medium', 'muted', { center: true, underline: true }), { fillW: true });
    S.track = s; }

  // 09 Lịch sử đơn
  { const { s, body } = await screen('09 — Lịch sử đơn', { header: 'Signed in', gap: 16 });
    add(body, await text('Đơn hàng của tôi', 'Heading/28'));
    const list = box('Orders', 'VERTICAL', { gap: 12 });
    for (const [c, m, t, st] of [['BL-261115-0027', '15/11 08:42 · 3 ly', '145.000 ₫', 'Đang pha chế'], ['BL-261114-0112', '14/11 17:20 · 1 ly', '45.000 ₫', 'Hoàn tất'], ['BL-261112-0045', '12/11 09:05 · 2 ly', '84.000 ₫', 'Hoàn tất'], ['BL-261110-0008', '10/11 07:58 · 1 ly', '35.000 ₫', 'Đã hủy']]) {
      add(list, inst(C.orderCard, { Code: c, Meta: m, Total: t, Status: st }, C.orderCardKeys), { fillW: true });
    }
    add(body, list, { fillW: true });
    const pg = box('Pagination', 'HORIZONTAL', { justify: 'SPACE_BETWEEN', align: 'CENTER' });
    const prev = btn('Secondary', 'Medium', 'Trang trước'); prev.opacity = 0.4;
    adds(pg, [prev, await text('Trang 1 / 2', 'Body/14', 'muted'), btn('Secondary', 'Medium', 'Trang sau')]);
    add(body, pg, { fillW: true });
    S.history = s; }

  // 10 Quầy pha chế (desktop)
  { const { s, body } = await screen('10 — Quầy pha chế (desktop)', { w: 1280, header: 'Signed in', gap: 16 });
    add(body, await text('Quầy pha chế', 'Heading/28'));
    const cols = box('Board', 'HORIZONTAL', { gap: 16 });
    const data = [
      ['Đã thanh toán', 'Bắt đầu pha', [['28', '08:47', '1 × Latte · Size L · Kem cheese'], ['29', '08:48', '2 × Trà sữa trân châu · Size M · Trân châu đen']]],
      ['Đang pha', 'Xong, sẵn sàng', [['27', '08:43', '2 × Cà phê sữa đá · Size M · Thạch cà phê · “Ít đá”\n1 × Trà đào cam sả · Size L']]],
      ['Sẵn sàng', 'Đã giao khách', [['26', '08:39', '1 × Bánh croissant bơ · Size S']]],
    ];
    for (const [title, action, tickets] of data) {
      const col = box(title, 'VERTICAL', { p: 12, gap: 12, fill: 'tint', fillOpacity: 0.6, r: 16 });
      const h = box('Head', 'HORIZONTAL', { p: [0, 4], justify: 'SPACE_BETWEEN', align: 'CENTER' });
      const cnt = box('Count', 'HORIZONTAL', { p: [0, 8], fill: 'white', r: 'full' }); add(cnt, await text(String(tickets.length), 'Body/14'));
      adds(h, [await text(title, 'Body/16 Semibold', 'brand'), cnt]);
      add(col, h, { fillW: true });
      for (const [n, t, it] of tickets) {
        const tk = inst(C.ticket, { 'Call number': n, Time: t, Items: it }, C.ticketKeys);
        const b = tk.findOne((x) => x.type === 'INSTANCE'); if (b) b.setProperties({ [C.button.keys.Label]: action });
        add(col, tk, { fillW: true });
      }
      add(cols, col, { fillW: true });
    }
    add(body, cols, { fillW: true });
    S.staff = s; }

  // 11 Offline
  { const { s, body } = await screen('11 — Offline (PWA)', { gap: 16, center: true });
    body.paddingTop = 240;
    adds(body, [svg(ICON.wifi, 'icon/wifi-off'), await text('Bạn đang offline', 'Heading/24', 'ink', { center: true })]);
    add(body, await text('Không có kết nối mạng. Vui lòng kiểm tra Wi-Fi hoặc 4G rồi thử lại.', 'Body/16', 'muted', { center: true }), { fillW: true });
    add(body, btn('Primary', 'Medium', 'Thử lại'));
    S.offline = s; }

  // 12 Trạng thái UI của menu (AC-01.3)
  const st = [];
  { const { s, body } = await screen('12a — Menu: đang tải', { header: 'Guest', gap: 24, minH: 640 });
    const chips = box('Chips', 'HORIZONTAL', { gap: 10 });
    for (let i = 0; i < 4; i++) add(chips, box('Skeleton', null, { w: 80, h: 44, fill: 'line', r: 'full' }));
    const g = box('Grid', 'HORIZONTAL', { gap: 12, wrap: 12 });
    for (let i = 0; i < 4; i++) add(g, box('Skeleton', null, { w: 173, h: 260, fill: 'line', r: 16 }));
    add(body, chips); add(body, g, { fillW: true }); st.push(s); }
  { const { s, body } = await screen('12b — Menu: lỗi tải', { header: 'Guest', minH: 640 });
    const c = card('Error', 'VERTICAL', { p: 24, gap: 16, align: 'CENTER' });
    add(c, await text('Không tải được menu. Vui lòng kiểm tra kết nối và thử lại.', 'Body/16 Semibold', 'ink', { center: true }), { fillW: true });
    add(c, btn('Primary', 'Medium', 'Thử lại'));
    add(body, c, { fillW: true }); st.push(s); }
  { const { s, body } = await screen('12c — Menu: trống', { header: 'Guest', minH: 640 });
    body.paddingTop = 96;
    add(body, await text('Chưa có món nào', 'Body/16', 'muted', { center: true }), { fillW: true });
    add(body, await text('Không tìm thấy món phù hợp (khi tìm kiếm không có kết quả)', 'Caption/13', 'faint', { center: true }), { fillW: true });
    st.push(s); }
  { const { s, body } = await screen('12d — Đăng nhập: sai mật khẩu', { header: 'Guest', minH: 640 });
    const f = await formCard('Đăng nhập');
    add(f, field('Filled', 'Email', 'khach@brewlite.test'), { fillW: true });
    add(f, field('Filled', 'Mật khẩu', '••••••••'), { fillW: true });
    add(f, inst(C.alert.pick({ Type: 'Error' }), { Message: 'Email hoặc mật khẩu không đúng' }, C.alert.keys), { fillW: true });
    add(f, btn('Primary', 'Large', 'Đăng nhập'), { fillW: true });
    add(body, f, { fillW: true }); st.push(s); }

  // Bố cục + nhãn truy vết
  const NOTES = new Map([
    [S.menu, 'FR-01 · US-01 · Xem menu, lọc danh mục, tìm không dấu'], [S.detail, 'FR-02 · Size, topping (≤3), ghi chú, giá tự cập nhật'],
    [S.cart, 'FR-03 · Sửa/xóa, tối đa 20 ly, lưu localStorage'], [S.review, 'FR-04 · Bắt buộc đăng nhập, tính lại giá ở server'],
    [S.pay, 'FR-05, FR-06 · Thẻ/Ví mô phỏng, Idempotency-Key'], [S.track, 'FR-07 · Số gọi món, trạng thái, polling 3 s'],
    [S.cartEmpty, 'FR-03 · Giỏ trống: không đặt được'], [S.login, 'FR-10 · Đăng nhập JWT, giữ returnUrl'], [S.register, 'FR-09 · Đăng ký, validate FE/BE'],
    [S.payFail, 'AC-05.5 · 402 PAYMENT_FAILED, lần sau dùng khóa mới'], [S.history, 'FR-08 · Lịch sử đơn phân trang'], [S.offline, 'NFR-11 · PWA: trang /offline'],
    [S.staff, 'FR-12 · Nhân viên đổi trạng thái (máy trạng thái BR-12)'], [st[0], 'AC-01.3 · Loading'], [st[1], 'AC-01.3 · Error + Thử lại'], [st[2], 'AC-01.3 · Empty'], [st[3], 'AC-10 · Sai thông tin đăng nhập'],
  ]);
  let y = 80;
  const rows = [[S.menu, S.detail, S.cart, S.review, S.pay, S.track], [S.cartEmpty, S.login, S.register, S.payFail, S.history, S.offline], st, [S.staff]];
  const titles = ['Luồng đặt món chính (prototype: bấm thẻ "Cà phê sữa đá")', 'Màn phụ và tài khoản', 'Trạng thái UI', 'Nhân viên quầy (desktop)'];
  for (const [i, row] of rows.entries()) {
    const h = await text(titles[i], 'Heading/28', 'brand'); h.x = 0; h.y = y; y += 64;
    const bottom = placeRow(row, 0, y + 36);
    for (const f of row) { const n = await text(NOTES.get(f) || '', 'Body/14 Medium', 'muted'); n.x = f.x; n.y = y; }
    y = bottom + 160;
  }

  await setFlow(hot.card, S.detail); await setFlow(hot.addToCart, S.cart); await setFlow(hot.cartOrder, S.review);
  await setFlow(hot.confirm, S.pay); await setFlow(hot.pay, S.track); await setFlow(hot.history, S.history);
  try { page.flowStartingPoints = [{ nodeId: S.menu.id, name: 'Đặt món: menu → xác nhận đơn' }]; } catch (e) { LOG.warnings.push(`flow: ${e.message}`); }
  return S;
}

// ---------- chạy ----------
async function main() {
  await setupFonts();
  await setupVariables();
  await setupTextStyles();
  const pages = [];
  for (const name of PAGES) pages.push(figma.root.children.find((p) => p.name === name));
  // Xóa trang screens trước (instance) rồi mới tới components.
  for (const i of [2, 1, 0]) if (pages[i]) { await figma.setCurrentPageAsync(pages[i]); for (const c of [...pages[i].children]) c.remove(); }
  const p0 = await preparePage(PAGES[0]); await buildFoundations(p0);
  const p1 = await preparePage(PAGES[1]); await buildComponents(p1);
  const p2 = await preparePage(PAGES[2]); const S = await buildScreens(p2);
  figma.viewport.scrollAndZoomIntoView([S.menu, S.detail, S.cart]);
  return { ok: true, font: FONT.family, nodes: LOG.created, warnings: LOG.warnings, screens: Object.keys(S).length };
}

if (typeof __BREWLITE_MCP__ === 'undefined') {
  main().then((r) => figma.closePlugin(`BrewLite: đã dựng ${r.screens} nhóm màn hình, ${r.nodes} layer${r.warnings.length ? ' · cảnh báo: ' + r.warnings.join('; ') : ''}`))
    .catch((e) => figma.closePlugin(`BrewLite lỗi: ${e.message}`));
}
