'use strict';
// ---------- Feld-Engine ----------
// Einheit: Werte liegen intern in cm; Anzeige/Eingabe wahlweise in Metern (Standard) oder cm
const unitM = () => !!(plan && plan.settings && plan.settings.unit !== 'cm');
const isLen = s => s.t === 'num' && /\(cm\)/.test(s.l || '');
const toUi = (s, v) => (isLen(s) && unitM() && v !== '' && v != null && !isNaN(v) ? Math.round(v * 10) / 1000 : v);
const fromUi = (s, v) => (isLen(s) && unitM() ? Math.round(v * 1000) / 10 : v);
function specHtml(s) {
  const m = isLen(s) && unitM();
  if (m) s = { ...s, l: s.l.replace('(cm)', '(m)'), step: 0.01, min: s.min != null ? s.min / 100 : s.min };
  const l = esc(s.l || '');
  switch (s.t) {
    case 'check': return `<label class="chk"><input type="checkbox" data-f="${s.k}"> ${l}</label>`;
    case 'select': return `<label class="fld"><span>${l}</span><select data-f="${s.k}">${s.o.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>`;
    case 'num': return `<label class="fld"><span>${l}</span><input type="number" inputmode="decimal" step="${s.step || 1}"${s.min != null ? ` min="${s.min}"` : ''} data-f="${s.k}"></label>`;
    case 'range': return `<label class="fld"><span>${l}</span><input type="range" min="${s.min}" max="${s.max}" step="${s.step || 1}" data-f="${s.k}"></label>`;
    case 'color': return `<label class="fld"><span>${l}</span><span class="colorrow"><input type="color" data-f="${s.k}"><button type="button" class="mini" data-clear="${s.k}">Standard</button></span></label>`;
    case 'area': return `<label class="fld"><span>${l}</span><textarea rows="${s.rows || 3}" data-f="${s.k}" placeholder="${esc(s.ph || '')}"></textarea></label>`;
    case 'entity': return `<label class="fld"><span>${l}</span><span class="colorrow"><input list="entlist" data-f="${s.k}" placeholder="z. B. light.wohnzimmer" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="button" class="mini" data-pick="${s.k}">Auswählen …</button></span></label><div class="hint" id="entinfo"></div>`;
    case 'image': return `<label class="fld"><span>${l}</span><span class="colorrow"><input type="text" data-f="${s.k}" placeholder="Bild-URL oder hochladen"><button type="button" class="mini" data-upicon="${s.k}">Bild …</button></span></label>`;
    case 'icon': return `<label class="fld"><span>${l}</span><span class="colorrow"><input type="text" data-f="${s.k}" placeholder="Emoji oder leer"><button type="button" class="mini" data-upicon="${s.k}">Bild …</button></span></label>`;
    default: return `<label class="fld"><span>${l}</span><input type="text" data-f="${s.k}" placeholder="${esc(s.ph || '')}"></label>`;
  }
}

function wire(root, obj, specs, hooks = {}) {
  specs.forEach(s => {
    const el = $(`[data-f="${s.k}"]`, root);
    if (!el) return;
    const get = () => (s.get ? s.get(obj) : obj[s.k]);
    const set = v => { if (s.set) s.set(obj, v); else obj[s.k] = v; };
    const write = () => {
      if (el.type === 'checkbox') el.checked = !!get();
      else if (el.type === 'color') el.value = /^#[0-9a-f]{6}$/i.test(get() || '') ? get() : (s.def || '#888888');
      else el.value = toUi(s, get()) ?? '';
    };
    write();
    el._write = write;
    const read = () => (el.type === 'checkbox' ? el.checked : (s.t === 'num' || s.t === 'range') ? fromUi(s, num(el.value, toUi(s, get()))) : el.value);
    el.addEventListener('input', () => {
      if (el.type === 'number' && el.value === '') return;
      set(read()); if (hooks.onInput) hooks.onInput(s.k); render();
    });
    el.addEventListener('change', () => {
      set(read()); if (hooks.onInput) hooks.onInput(s.k);
      if (hooks.onChange) hooks.onChange(s.k);
      if (hooks.commit !== false) commit();
      refreshInspectorValues();
    });
  });
  $$('[data-clear]', root).forEach(b => {
    b.onclick = () => { const k = b.dataset.clear; const sp = specs.find(x => x.k === k); if (sp && sp.set) sp.set(obj, ''); else obj[k] = ''; if (hooks.onInput) hooks.onInput(k); if (hooks.commit !== false) commit(); refreshInspectorValues(); render(); };
  });
}

function refreshInspectorValues() {
  $$('#inspector [data-f]').forEach(el => { if (el._write && document.activeElement !== el) el._write(); });
  updateEntInfo();
}
function updateEntInfo() {
  const el = $('#entinfo'), inp = $('#inspector [data-f="entity"]');
  if (!el || !inp) return;
  const id = inp.value.trim();
  if (!id) { el.textContent = haInfo.ha ? 'Verknüpft den Gegenstand mit einer Entität aus Home Assistant.' : 'Demo-Modus – Entität kann trotzdem eingetragen werden.'; return; }
  const s = states[id], e = entities.find(x => x.e === id);
  el.textContent = s ? `Zustand: ${valueText(id)}` : (e ? `${e.n || id} · ${e.s}` : (entities.length ? 'Entität nicht gefunden' : ''));
}

// ---------- Inspektor ----------
function renderInspector() {
  const box = $('#inspector');
  if (!plan) return;
  box.innerHTML = '';
  const o = selObj();
  if (!o || !sel) return renderFloorInspector(box);
  if (sel.k === 'item') return renderItemInspector(box, o);
  if (sel.k === 'wall') return renderWallInspector(box, o);
  if (sel.k === 'room') return renderRoomInspector(box, o);
  if (sel.k === 'bg') return renderFloorInspector(box);
}

