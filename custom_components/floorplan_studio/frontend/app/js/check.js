'use strict';
// Plan prüfen: überlappende Möbel/Objekte je Etage
const CHK_IGNORE = /^(rug|playmat|lawn|driveway|terrace|carpet|flowerbed|window|door|sliding|garage_door|skylight|roof_window|terrace_door|niche|cable_duct|painting|curtain|blind|shutter|awning|pillar|stairs)/;
const CHK_CATS = new Set(['Licht', 'Smart Home', 'Heizung & Klima', 'Bau & Deko']);
function chkCorners(it) {
  const a = (it.rot || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), hw = Math.max(1, it.w / 2 - 2), hh = Math.max(1, it.h / 2 - 2);
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => [it.x + x * c - y * s, it.y + x * s + y * c]);
}
function chkOverlap(A, B) {
  for (const P of [A, B]) for (let i = 0; i < 4; i++) {
    const p = P[i], q = P[(i + 1) % 4], nx = q[1] - p[1], ny = p[0] - q[0];
    let a0 = 1e18, a1 = -1e18, b0 = 1e18, b1 = -1e18;
    A.forEach(v => { const d = v[0] * nx + v[1] * ny; a0 = Math.min(a0, d); a1 = Math.max(a1, d); });
    B.forEach(v => { const d = v[0] * nx + v[1] * ny; b0 = Math.min(b0, d); b1 = Math.max(b1, d); });
    if (a1 <= b0 || b1 <= a0) return false;
  }
  return true;
}
function checkPlan() {
  const out = [];
  plan.floors.forEach(f => {
    const its = f.items.filter(i => { const t = typeById(i.type); return !CHK_IGNORE.test(i.type) && !(t && CHK_CATS.has(t.cat)) && !(i.z3 > 0) && i.w > 0 && i.h > 0; });
    const cs = its.map(chkCorners);
    for (let a = 0; a < its.length; a++) for (let b = a + 1; b < its.length; b++) if (chkOverlap(cs[a], cs[b])) out.push({ f, a: its[a], b: its[b] });
  });
  return out;
}
const chkName = i => i.label || (typeById(i.type) || {}).name || i.type;
function showCheck() {
  const r = checkPlan(), wrap = document.createElement('div');
  wrap.className = 'menu-list';
  if (!r.length) wrap.innerHTML = '<p class="hint">Keine Überschneidungen gefunden. ✔</p>';
  r.slice(0, 60).forEach(x => {
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = `${x.f.name}: ${chkName(x.a)} ↔ ${chkName(x.b)}`;
    b.onclick = () => { $('#dlg').close(); switchFloor(x.f.id); setTimeout(() => { setSel('item', x.a.id); fitView(); }, 50); };
    wrap.append(b);
  });
  if (r.length > 60) wrap.insertAdjacentHTML('beforeend', `<p class="hint">… und ${r.length - 60} weitere</p>`);
  modal({ title: r.length ? `Plan prüfen: ${r.length} Überschneidung(en)` : 'Plan prüfen', body: wrap, actions: [{ label: 'Schließen', value: null }] });
}
