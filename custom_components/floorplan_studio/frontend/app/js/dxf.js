'use strict';
// DXF-Import (ASCII): LINE, LWPOLYLINE, POLYLINE → Wände der aktuellen Etage
function parseDxf(text) {
  const L = text.split(/\r?\n/), ents = []; let units = null, sec = '', expectName = false, cur = null, parent = null;
  const fin = () => { if (cur && cur.t !== 'VERTEX' && cur !== parent) ents.push(cur); cur = null; };
  for (let i = 0; i + 1 < L.length; i += 2) {
    const c = parseInt(L[i].trim(), 10), v = L[i + 1].trim();
    if (c === 9 && v === '$INSUNITS' && i + 3 < L.length) { units = parseInt(L[i + 3].trim(), 10); continue; }
    if (c === 0) {
      if (sec === 'ENTITIES') fin();
      if (v === 'SECTION') { expectName = true; continue; }
      if (v === 'ENDSEC') { sec = ''; continue; }
      if (sec !== 'ENTITIES') continue;
      if (v === 'LINE') cur = { t: 'LINE', layer: '0', a: {}, b: {} };
      else if (v === 'LWPOLYLINE') cur = { t: 'POLY', layer: '0', pts: [], closed: false };
      else if (v === 'POLYLINE') { cur = { t: 'POLY', layer: '0', pts: [], closed: false }; parent = cur; }
      else if (v === 'VERTEX' && parent) { cur = { t: 'VERTEX' }; parent.pts.push({}); }
      else if (v === 'SEQEND') { if (parent) ents.push(parent); parent = null; cur = null; }
      else cur = null;
      continue;
    }
    if (c === 2 && expectName) { sec = v; expectName = false; continue; }
    if (!cur || sec !== 'ENTITIES') continue;
    const num = parseFloat(v), tgt = cur.t === 'VERTEX' ? parent : cur;
    if (c === 8 && cur.t !== 'VERTEX') cur.layer = v;
    else if (c === 70 && tgt && tgt.t === 'POLY' && cur.t !== 'VERTEX') tgt.closed = !!(parseInt(v, 10) & 1);
    else if (cur.t === 'LINE') { if (c === 10) cur.a.x = num; else if (c === 20) cur.a.y = num; else if (c === 11) cur.b.x = num; else if (c === 21) cur.b.y = num; }
    else if (c === 10 && tgt) { if (cur.t === 'VERTEX') tgt.pts[tgt.pts.length - 1].x = num; else cur.pts.push({ x: num }); }
    else if (c === 20 && tgt && tgt.pts.length) tgt.pts[tgt.pts.length - 1].y = num;
  }
  if (parent) ents.push(parent);
  const segs = [];
  ents.forEach(e => {
    if (e.t === 'LINE') { if ([e.a.x, e.a.y, e.b.x, e.b.y].every(Number.isFinite)) segs.push({ layer: e.layer, p: [e.a.x, e.a.y, e.b.x, e.b.y] }); }
    else { const P = e.pts.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)); for (let k = 0; k + 1 < P.length; k++) segs.push({ layer: e.layer, p: [P[k].x, P[k].y, P[k + 1].x, P[k + 1].y] }); if (e.closed && P.length > 2) segs.push({ layer: e.layer, p: [P[P.length - 1].x, P[P.length - 1].y, P[0].x, P[0].y] }); }
  });
  return { segs, units };
}
const DXF_SCALE = { mm: 0.1, cm: 1, m: 100, in: 2.54, ft: 30.48 };
function dxfToWalls(segs, unit) {
  const k = DXF_SCALE[unit] || 0.1, S2 = segs.map(s => ({ layer: s.layer, p: [s.p[0] * k, -s.p[1] * k, s.p[2] * k, -s.p[3] * k] })).filter(s => Math.hypot(s.p[2] - s.p[0], s.p[3] - s.p[1]) > 1);
  if (!S2.length) return [];
  const x0 = Math.min(...S2.map(s => Math.min(s.p[0], s.p[2]))), y0 = Math.min(...S2.map(s => Math.min(s.p[1], s.p[3])));
  return S2.map(s => ({ id: uid(), x1: Math.round(s.p[0] - x0 + 100), y1: Math.round(s.p[1] - y0 + 100), x2: Math.round(s.p[2] - x0 + 100), y2: Math.round(s.p[3] - y0 + 100), ...wallDef() }));
}
async function importDxf() {
  const file = await pickFile('.dxf');
  if (!file) return;
  let d;
  try { d = parseDxf(await file.text()); } catch (e) { toast('DXF konnte nicht gelesen werden.'); return; }
  if (!d.segs.length) { toast('Keine Linien in der DXF-Datei gefunden (unterstützt: LINE, POLYLINE).'); return; }
  const layers = [...new Set(d.segs.map(s => s.layer))], un = { 1: 'in', 2: 'ft', 4: 'mm', 5: 'cm', 6: 'm' }[d.units] || 'mm';
  const wrap = document.createElement('div');
  wrap.innerHTML = `<p class="hint">${d.segs.length} Linien in ${layers.length} Ebene(n). Sie werden als Wände in die aktuelle Etage übernommen.</p>
<label class="fld"><span>Einheit der Zeichnung</span><select id="dxU">${Object.keys(DXF_SCALE).map(u => `<option value="${u}"${u === un ? ' selected' : ''}>${u}</option>`).join('')}</select></label>
<div class="fld"><span>Ebenen (Layer)</span>${layers.map((l, i) => `<label class="chk"><input type="checkbox" data-l="${i}" checked> ${esc(l)}</label>`).join('')}</div>`;
  const r = await modal({ title: 'DXF importieren', body: wrap, actions: [{ label: 'Abbrechen', value: null }, { label: 'Importieren', value: 'ok', primary: true }] });
  if (r !== 'ok') return;
  const use = new Set($$('input[data-l]', wrap).filter(x => x.checked).map(x => layers[+x.dataset.l]));
  const walls = dxfToWalls(d.segs.filter(s => use.has(s.layer)).slice(0, 8000), $('#dxU', wrap).value);
  if (!walls.length) { toast('Nichts zu importieren.'); return; }
  curFloor().walls.push(...walls); commit(); renderAll(); fitView(); toast(walls.length + ' Wände importiert');
}