function section(title, inner) { if (unitM()) title = title.replace('(cm)', '(m)'); return `<section class="sec"><h4>${esc(title)}</h4>${inner}</section>`; }
function actionsHtml(list) { return `<div class="actions">${list.map(([id, l, c]) => `<button type="button" class="btn ${c || ''}" data-act="${id}">${esc(l)}</button>`).join('')}</div>`; }
function bindActs(root, map) { $$('[data-act]', root).forEach(b => { b.onclick = () => map[b.dataset.act] && map[b.dataset.act](); }); }
function pair(a, b) { return `<div class="row2">${a}${b}</div>`; }

function renderItemInspector(box, it) {
  const t = typeById(it.type), isText = it.shape === 'text', isWin = it.shape === 'door' || it.shape === 'window';
  const g = [
    { k: 'label', t: isText ? 'area' : 'text', l: isText ? 'Text' : 'Bezeichnung' },
    { k: 'showLabel', t: 'check', l: 'Bezeichnung im Plan anzeigen' },
    { k: 'labelEnt', t: 'check', l: 'Bezeichnung = Name der Entität (automatisch aus Home Assistant)' },
    { k: 'showValue', t: 'check', l: 'Wert/Zustand als Etikett anzeigen (braucht Entität)' },
    { k: 'valueRot', t: 'num', l: 'Wert/Zustand drehen (°)', step: 15 },
    { k: 'fs', t: 'num', l: 'Schriftgröße (cm)', min: 4 },
    { k: 'labelRot', t: 'num', l: 'Bezeichnung drehen (°)', step: 15 },
  ].filter(s => (isText ? !['showLabel', 'labelEnt', 'labelRot', 'showValue', 'valueRot'].includes(s.k) : s.k !== 'fs'));
  const glowSpecs = [
    { k: 'glow', t: 'check', l: 'Leuchten, wenn aktiv (Glow)' },
    { k: 'glowStyle', t: 'select', l: 'Leucht-Effekt', o: [['soft', 'Weich'], ['strong', 'Stark'], ['ring', 'Ring'], ['pulse', 'Pulsierend']] },
    { k: 'glowR', t: 'num', l: 'Leuchtradius (cm) · 0 = auto', min: 0, step: 10 },
    { k: 'glowStr', t: 'range', l: 'Leucht-Intensität', min: 0.2, max: 1.5, step: 0.05 },
    { k: 'onColor', t: 'color', l: 'Farbe im aktiven Zustand', def: '#ffc94d' },
  ];
  const ha = [
    { k: 'entity', t: 'entity', l: 'Home-Assistant-Entität' },
    ...(it.shape === 'window' || it.shape === 'door' ? [{ k: 'entity2', t: 'entity', l: 'Kipp-Entität (optional, an = gekippt)' }] : []),
    { k: 'tap', t: 'select', l: 'Aktion beim Tippen (Live)', o: [['auto', 'Automatisch'], ['toggle', 'Umschalten'], ['details', 'Details öffnen'], ['service', 'Eigener Dienst'], ['none', 'Keine']] },
    { k: 'svc', t: 'text', l: 'Dienst (domain.service)', ph: 'light.turn_on' },
    { k: 'svcData', t: 'area', l: 'Dienst-Daten (JSON)', ph: '{"brightness_pct": 40}', rows: 2 },
  ];
  const look = [
    { k: 'icon', t: 'icon', l: 'Icon (Emoji) – optional' },
    { k: 'image', t: 'image', l: 'Bild – optional' },
    { k: 'imgMode', t: 'select', l: 'Bild-Darstellung', o: [['contain', 'Eingepasst'], ['stretch', 'Ganze Fläche (gestreckt)'], ['bare', 'Nur Bild (ohne Fläche)']] },
    { k: 'iconScale', t: 'range', l: 'Icon-Größe', min: 0.3, max: 2, step: 0.05 },
    { k: 'color', t: 'color', l: 'Farbe', def: '#cfd8dc' },
    { k: 'shape', t: 'select', l: 'Form', o: [['rect', 'Rechteck'], ['ellipse', 'Kreis / Ellipse'], ['none', 'Nur Icon'], ['door', 'Tür'], ['window', 'Fenster'], ['text', 'Text']] },
    { k: 'leaves', t: 'select', l: 'Flügel', o: [[1, 'Einflügelig'], [2, 'Doppelflügelig']] },
    { k: 'flipX', t: 'check', l: 'Anschlag spiegeln' },
    { k: 'flipY', t: 'check', l: 'Öffnungsrichtung spiegeln' },
  ].filter(s => (isText ? ['color', 'shape'].includes(s.k) : isWin ? !['iconScale', 'icon', 'image', 'imgMode'].includes(s.k) : !s.k.startsWith('flip') && s.k !== 'leaves'));
  const pos = [
    { k: 'x', t: 'num', l: 'X (cm)', step: 1 }, { k: 'y', t: 'num', l: 'Y (cm)', step: 1 },
    { k: 'w', t: 'num', l: 'Breite (cm)', min: 1 }, { k: 'h', t: 'num', l: 'Tiefe (cm)', min: 1 },
    { k: 'rot', t: 'num', l: 'Drehung (°)', step: 1 },
    { k: 'roam', t: 'select', l: 'Roboter fährt in 3D umher', o: [['auto', 'Nur wenn Entität aktiv'], ['always', 'Immer (auch ohne Entität)'], ['off', 'Nie']] },
    { k: 'h3', t: 'num', l: '3D-Höhe (cm) · 0 = auto', min: 0, step: 5 },
    { k: 'z3', t: 'num', l: '3D-Höhe über Boden (cm) · 0 = auto', min: 0, step: 5 },
  ];
  const specs = [...g, ...glowSpecs, ...ha, ...look, ...pos];
  const P = k => specHtml(pos.find(s => s.k === k));
  box.innerHTML = `<div class="ihead"><span class="ico">${esc(it.icon && !it.icon.startsWith('img:') ? it.icon : '▫')}</span><b>${esc((t && t.name) || 'Objekt')}</b></div>` +
    section('Allgemein', g.map(specHtml).join('')) +
    (isText || isWin ? '' : section('Leuchten (Glow)', glowSpecs.map(specHtml).join(''))) +
    (isText ? '' : section('Home Assistant', ha.map(specHtml).join(''))) +
    section('Aussehen', look.map(specHtml).join('')) +
    section('Position & Größe', pair(P('x'), P('y')) + (isText ? '' : pair(P('w'), P('h'))) + P('rot') + (isText || isWin ? '' : pair(P('h3'), P('z3'))) + (typeof FP3D !== 'undefined' && FP3D.ROBOTS.has(it.type) ? P('roam') : '')) +
    actionsHtml([['front', 'Nach vorn'], ['back', 'Nach hinten'], ['dup', 'Duplizieren'], ['tpl', 'Als Vorlage speichern'], ['del', 'Löschen', 'danger']]);
  wire(box, it, specs.filter(s => !(isText && ['entity', 'glow', 'glowStyle', 'glowR', 'glowStr', 'onColor', 'tap', 'svc', 'svcData'].includes(s.k))), {
    onInput: k => {
      if (isText && (k === 'label' || k === 'fs')) fitText(it);
      if (k === 'entity') autofillFromEntity(it);
    },
    onChange: k => { if (k === 'tap' || k === 'shape' || k === 'glow') renderInspector(); },
  });
  const entInp = $('[data-f="entity"]', box);
  if (entInp) { entInp.addEventListener('focus', () => loadEntities().then(updateEntInfo)); entInp.addEventListener('input', updateEntInfo); loadEntities().then(updateEntInfo); bindPick(box); }
  ['glowStyle', 'glowR', 'glowStr', 'onColor'].forEach(k => { const e = $(`[data-f="${k}"]`, box); if (e) e.closest('.fld').style.opacity = it.glow ? '' : '.5'; });
  const svcRow = $('[data-f="svc"]', box);
  if (svcRow) { const show = it.tap === 'service'; svcRow.closest('.fld').hidden = !show; $('[data-f="svcData"]', box).closest('.fld').hidden = !show; }
  updateEntInfo();
  $$('[data-upicon]', box).forEach(upBtn => {
    upBtn.onclick = async () => {
      const k = upBtn.dataset.upicon, f = await pickFile('image/*');
      if (!f) return;
      try { const r = await uploadFile(f); it[k] = k === 'icon' ? 'img:' + r.url : r.url; commit(); renderInspector(); render(); } catch (e) { toast('Upload fehlgeschlagen: ' + e.message); }
    };
  });
  bindActs(box, {
    front: () => { const f = curFloor(); f.items = f.items.filter(x => x !== it).concat(it); commit(); render(); },
    back: () => { const f = curFloor(); f.items = [it].concat(f.items.filter(x => x !== it)); commit(); render(); },
    dup: duplicateSel,
    del: deleteSel,
    tpl: () => saveAsTemplate(it),
  });
}

