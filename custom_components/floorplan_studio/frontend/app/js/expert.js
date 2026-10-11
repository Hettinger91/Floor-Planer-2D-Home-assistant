'use strict';
// ============================================================================
// Experten-Modus (2D): Messen, Bemaßung, Hilfslinien, Leitungen & Stromkreise, Funk-Reichweite,
// Sensor-Sichtfeld, Ausrichten/Verteilen/Spiegeln, Wandwerkzeuge, Suche, SVG-/DXF-Export.
// Daten: f.dims, f.guides, f.cables (je Etage) · Objekt: rf, fov, fr, circuit · Plan: settings.expert
// ============================================================================
const isExpert = () => !!(plan && plan.settings && plan.settings.expert);
const EX_TOOLS = ['measure', 'dim', 'guide', 'cable'];
const CABLE_KINDS = { power: ['Strom', '#e53935'], net: ['Netzwerk', '#1e88e5'], bus: ['Bus (KNX …)', '#8e24aa'], sensor: ['Sensor / Signal', '#43a047'] };
let exS = null; // laufende Aktion eines Expertenwerkzeugs
let exHl = ''; // hervorgehobener Stromkreis (nur Laufzeit)
const exLen = cm => (typeof unitM === 'function' && unitM()) ? fmtN(cm / 100, 2) + ' m' : fmtN(cm, 1) + ' cm';
const exArr = (f, k) => f[k] || (f[k] = []);
const exAngle = (dx, dy) => { let a = Math.atan2(-dy, dx) * 180 / Math.PI; if (a < 0) a += 360; return a; };
const exPathLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };

Object.assign(HINTS, {
  measure: 'Zwei Punkte anklicken: Abstand und Winkel · Umschalt = gerade · Esc beendet',
  dim: 'Start- und Endpunkt anklicken, dann die Maßlinie platzieren · Esc bricht ab',
  guide: 'Klick = waagerechte Hilfslinie · Umschalt = senkrechte · zum Verschieben/Löschen Auswahl-Werkzeug',
  cable: 'Startgerät anklicken, Zwischenpunkte setzen, Zielgerät anklicken · Esc bricht ab',
});

// ---------- Schalter ----------
function syncExpert() {
  document.body.classList.toggle('expert', isExpert());
  const b = document.getElementById('btnExpert'); if (b) b.classList.toggle('on', isExpert());
}
function setExpert(on) {
  plan.settings.expert = !!on; commit(); syncExpert();
  if (!on && EX_TOOLS.includes(tool)) setTool('select'); else exCancel();
  renderInspector(); render();
  toast(on ? 'Experten-Modus an' : 'Experten-Modus aus');
}
function exCancel() { exS = null; }

// ---------- Fang an Hilfslinien ----------
function exGuideSnap(x, y, k) {
  if (!isExpert()) return { x, y, gx: false, gy: false };
  let gx = false, gy = false; const tol = 10 / (k || 1);
  (curFloor().guides || []).forEach(g => {
    if (g.ax === 'x' && Math.abs(x - g.pos) < tol) { x = g.pos; gx = true; }
    if (g.ax === 'y' && Math.abs(y - g.pos) < tol) { y = g.pos; gy = true; }
  });
  return { x, y, gx, gy };
}

// ---------- Eingabe ----------
function exSnap(p, e, from) { return snapPt(p, { from, ortho: !!(e && e.shiftKey) }); }
function exDown(e, p) {
  const f = curFloor();
  if (tool === 'measure') {
    const q = exSnap(p, e, exS && exS.a && !exS.b ? exS.a : null);
    if (!exS || exS.t !== 'measure' || exS.b) exS = { t: 'measure', a: q, b: null }; else exS.b = q;
    hover = q; render(); return true;
  }
  if (tool === 'dim') {
    const q = exSnap(p, e, exS && exS.a && !exS.b ? exS.a : null);
    if (!exS || exS.t !== 'dim') { exS = { t: 'dim', a: q, b: null }; hover = q; render(); return true; }
    if (!exS.b) { if (Math.hypot(q.x - exS.a.x, q.y - exS.a.y) < 1) return true; exS.b = q; hover = p; render(); return true; }
    const d = { id: uid(), x1: exS.a.x, y1: exS.a.y, x2: exS.b.x, y2: exS.b.y, off: exDimOff(exS.a, exS.b, p) };
    exArr(f, 'dims').push(d); exS = null; commit(); render(); return true;
  }
  if (tool === 'guide') {
    const q = snapPt(p, { noPoints: false }), vert = !!e.shiftKey;
    exArr(f, 'guides').push({ id: uid(), ax: vert ? 'x' : 'y', pos: vert ? q.x : q.y });
    commit(); render(); return true;
  }
  if (tool === 'cable') {
    const tg = e.target.closest ? e.target.closest('[data-k="item"]') : null, it = tg && findItem(tg.dataset.id);
    if (!exS || exS.t !== 'cable') {
      if (!it) { toast('Zuerst ein Gerät als Start anklicken'); return true; }
      exS = { t: 'cable', a: it.id, pts: [] }; hover = p; render(); return true;
    }
    if (it && it.id !== exS.a) {
      exArr(f, 'cables').push({ id: uid(), a: exS.a, b: it.id, pts: exS.pts.slice(), kind: exS.kind || 'power', circuit: (findItem(exS.a) || {}).circuit || '' });
      const c = f.cables[f.cables.length - 1]; exS = null; commit(); setTool('select'); setSel('cable', c.id); return true;
    }
    if (!it) { const last = exS.pts.length ? { x: exS.pts[exS.pts.length - 1][0], y: exS.pts[exS.pts.length - 1][1] } : null; const q = exSnap(p, e, last || centerOf(exS.a)); exS.pts.push([q.x, q.y]); render(); }
    return true;
  }
  return false;
}
function centerOf(id) { const it = findItem(id); return it ? { x: it.x, y: it.y } : null; }
function exDimOff(a, b, p) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const o = (p.x - a.x) * nx + (p.y - a.y) * ny; return r1(Math.abs(o) < 5 ? 40 : o);
}
function exHover(p, e) {
  if (!exS) { hover = snapPt(p, {}); render(); return; }
  if (exS.t === 'dim' && exS.b) hover = { x: p.x, y: p.y };
  else hover = exSnap(p, e, exS.t === 'cable' ? (exS.pts.length ? { x: exS.pts[exS.pts.length - 1][0], y: exS.pts[exS.pts.length - 1][1] } : centerOf(exS.a)) : exS.a);
  render();
}
// Auswahl-Werkzeug: Maßlinien, Hilfslinien, Leitungen
function exSelectDown(e, p, tgt, k) {
  if (k !== 'dim' && k !== 'guide' && k !== 'cable') return false;
  const id = tgt.dataset.id;
  if (!(sel && sel.k === k && sel.id === id)) setSel(k, id);
  if (k === 'guide') {
    const g = (curFloor().guides || []).find(x => x.id === id);
    drag = { t: 'exg', id, start: p, orig: g.pos, moved: false, sx: e.clientX, sy: e.clientY, snap: JSON.stringify(plan) };
  } else startPan(e, false);
  return true;
}
function exDragMove(p) {
  const g = (curFloor().guides || []).find(x => x.id === drag.id); if (!g) return;
  const d = g.ax === 'x' ? p.x - drag.start.x : p.y - drag.start.y;
  g.pos = r1(S().snap ? Math.round((drag.orig + d) / S().grid) * S().grid : drag.orig + d);
  render();
}

