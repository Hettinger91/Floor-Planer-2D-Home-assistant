'use strict';
// Stückliste (Flächen, Wände, Objekte) als Tabelle, CSV und Druck/PDF
function bomData() {
  const wh = Math.max(180, Number(S().wallH3) || 250) / 100;
  const floors = plan.floors.map(f => {
    const rooms = f.rooms.map(r => ({ n: r.name || '–', a: polyArea(r.pts) / 10000, fl: r.floor ? (FLOOR_NAMES[r.floor] || r.floor) : '' }));
    const wl = f.walls.reduce((a, w) => a + wallLen(w), 0) / 100, cnt = new Map();
    f.items.forEach(i => { const t = typeById(i.type), k = (t && t.name) || i.type; cnt.set(k, (cnt.get(k) || 0) + 1); });
    return { name: f.name, rooms, area: rooms.reduce((a, r) => a + r.a, 0), wall: wl, wallArea: wl * wh, items: [...cnt.entries()].sort((a, b) => b[1] - a[1]) };
  });
  return floors;
}
const FLOOR_NAMES = { wood: 'Holz', tile: 'Fliesen', stone: 'Stein', carpet: 'Teppich', grass: 'Rasen', concrete: 'Beton', gravel: 'Kies', pavers: 'Pflaster', deck: 'Holzdeck', sand: 'Sand', soil: 'Erde', water: 'Wasser' };
function bomHtml(d, plain) {
  const n1 = v => fmtN(v, 1), tot = d.reduce((a, f) => a + f.area, 0);
  const tb = (h, rows) => `<table><thead><tr>${h.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td${i ? ' class="r"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return d.map(f => `<h4>${esc(f.name)}</h4>` +
    tb(['Raum', 'Boden', 'Fläche m²'], f.rooms.map(r => [r.n, r.fl, n1(r.a)]).concat([['Summe', '', n1(f.area)]])) +
    `<p>Wände: ${n1(f.wall)} m Länge · ${n1(f.wallArea)} m² Wandfläche (je Seite, ohne Abzug von Öffnungen)</p>` +
    (f.items.length ? tb(['Objekt', 'Anzahl'], f.items) : '')).join('') + `<p><b>Gesamtfläche: ${n1(tot)} m²</b></p>`;
}
function bomCsv(d) {
  const q = v => '"' + String(v).replace(/"/g, '""') + '"', L = [];
  d.forEach(f => {
    L.push([q('Etage'), q(f.name)].join(';'));
    f.rooms.forEach(r => L.push([q('Raum'), q(r.n), q(r.fl), String(r.a.toFixed(2)).replace('.', ',')].join(';')));
    L.push([q('Wandlänge m'), String(f.wall.toFixed(2)).replace('.', ',')].join(';'));
    f.items.forEach(([k, c]) => L.push([q('Objekt'), q(k), c].join(';')));
    L.push('');
  });
  return '﻿' + L.join('\n');
}
async function printPlan(withBom) {
  const d = bomData(), parts = [];
  for (const f of plan.floors) {
    const b = contentBounds(f), svg = await exportSvgString(f), n = Math.max(1, Math.round((b.w + 160) * 10 / 277 / 10) * 10);
    parts.push(`<section><h3>${esc(f.name)}</h3><div class="pl">${svg}</div><p class="sc">Maßstab ca. 1 : ${n} bei A4 quer (Planbreite ${fmtN((b.w) / 100, 1)} m)</p></section>`);
  }
  const html = `<!doctype html><meta charset="utf-8"><title>${esc((S().projectName) || 'Grundriss')}</title><style>
@page { size: A4 landscape; margin: 12mm; } body { font: 12px system-ui, sans-serif; color: #111; }
section { page-break-after: always; } .pl svg { width: 100%; max-height: 165mm; height: auto; } .sc { color: #555; }
table { border-collapse: collapse; margin: 6px 0 10px; min-width: 50%; } th, td { border: 1px solid #bbb; padding: 3px 8px; text-align: left; } td.r { text-align: right; } h3, h4 { margin: 8px 0 4px; }
</style>${parts.join('')}${withBom ? `<section><h3>Stückliste</h3>${bomHtml(d)}</section>` : ''}`;
  const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.append(fr); fr.contentDocument.open(); fr.contentDocument.write(html); fr.contentDocument.close();
  setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Drucken nicht möglich: ' + e.message); } setTimeout(() => fr.remove(), 60000); }, 400);
}
function showBom() {
  const d = bomData(), wrap = document.createElement('div');
  wrap.className = 'bom';
  wrap.innerHTML = `<style>.bom table{border-collapse:collapse;margin:4px 0 8px;width:100%}.bom th,.bom td{border:1px solid var(--line);padding:3px 8px;text-align:left}.bom td.r{text-align:right}.bom h4{margin:10px 0 2px}.bom{max-height:60vh;overflow:auto}</style>` + bomHtml(d);
  modal({ title: 'Stückliste', body: wrap, wide: true, actions: [
    { label: 'CSV', value: 'csv' }, { label: 'Plan + Stückliste drucken / PDF', value: 'print' }, { label: 'Schließen', value: null },
  ] }).then(v => { if (v === 'csv') download('stueckliste.csv', new Blob([bomCsv(d)], { type: 'text/csv;charset=utf-8' })); else if (v === 'print') setTimeout(() => printPlan(true), 50); });
}
