'use strict';
let tool = 'select', mode = 'edit', placeType = null, drawing = null, drag = null, hover = null, spaceDown = false;
let calibPts = [];
const pointers = new Map();
let pinch = null, orbitMode = false;

const HINTS = {
  wall: 'Klicken setzt Punkte · Doppelklick/Enter beendet · Shift = gerade · Esc bricht ab',
  room: 'Ecken anklicken · ersten Punkt oder Enter zum Schließen',
  rect: 'Ziehen, um einen Raum aufzuspannen',
  place: 'In den Plan klicken zum Platzieren · Shift = mehrfach',
  calib: 'Zwei Punkte mit bekanntem Abstand anklicken',
  hand: 'Ziehen verschiebt die Ansicht',
};

function setTool(t, type) {
  cancelDrawing();
  tool = t; placeType = type || null; calibPts = []; drag = null;
  $$('#tools button').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  svgEl.dataset.tool = t;
  const hint = $('#hint');
  hint.textContent = HINTS[t] || '';
  hint.classList.toggle('show', !!HINTS[t]);
  updateDrawBar();
  render();
}
function updateDrawBar() {
  $('#drawBar').hidden = !(drawing || ['wall', 'room', 'place', 'calib'].includes(tool));
  $('#btnFinish').hidden = !drawing;
}
function setMode(m) {
  mode = m;
  $('#app').className = 'mode-' + m;
  $('#modeEdit').classList.toggle('on', m === 'edit');
  $('#modeLive').classList.toggle('on', m === 'live');
  document.body.classList.remove('show-left', 'show-right');
  if (m === 'live') { setTool('select'); sel = null; renderInspector(); pollStates(); }
  render();
}

function toWorld(e) {
  const r = svgEl.getBoundingClientRect(), v = V();
  return s2w(v, e.clientX - r.left, e.clientY - r.top);
}
function zoomAt(cx, cy, factor) {
  const v = V(), k = clamp(v.k * factor, 0.02, 6);
  const wp = s2w(v, cx, cy);
  v.touched = true;
  anchorView(v, k, v.a || 0, wp.x, wp.y, cx, cy);
  render();
}

// ---------- Zeichnen ----------
function cancelDrawing() { drawing = null; updateDrawBar(); }
function finishDrawing() {
  if (!drawing) return;
  if (drawing.k === 'room') {
    if (drawing.pts.length >= 3) {
      const r = { id: uid(), name: 'Raum', color: ROOM_COLORS[curFloor().rooms.length % ROOM_COLORS.length], entity: '', pts: drawing.pts.map(p => [p.x, p.y]) };
      curFloor().rooms.push(r);
      commit();
      drawing = null;
      setTool('select');
      setSel('room', r.id);
      return;
    }
  }
  drawing = null; updateDrawBar(); render();
}
function addWall(a, b) {
  const w = { id: uid(), x1: a.x, y1: a.y, x2: b.x, y2: b.y, ...wallDef() };
  curFloor().walls.push(w);
  commit();
  return w;
}
function createRectRoom(a, b) {
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  const f = curFloor();
  const r = { id: uid(), name: 'Raum', color: ROOM_COLORS[f.rooms.length % ROOM_COLORS.length], entity: '', pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] };
  f.rooms.push(r);
  if (S().rectWalls) {
    [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]].forEach(c =>
      f.walls.push({ id: uid(), x1: c[0], y1: c[1], x2: c[2], y2: c[3], ...wallDef() }));
  }
  commit();
  setTool('select');
  setSel('room', r.id);
}
function wallsFromRoom(r) {
  const f = curFloor();
  r.pts.forEach((p, i) => {
    const q = r.pts[(i + 1) % r.pts.length];
    f.walls.push({ id: uid(), x1: p[0], y1: p[1], x2: q[0], y2: q[1], ...wallDef() });
  });
  commit(); render();
}

