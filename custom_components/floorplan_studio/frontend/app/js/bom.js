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
const PAPER = { A4: [297, 210], A3: [420, 297], A2: [594, 420] };
const SCALES = [20, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000];
function printOptions(withBom) {
  const body = document.createElement('div');
  body.innerHTML = '<label style="display:block;margin:6px 0">Papierformat <select data-p>' + Object.keys(PAPER).map(k => '<option>' + k + '</option>').join('') + '</select></label>' +
    '<label style="display:block;margin:6px 0">Maßstab <select data-s><option value="0">Automatisch (passend)</option>' + SCALES.map(n => '<option value="' + n + '">1 : ' + n + '</option>').join('') + '</select></label>' +
    '<label style="display:block;margin:6px 0"><input type="checkbox" data-b' + (withBom ? ' checked' : '') + '> Stückliste anhängen</label>';
  return modal({ title: 'Drucken / PDF im Maßstab', body, actions: [{ label: 'Abbrechen', value: null }, { label: 'Drucken / PDF', value: 'ok', primary: true }] })
    .then(v => v === 'ok' ? { paper: body.querySelector('[data-p]').value, scale: +body.querySelector('[data-s]').value, bom: body.querySelector('[data-b]').checked } : null);
}
async function printPlan(withBom) {
  const opt = await printOptions(!!withBom); if (!opt) return;
  const d = bomData(), parts = [], M = 12, HEAD = 26, FOOT = 14;
  let [pw, ph] = PAPER[opt.paper], landscape = true;
  const bs = plan.floors.map(contentBounds);
  const mw = Math.max(...bs.map(b => b.w + 160)), mh = Math.max(...bs.map(b => b.h + 160));
  if (mh > mw * 1.15 && pw > ph) { landscape = false; [pw, ph] = [ph, pw]; }
  const aw = pw - 2 * M, ah = ph - 2 * M - HEAD - FOOT;
  const fit = Math.max(aw ? mw * 10 / aw : 1, mh * 10 / ah);
  const N = opt.scale || SCALES.find(n => n >= fit) || Math.ceil(fit / 100) * 100;
  const ok = mw * 10 / N <= aw + 0.5 && mh * 10 / ah >= 0 && mh * 10 / N <= ah + 0.5;
  const bar = N <= 100 ? 1 : N <= 300 ? 2 : 5, barMm = bar * 1000 / N;
  for (let i = 0; i < plan.floors.length; i++) {
    const f = plan.floors[i], b = bs[i], svg = (await exportSvgString(f)).replace(/ width="[\d.]+" height="[\d.]+"/, ` width="${((b.w + 160) * 10 / N).toFixed(2)}mm" height="${((b.h + 160) * 10 / N).toFixed(2)}mm"`);
    parts.push(`<section><div class="hd"><b>${esc(S().projectName || 'Grundriss')}</b> – ${esc(f.name)}</div><div class="pl">${svg}</div><div class="ft"><span class="bar" style="width:${barMm.toFixed(2)}mm"></span> ${bar} m &nbsp;·&nbsp; Maßstab 1 : ${N} (${opt.paper}${landscape ? ' quer' : ' hoch'})${ok ? '' : ' – Plan größer als Blatt, bitte größeren Maßstab wählen'}</div></section>`);
  }
  const html = `<!doctype html><meta charset="utf-8"><title>${esc((S().projectName) || 'Grundriss')}</title><style>
@page { size: ${opt.paper} ${landscape ? 'landscape' : 'portrait'}; margin: ${M}mm; } body { font: 12px system-ui, sans-serif; color: #111; margin: 0; }
section { page-break-after: always; height: ${ph - 2 * M - 1}mm; position: relative; } .hd { height: ${HEAD - 8}mm; font-size: 15px; border-bottom: 0.4mm solid #111; margin-bottom: 4mm; }
.pl { height: ${ah}mm; overflow: hidden; } .pl svg { display: block; margin: 0 auto; } .ft { position: absolute; bottom: 0; left: 0; right: 0; height: ${FOOT - 4}mm; font-size: 11px; color: #333; display: flex; align-items: center; gap: 6px; }
.bar { display: inline-block; height: 1.6mm; border: 0.3mm solid #111; border-top: none; box-sizing: border-box; }
table { border-collapse: collapse; margin: 6px 0 10px; min-width: 50%; } th, td { border: 1px solid #bbb; padding: 3px 8px; text-align: left; } td.r { text-align: right; } h3, h4 { margin: 8px 0 4px; }
</style>${parts.join('')}${opt.bom ? `<section><h3>Stückliste</h3>${bomHtml(d)}</section>` : ''}`;
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