function autofillFromEntity(it) {
  const id = (it.entity || '').trim();
  it.entity = id;
  const e = entities.find(x => x.e === id) || null;
  if (e && !it.label && e.n) it.label = e.n;
  if (e && e.n) it.labelEnt = true;
  if (e && ['sensor', 'climate', 'number', 'input_number'].includes(domainOf(id)) && !it.showValue) it.showValue = true;
  if (domainOf(id) === 'light' && !it.glow) it.glow = true;
  pollStates();
}

function renderWallInspector(box, w) {
  const specs = [
    { k: 't', t: 'num', l: 'Dicke (cm)', min: 1 },
    { k: 'style', t: 'select', l: 'Stil', o: [['solid', 'Durchgezogen'], ['dashed', 'Gestrichelt (Raumteiler)']] },
    { k: 'color', t: 'color', l: 'Farbe', def: '#2b3240' },
    { k: 'len', t: 'num', l: 'Länge (cm)', min: 1, get: o => r1(wallLen(o)), set: (o, v) => { const L = wallLen(o) || 1, f = v / L; o.x2 = r1(o.x1 + (o.x2 - o.x1) * f); o.y2 = r1(o.y1 + (o.y2 - o.y1) * f); } },
    { k: 'x1', t: 'num', l: 'Start X' }, { k: 'y1', t: 'num', l: 'Start Y' }, { k: 'x2', t: 'num', l: 'Ende X' }, { k: 'y2', t: 'num', l: 'Ende Y' },
  ];
  const P = k => specHtml(specs.find(s => s.k === k));
  box.innerHTML = `<div class="ihead"><span class="ico">╱</span><b>Wand</b></div>` +
    section('Wand', P('t') + P('style') + P('color') + P('len')) +
    section('Koordinaten (cm)', pair(P('x1'), P('y1')) + pair(P('x2'), P('y2'))) +
    actionsHtml([['dup', 'Duplizieren'], ['del', 'Löschen', 'danger']]);
  wire(box, w, specs);
  bindActs(box, { dup: duplicateSel, del: deleteSel });
}