function placeItem(t, p, keep) {
  const it = newItemFromType(t, p.x, p.y);
  if (t.wall) snapToWall(it, p);
  curFloor().items.push(it);
  commit();
  if (!keep) setTool('select');
  setSel('item', it.id);
}

// ---------- Pointer-Events ----------
function cancelDrag() {
  if (drag && drag.snap) { plan = JSON.parse(drag.snap); renderAll(); }
  if (drag && drag.timer) clearTimeout(drag.timer);
  drag = null;
}
function startPan(e, clickDeselect) {
  if (orbitMode) {
    const r = svgEl.getBoundingClientRect(), v = V(), { w, h } = stageSize(), cx = r.left + w / 2, cy = r.top + h / 2;
    drag = { t: 'orbit', sx: e.clientX, sy: e.clientY, ang0: Math.atan2(e.clientY - cy, e.clientX - cx), a0: v.a || 0, cx, cy, wp: s2w(v, w / 2, h / 2), moved: false, clickDeselect };
    return;
  }
  drag = { t: 'pan', sx: e.clientX, sy: e.clientY, tx: V().tx, ty: V().ty, moved: false, clickDeselect }; }
function startPinch() {
  const [a, b] = [...pointers.values()];
  pinch = { ang: Math.atan2(b.y - a.y, b.x - a.x), d: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, v: { ...V() } };
}
function updatePinch() {
  const [a, b] = [...pointers.values()], v = V(), r = svgEl.getBoundingClientRect();
  const d = Math.hypot(a.x - b.x, a.y - b.y) || 1, cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
  const k = clamp(pinch.v.k * d / pinch.d, 0.02, 6);
  const wp = s2w(pinch.v, pinch.cx - r.left, pinch.cy - r.top);
  let da = (Math.atan2(b.y - a.y, b.x - a.x) - pinch.ang) * 180 / Math.PI;
  da = normAngle(da);
  // kleine Wackler beim Zoomen ignorieren, erst ab ~6° dreht die Ansicht
  const rot = Math.abs(da) < 6 && !pinch.rotating ? 0 : (pinch.rotating = true, da);
  const ang = normAngle(snapAngle(normAngle((pinch.v.a || 0) + rot)));
  v.touched = true;
  anchorView(v, k, ang, wp.x, wp.y, cx - r.left, cy - r.top);
  if (ang !== (pinch.v.a || 0)) syncViews(v);
  render();
}