// ---------- Darstellung ----------
const EX_COL = '#00acc1', EX_DIM = '#0d7a8a';
function exFs(v) { return Math.max(S().labelSize * 0.62, 11.5 / ((v && v.k) || 1)); }
const exTxt = (x, y, t, fs, col, rot) => `<text x="${x}" y="${y}" dy=".35em" text-anchor="middle" font-size="${fs}" fill="${col}" stroke="${C.canvas || '#fff'}" stroke-width="${fs * 0.28}" paint-order="stroke" ${rot != null ? `transform="rotate(${rot} ${x} ${y})"` : ''} pointer-events="none" style="user-select:none">${esc(t)}</text>`;
function exDimMarkup(d, v, on, id) {
  const dx = d.x2 - d.x1, dy = d.y2 - d.y1, L = Math.hypot(dx, dy); if (L < 0.5) return '';
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, off = d.off == null ? 40 : d.off, sg = off >= 0 ? 1 : -1, fs = exFs(v), col = on ? C.accent : EX_DIM, tk = fs * 0.55;
  const ax = d.x1 + nx * off, ay = d.y1 + ny * off, bx = d.x2 + nx * off, by = d.y2 + ny * off, ext = fs * 0.5 * sg;
  let a = Math.atan2(dy, dx) * 180 / Math.PI; if (a > 90) a -= 180; if (a <= -90) a += 180;
  const tx = (ax + bx) / 2 + nx * fs * 0.9 * (sg), ty = (ay + by) / 2 + ny * fs * 0.9 * sg, label = d.text || exLen(L);
  const tick = (x, y) => `<line x1="${x - (ux - nx) * tk}" y1="${y - (uy - ny) * tk}" x2="${x + (ux - nx) * tk}" y2="${y + (uy - ny) * tk}" stroke="${col}" stroke-width="1.6" ${NS}/>`;
  return (id ? `<g data-k="dim" data-id="${d.id}">` : '<g>') +
    (id ? `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="transparent" stroke-width="${Math.max(12, 14 / ((v && v.k) || 1))}"/>` : '') +
    `<line x1="${d.x1 + nx * Math.sign(off) * 3}" y1="${d.y1 + ny * Math.sign(off) * 3}" x2="${ax + nx * ext}" y2="${ay + ny * ext}" stroke="${col}" stroke-width="1" ${NS} pointer-events="none"/>` +
    `<line x1="${d.x2 + nx * Math.sign(off) * 3}" y1="${d.y2 + ny * Math.sign(off) * 3}" x2="${bx + nx * ext}" y2="${by + ny * ext}" stroke="${col}" stroke-width="1" ${NS} pointer-events="none"/>` +
    `<line x1="${ax - ux * tk * 2}" y1="${ay - uy * tk * 2}" x2="${bx + ux * tk * 2}" y2="${by + uy * tk * 2}" stroke="${col}" stroke-width="1.2" ${NS} pointer-events="none"/>` +
    tick(ax, ay) + tick(bx, by) + exTxt(tx, ty, label, fs, col, a) + '</g>';
}
function exCablePath(f, c) {
  const A = (f.items || []).find(i => i.id === c.a), B = (f.items || []).find(i => i.id === c.b); if (!A || !B) return null;
  const pts = [[A.x, A.y], ...(c.pts || []), [B.x, B.y]];
  if (!(c.pts && c.pts.length) && Math.abs(A.x - B.x) > 1 && Math.abs(A.y - B.y) > 1) pts.splice(1, 0, [B.x, A.y]);
  return pts;
}
const exRise = () => Number(S().cableRise != null ? S().cableRise : 120) || 0;
const exCableLen = (f, c) => { const p = exCablePath(f, c); return p ? exPathLen(p) + 2 * exRise() : 0; };
function exCableMarkup(f, c, v, on) {
  const p = exCablePath(f, c); if (!p) return '';
  const col = (CABLE_KINDS[c.kind] || CABLE_KINDS.power)[1], pts = p.map(q => q.join(',')).join(' '), fs = exFs(v);
  const hl = exHl;
  const dim = hl && c.circuit !== hl ? ' opacity=".25"' : '';
  const mid = p[Math.floor(p.length / 2)], lab = c.circuit ? c.circuit : '';
  return `<g data-k="cable" data-id="${c.id}"${dim}><polyline points="${pts}" fill="none" stroke="transparent" stroke-width="${Math.max(12, 14 / ((v && v.k) || 1))}" stroke-linejoin="round"/>` +
    `<polyline points="${pts}" fill="none" stroke="${on ? C.accent : col}" stroke-width="${on ? 3.2 : 2}" stroke-dasharray="${c.kind === 'net' ? '10 4' : c.kind === 'sensor' ? '3 4' : c.kind === 'bus' ? '14 4 3 4' : 'none'}" stroke-linejoin="round" ${NS} pointer-events="none"/>` +
    p.slice(1, -1).map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="${fs * 0.22}" fill="${col}" pointer-events="none"/>`).join('') +
    (lab ? exTxt(mid[0], mid[1] - fs * 0.9, lab, fs * 0.85, col) : '') + '</g>';
}
function exHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
const exCircuitCol = s => `hsl(${exHash(s) % 360} 70% 42%)`;

// Strahlverfolgung gegen Wände (Sichtfeld, Funk)
function exRay(f, ox, oy, ang, reach, atten) {
  const dx = Math.cos(ang), dy = Math.sin(ang), hits = [];
  (f.walls || []).forEach(w => {
    const sx = w.x2 - w.x1, sy = w.y2 - w.y1, den = dx * sy - dy * sx; if (Math.abs(den) < 1e-9) return;
    const qx = w.x1 - ox, qy = w.y1 - oy, t = (qx * sy - qy * sx) / den, u = (qx * dy - qy * dx) / den;
    if (t > 0.5 && u >= 0 && u <= 1) hits.push(t);
  });
  hits.sort((a, b) => a - b);
  if (!atten) return hits.length && hits[0] < reach ? hits[0] : reach;
  let R = reach;
  for (let k = 0; k < hits.length; k++) { if (hits[k] >= R) return R; R = reach * Math.pow(atten, k + 1); }
  return R;
}
function exRangeMarkup(f, it) {
  let out = '';
  if (it.rf > 0) {
    const poly = base => { const pts = []; for (let i = 0; i < 90; i++) { const a = i * Math.PI * 2 / 90, r = exRay(f, it.x, it.y, a, base, 0.6); pts.push([it.x + Math.cos(a) * r, it.y + Math.sin(a) * r]); } return pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '); };
    out += `<polygon points="${poly(it.rf)}" fill="#26c6da" fill-opacity=".10" stroke="#26c6da" stroke-opacity=".6" stroke-width="1" stroke-dasharray="6 4" ${NS} pointer-events="none"/>` +
      `<polygon points="${poly(it.rf * 0.5)}" fill="#26c6da" fill-opacity=".16" stroke="none" pointer-events="none"/>`;
  }
  if (it.fov > 0 && it.fr > 0) {
    const c0 = (it.rot || 0) * Math.PI / 180 - Math.PI / 2, half = Math.min(180, it.fov) * Math.PI / 360, n = Math.max(6, Math.round(it.fov / 4)), pts = [[it.x, it.y]];
    for (let i = 0; i <= n; i++) { const a = c0 - half + (2 * half) * i / n, r = exRay(f, it.x, it.y, a, it.fr, 0); pts.push([it.x + Math.cos(a) * r, it.y + Math.sin(a) * r]); }
    out += `<polygon points="${pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')}" fill="#ff9800" fill-opacity=".2" stroke="#fb8c00" stroke-opacity=".8" stroke-width="1" ${NS} pointer-events="none"/>`;
  }
  return out;
}
// unter den Objekten
function exMarkupBelow(f) {
  if (!isExpert() || mode !== 'edit') return '';
  return (f.items || []).map(it => exRangeMarkup(f, it)).join('');
}
// über den Objekten
function exMarkupAbove(f, v, forExport) {
  if (!forExport && (!isExpert() || mode !== 'edit')) return '';
  const on = (k, id) => !forExport && sel && sel.k === k && sel.id === id, fs = exFs(v);
  let out = '';
  if (!forExport) {
    (f.guides || []).forEach(g => {
      const a = g.ax === 'x' ? `x1="${g.pos}" x2="${g.pos}" y1="-50000" y2="50000"` : `y1="${g.pos}" y2="${g.pos}" x1="-50000" x2="50000"`, col = on('guide', g.id) ? C.accent : EX_COL;
      out += `<g data-k="guide" data-id="${g.id}"><line ${a} stroke="transparent" stroke-width="${Math.max(12, 14 / ((v && v.k) || 1))}"/><line ${a} stroke="${col}" stroke-width="1" stroke-dasharray="8 5" opacity=".75" ${NS} pointer-events="none"/></g>`;
    });
  }
  (f.cables || []).forEach(c => { out += exCableMarkup(f, c, v, on('cable', c.id)); });
  (f.dims || []).forEach(d => { out += exDimMarkup(d, v, on('dim', d.id), !forExport); });
  if (!forExport) {
    // Stromkreis-Plaketten
    (f.items || []).forEach(it => { if (!it.circuit) return; const hl = exHl; const col = exCircuitCol(it.circuit), s = fs * 0.8, bw = Math.max(s * 1.2, s * 0.62 * String(it.circuit).length + s * 0.5);
      const bx = it.x + it.w / 2, by = it.y - it.h / 2; out += `<g pointer-events="none" ${hl && hl !== it.circuit ? 'opacity=".25"' : ''}><rect x="${bx - bw / 2}" y="${by - s * 0.6}" width="${bw}" height="${s * 1.2}" rx="${s * 0.3}" fill="${col}"/><text x="${bx}" y="${by}" dy=".35em" text-anchor="middle" font-size="${s * 0.85}" fill="#fff" font-weight="600">${esc(it.circuit)}</text></g>`; });
    // laufende Aktion (Vorschau)
    if (exS) out += exPreview(f, v);
  }
  return out;
}
function exPreview(f, v) {
  const fs = exFs(v), h = hover; if (!h) return '';
  if (exS.t === 'measure' && exS.a) {
    const b = exS.b || h, dx = b.x - exS.a.x, dy = b.y - exS.a.y, L = Math.hypot(dx, dy);
    const dot = q => `<circle cx="${q.x}" cy="${q.y}" r="${fs * 0.28}" fill="${EX_COL}"/>`;
    return `<g pointer-events="none"><line x1="${exS.a.x}" y1="${exS.a.y}" x2="${b.x}" y2="${b.y}" stroke="${EX_COL}" stroke-width="2" ${NS}/>${dot(exS.a)}${dot(b)}` +
      `<line x1="${exS.a.x}" y1="${exS.a.y}" x2="${b.x}" y2="${exS.a.y}" stroke="${EX_COL}" stroke-width="1" stroke-dasharray="4 4" opacity=".6" ${NS}/><line x1="${b.x}" y1="${exS.a.y}" x2="${b.x}" y2="${b.y}" stroke="${EX_COL}" stroke-width="1" stroke-dasharray="4 4" opacity=".6" ${NS}/>` +
      exTxt((exS.a.x + b.x) / 2, (exS.a.y + b.y) / 2 - fs * 1.4, `${exLen(L)} · ${fmtN(exAngle(dx, dy), 1)}°`, fs * 1.05, EX_COL) +
      exTxt((exS.a.x + b.x) / 2, (exS.a.y + b.y) / 2 + fs * 1.4, `Δx ${exLen(Math.abs(dx))} · Δy ${exLen(Math.abs(dy))}`, fs * 0.8, EX_DIM) + '</g>';
  }
  if (exS.t === 'dim' && exS.a) {
    if (!exS.b) return `<line x1="${exS.a.x}" y1="${exS.a.y}" x2="${h.x}" y2="${h.y}" stroke="${EX_COL}" stroke-width="1.5" stroke-dasharray="5 4" ${NS} pointer-events="none"/>`;
    return exDimMarkup({ x1: exS.a.x, y1: exS.a.y, x2: exS.b.x, y2: exS.b.y, off: exDimOff(exS.a, exS.b, h) }, v, true, false);
  }
  if (exS.t === 'cable') {
    const A = centerOf(exS.a); if (!A) return '';
    const pts = [[A.x, A.y], ...exS.pts, [h.x, h.y]].map(q => q.join(',')).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${(CABLE_KINDS[exS.kind || 'power'] || CABLE_KINDS.power)[1]}" stroke-width="2" stroke-dasharray="6 4" ${NS} pointer-events="none"/>`;
  }
  return '';
}