// Raum-Umriss skalieren/verschieben; Wandenden auf Raumecken werden mitgenommen
function mapRoomPts(r, fn) {
  const old = r.pts.map(p => [p[0], p[1]]), nw = old.map(p => fn(p));
  curFloor().walls.forEach(w => {
    old.forEach((o, i) => {
      if (Math.hypot(w.x1 - o[0], w.y1 - o[1]) < 1.5) { w.x1 = r1(nw[i][0]); w.y1 = r1(nw[i][1]); }
      else if (Math.hypot(w.x2 - o[0], w.y2 - o[1]) < 1.5) { w.x2 = r1(nw[i][0]); w.y2 = r1(nw[i][1]); }
    });
  });
  r.pts = nw.map(p => [r1(p[0]), r1(p[1])]);
}
function resizeRoom(r, nw, nh) {
  const xs = r.pts.map(p => p[0]), ys = r.pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
  const bw = Math.max(...xs) - x0, bh = Math.max(...ys) - y0;
  const fx = nw && bw > 0 ? Math.max(10, nw) / bw : 1, fy = nh && bh > 0 ? Math.max(10, nh) / bh : 1;
  mapRoomPts(r, p => [x0 + (p[0] - x0) * fx, y0 + (p[1] - y0) * fy]);
}
function moveRoomTo(r, nx, ny) {
  const x0 = Math.min(...r.pts.map(p => p[0])), y0 = Math.min(...r.pts.map(p => p[1]));
  const dx = nx == null ? 0 : nx - x0, dy = ny == null ? 0 : ny - y0;
  mapRoomPts(r, p => [p[0] + dx, p[1] + dy]);
}
function renderRoomInspector(box, r) {
  if (!r.floorScale) r.floorScale = 1;
  if (!r.floorRot) r.floorRot = 0;
  const specs = [
    { k: 'name', t: 'text', l: 'Name' },
    { k: 'color', t: 'color', l: 'Farbe', def: '#90caf9' },
    { k: 'floor', t: 'select', l: 'Bodenbelag', o: FLOOR_OPTIONS },
    { k: 'floorScale', t: 'range', l: 'Muster-Größe', min: 0.4, max: 3, step: 0.1 },
    { k: 'floorRot', t: 'range', l: 'Muster-Drehung (°)', min: 0, max: 90, step: 15 },
    { k: 'entity', t: 'entity', l: 'Entität im Raum anzeigen (z. B. Temperatur)' },
    ...(areaList().length ? [{ k: 'area', t: 'select', l: 'Bereich (Home Assistant)', o: [['', '– keiner –'], ...areaList().map(a => [a.id, a.name])] }] : []),
  ];
  const bb = () => { const xs = r.pts.map(p => p[0]), ys = r.pts.map(p => p[1]); return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; };
  const dims = [
    { k: 'rw', t: 'num', l: 'Breite (cm)', min: 10, get: () => r1(bb().w), set: (o, v) => resizeRoom(r, v, null) },
    { k: 'rh', t: 'num', l: 'Tiefe (cm)', min: 10, get: () => r1(bb().h), set: (o, v) => resizeRoom(r, null, v) },
    { k: 'rx', t: 'num', l: 'Links (cm)', get: () => r1(bb().x), set: (o, v) => moveRoomTo(r, v, null) },
    { k: 'ry', t: 'num', l: 'Oben (cm)', get: () => r1(bb().y), set: (o, v) => moveRoomTo(r, null, v) },
  ];
  box.innerHTML = `<div class="ihead"><span class="ico">⬠</span><b>Raum</b></div>` +
    section('Maße (Umriss)', pair(specHtml(dims[0]), specHtml(dims[1])) + pair(specHtml(dims[2]), specHtml(dims[3])) + '<div class="hint">Wände, deren Enden auf den Raumecken liegen, wandern mit. Türen/Fenster ggf. nachziehen.</div>') +
    section('Raum', specs.map(specHtml).join('') + `<div class="hint">Fläche: ${fmtN(polyArea(r.pts) / 10000, 2)} m² · ${r.pts.length} Ecken<br>Tipp: Ecken ziehen, kleine Punkte auf den Kanten ziehen fügt Ecken hinzu.</div>`) +
    actionsHtml([['walls', 'Wände entlang des Raums'], ['dup', 'Duplizieren'], ['del', 'Löschen', 'danger']]);
  wire(box, r, [...specs, ...dims], { onChange: k => { if (k === 'floor') renderInspector(); if (k === 'area') { const al = areaList(), nm = (al.find(a => a.id === r.area) || {}).name; if (nm && (!r.name || al.some(a => a.name === r.name))) r.name = nm; renderInspector(); render(); pollStates(); } }, onInput: k => { if (k === 'entity') { r.entity = r.entity.trim(); pollStates(); } } });
  const entInp = $('[data-f="entity"]', box);
  if (entInp) { entInp.addEventListener('focus', () => loadEntities().then(updateEntInfo)); entInp.addEventListener('input', updateEntInfo); bindPick(box); }
  updateEntInfo();
  bindActs(box, { walls: () => wallsFromRoom(r), dup: duplicateSel, del: deleteSel });
}