function onDown(e) {
  if (e.button === 2) {
    e.preventDefault();
    if (drawing) { finishDrawing(); return; }
    try { svgEl.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
    const r = svgEl.getBoundingClientRect(), v = V(), sx = e.clientX - r.left, sy = e.clientY - r.top, wp = s2w(v, sx, sy);
    drag = { t: 'rotview', sx: e.clientX, sy: e.clientY, a0: v.a || 0, wp, ax: sx, ay: sy, moved: false };
    return;
  }
  try { svgEl.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) { cancelDrag(); startPinch(); return; }
  if (pointers.size > 2) return;
  const p = toWorld(e);
  if (e.button === 1 || spaceDown || tool === 'hand') { startPan(e, false); return; }
  if (mode === 'live') return downLive(e);
  const tgt = e.target.closest ? e.target.closest('[data-k]') : null;
  const k = tgt && tgt.dataset.k;
  switch (tool) {
    case 'select': return downSelect(e, p, tgt, k);
    case 'wall': return downWall(e, p);
    case 'room': return downRoom(e, p);
    case 'rect': { const q = snapPt(p); drag = { t: 'rect', a: q, moved: false, sx: e.clientX, sy: e.clientY }; hover = q; return; }
    case 'place': { if (placeType) placeItem(placeType, snapPt(p, { noPoints: true }), e.shiftKey); return; }
    case 'calib': return downCalib(p);
    default:
  }
}

function downLive(e) {
  const tgt = e.target.closest ? e.target.closest('[data-k="item"]') : null;
  const it = tgt && findItem(tgt.dataset.id);
  if (it && (it.entity || it.tap === 'service')) {
    drag = { t: 'live', id: it.id, sx: e.clientX, sy: e.clientY, moved: false, long: false };
    drag.timer = setTimeout(() => { if (drag && drag.t === 'live' && !drag.moved) { drag.long = true; onItemTap(it, true); } }, 550);
    return;
  }
  const rt = e.target.closest ? e.target.closest('[data-k="room"]') : null;
  const room = rt && findRoom(rt.dataset.id);
  if (room && (room.entity || room.area)) { drag = { t: 'liveRoom', id: room.id, sx: e.clientX, sy: e.clientY, moved: false }; return; }
  startPan(e, false);
}

function downSelect(e, p, tgt, k) {
  const f = curFloor();
  if (k === 'h') return downHandle(e, p, tgt);
  if (k === 'item') {
    const it = findItem(tgt.dataset.id);
    setSel('item', it.id);
    drag = { t: 'move', k: 'item', id: it.id, start: p, orig: { x: it.x, y: it.y, rot: it.rot, h: it.h }, moved: false, sx: e.clientX, sy: e.clientY, snap: JSON.stringify(plan) };
    return;
  }
  if (k === 'wall') {
    const w = findWall(tgt.dataset.id);
    setSel('wall', w.id);
    drag = { t: 'move', k: 'wall', id: w.id, start: p, orig: { x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 }, moved: false, sx: e.clientX, sy: e.clientY, snap: JSON.stringify(plan) };
    return;
  }
  if (k === 'room' || k === 'bg') {
    const was = sel && sel.k === k && (k === 'bg' || sel.id === tgt.dataset.id);
    if (k === 'room') setSel('room', tgt.dataset.id); else setSel('bg', 'bg');
    if (was) {
      const o = selObj();
      drag = { t: 'move', k, id: sel.id, start: p, orig: k === 'room' ? deepClone(o.pts) : { x: o.x, y: o.y }, moved: false, sx: e.clientX, sy: e.clientY, snap: JSON.stringify(plan) };
    } else startPan(e, false);
    return;
  }
  void f;
  startPan(e, true);
}

function downHandle(e, p, tgt) {
  const t = tgt.dataset.t, i = parseInt(tgt.dataset.i, 10), c = parseInt(tgt.dataset.c, 10);
  const snap = JSON.stringify(plan), base = { moved: false, sx: e.clientX, sy: e.clientY, snap };
  if (t === 'vrot') { drag = { ...base, t: 'vrot', id: sel.id }; return; }
  if (t === 'lrot') { drag = { ...base, t: 'lrot', id: sel.id }; return; }
  if (t === 'rot') { drag = { ...base, t: 'rot', id: sel.id }; return; }
  if (t === 'size') {
    const it = selObj(), hw = it.w / 2, hh = it.h / 2, cs = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], o = cs[(c + 2) % 4];
    const r = (it.rot || 0) * Math.PI / 180, cr = Math.cos(r), sr = Math.sin(r);
    drag = { ...base, t: 'size', id: it.id, fixed: { x: it.x + o[0] * cr - o[1] * sr, y: it.y + o[0] * sr + o[1] * cr } };
    return;
  }
  if (t === 'wa' || t === 'wb') {
    const w = selObj(), which = t === 'wa' ? 'a' : 'b', px = which === 'a' ? w.x1 : w.x2, py = which === 'a' ? w.y1 : w.y2;
    const linked = [];
    curFloor().walls.forEach(o => {
      if (o.id === w.id) return;
      if (Math.hypot(o.x1 - px, o.y1 - py) < 1) linked.push([o, 'a']);
      if (Math.hypot(o.x2 - px, o.y2 - py) < 1) linked.push([o, 'b']);
    });
    drag = { ...base, t: 'wend', id: w.id, which, linked, skip: new Set([w.id, ...linked.map(l => l[0].id)]) };
    return;
  }
  if (t === 'rm') {
    const r = selObj();
    r.pts.splice(i + 1, 0, [p.x, p.y]);
    drag = { ...base, t: 'rv', id: r.id, i: i + 1 };
    return;
  }
  if (t === 'rv') drag = { ...base, t: 'rv', id: sel.id, i };
}