// ---------- Auswahl-Hilfen ----------
function exBBox(sels) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  sels.forEach(m => { const o = objOf(m); if (!o) return;
    if (m.k === 'item') itemCorners(o).forEach(p => add(p[0], p[1])); else if (m.k === 'wall') { add(o.x1, o.y1); add(o.x2, o.y2); } else if (m.k === 'room') o.pts.forEach(p => add(p[0], p[1])); });
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
function exObjBox(m) { return exBBox([m]); }
function exAlign(kind) {
  const sels = selAll().filter(m => { const o = objOf(m); return o && !isLocked(m.k, o); }); if (sels.length < 2) { toast('Mindestens zwei Elemente markieren (Umschalt+Klick)'); return; }
  const B = exBBox(sels);
  if (kind === 'dh' || kind === 'dv') {
    if (sels.length < 3) { toast('Zum Verteilen mindestens drei Elemente markieren'); return; }
    const key = kind === 'dh' ? 'cx' : 'cy', list = sels.map(m => ({ m, b: exObjBox(m) })).sort((a, b) => a.b[key] - b.b[key]);
    const first = list[0].b[key], last = list[list.length - 1].b[key], step = (last - first) / (list.length - 1);
    list.forEach((e, i) => { const d = first + step * i - e.b[key]; shiftObj(e.m.k, objOf(e.m), kind === 'dh' ? r1(d) : 0, kind === 'dv' ? r1(d) : 0); });
  } else {
    sels.forEach(m => { const o = objOf(m), b = exObjBox(m); let dx = 0, dy = 0;
      if (kind === 'l') dx = B.x0 - b.x0; else if (kind === 'r') dx = B.x1 - b.x1; else if (kind === 'ch') dx = B.cx - b.cx;
      else if (kind === 't') dy = B.y0 - b.y0; else if (kind === 'b') dy = B.y1 - b.y1; else if (kind === 'cv') dy = B.cy - b.cy;
      shiftObj(m.k, o, r1(dx), r1(dy)); });
  }
  commit(); render(); refreshInspectorValues();
}
function exMirror(axis) { // axis 'h' = an senkrechter Achse (links↔rechts), 'v' = an waagerechter Achse
  const sels = selAll().filter(m => { const o = objOf(m); return o && !isLocked(m.k, o); }); if (!sels.length) return;
  const B = exBBox(sels), fx = axis === 'h', mx = x => r1(2 * B.cx - x), my = y => r1(2 * B.cy - y);
  sels.forEach(m => { const o = objOf(m);
    if (m.k === 'item') { if (fx) { o.x = mx(o.x); o.rot = r1(((360 - (o.rot || 0)) % 360 + 360) % 360); o.flipX = !o.flipX; } else { o.y = my(o.y); o.rot = r1(((180 - (o.rot || 0)) % 360 + 360) % 360); o.flipX = !o.flipX; } }
    else if (m.k === 'wall') { if (fx) { o.x1 = mx(o.x1); o.x2 = mx(o.x2); } else { o.y1 = my(o.y1); o.y2 = my(o.y2); } }
    else if (m.k === 'room') o.pts = o.pts.map(q => fx ? [mx(q[0]), q[1]] : [q[0], my(q[1])]); });
  commit(); render(); refreshInspectorValues();
}
function exSelectSameType() {
  const it = sel && sel.k === 'item' ? selObj() : null; if (!it) return;
  const f = curFloor(), same = f.items.filter(i => i.type === it.type && i.id !== it.id);
  multi = same.map(i => ({ k: 'item', id: i.id })); renderInspector(); render(); toast(`${same.length + 1} Objekte markiert`);
}
// Wandwerkzeuge
async function exWallParallel(w, dist) {
  const v = dist != null ? dist : await ask('Parallele Wand', 'Abstand in cm (negativ = andere Seite)', '100'); if (v == null) return;
  const d = parseFloat(String(v).replace(',', '.')); if (!isFinite(d) || !d) return;
  const L = wallLen(w) || 1, nx = -(w.y2 - w.y1) / L * d, ny = (w.x2 - w.x1) / L * d, c = deepClone(w);
  c.id = uid(); c.x1 = r1(w.x1 + nx); c.y1 = r1(w.y1 + ny); c.x2 = r1(w.x2 + nx); c.y2 = r1(w.y2 + ny); curFloor().walls.push(c); commit(); setSel('wall', c.id);
}
function exWallSplit(w) {
  const mx = r1((w.x1 + w.x2) / 2), my = r1((w.y1 + w.y2) / 2), c = deepClone(w); c.id = uid();
  c.x1 = mx; c.y1 = my; c.x2 = w.x2; c.y2 = w.y2; w.x2 = mx; w.y2 = my; curFloor().walls.push(c); commit(); render(); renderInspector(); toast('Wand geteilt');
}
function exDimWall(w) { exArr(curFloor(), 'dims').push({ id: uid(), x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, off: 50 }); commit(); render(); }
function exDimRoom(r) {
  const xs = r.pts.map(p => p[0]), ys = r.pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), f = curFloor();
  exArr(f, 'dims').push({ id: uid(), x1: x0, y1: y1, x2: x1, y2: y1, off: 60 }, { id: uid(), x1: x1, y1: y0, x2: x1, y2: y1, off: 60 });
  commit(); render();
}