function renderFloorInspector(box) {
  const f = curFloor(), st = S(), hasBg = f.bg && f.bg.url;
  const fs = [{ k: 'name', t: 'text', l: 'Name der Etage' }];
  const bg = hasBg ? [
    { k: 'opacity', t: 'range', l: 'Deckkraft', min: 0.05, max: 1, step: 0.05 },
    { k: 'w', t: 'num', l: 'Breite (cm)', min: 10 }, { k: 'x', t: 'num', l: 'X (cm)' }, { k: 'y', t: 'num', l: 'Y (cm)' },
    { k: 'locked', t: 'check', l: 'Hintergrund fixieren' },
  ] : [];
  const ss = [
    { k: 'lang', t: 'select', l: 'Sprache', o: [['auto', 'Automatisch (Home-Assistant-Sprache)'], ...Object.keys(FPI.NAMES).map(k => [k, FPI.NAMES[k]])] },
    { k: 'unit', t: 'select', l: 'Einheit (Eingabefelder)', o: [['m', 'Meter'], ['cm', 'Zentimeter']] },
    { k: 'grid', t: 'select', l: 'Raster', o: [[5, '5 cm'], [10, '10 cm'], [25, '25 cm'], [50, '50 cm'], [100, '1 m']] },
    { k: 'snap', t: 'check', l: 'Am Raster einrasten (Alt = frei)' },
    { k: 'showGrid', t: 'check', l: 'Raster anzeigen' },
    { k: 'showDims', t: 'check', l: 'Wandlängen anzeigen' },
    { k: 'showRoomNames', t: 'check', l: 'Raumnamen anzeigen' },
    { k: 'showArea', t: 'check', l: 'Raumflächen anzeigen' },
    { k: 'labelSize', t: 'range', l: 'Schriftgröße im Plan', min: 8, max: 40, step: 1 },
    { k: 'wallThickness', t: 'num', l: 'Standard-Wanddicke (cm)', min: 2 },
    { k: 'wallColor', t: 'color', l: 'Wandfarbe (2D)', def: '#2b3240' },
    { k: 'roomOpacity', t: 'range', l: 'Raumfüllung', min: 0.05, max: 0.8, step: 0.05 },
    { k: 'theme', t: 'select', l: 'Darstellung', o: [['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']] },
    { k: 'viewRot', t: 'num', l: 'Ausrichtung (°) – gilt auch im Dashboard', min: -180, max: 180 },
    { k: 'symStyle', t: 'select', l: 'Symbol-Stil der Objekte', o: [['b', 'Modern-neutral (Standard)'], ['a', 'Klassisch (Architektenplan)'], ['c', 'Farbig, dezent'], ['emoji', 'Emojis']] },
    { k: 'itemShadow', t: 'check', l: 'Schatten unter Objekten' },
    { k: 'liveTap', t: 'select', l: 'Live: Tippen', o: [['toggle', 'Schaltet (lang drücken = Details)'], ['details', 'Öffnet Details (lang drücken = schalten)']] },
  ];
  const s3 = [
    { k: 'wallColor3', t: 'color', l: 'Wandfarbe', def: '#f3f0ea' },
    { k: 'wallH3', t: 'num', l: 'Wandhöhe (cm)', min: 180, step: 10 },
    { k: 'roof3', t: 'select', l: 'Dach', o: [['none', 'Kein Dach'], ['flat', 'Flachdach'], ['gable', 'Satteldach'], ['hip', 'Walmdach']] },
    { k: 'roofColor3', t: 'color', l: 'Dachfarbe', def: '#8a4b3a' },
    { k: 'roofPitch3', t: 'num', l: 'Dachneigung (°)', min: 5, max: 60 },
    { k: 'roofOver3', t: 'num', l: 'Dachüberstand (cm)', min: 0 },
    { k: 'solar3', t: 'check', l: 'Solaranlage auf dem Dach (mit Energie-Animation)' },
    { k: 'solarEntity', t: 'entity', l: 'Solar-Leistung (Entität, optional – steuert die Animation)' },
    { k: 'solarMax3', t: 'num', l: 'Solar-Maximalleistung (W)', min: 100, step: 100 },
    { k: 'solarFill3', t: 'num', l: 'Dachbelegung (%)', min: 10, max: 100, step: 10 },
    { k: 'solarSide3', t: 'select', l: 'Dachseite', o: [['A', 'Seite A'], ['B', 'Seite B']] },
    { k: 'ground3', t: 'color', l: 'Bodenfarbe außen (Wiese)', def: '#93b07f' },
    { k: 'look3d', t: 'select', l: 'Look', o: [['auto', 'Automatisch'], ['day', 'Realistisch Tag'], ['dark', 'Realistisch Nacht'], ['neon', 'Neon']] },
    { k: 'walls3d', t: 'select', l: 'Wände', o: [['auto', 'Automatisch (Kamera-Ausschnitt)'], ['full', 'Voll'], ['half', 'Halb'], ['flat', 'Flach']] },
  ];
  const numSel = ['grid'];
  box.innerHTML = `<div class="ihead"><span class="ico">⌂</span><b>Etage & Einstellungen</b></div>` +
    section('Etage', fs.map(specHtml).join('') +
      (hasBg ? bg.map(specHtml).join('') : '') +
      `<div class="actions"><button class="btn" data-act="bgup">${hasBg ? 'Bild ersetzen' : 'Bild als Vorlage laden'}</button>` +
      (hasBg ? '<button class="btn" data-act="calib">Maßstab kalibrieren</button><button class="btn" data-act="bgdel">Bild entfernen</button>' : '') + '</div>' +
      `<div class="actions"><button class="btn" data-act="fdup">Etage duplizieren</button><button class="btn" data-act="fren">Umbenennen</button><button class="btn danger" data-act="fdel">Etage löschen</button></div>`) +
    section('Ansicht & Raster', ss.map(specHtml).join('')) +
    section('3D-Ansicht', s3.map(specHtml).join('')) +
    actionsHtml([['fit', 'Alles anzeigen'], ['rotsave', 'Aktuelle Drehung als Ausrichtung speichern']]);
  wire(box, f, fs, { onInput: () => renderFloorTabs() });
  if (hasBg) wire(box, f.bg, bg);
  wire(box, st, ss.map(s => numSel.includes(s.k) ? { ...s, get: o => o[s.k], set: (o, v) => { o[s.k] = num(v, 25); } } : s), { onInput: k => { if (k === 'theme') applyTheme(); }, onChange: k => { if (k === 'lang') applyLang(); if (k === 'symStyle') { renderLibrary(); render(); } if (k === 'theme') applyTheme(); if (k === 'unit') renderInspector(); if (k === 'viewRot') { setViewAngle(num(S().viewRot, 0)); fitView(); } } });
  wire(box, st, s3, { onInput: () => render(), onChange: () => render() });
  bindPick(box);
  bindActs(box, {
    bgup: async () => {
      const file = await pickFile('image/*');
      if (!file) return;
      try {
        const r = await uploadFile(file);
        const dim = await imgSize(r.url);
        f.bg = { url: r.url, x: 0, y: 0, w: 1000, ar: dim.h / dim.w, opacity: 0.5, locked: false };
        commit(); renderInspector(); fitView(); toast('Bild geladen – Maßstab mit „kalibrieren“ anpassen');
      } catch (e) { toast('Upload fehlgeschlagen: ' + e.message); }
    },
    calib: () => { setTool('calib'); document.body.classList.remove('show-right'); },
    bgdel: () => { f.bg = null; commit(); renderInspector(); render(); },
    fit: fitView,
    rotsave: () => { S().viewRot = Math.round(V().a || 0); commit(); renderInspector(); toast('Ausrichtung gespeichert: ' + S().viewRot + '°'); },
    fren: renameFloor, fdup: duplicateFloor, fdel: deleteFloor,
  });
}