function downWall(e, p) {
  const last = drawing && drawing.pts[drawing.pts.length - 1];
  const q = snapPt(p, { from: last, ortho: e.shiftKey });
  if (!drawing) { drawing = { k: 'wall', pts: [q] }; hover = q; updateDrawBar(); render(); return; }
  if (dist(last, q) < 1) { finishDrawing(); return; }
  addWall(last, q);
  drawing.pts.push(q);
  if (drawing.pts.length >= 3 && dist(drawing.pts[0], q) < 1) { finishDrawing(); return; }
  render();
}
function downRoom(e, p) {
  const last = drawing && drawing.pts[drawing.pts.length - 1];
  const q = snapPt(p, { from: last, ortho: e.shiftKey });
  if (!drawing) { drawing = { k: 'room', pts: [q] }; hover = q; updateDrawBar(); render(); return; }
  if (dist(last, q) < 1 || (drawing.pts.length >= 3 && dist(drawing.pts[0], q) < 14 / V().k)) { finishDrawing(); return; }
  drawing.pts.push(q);
  render();
}
async function downCalib(p) {
  calibPts.push({ x: p.x, y: p.y });
  render();
  if (calibPts.length < 2) return;
  const [a, b] = calibPts, f = curFloor();
  const val = await ask('Maßstab festlegen', 'Echter Abstand der beiden Punkte in Metern', '', 'number');
  const real = num(val, 0) * 100, cur = dist(a, b);
  if (val !== null && real > 0 && cur > 0 && f.bg) {
    const fac = real / cur;
    f.bg.x = a.x - (a.x - f.bg.x) * fac;
    f.bg.y = a.y - (a.y - f.bg.y) * fac;
    f.bg.w *= fac;
    commit();
    toast('Maßstab angepasst');
  }
  setTool('select');
  renderInspector();
}