// ---------- Inspektor ----------
const exSec = (t, inner, open) => (typeof section === 'function' ? section(t, inner, open) : inner);
function exInspector(box, k, o) {
  const f = curFloor();
  if (k === 'dim') {
    const specs = [
      { k: 'text', t: 'text', l: 'Text (leer = automatisch)' }, { k: 'off', t: 'num', l: 'Abstand der Maßlinie (cm)', step: 1 },
      { k: 'x1', t: 'num', l: 'Start X (cm)' }, { k: 'y1', t: 'num', l: 'Start Y (cm)' }, { k: 'x2', t: 'num', l: 'Ende X (cm)' }, { k: 'y2', t: 'num', l: 'Ende Y (cm)' },
    ], P = key => specHtml(specs.find(s => s.k === key));
    box.innerHTML = `<div class="ihead"><span class="ico">↔</span><b>Maßlinie</b></div>` +
      exSec('Maßlinie', `<div class="hint" id="exDimLen"><span>Länge</span>: <b>${exLen(Math.hypot(o.x2 - o.x1, o.y2 - o.y1))}</b></div>` + P('text') + P('off')) +
      exSec('Koordinaten (cm)', pair(P('x1'), P('y1')) + pair(P('x2'), P('y2'))) + actionsHtml([['del', 'Löschen', 'danger']]);
    wire(box, o, specs, { onInput: () => { const e = $('#exDimLen b', box); if (e) e.textContent = exLen(Math.hypot(o.x2 - o.x1, o.y2 - o.y1)); } });
    bindActs(box, { del: deleteSel }); return;
  }
  if (k === 'guide') {
    const specs = [{ k: 'pos', t: 'num', l: 'Position (cm)' }];
    box.innerHTML = `<div class="ihead"><span class="ico">┿</span><b>${FPI.tr(o.ax === 'x' ? 'Senkrechte' : 'Waagerechte')} ${FPI.tr('Hilfslinie')}</b></div>` + exSec('Hilfslinie', specHtml(specs[0])) + actionsHtml([['del', 'Löschen', 'danger']]);
    wire(box, o, specs); bindActs(box, { del: deleteSel }); return;
  }
  if (k === 'cable') {
    const specs = [
      { k: 'kind', t: 'select', l: 'Art', o: Object.keys(CABLE_KINDS).map(x => [x, CABLE_KINDS[x][0]]) },
      { k: 'circuit', t: 'text', l: 'Stromkreis / Bezeichnung', ph: 'z. B. F3 oder KNX-1' },
    ];
    box.innerHTML = `<div class="ihead"><span class="ico">⌁</span><b>Leitung</b></div>` +
      exSec('Leitung', `<div class="hint" id="exCabLen"><span>Länge inkl. Zuschlag</span>: <b>${exLen(exCableLen(f, o))}</b></div>` + specs.map(specHtml).join('')) +
      actionsHtml([['clear', 'Zwischenpunkte entfernen'], ['del', 'Löschen', 'danger']]);
    wire(box, o, specs, { onInput: () => { const e = $('#exCabLen b', box); if (e) e.textContent = exLen(exCableLen(f, o)); } });
    bindActs(box, { del: deleteSel, clear: () => { o.pts = []; commit(); render(); renderInspector(); } }); return;
  }
}
const exBtn = (id, label, title) => `<button type="button" class="btn" data-act="${id}" title="${esc(title || label)}">${label}</button>`;
function exInspectorExtra(box) {
  if (!isExpert() || mode !== 'edit') return;
  const wrap = document.createElement('div'); wrap.className = 'ex-extra'; const f = curFloor(), acts = {}, specs = []; let html = '';
  const n = selAll().length;
  if (n >= 1) {
    html += exSec('Ausrichten & Spiegeln', `<div class="ex-grid">${[['l', '⇤', 'Links ausrichten'], ['ch', '⇔', 'Horizontal zentrieren'], ['r', '⇥', 'Rechts ausrichten'], ['t', '⤒', 'Oben ausrichten'], ['cv', '⇕', 'Vertikal zentrieren'], ['b', '⤓', 'Unten ausrichten'], ['dh', '↔ ⋮', 'Horizontal verteilen'], ['dv', '↕ ⋮', 'Vertikal verteilen'], ['mh', '⟷', 'Spiegeln links↔rechts'], ['mv', '⥮', 'Spiegeln oben↔unten']].map(([id, l, t]) => exBtn('al_' + id, l, t)).join('')}</div>` +
      (n < 2 ? '<div class="hint">Zum Ausrichten mehrere Elemente mit Umschalt+Klick markieren.</div>' : ''), n > 1);
    ['l', 'ch', 'r', 't', 'cv', 'b', 'dh', 'dv'].forEach(id => { acts['al_' + id] = () => exAlign(id); });
    acts.al_mh = () => exMirror('h'); acts.al_mv = () => exMirror('v');
  }
  if (sel && sel.k === 'item') {
    const it = selObj(); if (it) {
      const sp = [{ k: 'rf', t: 'num', l: 'Funk-Reichweite (cm) · 0 = aus', min: 0, step: 10 }, { k: 'fov', t: 'num', l: 'Erfassungswinkel (°) · 0 = aus', min: 0, step: 5 }, { k: 'fr', t: 'num', l: 'Sicht-Reichweite (cm)', min: 0, step: 10 }, { k: 'circuit', t: 'text', l: 'Stromkreis / Sicherung', ph: 'z. B. F3' }];
      specs.push(...sp);
      html += exSec('Experte: Funk, Sichtfeld, Stromkreis', sp.map(specHtml).join('') + `<div class="hint">Funk/Sichtfeld werden von Wänden abgeschattet. Sichtfeld zeigt in Richtung der Objekt-Drehung (0° = nach oben).</div>` + actionsHtml([['same', 'Alle gleichen Typs markieren']]));
      acts.same = exSelectSameType; wrap._obj = it;
    }
  } else if (sel && sel.k === 'wall') {
    const w = selObj(); if (w) { html += exSec('Experte: Wand', actionsHtml([['par', 'Parallele Wand …'], ['split', 'Wand teilen'], ['dimw', 'Bemaßen']])); acts.par = () => exWallParallel(w); acts.split = () => exWallSplit(w); acts.dimw = () => exDimWall(w); }
  } else if (sel && sel.k === 'room') {
    const r = selObj(); if (r) { html += exSec('Experte: Raum', actionsHtml([['dimr', 'Raum bemaßen']])); acts.dimr = () => exDimRoom(r); }
  } else if (!sel || sel.k === 'bg') {
    const circ = {}; plan.floors.forEach(fl => (fl.items || []).forEach(i => { if (i.circuit) circ[i.circuit] = (circ[i.circuit] || 0) + 1; }));
    const cabLen = {}; plan.floors.forEach(fl => (fl.cables || []).forEach(c => { const k2 = c.kind || 'power'; cabLen[k2] = (cabLen[k2] || 0) + exCableLen(fl, c); }));
    const spx = [{ k: 'cableRise', t: 'num', l: 'Leitungszuschlag je Ende (cm)', min: 0, step: 10 }, { k: 'planner', t: 'text', l: 'Planer / Bearbeiter (Schriftfeld)' }, { k: 'planNo', t: 'text', l: 'Plan-Nr. (Schriftfeld)' }];
    specs.push(...spx); wrap._obj = S();
    html += exSec('Experte: Planung', `<div class="ex-grid">${exBtn('search', '🔍 Suchen …', 'Objekt, Raum oder Stromkreis finden (Strg+F)')}${exBtn('svg', 'SVG export')}${exBtn('dxf', 'DXF export')}${exBtn('equip', 'Ausstattung prüfen')}</div>` + spx.map(specHtml).join(''));
    acts.search = exSearch; acts.svg = exportSvgFile; acts.dxf = exportDxfFile; acts.equip = showEquipCheck;
    if (Object.keys(circ).length) {
      html += exSec('Stromkreise', Object.keys(circ).sort().map(c => `<button type="button" class="btn ex-circ${exHl === c ? ' primary' : ''}" data-act="c_${esc(c)}"><i style="background:${exCircuitCol(c)}"></i>${esc(c)} · ${circ[c]}</button>`).join('') + `<div class="hint">Antippen hebt einen Stromkreis im Plan hervor.</div>`);
      Object.keys(circ).forEach(c => { acts['c_' + c] = () => { exHl = exHl === c ? '' : c; renderInspector(); render(); }; });
    }
    if (Object.keys(cabLen).length) html += exSec('Leitungslängen', Object.keys(cabLen).map(k2 => `<div class="hint"><b style="color:${CABLE_KINDS[k2][1]}">●</b> ${esc(FPI.tr(CABLE_KINDS[k2][0]))}: ${exLen(cabLen[k2])}</div>`).join(''), false);
  }
  if (!html) return;
  wrap.innerHTML = html; box.append(wrap);
  if (specs.length) { const obj = wrap._obj; if (obj) wire(wrap, obj, specs); }
  bindActs(wrap, acts);
  if (n >= 1) wrap.parentNode.insertBefore(wrap, box.firstChild);
}