async function uploadFile(file) {
  return HOST.upload(file);
}
function imgSize(url) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth || 1, h: i.naturalHeight || 1 }); i.onerror = () => rej(new Error('Bild nicht lesbar')); i.src = url; }); }

// ---------- Etagen ----------
function renderFloorTabs() {
  const nav = $('#floors');
  if (!nav || !plan) return;
  nav.innerHTML = plan.floors.map(f => `<button class="tab${f.id === floorId ? ' on' : ''}" data-id="${f.id}">${f.kind === 'garden' ? '🌿 ' : ''}${esc(f.name)}</button>`).join('') + '<button class="tab add garden" title="Garten hinzufügen">🌿+</button><button class="tab add" title="Etage hinzufügen">+</button>';
  $$('.tab', nav).forEach(b => {
    b.onclick = () => {
      if (b.classList.contains('add')) return addFloor(b.classList.contains('garden') ? 'garden' : '');
      switchFloor(b.dataset.id);
    };
    b.ondblclick = () => { if (!b.classList.contains('add')) renameFloor(); };
  });
}
function switchFloor(id) {
  floorId = id; sel = null;
  try { localStorage.setItem('fp.floor', id); } catch (_) { /* egal */ }
  setTool('select');
  if (!V().fitted) fitView();
  renderAll();
}
function addFloor(kind) {
  const f = newFloor(kind === 'garden' ? 'Garten' : 'Etage ' + (plan.floors.filter(x => x.kind !== 'garden').length + 1), kind);
  if (kind === 'garden') {
    const bs = plan.floors.filter(x => x.kind !== 'garden').map(contentBounds).filter(b => !b.empty);
    const x0 = bs.length ? Math.min(...bs.map(b => b.x)) - 600 : 0, y0 = bs.length ? Math.min(...bs.map(b => b.y)) - 600 : 0;
    const x1 = bs.length ? Math.max(...bs.map(b => b.x + b.w)) + 600 : 1600, y1 = bs.length ? Math.max(...bs.map(b => b.y + b.h)) + 600 : 1200;
    f.rooms.push({ id: uid(), name: 'Rasen', color: '#8fc27a', floor: 'grass', entity: '', pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] });
  }
  if (!kind) {
    // Neue Etage übernimmt Wände + Räume der ersten Etage (deckungsgleich gestapelt)
    const base = plan.floors.find(x => x.kind !== 'garden');
    if (base) {
      const c = deepClone({ walls: base.walls, rooms: base.rooms });
      c.walls.forEach(w => { w.id = uid(); });
      c.rooms.forEach(r => { r.id = uid(); r.entity = ''; });
      f.walls = c.walls; f.rooms = c.rooms;
    }
  }
  plan.floors.push(f); commit(); switchFloor(f.id); if (!kind) setTimeout(renameFloor, 50);
}
async function renameFloor() {
  const f = curFloor(), n = await ask('Etage umbenennen', 'Name', f.name);
  if (n && n.trim()) { f.name = n.trim(); commit(); renderInspector(); }
}
function duplicateFloor() {
  const c = deepClone(curFloor());
  c.id = uid(); c.name += ' (Kopie)';
  const remap = a => a.forEach(o => { o.id = uid(); });
  remap(c.walls); remap(c.rooms); remap(c.items);
  plan.floors.push(c); commit(); switchFloor(c.id);
}
async function deleteFloor() {
  if (plan.floors.length < 2) { toast('Die letzte Etage kann nicht gelöscht werden.'); return; }
  const r = await modal({ title: 'Etage löschen?', body: `„${curFloor().name}“ mit allen Wänden, Räumen und Objekten wird gelöscht. Das lässt sich mit Rückgängig wieder herstellen.`, actions: [{ label: 'Abbrechen', value: null }, { label: 'Löschen', danger: true, value: 'del' }] });
  if (r !== 'del') return;
  plan.floors = plan.floors.filter(f => f.id !== floorId);
  commit(); switchFloor(plan.floors[0].id);
}

// ---------- Bibliothek ----------
function renderLibrary() {
  const q = ($('#libSearch').value || '').toLowerCase().trim(), cats = new Map();
  typeList().filter(t => !q || t.name.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q)).forEach(t => {
    if (!cats.has(t.cat)) cats.set(t.cat, []);
    cats.get(t.cat).push(t);
  });
  const box = $('#library');
  box.innerHTML = [...cats].map(([cat, list]) => `<details open><summary>${esc(cat)}<span>${list.length}</span></summary><div class="libgrid">` +
    list.map(t => {
      const thumb = symThumb(t);
      const ico = t.image ? `<img src="${esc(t.image)}" alt="">` : thumb || ((t.icon && t.icon.startsWith('img:')) ? `<img src="${esc(t.icon.slice(4))}" alt="">` : esc(t.icon || (t.shape === 'door' ? '🚪' : t.shape === 'window' ? '🪟' : '▫')));
      return `<button class="lib" draggable="true" data-id="${esc(t.id)}" title="${esc(t.name)} (${fmtN(t.w / 100, 2)}×${fmtN(t.h / 100, 2)} m)"><span class="ico" style="background:${thumb ? 'transparent' : esc(t.color || '#eceff1')}">${ico}</span><span class="nm">${esc(t.name)}</span><i class="ed" data-ed="${esc(t.id)}" title="Vorlage bearbeiten">✎</i></button>`;
    }).join('') + '</div></details>').join('') || '<p class="hint">Nichts gefunden.</p>';
  $$('.lib', box).forEach(b => {
    const t = typeById(b.dataset.id);
    b.onclick = e => {
      if (e.target.dataset.ed) { editType(t); return; }
      setTool('place', t);
      document.body.classList.remove('show-left');
    };
    b.ondragstart = e => { e.dataTransfer.setData('text/plain', 'fp:' + t.id); };
  });
}