function onMove(e) {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2 && pinch) { updatePinch(); return; }
  const p = toWorld(e);
  if (!drag) {
    if (mode === 'edit' && ['wall', 'room', 'rect', 'place', 'calib'].includes(tool)) {
      const last = drawing && drawing.pts[drawing.pts.length - 1];
      hover = tool === 'place' || tool === 'calib' ? { x: p.x, y: p.y } : snapPt(p, { from: last, ortho: e.shiftKey });
      render();
    } else { hover = { x: p.x, y: p.y }; updateStatus(); }
    return;
  }
  const dxs = e.clientX - drag.sx, dys = e.clientY - drag.sy;
  if (!drag.moved && Math.hypot(dxs, dys) > 4) drag.moved = true;
  if (!drag.moved && drag.t !== 'rect') return;
  const free = e.altKey, g = S().grid;
  switch (drag.t) {
    case 'rotview': { const v = V(); anchorView(v, v.k, normAngle(snapAngle(drag.a0 + dxs * 0.35)), drag.wp.x, drag.wp.y, drag.ax, drag.ay); syncViews(v); render(); break; }
    case 'orbit': {
      const v = V(), { w, h } = stageSize();
      let da = (Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx) - drag.ang0) * 180 / Math.PI;
      v.touched = true;
      anchorView(v, v.k, normAngle(snapAngle(normAngle(drag.a0 + da))), drag.wp.x, drag.wp.y, w / 2, h / 2);
      syncViews(v); render(); return;
    }
    case 'pan': { const v = V(); v.touched = true; v.tx = drag.tx + dxs; v.ty = drag.ty + dys; render(); break; }
    case 'live': case 'liveRoom':
      if (Math.hypot(dxs, dys) > 8) { clearTimeout(drag.timer); startPan({ clientX: e.clientX, clientY: e.clientY }, false); drag.moved = true; }
      break;
    case 'rect': hover = snapPt(p, { free }); render(); break;
    case 'move': doMove(p, free, g); break;
    case 'vrot': {
      const it = findItem(drag.id), L = valuePos(it);
      let ang = Math.atan2(p.y - L.y, p.x - L.x) * 180 / Math.PI + 90;
      if (!free) ang = Math.round(ang / 15) * 15;
      it.valueRot = r1(((ang + 540) % 360) - 180);
      render(); refreshInspectorValues(); break;
    }
    case 'lrot': {
      const it = findItem(drag.id), L = labelPos(it);
      let ang = Math.atan2(p.y - L.y, p.x - L.x) * 180 / Math.PI + 90;
      if (!free) ang = Math.round(ang / 15) * 15;
      it.labelRot = r1(((ang + 540) % 360) - 180);
      render(); refreshInspectorValues(); break;
    }
    case 'rot': {
      const it = findItem(drag.id);
      let ang = Math.atan2(p.y - it.y, p.x - it.x) * 180 / Math.PI + 90;
      if (!free) ang = Math.round(ang / 15) * 15;
      it.rot = r1(((ang + 540) % 360) - 180);
      render(); refreshInspectorValues(); break;
    }
    case 'size': {
      const it = findItem(drag.id), r = (it.rot || 0) * Math.PI / 180, cr = Math.cos(r), sr = Math.sin(r);
      const dx = p.x - drag.fixed.x, dy = p.y - drag.fixed.y;
      let dw = dx * cr + dy * sr, dh = -dx * sr + dy * cr;
      const st = free || !S().snap ? 0 : 5;
      if (st) { dw = Math.round(dw / st) * st; dh = Math.round(dh / st) * st; }
      it.w = Math.max(5, Math.abs(dw)); it.h = Math.max(5, Math.abs(dh));
      it.x = r1(drag.fixed.x + (dw * cr - dh * sr) / 2); it.y = r1(drag.fixed.y + (dw * sr + dh * cr) / 2);
      render(); refreshInspectorValues(); break;
    }
    case 'wend': {
      const w = findWall(drag.id), q = snapPt(p, { skip: drag.skip, free });
      if (drag.which === 'a') { w.x1 = q.x; w.y1 = q.y; } else { w.x2 = q.x; w.y2 = q.y; }
      drag.linked.forEach(([o, wh]) => { if (wh === 'a') { o.x1 = q.x; o.y1 = q.y; } else { o.x2 = q.x; o.y2 = q.y; } });
      hover = q; render(); refreshInspectorValues(); break;
    }
    case 'rv': {
      const r = findRoom(drag.id), q = snapPt(p, { skipRoom: r.id, free });
      r.pts[drag.i] = [q.x, q.y];
      hover = q; render(); refreshInspectorValues(); break;
    }
    default:
  }
}

function doMove(p, free, g) {
  let dx = p.x - drag.start.x, dy = p.y - drag.start.y;
  if (drag.k === 'item') {
    const it = findItem(drag.id);
    let nx = drag.orig.x + dx, ny = drag.orig.y + dy;
    if (S().snap && !free) { nx = Math.round(nx / g) * g; ny = Math.round(ny / g) * g; }
    it.x = r1(nx); it.y = r1(ny);
    const t = typeById(it.type);
    if ((t && t.wall) || it.shape === 'door' || it.shape === 'window') snapToWall(it, { x: nx, y: ny });
  } else {
    if (S().snap && !free) { dx = Math.round(dx / g) * g; dy = Math.round(dy / g) * g; }
    if (drag.k === 'wall') {
      const w = findWall(drag.id), o = drag.orig;
      w.x1 = r1(o.x1 + dx); w.y1 = r1(o.y1 + dy); w.x2 = r1(o.x2 + dx); w.y2 = r1(o.y2 + dy);
    } else if (drag.k === 'room') {
      findRoom(drag.id).pts = drag.orig.map(q => [r1(q[0] + dx), r1(q[1] + dy)]);
    } else if (drag.k === 'bg') {
      const b = curFloor().bg; b.x = r1(drag.orig.x + dx); b.y = r1(drag.orig.y + dy);
    }
  }
  render(); refreshInspectorValues();
}