// ---------- Suche (Strg+F) ----------
function exSearch() {
  const wrap = document.createElement('div'); wrap.className = 'menu-list';
  wrap.innerHTML = `<input id="exQ" type="search" placeholder="Name, Typ, Entität, Raum, Stromkreis …" style="width:100%;margin-bottom:8px"><div id="exRes"></div>`;
  const res = $('#exRes', wrap);
  const run = () => {
    const q = $('#exQ', wrap).value.trim().toLowerCase(); res.innerHTML = ''; if (q.length < 1) return;
    const out = [];
    plan.floors.forEach(fl => {
      (fl.items || []).forEach(i => { const t = typeById(i.type) || {}, hay = [i.label, t.name, i.type, i.entity, i.circuit, ...(i.ents || []).map(e => e.id)].join(' ').toLowerCase(); if (hay.includes(q)) out.push({ fl, k: 'item', o: i, txt: `${i.label || t.name || i.type}${i.entity ? ' · ' + i.entity : ''}` }); });
      (fl.rooms || []).forEach(r => { if (String(r.name || '').toLowerCase().includes(q)) out.push({ fl, k: 'room', o: r, txt: FPI.tr('Raum') + ': ' + r.name }); });
    });
    out.slice(0, 80).forEach(x => {
      const b = document.createElement('button'); b.className = 'btn'; b.textContent = `${x.fl.name}: ${x.txt}`;
      b.onclick = () => { $('#dlg').close(); switchFloor(x.fl.id); setTimeout(() => { setSel(x.k, x.o.id); const c = x.k === 'item' ? { x: x.o.x, y: x.o.y } : (() => { const p = polyCentroid(x.o.pts); return { x: p[0], y: p[1] }; })(); const v = V(), s = stageSize(); anchorView(v, Math.max(v.k, 0.5), v.a || 0, c.x, c.y, s.w / 2, s.h / 2); render(); }, 60); };
      res.append(b);
    });
    if (!out.length) res.innerHTML = '<p class="hint">Nichts gefunden.</p>';
  };
  modal({ title: 'Suchen', body: wrap, actions: [{ label: 'Schließen', value: null }], onOpen: () => { const i = $('#exQ', wrap); i.oninput = run; i.focus(); } });
}