async function editType(t) {
  const isNew = !t;
  const o = t ? { ...t } : { id: 'c_' + uid(), cat: 'Eigene', name: '', icon: '⭐', image: '', imgMode: 'contain', w: 60, h: 60, color: '#d1c4e9', shape: 'rect', glow: false, hint: '' };
  const specs = [
    { k: 'name', t: 'text', l: 'Name' }, { k: 'cat', t: 'text', l: 'Kategorie (frei wählbar)' },
    { k: 'icon', t: 'icon', l: 'Icon (Emoji, oder Bild über „Bild …“) – optional' },
    { k: 'image', t: 'image', l: 'Bild (z. B. Draufsicht) – optional' },
    { k: 'imgMode', t: 'select', l: 'Bild-Darstellung', o: [['contain', 'Eingepasst'], ['stretch', 'Ganze Fläche (gestreckt)'], ['bare', 'Nur Bild (ohne Fläche)']] },
    { k: 'color', t: 'color', l: 'Farbe', def: '#d1c4e9' },
    { k: 'w', t: 'num', l: 'Breite (cm)', min: 1 }, { k: 'h', t: 'num', l: 'Tiefe (cm)', min: 1 },
    { k: 'shape', t: 'select', l: 'Form', o: [['rect', 'Rechteck'], ['ellipse', 'Kreis / Ellipse'], ['none', 'Nur Icon'], ['door', 'Tür'], ['window', 'Fenster'], ['text', 'Text']] },
    { k: 'glow', t: 'check', l: 'Leuchtet, wenn aktiv' },
  ];
  const wrap = document.createElement('div');
  wrap.innerHTML = specs.map(specHtml).join('');
  wire(wrap, o, specs, { commit: false });
  $$('[data-upicon]', wrap).forEach(b => {
    b.onclick = async () => {
      const k = b.dataset.upicon, f = await pickFile('image/*');
      if (!f) return;
      try { const r = await uploadFile(f); o[k] = k === 'icon' ? 'img:' + r.url : r.url; $(`[data-f="${k}"]`, wrap).value = o[k]; } catch (e) { toast('Upload fehlgeschlagen: ' + e.message); }
    };
  });
  const actions = [{ label: 'Abbrechen', value: null }];
  if (t && t.custom) actions.push({ label: t.builtin ? 'Zurücksetzen' : 'Löschen', danger: true, value: 'del' });
  actions.push({ label: 'Speichern', primary: true, value: 'ok', cb: () => { if (!o.name.trim()) { toast('Bitte einen Namen eingeben.'); return false; } } });
  const r = await modal({ title: isNew ? 'Eigenes Objekt anlegen' : 'Vorlage bearbeiten', body: wrap, actions });
  if (r === 'ok') {
    o.wall = o.shape === 'door' || o.shape === 'window';
    plan.customTypes = plan.customTypes.filter(x => x.id !== o.id).concat([{ id: o.id, cat: o.cat.trim() || 'Eigene', name: o.name.trim(), icon: o.icon, image: o.image || '', imgMode: o.imgMode || 'contain', w: o.w, h: o.h, color: o.color, shape: o.shape, glow: !!o.glow, hint: o.hint || '', wall: o.wall }]);
    commit(); renderLibrary();
  } else if (r === 'del') {
    plan.customTypes = plan.customTypes.filter(x => x.id !== o.id);
    commit(); renderLibrary();
  }
}
function saveAsTemplate(it) {
  const base = typeById(it.type);
  editType({ id: 'c_' + uid(), cat: 'Eigene', name: it.label || (base && base.name) || 'Objekt', icon: it.icon, image: it.image || '', imgMode: it.imgMode || 'contain', w: it.w, h: it.h, color: it.color, shape: it.shape, glow: it.glow, hint: it.hint, custom: false });
}

