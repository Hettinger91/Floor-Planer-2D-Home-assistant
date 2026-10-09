'use strict';
let plan = null, rev = 0, floorId = null, sel = null;
let hist = [], histIdx = -1;
const views = {};
const S = () => plan.settings;

function newFloor(name) { return { id: uid(), name, bg: null, walls: [], rooms: [], items: [] }; }
function defaultPlan() { return { version: 1, settings: { ...DEFAULT_SETTINGS }, floors: [newFloor('Erdgeschoss')], customTypes: [] }; }

function normalize(p) {
  p = p && typeof p === 'object' ? p : {};
  p.version = 1;
  p.settings = { ...DEFAULT_SETTINGS, ...(p.settings || {}) };
  p.customTypes = Array.isArray(p.customTypes) ? p.customTypes : [];
  if (!Array.isArray(p.floors) || !p.floors.length) p.floors = [newFloor('Erdgeschoss')];
  p.floors.forEach(f => {
    f.id = f.id || uid(); f.name = f.name || 'Etage';
    f.walls = f.walls || []; f.rooms = f.rooms || []; f.items = f.items || []; f.bg = f.bg || null;
  });
  return p;
}

function curFloor() { return plan.floors.find(f => f.id === floorId) || plan.floors[0]; }
function V() { const id = curFloor().id; return views[id] || (views[id] = { tx: 0, ty: 0, k: 0.5, a: viewAngle(), fitted: false }); }
// Ansicht drehen: Bildschirm = t + R(a) · (k · Welt)
const viewAngle = () => (plan && plan.settings && Number(plan.settings.viewRot)) || 0;
function normAngle(a) { a = ((a % 360) + 540) % 360 - 180; return a; }
function s2w(v, sx, sy) {
  const r = (v.a || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), dx = sx - v.tx, dy = sy - v.ty;
  return { x: (c * dx + s * dy) / v.k, y: (-s * dx + c * dy) / v.k };
}
// setzt k/a so, dass der Weltpunkt (wx,wy) auf dem Bildschirmpunkt (sx,sy) liegt
function anchorView(v, k, a, wx, wy, sx, sy) {
  const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  v.k = k; v.a = a;
  v.tx = sx - k * (c * wx - s * wy);
  v.ty = sy - k * (s * wx + c * wy);
}
function syncViews(v) { Object.keys(views).forEach(id => { if (views[id] !== v) { views[id].fitted = false; views[id].a = v.a; } }); }
function snapAngle(a) { const n = Math.round(a / 90) * 90; return Math.abs(a - n) < 3.5 ? n : a; }
function rotateViewBy(da, sx, sy) {
  const v = V(), { w, h } = stageSize();
  if (sx == null) { sx = w / 2; sy = h / 2; }
  const wp = s2w(v, sx, sy);
  v.touched = true;
  anchorView(v, v.k, normAngle(snapAngle(normAngle((v.a || 0) + da))), wp.x, wp.y, sx, sy);
  syncViews(v);
  render();
}
function setViewAngle(a) { const v = V(), { w, h } = stageSize(), wp = s2w(v, w / 2, h / 2); anchorView(v, v.k, normAngle(a), wp.x, wp.y, w / 2, h / 2); syncViews(v); render(); }
const findItem = id => curFloor().items.find(i => i.id === id);
const findWall = id => curFloor().walls.find(i => i.id === id);
const findRoom = id => curFloor().rooms.find(i => i.id === id);
function selObj() {
  if (!sel) return null;
  const f = curFloor();
  if (sel.k === 'item') return f.items.find(i => i.id === sel.id) || null;
  if (sel.k === 'wall') return f.walls.find(i => i.id === sel.id) || null;
  if (sel.k === 'room') return f.rooms.find(i => i.id === sel.id) || null;
  if (sel.k === 'bg') return f.bg;
  return null;
}
function setSel(k, id) {
  sel = k ? { k, id } : null;
  renderInspector();
  render();
}

// ---------- Verlauf ----------
function histReset() { hist = [JSON.stringify(plan)]; histIdx = 0; updateUndoButtons(); }
function commit() {
  const s = JSON.stringify(plan);
  if (s === hist[histIdx]) return;
  hist = hist.slice(0, histIdx + 1);
  hist.push(s);
  if (hist.length > 150) hist.shift();
  histIdx = hist.length - 1;
  afterChange();
}
function afterChange() {
  scheduleSave();
  try { localStorage.setItem('fp.plan', JSON.stringify(plan)); } catch (_) { /* Kontingent voll */ }
  renderFloorTabs();
  updateUndoButtons();
}
function restoreFrom(json) {
  plan = JSON.parse(json);
  if (!plan.floors.some(f => f.id === floorId)) floorId = plan.floors[0].id;
  if (!selObj()) sel = null;
  afterChange();
  renderAll();
}
function undo() { if (histIdx > 0) { histIdx--; restoreFrom(hist[histIdx]); } }
function redo() { if (histIdx < hist.length - 1) { histIdx++; restoreFrom(hist[histIdx]); } }
function updateUndoButtons() {
  $('#btnUndo').disabled = histIdx <= 0;
  $('#btnRedo').disabled = histIdx >= hist.length - 1;
}