function onUp(e) {
  pointers.delete(e.pointerId);
  if (pinch) { if (pointers.size < 2) pinch = null; return; }
  if (!drag) return;
  const d = drag;
  if (d.timer) clearTimeout(d.timer);
  drag = null;
  switch (d.t) {
    case 'orbit': case 'pan': if (!d.moved && d.clickDeselect && mode === 'edit' && sel) setSel(null); break;
    case 'live': { const it = findItem(d.id); if (!d.moved && !d.long && it) onItemTap(it, false); break; }
    case 'liveRoom': { const r = findRoom(d.id); if (!d.moved && r) onRoomTap(r, false); break; }
    case 'rect': {
      const a = d.a, b = snapPt(toWorld(e), { free: e.altKey });
      if (Math.abs(a.x - b.x) > 20 && Math.abs(a.y - b.y) > 20) createRectRoom(a, b); else { hover = null; render(); }
      break;
    }
    default: if (d.moved) { commit(); renderInspector(); } else render();
  }
}

function onWheel(e) {
  e.preventDefault();
  const r = svgEl.getBoundingClientRect();
  if (e.shiftKey) { rotateViewBy(-(e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 16 : 1) * 0.12, e.clientX - r.left, e.clientY - r.top); return; }
  const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015) * (e.deltaMode === 1 ? 16 : 1));
  zoomAt(e.clientX - r.left, e.clientY - r.top, f);
}

// ---------- Tastatur ----------
let clip = null;
function duplicateSel() {
  const o = selObj(), f = curFloor();
  if (!o || !sel) return;
  const c = deepClone(o);
  c.id = uid();
  if (sel.k === 'item') { c.x += 40; c.y += 40; f.items.push(c); }
  else if (sel.k === 'wall') { c.x1 += 40; c.y1 += 40; c.x2 += 40; c.y2 += 40; f.walls.push(c); }
  else if (sel.k === 'room') { c.pts = c.pts.map(q => [q[0] + 40, q[1] + 40]); c.name += ' (Kopie)'; f.rooms.push(c); }
  else return;
  commit();
  setSel(sel.k, c.id);
}
function deleteSel() {
  const f = curFloor();
  if (!sel || sel.k === 'bg') return;
  const key = { item: 'items', wall: 'walls', room: 'rooms' }[sel.k];
  f[key] = f[key].filter(x => x.id !== sel.id);
  sel = null;
  commit();
  renderInspector();
  render();
}
function onKey(e) {
  const tag = (e.target.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag) || (e.target.isContentEditable)) {
    if (e.key === 'Escape') e.target.blur();
    return;
  }
  if ($('#dlg').open) return;
  const mod = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
  if (e.key === ' ') { spaceDown = true; e.preventDefault(); return; }
  if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && key === 'y') { e.preventDefault(); redo(); return; }
  if (mod && key === 'd') { e.preventDefault(); duplicateSel(); return; }
  if (mod && key === 'c') { const o = selObj(); if (o && sel.k !== 'bg') clip = { k: sel.k, o: deepClone(o) }; return; }
  if (mod && key === 'v') {
    if (!clip) return;
    const c = deepClone(clip.o), f = curFloor();
    c.id = uid();
    if (clip.k === 'item') { c.x += 40; c.y += 40; f.items.push(c); }
    else if (clip.k === 'wall') { c.x1 += 40; c.y1 += 40; c.x2 += 40; c.y2 += 40; f.walls.push(c); }
    else { c.pts = c.pts.map(q => [q[0] + 40, q[1] + 40]); f.rooms.push(c); }
    commit(); setSel(clip.k, c.id); return;
  }
  if (!mod && (key === 'q' || key === 'e')) { rotateViewBy(key === 'q' ? -15 : 15); return; }
  if (mod || mode === 'live') return;
  if (e.key === 'Escape') { if (drawing) { drawing = null; updateDrawBar(); render(); } else if (tool !== 'select') setTool('select'); else if (sel) setSel(null); return; }
  if (e.key === 'Enter') { finishDrawing(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSel(); return; }
  if (key === 'v') setTool('select');
  else if (key === 'w') setTool('wall');
  else if (key === 'r') setTool('rect');
  else if (key === 'p') setTool('room');
  else if (key === 'h') setTool('hand');
  else if (e.key.startsWith('Arrow') && sel && sel.k !== 'bg') {
    e.preventDefault();
    const st = e.shiftKey ? 25 : 5, dx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, dy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0;
    const o = selObj();
    if (sel.k === 'item') { o.x += dx; o.y += dy; }
    else if (sel.k === 'wall') { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; }
    else if (sel.k === 'room') o.pts = o.pts.map(q => [q[0] + dx, q[1] + dy]);
    clearTimeout(onKey._t);
    onKey._t = setTimeout(commit, 400);
    render(); refreshInspectorValues();
  }
}

