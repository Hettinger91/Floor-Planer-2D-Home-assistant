'use strict';
// Vorkonfigurierte Räume, Gebäude (Garage, Carport …) und Etagen. Koordinaten lokal in cm, Ursprung links oben.
function presetBuilder() {
  const T = Number(S().wallThickness) || 15, rooms = [], items = [], edges = [];
  const b = {
    rect(x, y, w, h, name, color, floor) {
      edges.push([x, y, x + w, y], [x + w, y, x + w, y + h], [x, y + h, x + w, y + h], [x, y, x, y + h]);
      if (name) rooms.push({ id: uid(), name: FPI.tr(name), color: color || ROOM_COLORS[rooms.length % ROOM_COLORS.length], floor: floor || '', entity: '', pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] });
      return b;
    },
    item(type, x, y, rot, o) { const t = typeById(type); if (!t) return null; const it = newItemFromType(t, x, y); it.rot = rot || 0; Object.assign(it, o || {}); items.push(it); return it; },
    open(type, x, y, vertical, o) { const it = b.item(type, x, y, vertical ? 90 : 0, o); if (it) it.h = T; return it; },
    roof(type, x, y, w, h, o) { return b.item(type, x + w / 2, y + h / 2, 0, Object.assign({ w, h, rform: ROOF_FORM[type], rridge: 'auto', rover: 40, rpitch: Number(S().roofPitch3) || 30, rz: 0, rcolor: S().roofColor3 || '#8a4b3a', rcover: '' }, o || {})); },
    done() {
      const walls = [], push = (x1, y1, x2, y2) => walls.push({ id: uid(), x1, y1, x2, y2, t: T, style: 'solid', color: '' });
      const merge = list => { list.sort((p, q) => p[0] - q[0]); const out = []; list.forEach(s => { const l = out[out.length - 1]; if (l && s[0] <= l[1] + 0.5) l[1] = Math.max(l[1], s[1]); else out.push([s[0], s[1]]); }); return out; };
      const H = new Map(), V = new Map();
      edges.forEach(([x1, y1, x2, y2]) => { if (y1 === y2) { const a = H.get(y1) || []; a.push([Math.min(x1, x2), Math.max(x1, x2)]); H.set(y1, a); } else { const a = V.get(x1) || []; a.push([Math.min(y1, y2), Math.max(y1, y2)]); V.set(x1, a); } });
      H.forEach((l, y) => merge(l).forEach(s => push(s[0], y, s[1], y)));
      V.forEach((l, x) => merge(l).forEach(s => push(x, s[0], x, s[1])));
      return { walls, rooms, items };
    },
  };
  return b;
}
const PRESET_GROUPS = [['Räume', 'Räume'], ['Gebäude', 'Gebäude & Garagen'], ['Etagen', 'Komplette Etagen']];
const PRESETS = [
  { g: 'Räume', id: 'r_wohn', name: 'Wohnzimmer', icon: '🛋️', w: 450, h: 400, build: b => { b.rect(0, 0, 450, 400, 'Wohnzimmer'); b.open('window_double_big', 225, 0); b.open('door', 450, 320, true); b.item('sofa', 225, 170); b.item('table_coffee', 225, 270); b.item('tv_board', 225, 375, 180); b.item('lamp_ceiling', 225, 200); } },
  { g: 'Räume', id: 'r_kueche', name: 'Küche', icon: '🍳', w: 350, h: 300, build: b => { b.rect(0, 0, 350, 300, 'Küche'); b.open('window_double', 175, 0); b.open('door', 350, 230, true); b.item('fridge', 40, 40); b.item('counter', 130, 35); b.item('stove', 215, 35); b.item('sink_kitchen', 295, 35); b.item('table_dining', 150, 200); } },
  { g: 'Räume', id: 'r_schlaf', name: 'Schlafzimmer', icon: '🛏️', w: 400, h: 350, build: b => { b.rect(0, 0, 400, 350, 'Schlafzimmer'); b.open('window_double', 200, 0); b.open('door', 0, 280, true); b.item('bed_double', 200, 130); b.item('nightstand', 85, 40); b.item('nightstand', 315, 40); b.item('wardrobe', 200, 315, 180); } },
  { g: 'Räume', id: 'r_kind', name: 'Kinderzimmer', icon: '🧸', w: 300, h: 300, build: b => { b.rect(0, 0, 300, 300, 'Kinderzimmer'); b.open('window', 150, 0); b.open('door', 300, 230, true); b.item('bed_kid', 60, 100); b.item('desk', 190, 40); b.item('wardrobe', 150, 270, 180); } },
  { g: 'Räume', id: 'r_bad', name: 'Bad', icon: '🛁', w: 250, h: 250, build: b => { b.rect(0, 0, 250, 250, 'Bad'); b.open('window_small', 125, 0); b.open('door', 0, 180, true, { w: 80 }); b.item('bathtub', 125, 50, 0, { w: 170 }); b.item('toilet', 215, 190); b.item('basin', 140, 215); b.item('washer', 40, 215); } },
  { g: 'Räume', id: 'r_wc', name: 'Gäste-WC', icon: '🚽', w: 120, h: 200, build: b => { b.rect(0, 0, 120, 200, 'Gäste-WC'); b.open('window_small', 60, 0); b.open('door', 120, 150, true, { w: 80 }); b.item('toilet', 60, 40); b.item('basin', 60, 160, 180); } },
  { g: 'Räume', id: 'r_buero', name: 'Büro', icon: '🖥️', w: 300, h: 300, build: b => { b.rect(0, 0, 300, 300, 'Büro'); b.open('window_double', 150, 0); b.open('door', 300, 230, true); b.item('desk', 150, 70); b.item('office_chair', 150, 130); b.item('shelf', 150, 280, 180); } },
  { g: 'Räume', id: 'r_flur', name: 'Flur', icon: '🚪', w: 300, h: 150, build: b => { b.rect(0, 0, 300, 150, 'Flur'); b.open('door_front', 150, 150); b.item('coat_rack', 30, 25); b.item('shoe_rack', 240, 25); } },
  { g: 'Räume', id: 'r_hwr', name: 'Hauswirtschaftsraum', icon: '🧺', w: 250, h: 250, build: b => { b.rect(0, 0, 250, 250, 'Hauswirtschaftsraum'); b.open('window_small', 125, 0); b.open('door', 250, 180, true); b.item('washer', 40, 40); b.item('dryer', 110, 40); b.item('utility_sink', 200, 40); } },
  { g: 'Gebäude', id: 'g_single', name: 'Einzelgarage', icon: '🚗', w: 350, h: 650, build: b => { b.rect(0, 0, 350, 650, 'Garage', '#cfd8dc', 'concrete'); b.open('garage_door', 175, 650); b.open('door', 350, 150, true); b.open('window_small', 0, 300, true); b.item('wallbox', 320, 560, 0); b.item('lamp_ceiling', 175, 325); b.roof('roof_gable', -8, -8, 366, 666); } },
  { g: 'Gebäude', id: 'g_double', name: 'Doppelgarage', icon: '🚗', w: 600, h: 650, build: b => { b.rect(0, 0, 600, 650, 'Garage', '#cfd8dc', 'concrete'); b.open('garage_door', 150, 650); b.open('garage_door', 450, 650); b.open('door', 600, 150, true); b.open('window_small', 0, 300, true); b.item('wallbox', 570, 560); b.item('lamp_ceiling', 150, 325); b.item('lamp_ceiling', 450, 325); b.roof('roof_gable', -8, -8, 616, 666); } },
  { g: 'Gebäude', id: 'g_work', name: 'Garage mit Werkstatt', icon: '🔧', w: 600, h: 750, build: b => { b.rect(0, 0, 600, 750, null); b.rect(0, 0, 350, 750, 'Garage', '#cfd8dc', 'concrete'); b.rect(350, 0, 250, 750, 'Werkstatt', '#ffcc80'); b.open('garage_door', 175, 750); b.open('door', 350, 600, true); b.open('door', 600, 650, true); b.open('window', 600, 250, true); b.item('wallbox', 320, 660); b.item('lamp_ceiling', 175, 375); b.item('lamp_ceiling', 475, 375); b.item('shelf', 475, 25); b.item('desk', 475, 120, 0, { label: 'Werkbank' }); b.roof('roof_gable', -8, -8, 616, 766); } },
  { g: 'Gebäude', id: 'g_carport', name: 'Carport', icon: '🅿️', w: 300, h: 550, build: b => { b.item('carport', 150, 275, 0, { w: 280, h: 520 }); b.roof('roof_carport', 0, 0, 300, 550, { rover: 20 }); } },
  { g: 'Gebäude', id: 'g_carport2', name: 'Doppelcarport', icon: '🅿️', w: 560, h: 550, build: b => { b.item('carport', 150, 275, 0, { w: 260, h: 520 }); b.item('carport', 410, 275, 0, { w: 260, h: 520 }); b.roof('roof_carport', 0, 0, 560, 550, { rover: 20 }); } },
  { g: 'Gebäude', id: 'g_shed', name: 'Gartenhaus', icon: '🏠', w: 300, h: 250, build: b => { b.rect(0, 0, 300, 250, 'Gartenhaus', '#d7ccc8', 'deck'); b.open('door', 150, 250); b.open('window', 300, 125, true); b.roof('roof_shed', -8, -8, 316, 266); } },
  { g: 'Etagen', id: 'f_eg', name: 'Erdgeschoss Einfamilienhaus', icon: '🏡', w: 1000, h: 900, floor: 'Erdgeschoss', build: b => {
    b.rect(0, 0, 600, 450, 'Wohnzimmer'); b.rect(600, 0, 400, 450, 'Küche'); b.rect(0, 450, 250, 450, 'Flur'); b.rect(250, 450, 200, 200, 'Gäste-WC'); b.rect(250, 650, 200, 250, 'Hauswirtschaftsraum'); b.rect(450, 450, 300, 450, 'Büro'); b.rect(750, 450, 250, 450, 'Gästezimmer');
    b.open('door_front', 125, 900); b.open('door', 125, 450); b.open('door_double', 600, 225, true); b.open('door', 250, 550, true, { w: 80 }); b.open('door', 250, 775, true); b.open('door', 450, 600, true); b.open('door', 750, 600, true);
    b.open('door_terrace', 200, 0); b.open('window_big', 450, 0); b.open('window_double', 800, 0); b.open('window_double', 0, 225, true); b.open('window_double', 1000, 225, true); b.open('window_small', 350, 900); b.open('window_double', 600, 900); b.open('window_double', 1000, 675, true);
    b.item('sofa', 200, 280); b.item('table_coffee', 200, 190); b.item('table_dining', 460, 300); b.item('counter', 700, 35); b.item('stove', 800, 35); b.item('fridge', 940, 40); b.item('kitchen_island', 800, 200); b.item('toilet', 400, 490); b.item('washer', 290, 700); b.item('dryer', 360, 700); b.item('desk', 600, 500); b.item('bed_double', 870, 620); b.item('coat_rack', 30, 480); b.item('stairs', 190, 700);
  } },
  { g: 'Etagen', id: 'f_og', name: 'Obergeschoss Einfamilienhaus', icon: '🏠', w: 1000, h: 900, floor: 'Obergeschoss', build: b => {
    b.rect(0, 0, 450, 450, 'Schlafzimmer'); b.rect(450, 0, 300, 450, 'Kinderzimmer 1'); b.rect(750, 0, 250, 450, 'Kinderzimmer 2'); b.rect(0, 450, 250, 450, 'Flur'); b.rect(250, 450, 350, 450, 'Bad'); b.rect(600, 450, 400, 450, 'Arbeitszimmer');
    b.open('door', 125, 450); b.open('door', 250, 600, true); b.open('door', 250, 700, true, { w: 80 }); b.open('door', 450, 100, true); b.open('door', 750, 100, true); b.open('door', 600, 600, true);
    b.open('window_double', 225, 0); b.open('window_double', 600, 0); b.open('window', 875, 0); b.open('window_double', 0, 225, true); b.open('window_double', 1000, 225, true); b.open('window_small', 425, 900); b.open('window_double', 800, 900); b.open('window_double', 1000, 675, true);
    b.item('bed_double', 225, 130); b.item('wardrobe', 225, 415, 180); b.item('bed_kid', 520, 100); b.item('desk', 640, 400); b.item('bed_kid', 810, 100); b.item('desk', 880, 400); b.item('bathtub', 425, 500, 0, { w: 170 }); b.item('toilet', 560, 600); b.item('basin', 400, 860); b.item('desk', 800, 500); b.item('stairs', 190, 700);
  } },
  { g: 'Etagen', id: 'f_ug', name: 'Keller', icon: '🧱', w: 1000, h: 900, floor: 'Keller', build: b => {
    b.rect(0, 0, 400, 450, 'Heizraum'); b.rect(400, 0, 300, 450, 'Vorratsraum'); b.rect(700, 0, 300, 450, 'Hobbyraum'); b.rect(0, 450, 400, 450, 'Waschküche'); b.rect(400, 450, 600, 450, 'Flur');
    b.open('door', 200, 450); b.open('door', 400, 600, true); b.open('door', 550, 450); b.open('door', 850, 450); b.open('window_small', 200, 0); b.open('window_small', 850, 0); b.open('window_small', 200, 900);
    b.item('boiler', 80, 80); b.item('heat_pump', 280, 80); b.item('shelf', 550, 25); b.item('shelf', 550, 400); b.item('desk', 850, 80); b.item('washer', 60, 520); b.item('dryer', 140, 520); b.item('utility_sink', 330, 520); b.item('stairs', 700, 650);
  } },
];
function buildPreset(p) {
  const b = presetBuilder(); p.build(b); const r = b.done();
  return r;
}
// Platziert ein Raum-/Gebäude-Preset in die aktuelle Etage (Mitte der Ansicht) und markiert es
function insertPreset(p) {
  const r = buildPreset(p), f = curFloor(), v = V(), { w, h } = stageSize(), c = s2w(v, w / 2, h / 2), g = S().snap ? (S().grid || 25) : 1;
  let ox = Math.round((c.x - p.w / 2) / g) * g, oy = Math.round((c.y - p.h / 2) / g) * g;
  if (!isFinite(ox) || !isFinite(oy)) { ox = 0; oy = 0; }
  r.walls.forEach(wl => { wl.x1 += ox; wl.x2 += ox; wl.y1 += oy; wl.y2 += oy; });
  r.rooms.forEach(rm => { rm.pts = rm.pts.map(q => [q[0] + ox, q[1] + oy]); });
  r.items.forEach(it => { it.x = r1(it.x + ox); it.y = r1(it.y + oy); });
  f.walls.push(...r.walls); f.rooms.push(...r.rooms); f.items.push(...r.items);
  commit();
  const all = [...r.rooms.map(o => ({ k: 'room', id: o.id })), ...r.walls.map(o => ({ k: 'wall', id: o.id })), ...r.items.map(o => ({ k: 'item', id: o.id }))];
  setSel(all[0].k, all[0].id); multi = all.slice(1); render(); renderInspector();
  toast(FPI.tr(p.name) + ' ' + FPI.tr('eingefügt'));
}
// Legt eine neue Etage aus einem Etagen-Preset an
function insertFloorPreset(p) {
  const r = buildPreset(p), f = newFloor(FPI.tr(p.floor || p.name), '');
  const cur = curFloor(); if (cur.bld) f.bld = cur.bld;
  f.walls = r.walls; f.rooms = r.rooms; f.items = r.items;
  plan.floors.push(f); commit(); switchFloor(f.id); fitView && fitView();
  toast(FPI.tr(p.name) + ' ' + FPI.tr('eingefügt'));
}
function showPresets() {
  const wrap = document.createElement('div'); wrap.className = 'presets';
  wrap.innerHTML = '<style>.presets{max-height:62vh;overflow:auto}.presets h4{margin:10px 0 4px;font-size:13px}.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}.pgrid button{display:flex;align-items:center;gap:8px;text-align:left;padding:8px;border:1px solid var(--line);background:var(--field);border-radius:8px}.pgrid b{font-size:22px;font-weight:400}.pgrid span{display:block;font-size:12px}.pgrid small{display:block;color:var(--muted);font-size:11px}</style>' +
    PRESET_GROUPS.map(([k, l]) => `<h4>${esc(l)}</h4><div class="pgrid">${PRESETS.filter(p => p.g === k).map(p => `<button data-p="${p.id}"><b>${p.icon}</b><div><span>${esc(p.name)}</span><small>${fmtN(p.w / 100, 1)} × ${fmtN(p.h / 100, 1)} m</small></div></button>`).join('')}</div>`).join('');
  modal({ title: 'Vorlagen: Räume, Garagen, Etagen', body: wrap, wide: true, actions: [{ label: 'Schließen', value: null }], onOpen: () => {
    wrap.querySelectorAll('[data-p]').forEach(bt => { bt.onclick = () => { const p = PRESETS.find(x => x.id === bt.dataset.p); $('#dlg').close(); setTimeout(() => (p.g === 'Etagen' ? insertFloorPreset(p) : insertPreset(p)), 30); }; });
  } });
}