// ---------- Speichern ----------
let saveTimer = null, saving = false, dirty = false, conflictOpen = false;
function setSaveState(txt, cls) {
  const el = $('#saveState');
  el.className = 'savestate ' + (cls || '');
  $('span', el).textContent = txt;
}
function scheduleSave() {
  dirty = true;
  setSaveState('Ungespeichert …', 'dirty');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 700);
}
async function save(force = false) {
  if (saving) { scheduleSave(); return; }
  if (conflictOpen) return;
  saving = true; dirty = false;
  setSaveState('Speichere …', 'dirty');
  try {
    const res = await HOST.savePlan(rev, plan, force);
    rev = res.rev;
    setSaveState('Gespeichert', 'ok');
  } catch (e) {
    if (e && e.code === 'conflict') onConflict(); else setSaveState('Speichern fehlgeschlagen', 'err');
  } finally {
    saving = false;
    if (dirty && !conflictOpen) scheduleSave();
  }
}
async function onConflict() {
  conflictOpen = true;
  setSaveState('Konflikt', 'err');
  const r = await modal({
    title: 'Plan wurde anderswo geändert',
    body: 'Der Grundriss wurde in der Zwischenzeit von einem anderen Gerät oder Browser-Tab gespeichert. Wie soll es weitergehen?',
    actions: [
      { label: 'Neu laden (meine Änderungen verwerfen)', value: 'reload' },
      { label: 'Meine Version behalten', value: 'force', primary: true },
    ],
  });
  conflictOpen = false;
  if (r === 'reload') {
    const d = await HOST.getPlan();
    plan = normalize(d.plan); rev = d.rev || 0;
    if (!plan.floors.some(f => f.id === floorId)) floorId = plan.floors[0].id;
    sel = null; histReset(); renderAll();
    setSaveState('Gespeichert', 'ok');
  } else {
    save(true);
  }
}
function loadLocal() {
  try { const s = localStorage.getItem('fp.plan'); return s ? JSON.parse(s) : null; } catch (_) { return null; }
}

// ---------- Geometrie ----------
function polyArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  return Math.abs(a) / 2;
}
function polyCentroid(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const c = x1 * y2 - x2 * y1; a += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c;
  }
  a /= 2;
  if (Math.abs(a) < 1e-6) return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  return [cx / (6 * a), cy / (6 * a)];
}
const wallLen = w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1);

function snapPt(p, o = {}) {
  const f = curFloor(), v = V();
  let x = p.x, y = p.y;
  const ortho = !!(o.from && o.ortho);
  if (ortho) { if (Math.abs(x - o.from.x) > Math.abs(y - o.from.y)) y = o.from.y; else x = o.from.x; }
  if (!o.noPoints && !ortho) {
    let best = null, bd = 14 / v.k;
    const test = (px, py) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = { x: px, y: py, pt: true }; } };
    f.walls.forEach(w => { if (o.skip && o.skip.has(w.id)) return; test(w.x1, w.y1); test(w.x2, w.y2); });
    f.rooms.forEach(r => { if (o.skipRoom === r.id) return; r.pts.forEach(pt => test(pt[0], pt[1])); });
    if (best) return best;
  }
  if (S().snap && !o.free) {
    const g = S().grid;
    if (!ortho) { x = Math.round(x / g) * g; y = Math.round(y / g) * g; }
    else { if (x !== o.from.x) x = Math.round(x / g) * g; if (y !== o.from.y) y = Math.round(y / g) * g; }
  }
  return { x: r1(x), y: r1(y) };
}

function snapToWall(it, p) {
  const f = curFloor();
  let best = null, bd = Math.max(40, 18 / V().k);
  f.walls.forEach(w => {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, L2 = dx * dx + dy * dy;
    if (L2 < 1) return;
    const t = clamp(((p.x - w.x1) * dx + (p.y - w.y1) * dy) / L2, 0, 1);
    const qx = w.x1 + t * dx, qy = w.y1 + t * dy, d = Math.hypot(p.x - qx, p.y - qy);
    if (d < bd) { bd = d; best = { x: qx, y: qy, ang: Math.atan2(dy, dx) * 180 / Math.PI, t: w.t }; }
  });
  if (!best) return false;
  let a = best.ang;
  if (a > 90) a -= 180;
  if (a <= -90) a += 180;
  it.x = r1(best.x); it.y = r1(best.y); it.rot = r1(a); it.h = best.t;
  return true;
}

function contentBounds(f) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  f.walls.forEach(w => { add(w.x1, w.y1); add(w.x2, w.y2); });
  f.rooms.forEach(r => r.pts.forEach(p => add(p[0], p[1])));
  f.items.forEach(i => { const R = Math.max(i.w, i.h) / 2; add(i.x - R, i.y - R); add(i.x + R, i.y + R); });
  if (f.bg && f.bg.url) { add(f.bg.x, f.bg.y); add(f.bg.x + f.bg.w, f.bg.y + f.bg.w * (f.bg.ar || 1)); }
  if (!isFinite(x0)) return { x: 0, y: 0, w: 1000, h: 700, empty: true };
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
}

function stageSize() {
  const el = $('#svg'), r = el.getBoundingClientRect();
  return { w: r.width || el.clientWidth || 900, h: r.height || el.clientHeight || 600 };
}
function fitView() {
  const f = curFloor(), v = V(), b = contentBounds(f), { w, h } = stageSize(), pad = 70;
  const r = (v.a || 0) * Math.PI / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  const bw = b.w * c + b.h * s, bh = b.w * s + b.h * c;
  const k = clamp(Math.min((w - pad * 2) / bw, (h - pad * 2) / bh), 0.03, 3);
  anchorView(v, k, v.a || 0, b.x + b.w / 2, b.y + b.h / 2, w / 2, h / 2);
  v.fitted = true; v.touched = false; v.fitW = w; v.fitH = h;
  render();
}