// ---------- Ausstattung prüfen ----------
function equipCheck() {
  const out = [], has = (f, r, re) => (f.items || []).some(i => re.test(i.type) && ptInPoly(i.x, i.y, r.pts));
  plan.floors.forEach(f => { if (f.kind === 'garden') return; (f.rooms || []).forEach(r => {
    if (!r.pts || r.pts.length < 3 || polyArea(r.pts) / 10000 < 3) return;
    const nm = r.name || 'Raum';
    if (!has(f, r, /^smoke/)) out.push({ f, r, txt: 'kein Rauchmelder' });
    if (!has(f, r, /^outlet|^socket/)) out.push({ f, r, txt: 'keine Steckdose' });
    if (!has(f, r, /^sensor_(motion|presence)|^presence|^motion/)) out.push({ f, r, txt: 'kein Bewegungs-/Präsenzsensor', soft: true });
  }); });
  return out;
}
function showEquipCheck() {
  const r = equipCheck(), wrap = document.createElement('div'); wrap.className = 'menu-list';
  if (!r.length) wrap.innerHTML = '<p class="hint">Alle Räume (ab 3 m²) haben Rauchmelder, Steckdose und Sensor. ✔</p>';
  r.slice(0, 100).forEach(x => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = `${x.f.name} · ${x.r.name || FPI.tr('Raum')}: ${FPI.tr(x.txt)}${x.soft ? ' ' + FPI.tr('(Hinweis)') : ''}`; b.onclick = () => { $('#dlg').close(); switchFloor(x.f.id); setTimeout(() => { setSel('room', x.r.id); fitView(); }, 50); }; wrap.append(b); });
  modal({ title: r.length ? FPI.tr('Ausstattung prüfen') + ' · ' + r.length : 'Ausstattung prüfen', body: wrap, actions: [{ label: 'Schließen', value: null }] });
}

