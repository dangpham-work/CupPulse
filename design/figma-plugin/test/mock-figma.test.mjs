// Chạy plugin với Figma Plugin API giả lập: bắt lỗi runtime và các ràng buộc hay sai của API thật.
// node design/figma-plugin/test/mock-figma.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'code.js'), 'utf8');

let nextId = 1;
const loadedFonts = new Set();
const fontKey = (f) => `${f.family}::${f.style}`;
const FONTS = ['Regular', 'Medium', 'SemiBold', 'Bold'].map((style) => ({ fontName: { family: 'Be Vietnam Pro', style } }));

function checkPaints(paints) {
  assert.ok(Array.isArray(paints), 'fills/strokes phải là mảng');
  for (const p of paints) {
    if (p.type === 'SOLID') {
      assert.ok(!('a' in p.color), 'paint.color không được có a');
      for (const k of ['r', 'g', 'b']) assert.ok(p.color[k] >= 0 && p.color[k] <= 1, `màu ngoài 0..1: ${k}=${p.color[k]}`);
    }
  }
}

class Node {
  constructor(type) {
    this.id = `${nextId++}:1`; this.type = type; this.name = type; this.parent = null; this.children = [];
    this.width = 100; this.height = 100; this.x = 0; this.y = 0;
    this._fills = []; this._strokes = []; this.layoutMode = 'NONE'; this._props = {}; this.reactions = [];
    if (type === 'TEXT') { this.width = 10; this.height = 10; this._chars = ''; this.fontName = null; this.textAutoResize = 'WIDTH_AND_HEIGHT'; }
  }
  get fills() { return this._fills; } set fills(v) { checkPaints(v); this._fills = v; }
  get strokes() { return this._strokes; } set strokes(v) { checkPaints(v); this._strokes = v; }
  get characters() { return this._chars; }
  set characters(v) {
    assert.ok(this.fontName && loadedFonts.has(fontKey(this.fontName)), `font chưa nạp khi đặt characters: ${JSON.stringify(this.fontName)}`);
    this._chars = v; this.width = Math.max(10, v.length * 7);
  }
  set layoutSizingHorizontal(v) { this._sizing('H', v); } get layoutSizingHorizontal() { return this._sh; }
  set layoutSizingVertical(v) { this._sizing('V', v); } get layoutSizingVertical() { return this._sv; }
  _sizing(axis, v) {
    const auto = this.layoutMode && this.layoutMode !== 'NONE';
    const parentAuto = this.parent && this.parent.layoutMode && this.parent.layoutMode !== 'NONE';
    if (v === 'FILL') assert.ok(parentAuto && this.layoutPositioning !== 'ABSOLUTE', `FILL cần cha auto-layout (${this.name} trong ${this.parent && this.parent.name})`);
    if (v === 'HUG') assert.ok(auto || this.type === 'TEXT', `HUG chỉ cho frame auto-layout/text (${this.name})`);
    assert.ok(['FIXED', 'HUG', 'FILL'].includes(v), `giá trị sizing sai ${v}`);
    if (axis === 'H') this._sh = v; else this._sv = v;
  }
  set primaryAxisSizingMode(v) { assert.ok(['FIXED', 'AUTO'].includes(v), `primaryAxisSizingMode sai ${v}`); this._pa = v; } get primaryAxisSizingMode() { return this._pa; }
  set counterAxisSizingMode(v) { assert.ok(['FIXED', 'AUTO'].includes(v), `counterAxisSizingMode sai ${v}`); this._ca = v; } get counterAxisSizingMode() { return this._ca; }
  set counterAxisAlignItems(v) { assert.ok(['MIN', 'MAX', 'CENTER', 'BASELINE'].includes(v), `counterAxisAlignItems sai ${v}`); this._cai = v; } get counterAxisAlignItems() { return this._cai; }
  set primaryAxisAlignItems(v) { assert.ok(['MIN', 'MAX', 'CENTER', 'SPACE_BETWEEN'].includes(v), `primaryAxisAlignItems sai ${v}`); this._pai = v; } get primaryAxisAlignItems() { return this._pai; }
  set componentPropertyReferences(v) {
    for (let p = this.parent; p; p = p.parent) assert.ok(p.type !== 'INSTANCE', `không gắn property cho node trong instance (${this.name})`);
    this._refs = v;
  }
  get componentPropertyReferences() { return this._refs; }
  appendChild(c) {
    assert.ok(c instanceof Node, 'appendChild cần node');
    assert.ok(this.type !== 'INSTANCE', `không append vào instance (${this.name})`);
    if (c.parent) c.parent.children.splice(c.parent.children.indexOf(c), 1);
    c.parent = this; this.children.push(c);
    if (this.layoutMode !== 'NONE' && this.layoutMode) this._relayout();
  }
  insertChild(i, c) { this.appendChild(c); }
  _relayout() { /* ước lượng kích thước HUG */
    const horiz = this.layoutMode === 'HORIZONTAL';
    let main = 0, cross = 0;
    for (const c of this.children) { main += horiz ? c.width : c.height; cross = Math.max(cross, horiz ? c.height : c.width); }
    if (this._pa !== 'FIXED') { if (horiz) this.width = main; else this.height = main; }
  }
  remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; this.removed = true; }
  resize(w, h) { assert.ok(w > 0 && h > 0, `resize không hợp lệ ${w}x${h} (${this.name})`); this.width = w; this.height = h; }
  rescale(s) { assert.ok(s > 0); this.width *= s; this.height *= s; }
  findAll(pred) { const out = []; const walk = (n) => { for (const c of n.children) { if (pred(c)) out.push(c); walk(c); } }; walk(this); return out; }
  findOne(pred) { return this.findAll(pred)[0] || null; }
  setBoundVariable(field, v) { assert.ok(v && v.resolvedType === 'FLOAT', `bind ${field} cần biến FLOAT`); this[field] = v._value; }
  setRangeFontName(s, e, f) { assert.ok(loadedFonts.has(fontKey(f)), `font chưa nạp ${fontKey(f)}`); assert.ok(e <= this._chars.length); }
  setRangeFills(s, e, p) { checkPaints(p); }
  setRangeTextDecoration() {}
  async setTextStyleIdAsync(id) { assert.ok(STYLES.has(id), 'text style không tồn tại'); }
  async setReactionsAsync(r) { assert.ok(r[0].actions[0].destinationId, 'thiếu destinationId'); this.reactions = r; }
  addComponentProperty(name, type, def) {
    assert.ok(this.type === 'COMPONENT_SET' || (this.type === 'COMPONENT' && (!this.parent || this.parent.type !== 'COMPONENT_SET')), `addComponentProperty trên ${this.type} ${this.name}`);
    if (type === 'INSTANCE_SWAP') assert.ok(NODES.get(def), 'INSTANCE_SWAP cần id component');
    const key = `${name}#${nextId++}:0`; this._props[key] = { type, def }; return key;
  }
  createInstance() {
    assert.ok(this.type === 'COMPONENT', `createInstance trên ${this.type}`);
    const i = clone(this); i.type = 'INSTANCE'; i.mainComponent = this; return i;
  }
  setProperties(p) {
    const main = this.mainComponent; const owner = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main;
    for (const k of Object.keys(p)) assert.ok(owner._props[k], `property ${k} không có trên ${owner.name}`);
  }
}
function clone(n) {
  const c = new Node(n.type);
  for (const k of ['name', 'width', 'height', 'layoutMode', '_fills', '_strokes', '_chars', 'fontName', '_pa', '_ca', 'mainComponent']) c[k] = n[k];
  for (const ch of n.children) { const cc = clone(ch); cc.parent = c; c.children.push(cc); }
  NODES.set(c.id, c);
  return c;
}
const NODES = new Map();
const STYLES = new Map();
const track = (n) => { NODES.set(n.id, n); return n; };