function bindStage() {
  svgEl.addEventListener('pointerdown', onDown);
  svgEl.addEventListener('pointermove', onMove);
  svgEl.addEventListener('pointerup', onUp);
  svgEl.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); pinch = null; cancelDrag(); });
  svgEl.addEventListener('wheel', onWheel, { passive: false });
  svgEl.addEventListener('contextmenu', e => e.preventDefault());
  svgEl.addEventListener('dblclick', e => { if (mode === 'edit' && tool === 'select' && !e.target.closest('[data-k]')) fitView(); });
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', e => { if (e.key === ' ') spaceDown = false; });
  window.addEventListener('resize', render);
  // Bühne wurde (z. B. beim Einblenden des Panels) deutlich größer/kleiner: automatisch neu einpassen, solange der Nutzer nichts verschoben hat
  if (window.ResizeObserver) new ResizeObserver(() => {
    if (!plan) return;
    const v = V(), { w, h } = stageSize();
    if (w < 50 || h < 50) return;
    if (v.fitted && !v.touched && (Math.abs(w - v.fitW) > v.fitW * 0.25 || Math.abs(h - v.fitH) > v.fitH * 0.25)) fitView(); else render();
  }).observe($('#stage'));

  // Drag & Drop aus der Bibliothek
  const stage = $('#stage');
  stage.addEventListener('dragover', e => e.preventDefault());
  stage.addEventListener('drop', e => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain') || '';
    if (raw.startsWith('fp-ent:') && mode === 'edit') { placeEntities([raw.slice(7)], snapPt(toWorld(e), { noPoints: true })); return; }
    const id = raw.replace(/^fp:/, '');
    const t = typeById(id);
    if (!t || mode !== 'edit') return;
    placeItem(t, snapPt(toWorld(e), { noPoints: true }), true);
  });

  $('#zoomIn').onclick = () => { const r = stageSize(); zoomAt(r.w / 2, r.h / 2, 1.3); };
  $('#zoomOut').onclick = () => { const r = stageSize(); zoomAt(r.w / 2, r.h / 2, 1 / 1.3); };
  $('#zoomFit').onclick = fitView;
  $('#orbit').onclick = () => { orbitMode = !orbitMode; $('#orbit').classList.toggle('on', orbitMode); toast(orbitMode ? 'Dreh-Modus: Mit einem Finger/der Maus ziehen dreht die Ansicht' : 'Dreh-Modus aus: Ziehen verschiebt die Ansicht'); };
  $('#rotL').onclick = () => rotateViewBy(-90);
  $('#rotR').onclick = () => rotateViewBy(90);
  $('#btnFinish').onclick = finishDrawing;
  $('#btnCancel').onclick = () => setTool('select');
  $$('#tools button').forEach(b => { b.onclick = () => { setTool(b.dataset.tool); document.body.classList.remove('show-left'); }; });
}