// ---------- Export: SVG & DXF ----------
async function exportSvgFile() {
  const f = curFloor(), svg = await exportSvgString(f, true);
  download((S().projectName || 'grundriss') + '-' + f.name.replace(/\s+/g, '_') + '.svg', new Blob([svg], { type: 'image/svg+xml' }));
}
function dxfPair(c, v) { return c + '\n' + v + '\n'; }
function exportDxf() {
  const U = 10, Y = y => -y * U, X = x => x * U; // cm → mm, y nach oben
  let ents = '';
  const layers = { WAENDE: 7, RAEUME: 3, OBJEKTE: 5, MASSE: 4, LEITUNGEN: 1, TEXT: 7 };
  const line = (l, x1, y1, x2, y2) => { ents += dxfPair(0, 'LINE') + dxfPair(8, l) + dxfPair(10, X(x1).toFixed(2)) + dxfPair(20, Y(y1).toFixed(2)) + dxfPair(30, 0) + dxfPair(11, X(x2).toFixed(2)) + dxfPair(21, Y(y2).toFixed(2)) + dxfPair(31, 0); };
  const poly = (l, pts, closed) => { ents += dxfPair(0, 'LWPOLYLINE') + dxfPair(8, l) + dxfPair(90, pts.length) + dxfPair(70, closed ? 1 : 0); pts.forEach(p => { ents += dxfPair(10, X(p[0]).toFixed(2)) + dxfPair(20, Y(p[1]).toFixed(2)); }); };
  const text = (l, x, y, h, t) => { ents += dxfPair(0, 'TEXT') + dxfPair(8, l) + dxfPair(10, X(x).toFixed(2)) + dxfPair(20, Y(y).toFixed(2)) + dxfPair(30, 0) + dxfPair(40, (h * U).toFixed(1)) + dxfPair(1, String(t).replace(/[\r\n]+/g, ' ')); };
  const f = curFloor();
  (f.rooms || []).forEach(r => { poly('RAEUME', r.pts, true); const c = polyCentroid(r.pts); text('TEXT', c[0], c[1], 12, r.name || ''); });
  (f.walls || []).forEach(w => { const L = wallLen(w) || 1, nx = -(w.y2 - w.y1) / L * (w.t || 15) / 2, ny = (w.x2 - w.x1) / L * (w.t || 15) / 2; poly('WAENDE', [[w.x1 + nx, w.y1 + ny], [w.x2 + nx, w.y2 + ny], [w.x2 - nx, w.y2 - ny], [w.x1 - nx, w.y1 - ny]], true); });
  (f.items || []).forEach(i => { if (i.shape === 'text') { text('TEXT', i.x, i.y, i.fs || 12, i.label || ''); return; } poly('OBJEKTE', itemCorners(i), true); const t = typeById(i.type) || {}; text('TEXT', i.x, i.y, 6, i.label || t.name || i.type); });
  (f.dims || []).forEach(d => { const dx = d.x2 - d.x1, dy = d.y2 - d.y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * (d.off || 40), ny = dx / L * (d.off || 40); line('MASSE', d.x1 + nx, d.y1 + ny, d.x2 + nx, d.y2 + ny); line('MASSE', d.x1, d.y1, d.x1 + nx, d.y1 + ny); line('MASSE', d.x2, d.y2, d.x2 + nx, d.y2 + ny); text('MASSE', (d.x1 + d.x2) / 2 + nx, (d.y1 + d.y2) / 2 + ny, 8, d.text || fmtN(L / 100, 2) + ' m'); });
  (f.cables || []).forEach(c => { const p = exCablePath(f, c); if (p) poly('LEITUNGEN', p, false); });
  let tab = dxfPair(0, 'SECTION') + dxfPair(2, 'TABLES') + dxfPair(0, 'TABLE') + dxfPair(2, 'LAYER') + dxfPair(70, Object.keys(layers).length);
  Object.keys(layers).forEach(k => { tab += dxfPair(0, 'LAYER') + dxfPair(2, k) + dxfPair(70, 0) + dxfPair(62, layers[k]) + dxfPair(6, 'CONTINUOUS'); });
  tab += dxfPair(0, 'ENDTAB') + dxfPair(0, 'ENDSEC');
  return dxfPair(0, 'SECTION') + dxfPair(2, 'HEADER') + dxfPair(9, '$ACADVER') + dxfPair(1, 'AC1015') + dxfPair(9, '$INSUNITS') + dxfPair(70, 4) + dxfPair(0, 'ENDSEC') + tab + dxfPair(0, 'SECTION') + dxfPair(2, 'ENTITIES') + ents + dxfPair(0, 'ENDSEC') + dxfPair(0, 'EOF');
}
function exportDxfFile() { download((S().projectName || 'grundriss') + '-' + curFloor().name.replace(/\s+/g, '_') + '.dxf', new Blob([exportDxf()], { type: 'application/dxf' })); }

// ---------- Kurzbefehle ----------
document.addEventListener('keydown', e => {
  if (!isExpert() || mode !== 'edit') return;
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); exSearch(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(), map = { m: 'measure', d: 'dim', g: 'guide', k: 'cable' };
  if (map[k]) { setTool(map[k]); }
});