const root = new Node('DOCUMENT');
const startPage = new Node('PAGE'); startPage.name = 'App Screens'; root.children.push(startPage); startPage.parent = root;
let current = startPage;
const collections = []; const variables = [];

const figma = {
  root,
  get currentPage() { return current; },
  set currentPage(v) { throw new Error('Setting figma.currentPage is not supported'); },
  async setCurrentPageAsync(p) { assert.ok(p.type === 'PAGE'); current = p; },
  createPage() { const p = new Node('PAGE'); root.children.push(p); p.parent = root; return track(p); },
  createFrame() { const f = track(new Node('FRAME')); current.appendChild(f); return f; },
  createComponent() { const f = track(new Node('COMPONENT')); current.appendChild(f); return f; },
  createRectangle() { const f = track(new Node('RECTANGLE')); current.appendChild(f); return f; },
  createText() { const f = track(new Node('TEXT')); current.appendChild(f); return f; },
  createNodeFromSvg(s) {
    assert.ok(/width="\d+"/.test(s) && /viewBox=/.test(s), 'SVG cần width/height và viewBox');
    assert.ok(!/#[0-9a-f]{8}\b/i.test(s), 'SVG có màu 8 chữ số hex');
    const f = track(new Node('FRAME')); current.appendChild(f); const v = track(new Node('VECTOR')); f.appendChild(v); return f;
  },
  combineAsVariants(comps, parent) {
    assert.ok(comps.length > 0 && comps.every((c) => c.type === 'COMPONENT' && c.parent === parent), 'combineAsVariants: cần component cùng cha');
    const names = comps.map((c) => c.name); assert.equal(new Set(names).size, names.length, `trùng tên biến thể: ${names}`);
    for (const n of names) assert.ok(/^[^=,]+=[^=,]+(, [^=,]+=[^=,]+)*$/.test(n), `tên biến thể sai: ${n}`);
    const set = track(new Node('COMPONENT_SET')); parent.appendChild(set);
    for (const c of comps) set.appendChild(c);
    return set;
  },
  async listAvailableFontsAsync() { return FONTS; },
  async loadFontAsync(f) { assert.ok(FONTS.some((x) => fontKey(x.fontName) === fontKey(f)), `font không có ${fontKey(f)}`); loadedFonts.add(fontKey(f)); },
  async getLocalTextStylesAsync() { return [...STYLES.values()]; },
  createTextStyle() { const s = { id: `S:${nextId++}`, name: '', set fontName(f) { assert.ok(loadedFonts.has(fontKey(f)), 'style: font chưa nạp'); } }; STYLES.set(s.id, s); return s; },
  variables: {
    async getLocalVariableCollectionsAsync() { return collections; },
    async getLocalVariablesAsync() { return variables; },
    createVariableCollection(name) { const c = { id: `VC:${nextId++}`, name, modes: [{ modeId: 'm1', name: 'Mode 1' }], renameMode() {} }; collections.push(c); return c; },
    createVariable(name, col, type) {
      assert.ok(typeof col === 'object' || typeof col === 'string');
      const v = { id: `V:${nextId++}`, name, resolvedType: type, variableCollectionId: col.id || col, scopes: [],
        setValueForMode(m, val) { if (type === 'COLOR') assert.ok('a' in val, 'biến màu cần a'); this._value = val; } };
      variables.push(v); return v;
    },
    setBoundVariableForPaint(p, field, v) { assert.equal(field, 'color'); assert.equal(v.resolvedType, 'COLOR'); return Object.assign({}, p, { boundVariables: { color: { id: v.id } } }); },
  },
  viewport: { scrollAndZoomIntoView() {} },
  closePlugin(msg) { figma._closed = msg; },
};
Object.defineProperty(Node.prototype, 'flowStartingPoints', { set(v) { assert.ok(v[0].nodeId); this._flow = v; }, get() { return this._flow; } });

globalThis.figma = figma;
globalThis.__BREWLITE_MCP__ = true;
const main = new Function(`${src}\nreturn main;`)();

// Chạy hai lần: lần 2 phải dựng lại được (idempotent) và không nhân đôi biến/style.
const r1 = await main();
const varCount = variables.length; const styleCount = STYLES.size;
const r2 = await main();
assert.equal(variables.length, varCount, 'chạy lại tạo thêm biến');
assert.equal(STYLES.size, styleCount, 'chạy lại tạo thêm text style');

const pages = root.children.map((p) => p.name);
assert.deepEqual(pages, ['App Screens', 'BrewLite · 0 Foundations', 'BrewLite · 1 Components', 'BrewLite · 2 Screens (MVP)']);
const screensPage = root.children[3];
const frames = screensPage.children.filter((n) => n.type === 'FRAME').map((n) => n.name);
const compsPage = root.children[2];
const sets = compsPage.findAll((n) => n.type === 'COMPONENT_SET').map((n) => n.name);
const reactions = screensPage.findAll((n) => n.reactions.length).length;
console.log(JSON.stringify({ r1, r2, variables: varCount, textStyles: styleCount, componentSets: sets, screens: frames, prototypeLinks: reactions }, null, 1));
assert.equal(frames.length, 17, 'số màn hình');
assert.equal(reactions, 6, 'số liên kết prototype');
assert.ok(r2.warnings.length === 0, `cảnh báo: ${r2.warnings}`);
console.log('OK – plugin chạy hết trên API giả lập');