// ---------- Menü, Export, Import ----------
function showMenu() {
  const items = [
    ['Plan exportieren (JSON)', exportJson], ['Plan importieren …', importJson],
    ['Etage als PNG exportieren', () => exportImage('png')], ['Etage als SVG exportieren', () => exportImage('svg')],
    ['Dashboard in Home Assistant …', showDashboard], ['Sicherungen …', showBackups], ['Hilfe & Tastenkürzel', showHelp],
  ];
  const wrap = document.createElement('div');
  wrap.className = 'menu-list';
  items.forEach(([l, fn]) => {
    const b = document.createElement('button');
    b.className = 'btn'; b.textContent = l;
    b.onclick = () => { $('#dlg').close(); setTimeout(fn, 30); };
    wrap.append(b);
  });
  modal({ title: 'Menü', body: wrap, actions: [{ label: 'Schließen', value: null }] });
}
function showDashboard() {
  const wrap = document.createElement('div');
  wrap.className = 'dash-dlg';
  const cardYaml = 'type: custom:floorplan-studio-card\n# floor: ' + (curFloor().id) + '   # optional: feste Etage\n# title: Erdgeschoss';
  wrap.innerHTML = `<p class="hint">Der Grundriss kann als eigene Dashboard-Seite oder als Karte in jedem bestehenden Dashboard erscheinen – live mit allen Komponenten.</p>
<label class="fld"><span>Titel</span><input id="dbTitle" value="Grundriss"></label>
<label class="fld"><span>URL-Pfad (mit Bindestrich)</span><input id="dbPath" value="grundriss-plan" autocapitalize="off" spellcheck="false"></label>
<label class="fld chk"><input id="dbSide" type="checkbox" checked><span>In der Seitenleiste zeigen</span></label>
<div class="actions"><button class="btn primary" id="dbGo">Dashboard anlegen / aktualisieren</button></div>
<div class="hint" id="dbMsg"></div>
<p class="hint">Oder als Karte in ein vorhandenes Dashboard (YAML):</p>
<pre class="code">${esc(cardYaml)}</pre>`;
  $('#dbGo', wrap).onclick = async () => {
    const msg = $('#dbMsg', wrap);
    msg.textContent = 'Arbeite …';
    try {
      const r = await HOST.publishDashboard({ title: $('#dbTitle', wrap).value.trim() || 'Grundriss', path: $('#dbPath', wrap).value.trim(), sidebar: $('#dbSide', wrap).checked });
      msg.textContent = (r && r.created ? 'Dashboard angelegt: ' : 'Dashboard aktualisiert: ') + (r && r.path ? '/' + r.path : '') +
        (r && r.cardLoaded === false ? ' – Hinweis: Das Karten-Modul ist in diesem Browser-Tab noch nicht geladen' + (r.cardError ? ' (' + r.cardError + ')' : '') + '. Bitte Seite komplett neu laden (Strg/Cmd+Shift+R).' : '');
    } catch (e) { msg.textContent = 'Fehler: ' + ((e && e.message) || e); }
  };
  modal({ title: 'Dashboard', body: wrap, actions: [{ label: 'Schließen', value: null }] });
}
function exportJson() { download('grundriss.json', new Blob([JSON.stringify(plan, null, 1)], { type: 'application/json' })); toast('Hinweis: Hintergrundbilder werden nicht mit exportiert.'); }
async function importJson() {
  const f = await pickFile('.json,application/json');
  if (!f) return;
  try {
    const p = normalize(JSON.parse(await f.text()));
    const r = await modal({ title: 'Plan importieren?', body: 'Der aktuelle Plan wird ersetzt (mit Rückgängig wieder herstellbar).', actions: [{ label: 'Abbrechen', value: null }, { label: 'Importieren', primary: true, value: 'ok' }] });
    if (r !== 'ok') return;
    plan = p; floorId = plan.floors[0].id; sel = null;
    commit(); renderAll(); fitView();
  } catch (_) { toast('Datei konnte nicht gelesen werden.'); }
}
async function exportImage(kind) {
  const f = curFloor(), svg = await exportSvgString(f);
  if (kind === 'svg') { download(f.name + '.svg', new Blob([svg], { type: 'image/svg+xml' })); return; }
  const b = contentBounds(f), sc = Math.min(2, 3000 / (b.w + 160), 3000 / (b.h + 160));
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(bl => bl && download(f.name + '.png', bl), 'image/png');
  };
  img.onerror = () => toast('PNG-Export fehlgeschlagen – bitte SVG nutzen.');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
async function showBackups() {
  let list = [];
  try { list = await HOST.backups(); } catch (e) { toast('Sicherungen nicht verfügbar: ' + e.message); return; }
  const wrap = document.createElement('div');
  wrap.className = 'menu-list';
  if (!list.length) wrap.innerHTML = '<p class="hint">Noch keine Sicherungen vorhanden. Sie entstehen automatisch beim Speichern.</p>';
  list.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn'; btn.textContent = new Date(b.ts * 1000).toLocaleString('de-DE');
    btn.onclick = async () => {
      try {
        const r = await HOST.restore(b.id);
        plan = normalize(r.plan); rev = r.rev; floorId = plan.floors[0].id; sel = null; histReset(); renderAll(); fitView();
        $('#dlg').close(); toast('Sicherung wiederhergestellt');
      } catch (e) { toast('Fehler: ' + e.message); }
    };
    wrap.append(btn);
  });
  modal({ title: 'Sicherungen wiederherstellen', body: wrap, actions: [{ label: 'Schließen', value: null }] });
}
function showHelp() {
  modal({
    title: 'Hilfe', wide: true, body: `<div class="help">
<p><b>Zeichnen:</b> Wand (W), Raum als Rechteck (R) oder Polygon (P). Klicken setzt Punkte, Doppelklick / Enter beendet, Shift hält die Linie gerade. Auf Touch-Geräten: „Fertig“-Knopf unten.</p>
<p><b>Objekte:</b> In der Bibliothek anklicken und im Plan platzieren – oder per Drag &amp; Drop. Türen und Fenster rasten an Wänden ein. Eigene Objekte über „+ Eigenes“ oder ✎ an jeder Vorlage.</p>
<p><b>Bearbeiten:</b> Auswahl zeigt Griffe zum Skalieren und Drehen; alle Werte stehen rechts auch als Zahlen (Meter oder cm, einstellbar). Alt gedrückt = ohne Einrasten.</p>
<p><b>Live:</b> Objekte mit Home-Assistant-Entität zeigen Zustand, Lampen leuchten in ihrer Farbe. Tippen schaltet, langes Drücken öffnet Details (umstellbar).</p>
<table><tr><td>V / W / R / P / H</td><td>Werkzeuge</td></tr><tr><td>Strg+Z / Strg+Y</td><td>Rückgängig / Wiederholen</td></tr><tr><td>Strg+D / C / V</td><td>Duplizieren / Kopieren / Einfügen</td></tr><tr><td>Entf</td><td>Löschen</td></tr><tr><td>Pfeiltasten</td><td>Verschieben (Shift = grob)</td></tr><tr><td>Leertaste + Ziehen</td><td>Ansicht verschieben</td></tr><tr><td>Mausrad / Pinch</td><td>Zoomen</td></tr><tr><td>Q / E · Shift+Mausrad · Rechtsklick ziehen · zwei Finger drehen</td><td>Ansicht drehen (⟲ ⟳ = 90°)</td></tr></table></div>`,
    actions: [{ label: 'Schließen', value: null }],
  });
}

function applyTheme() {
  const t = plan ? S().theme : 'auto';
  let eff = t;
  if (t === 'auto') { try { const i = HOST.info(); if (!HOST.demo && typeof i.dark === 'boolean') eff = i.dark ? 'dark' : 'light'; } catch (_) { /* egal */ } }
  if (eff === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', eff);
  render();
}
