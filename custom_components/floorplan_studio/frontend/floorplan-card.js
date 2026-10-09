/* Floorplan Studio Karte – GENERIERT von tools/build_card.py, nicht von Hand ändern. */
(function () {
'use strict';
/* ---- util.js ---- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : d; };
const r1 = v => Math.round(v * 10) / 10;
const fmtN = (v, d = 2) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: d });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const deepClone = o => JSON.parse(JSON.stringify(o));
function toast(msg, ms = 2800) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}

function modal({ title, body, actions, wide = false, onOpen }) {
  return new Promise(resolve => {
    const d = $('#dlg');
    d.className = wide ? 'wide' : '';
    d.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'dlg-box';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    box.append(h3);
    const b = document.createElement('div');
    b.className = 'dlg-body';
    if (typeof body === 'string') b.innerHTML = body; else if (body) b.append(body);
    box.append(b);
    const bar = document.createElement('div');
    bar.className = 'dlg-actions';
    let result = null;
    (actions || [{ label: 'Schließen', value: 'close' }]).forEach(a => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = a.label;
      btn.className = 'btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : '');
      btn.onclick = async () => {
        if (a.cb) { const keep = await a.cb(d); if (keep === false) return; }
        result = 'value' in a ? a.value : a.label;
        d.close();
      };
      bar.append(btn);
    });
    box.append(bar);
    d.append(box);
    d.onclose = () => resolve(result);
    d.showModal();
    if (onOpen) onOpen(d);
  });
}

async function ask(title, label, value = '', type = 'text') {
  let out = null;
  const wrap = document.createElement('label');
  wrap.className = 'fld';
  const sp = document.createElement('span');
  sp.textContent = label;
  const inp = document.createElement('input');
  inp.type = type;
  inp.value = value;
  if (type === 'number') inp.step = 'any';
  wrap.append(sp, inp);
  const r = await modal({
    title, body: wrap,
    actions: [{ label: 'Abbrechen', value: null }, { label: 'OK', primary: true, value: 'ok', cb: () => { out = inp.value; } }],
    onOpen: d => {
      inp.focus(); inp.select();
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('.primary', d).click(); } };
    },
  });
  return r === 'ok' ? out : null;
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function pickFile(accept) {
  return new Promise(resolve => {
    const inp = $('#fileAny');
    inp.value = '';
    inp.accept = accept || '';
    inp.onchange = () => resolve(inp.files[0] || null);
    inp.click();
  });
}

/* ---- library.js ---- */
const ROOM_COLORS = ['#90caf9', '#a5d6a7', '#ffcc80', '#ce93d8', '#80cbc4', '#ef9a9a', '#fff59d', '#b0bec5'];

const DEFAULT_SETTINGS = {
  grid: 25, snap: true, showGrid: true, showDims: true, showArea: true, showRoomNames: true,
  labelSize: 20, wallThickness: 15, wallColor: '', roomOpacity: 0.28, itemShadow: true, symStyle: 'b', viewRot: 0, theme: 'auto',
  pollSec: 4, rectWalls: true, liveTap: 'toggle',
};

// Farben je Kategorie
const CF = '#d7ccc8', CA = '#cfd8dc', CW = '#b3e5fc', CH = '#ffccbc', CS = '#c5e1a5', CB = '#eceff1';

function T(cat, id, name, icon, w, h, color, o = {}) {
  return { cat, id, name, icon, w, h, color, shape: o.shape || 'rect', glow: !!o.glow, hint: o.hint || '', wall: !!o.wall };
}

// Maße in cm
const LIB = [
  T('Licht', 'lamp_ceiling', 'Deckenlampe', '💡', 34, 34, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_floor', 'Stehlampe', '🪔', 30, 30, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_wall', 'Wandlampe', '🔆', 24, 12, CB, { glow: true, hint: 'light' }),
  T('Licht', 'lamp_spot', 'Spot', '🔦', 16, 16, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_strip', 'LED-Streifen', '✨', 150, 8, CB, { glow: true, hint: 'light' }),

  T('Möbel', 'bed_double', 'Doppelbett', '🛏️', 180, 200, CF),
  T('Möbel', 'bed_single', 'Einzelbett', '🛏️', 90, 200, CF),
  T('Möbel', 'bed_kid', 'Kinderbett', '🛏️', 70, 140, CF),
  T('Möbel', 'sofa', 'Sofa', '🛋️', 200, 90, CF),
  T('Möbel', 'armchair', 'Sessel', '🛋️', 80, 80, CF),
  T('Möbel', 'table_coffee', 'Couchtisch', '', 100, 60, CF),
  T('Möbel', 'table_dining', 'Esstisch', '🍽️', 160, 90, CF),
  T('Möbel', 'chair', 'Stuhl', '🪑', 45, 45, CF),
  T('Möbel', 'desk', 'Schreibtisch', '🖥️', 140, 70, CF),
  T('Möbel', 'wardrobe', 'Kleiderschrank', '👔', 200, 60, CF),
  T('Möbel', 'shelf', 'Regal', '📚', 100, 35, CF),
  T('Möbel', 'dresser', 'Kommode', '🗄️', 100, 45, CF),
  T('Möbel', 'tv_board', 'TV-Board', '📺', 160, 40, CF),

  T('Küche & Bad', 'fridge', 'Kühlschrank', '🧊', 60, 65, CA),
  T('Küche & Bad', 'stove', 'Herd', '🍳', 60, 60, CA),
  T('Küche & Bad', 'sink_kitchen', 'Spüle', '🚰', 120, 60, CA),
  T('Küche & Bad', 'dishwasher', 'Spülmaschine', '🫧', 60, 60, CA),
  T('Küche & Bad', 'washer', 'Waschmaschine', '🧺', 60, 60, CA),
  T('Küche & Bad', 'bathtub', 'Badewanne', '🛁', 170, 75, CW),
  T('Küche & Bad', 'shower', 'Dusche', '🚿', 90, 90, CW),
  T('Küche & Bad', 'toilet', 'WC', '🚽', 40, 65, CW),
  T('Küche & Bad', 'basin', 'Waschbecken', '🚰', 60, 45, CW),

  T('Heizung & Klima', 'radiator', 'Heizkörper', '♨️', 100, 12, CH, { hint: 'climate' }),
  T('Heizung & Klima', 'thermostat', 'Thermostat', '🌡️', 22, 22, CH, { shape: 'ellipse', hint: 'climate' }),
  T('Heizung & Klima', 'ac', 'Klimagerät', '❄️', 90, 25, CH, { hint: 'climate' }),
  T('Heizung & Klima', 'fan', 'Ventilator', '🌀', 40, 40, CH, { shape: 'ellipse', hint: 'fan' }),
  T('Heizung & Klima', 'fireplace', 'Kamin / Ofen', '🔥', 80, 40, CH),
  T('Heizung & Klima', 'boiler', 'Heizkessel', '🔥', 60, 60, CH),

  T('Smart Home', 'outlet', 'Steckdose', '🔌', 16, 16, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'switch', 'Schalter', '🎚️', 16, 16, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'sensor_temp', 'Temperatursensor', '🌡️', 18, 18, CS, { shape: 'ellipse', hint: 'sensor' }),
  T('Smart Home', 'sensor_hum', 'Feuchtesensor', '💧', 18, 18, CS, { shape: 'ellipse', hint: 'sensor' }),
  T('Smart Home', 'sensor_motion', 'Bewegungsmelder', '👁️', 18, 18, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'sensor_contact', 'Tür-/Fensterkontakt', '🧲', 16, 16, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'smoke', 'Rauchmelder', '🚨', 18, 18, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'camera', 'Kamera', '📷', 20, 20, CS, { shape: 'ellipse', hint: 'camera' }),
  T('Smart Home', 'speaker', 'Lautsprecher', '🔊', 24, 24, CS, { hint: 'media_player' }),
  T('Smart Home', 'blind', 'Rollladen / Jalousie', '🪟', 100, 10, CS, { hint: 'cover' }),
  T('Smart Home', 'router', 'Router', '📶', 24, 18, CS),
  T('Smart Home', 'dongle', 'Zigbee-/Matter-Stick', '📡', 20, 20, CS, { shape: 'ellipse' }),
  T('Smart Home', 'vacuum', 'Saugroboter', '🤖', 35, 35, CS, { shape: 'ellipse', hint: 'vacuum' }),
  T('Smart Home', 'bell', 'Klingel', '🔔', 16, 16, CS, { shape: 'ellipse' }),
  T('Smart Home', 'lock', 'Türschloss', '🔒', 16, 16, CS, { shape: 'ellipse', hint: 'lock' }),
  T('Smart Home', 'wallbox', 'Wallbox', '⚡', 30, 20, CS),
  T('Smart Home', 'meter_power', 'Stromzähler', '⚡', 40, 25, CS, { hint: 'sensor' }),
  T('Smart Home', 'meter_gas', 'Gaszähler', '🔥', 30, 25, CS, { hint: 'sensor' }),

  T('Bau & Deko', 'door', 'Tür', '', 90, 15, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'door_double', 'Doppeltür', '', 160, 15, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'window', 'Fenster', '', 100, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'window_big', 'Fenster groß', '', 200, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'stairs', 'Treppe', '🪜', 100, 260, CB),
  T('Bau & Deko', 'plant', 'Pflanze', '🪴', 40, 40, '#c8e6c9', { shape: 'ellipse' }),
  T('Bau & Deko', 'rug', 'Teppich', '', 200, 140, '#e1bee7'),
  T('Bau & Deko', 'pillar', 'Säule', '', 30, 30, '#b0bec5'),
  T('Bau & Deko', 'text', 'Beschriftung', 'Aa', 200, 40, '', { shape: 'text' }),
];

function typeList() {
  const m = new Map();
  LIB.forEach(t => m.set(t.id, { ...t }));
  ((typeof plan !== 'undefined' && plan && plan.customTypes) || []).forEach(t =>
    m.set(t.id, { ...t, custom: true, builtin: LIB.some(b => b.id === t.id) }));
  return [...m.values()];
}
function typeById(id) { return typeList().find(t => t.id === id); }

function newItemFromType(t, x, y) {
  const it = {
    id: uid(), type: t.id, x, y, w: t.w, h: t.h, rot: 0, shape: t.shape || 'rect',
    icon: t.icon || '', color: t.color || '', label: '', showLabel: true, entity: '',
    showValue: false, glow: !!t.glow, onColor: '', tap: 'auto', svc: '', svcData: '',
    flipX: false, flipY: false, iconScale: 1, hint: t.hint || '',
  };
  if (it.shape === 'text') { it.label = 'Text'; it.fs = 28; it.color = ''; fitText(it); }
  return it;
}

function fitText(it) {
  const lines = String(it.label || ' ').split('\n');
  const fs = it.fs || 28;
  it.w = Math.max(20, Math.max(...lines.map(l => l.length)) * fs * 0.6 + fs * 0.6);
  it.h = Math.max(fs, lines.length * fs * 1.2 + fs * 0.2);
}

/* ---- symbols.js ---- */
// Draufsicht-Symbole im klassischen Planstil. Alle Generatoren zeichnen Details im lokalen
// Koordinatensystem (Mitte = 0/0) für ein Objekt der Größe w × h (cm); die Fläche selbst zeichnet render.js.
const SYM = {
  sofa: (w, h) => {
    const bk = -h / 2 + h * 0.26, arm = Math.min(h * 0.2, w * 0.15), n = w > 150 ? 3 : 2, cx = (w - arm * 2) / n;
    let s = `<path d="M${-w / 2} ${bk}H${w / 2}M${-w / 2 + arm} ${bk}V${h / 2}M${w / 2 - arm} ${bk}V${h / 2}"/>`;
    for (let i = 1; i < n; i++) s += `<path d="M${-w / 2 + arm + cx * i} ${bk}V${h / 2}"/>`;
    return s;
  },
  armchair: (w, h) => { const bk = -h / 2 + h * 0.28, arm = w * 0.2; return `<path d="M${-w / 2} ${bk}H${w / 2}M${-w / 2 + arm} ${bk}V${h / 2}M${w / 2 - arm} ${bk}V${h / 2}"/>`; },
  bed: (w, h) => {
    const two = w > 110, pw = two ? (w - 30) / 2 - 3 : w - 20, ph = h * 0.16, y = -h / 2 + 12;
    let s = `<rect x="${-w / 2 + 10}" y="${y}" width="${pw}" height="${ph}" rx="6"/>`;
    if (two) s += `<rect x="${w / 2 - 10 - pw}" y="${y}" width="${pw}" height="${ph}" rx="6"/>`;
    return s + `<path d="M${-w / 2} ${-h / 2 + h * 0.38}H${w / 2}"/>`;
  },
  table: (w, h) => `<rect x="${-w / 2 + 8}" y="${-h / 2 + 8}" width="${Math.max(2, w - 16)}" height="${Math.max(2, h - 16)}" rx="3"/>`,
  desk: (w, h) => `<rect x="${-w * 0.18}" y="${-h / 2 + 6}" width="${w * 0.36}" height="${h * 0.14}" rx="1"/><path d="M${-w / 2 + 8} ${h * 0.12}H${w / 2 - 8}"/>`,
  chair: (w, h) => `<path d="M${-w / 2 + 3} ${-h / 2 + h * 0.25}H${w / 2 - 3}"/>`,
  lamp: (w, h) => { const r = Math.min(w, h) / 2 * 0.55, q = r * 0.707; return `<circle cx="0" cy="0" r="${r}"/><path d="M${-q} ${-q}L${q} ${q}M${q} ${-q}L${-q} ${q}"/>`; },
  lampwall: (w, h) => `<path d="M${-w / 2 + 3} 0H${w / 2 - 3}"/>`,
  strip: (w, h) => `<path d="M${-w / 2 + 6} 0H${w / 2 - 6}" stroke-dasharray="5 4"/>`,
  radiator: (w, h) => { let d = ''; for (let x = -w / 2 + 8; x < w / 2 - 4; x += 8) d += `M${x} ${-h / 2 + 2}V${h / 2 - 2}`; return `<path d="${d}"/>`; },
  toilet: (w, h) => `<rect x="${-w / 2 + 4}" y="${-h / 2 + 4}" width="${w - 8}" height="${h * 0.24}" rx="3"/><ellipse cx="0" cy="${h * 0.14}" rx="${w * 0.36}" ry="${h * 0.3}"/>`,
  bath: (w, h) => `<rect x="${-w / 2 + 7}" y="${-h / 2 + 7}" width="${w - 14}" height="${h - 14}" rx="${Math.min(w, h) * 0.3}"/><circle cx="${-w / 2 + 20}" cy="0" r="3.5"/>`,
  shower: (w, h) => `<path d="M${-w / 2 + 4} ${-h / 2 + 4}L${w / 2 - 4} ${h / 2 - 4}"/><circle cx="0" cy="0" r="${Math.min(w, h) * 0.08 + 1.5}"/>`,
  stove: (w, h) => { const r = Math.min(w, h) * 0.17, dx = w * 0.22, dy = h * 0.22; return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => `<circle cx="${a * dx}" cy="${b * dy}" r="${r}"/><circle cx="${a * dx}" cy="${b * dy}" r="${r * 0.45}"/>`).join(''); },
  sink: (w, h) => `<rect x="${-w / 2 + 6}" y="${-h / 2 + 8}" width="${Math.max(2, w - 12)}" height="${Math.max(2, h - 16)}" rx="8"/><circle cx="0" cy="${-h / 2 + 16}" r="2.5"/>`,
  dish: (w, h) => `<rect x="${-w / 2 + 6}" y="${-h / 2 + 6}" width="${Math.max(2, w - 12)}" height="${Math.max(2, h - 12)}" rx="3"/><path d="M${-w * 0.2} ${-h / 2 + 12}H${w * 0.2}"/>`,
  fridge: (w, h) => `<path d="M${-w / 2} ${-h / 2 + h * 0.34}H${w / 2}M${w / 2 - 9} ${-h / 2 + 7}V${-h / 2 + h * 0.28}M${w / 2 - 9} ${-h / 2 + h * 0.4}V${-h / 2 + h * 0.62}"/>`,
  wardrobe: (w, h) => `<path d="M${-w / 2} ${-h / 2}L${w / 2} ${h / 2}M${w / 2} ${-h / 2}L${-w / 2} ${h / 2}"/>`,
  shelf: (w, h) => { let d = ''; for (let x = -w / 2 + 30; x < w / 2 - 10; x += 30) d += `M${x} ${-h / 2}V${h / 2}`; return `<path d="${d}"/>`; },
  dresser: (w, h) => `<path d="M0 ${-h / 2}V${h / 2}"/><circle cx="${-w * 0.2}" cy="0" r="2"/><circle cx="${w * 0.2}" cy="0" r="2"/>`,
  washer: (w, h) => `<circle cx="0" cy="${h * 0.05}" r="${Math.min(w, h) * 0.34}"/><circle cx="0" cy="${h * 0.05}" r="${Math.min(w, h) * 0.2}"/>`,
  tv: (w, h) => `<rect x="${-w / 2 + 14}" y="${-h / 2 + 4}" width="${Math.max(2, w - 28)}" height="${h * 0.3}" rx="1"/>`,
  ac: (w, h) => `<path d="M${-w / 2 + 6} ${-h * 0.15}H${w / 2 - 6}M${-w / 2 + 6} ${h * 0.05}H${w / 2 - 6}M${-w / 2 + 6} ${h * 0.25}H${w / 2 - 6}"/>`,
  fan: (w, h) => { const r = Math.min(w, h) / 2; let s = `<circle cx="0" cy="0" r="${r * 0.12}"/>`; for (let i = 0; i < 4; i++) s += `<ellipse cx="0" cy="${-r * 0.5}" rx="${r * 0.2}" ry="${r * 0.38}" transform="rotate(${i * 90})"/>`; return s; },
  fireplace: (w, h) => `<rect x="${-w / 2 + 8}" y="${-h / 2 + 8}" width="${Math.max(2, w - 16)}" height="${Math.max(2, h - 16)}"/><path d="M${-w / 2 + 8} ${-h / 2 + 8}L${w / 2 - 8} ${h / 2 - 8}M${w / 2 - 8} ${-h / 2 + 8}L${-w / 2 + 8} ${h / 2 - 8}"/>`,
  stairs: (w, h) => { const L = Math.max(w, h), horiz = w > h; let d = ''; for (let p = -L / 2 + 25; p < L / 2 - 5; p += 25) d += horiz ? `M${p} ${-h / 2}V${h / 2}` : `M${-w / 2} ${p}H${w / 2}`; d += horiz ? `M${-w / 2 + 8} 0H${w / 2 - 12}` : `M0 ${h / 2 - 8}V${-h / 2 + 12}`; return `<path d="${d}"/>`; },
  rug: (w, h) => `<rect x="${-w / 2 + 8}" y="${-h / 2 + 8}" width="${Math.max(2, w - 16)}" height="${Math.max(2, h - 16)}" rx="3" stroke-dasharray="6 4"/>`,
  pillar: (w, h) => `<path d="M${-w / 2} ${-h / 2}L${w / 2} ${h / 2}M${w / 2} ${-h / 2}L${-w / 2} ${h / 2}"/>`,
  plant: (w, h) => { const r = Math.min(w, h) / 2; let s = ''; for (let i = 0; i < 8; i++) s += `<ellipse cx="0" cy="${-r * 0.5}" rx="${r * 0.2}" ry="${r * 0.42}" transform="rotate(${i * 45})"/>`; return s; },
};
const SYMMAP = {
  lamp_ceiling: 'lamp', lamp_floor: 'lamp', lamp_spot: 'lamp', lamp_wall: 'lampwall', lamp_strip: 'strip',
  bed_double: 'bed', bed_single: 'bed', bed_kid: 'bed', sofa: 'sofa', armchair: 'armchair', table_coffee: 'table', table_dining: 'table',
  chair: 'chair', desk: 'desk', wardrobe: 'wardrobe', shelf: 'shelf', dresser: 'dresser', tv_board: 'tv',
  fridge: 'fridge', stove: 'stove', sink_kitchen: 'sink', dishwasher: 'dish', washer: 'washer', bathtub: 'bath', shower: 'shower', toilet: 'toilet', basin: 'sink',
  radiator: 'radiator', ac: 'ac', fan: 'fan', fireplace: 'fireplace', stairs: 'stairs', plant: 'plant', rug: 'rug', pillar: 'pillar',
};
// Stile: a = klassisch, b = modern-neutral (Standard), c = farbig dezent; alles andere = Emojis
const SYM_STYLES = {
  a: { fill: '#ffffff', stroke: '#1f2430', bw: 1.4, dc: '#1f2430', dw: 1.1, grey: true },
  b: { fill: '#eceff1', stroke: '#90a4ae', bw: 1.5, dc: '#37474f', dw: 1.9, grey: true },
  c: { fill: null, stroke: null, bw: 1.5, dc: 'rgba(0,0,0,.42)', dw: 1.2, grey: false },
};
function symStyleKey() { const k = plan && plan.settings && plan.settings.symStyle; return SYM_STYLES[k] ? k : ''; }
function builtinType(id) { return LIB.find(t => t.id === id); }
// Symbolschlüssel für ein Objekt – leer, wenn Emoji-Modus, kein Symbol vorhanden oder ein eigenes Icon gesetzt wurde
function symKeyFor(it) {
  if (!symStyleKey()) return '';
  const key = SYMMAP[it.type], bt = builtinType(it.type);
  if (!key || !bt || (it.icon && it.icon !== bt.icon)) return '';
  return key;
}
function isCustomColor(it) { const t = typeById(it.type); return !!(it.color && (!t || t.color !== it.color)); }
function symDetail(key, w, h) {
  const S0 = SYM_STYLES[symStyleKey()];
  const inner = SYM[key](w, h).replace(/<(path|rect|circle|ellipse)\s/g, '<$1 vector-effect="non-scaling-stroke" ');
  return `<g fill="none" stroke="${S0.dc}" stroke-width="${S0.dw}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none">${inner}</g>`;
}
// Kleines Vorschaubild für die Bibliothek
function symThumb(t) {
  const sk = symStyleKey(), key = SYMMAP[t.id];
  if (!sk || !key || (t.icon && builtinType(t.id) && t.icon !== builtinType(t.id).icon)) return '';
  const S0 = SYM_STYLES[sk], w = t.w, h = t.h, pad = Math.max(w, h) * 0.08, fill = S0.fill && !t.custom ? S0.fill : (t.color || '#cfd8dc');
  const round = t.shape === 'ellipse' || key === 'lamp' || key === 'plant' || key === 'fan';
  const body = round ? `<circle r="${Math.min(w, h) / 2}" fill="${fill}" stroke="${S0.stroke || '#555'}" stroke-width="${S0.bw}" vector-effect="non-scaling-stroke"/>`
    : `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(8, Math.min(w, h) / 4)}" fill="${fill}" stroke="${S0.stroke || '#555'}" stroke-width="${S0.bw}" vector-effect="non-scaling-stroke"/>`;
  return `<svg viewBox="${-w / 2 - pad} ${-h / 2 - pad} ${w + pad * 2} ${h + pad * 2}" width="26" height="26" aria-hidden="true">${body}${symDetail(key, w, h)}</svg>`;
}

/* ---- model.js ---- */
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

/* ---- ha.js ---- */
// Zustände kommen live aus Home Assistant (hass.states) über den Wirt (HOST).
let states = {}, entities = [], haInfo = { ha: false, allowControl: false }, statesSig = '';

const TOGGLE_DOMAINS = new Set(['light', 'switch', 'fan', 'input_boolean', 'automation', 'siren', 'humidifier', 'group']);
const ON_STATES = new Set(['on', 'open', 'opening', 'playing', 'home', 'unlocked', 'heat', 'cool', 'heat_cool',
  'cleaning', 'detected', 'running', 'active', 'charging', 'armed_home', 'armed_away', 'armed_night', 'buffering']);
const STATE_DE = {
  on: 'an', off: 'aus', open: 'offen', closed: 'zu', opening: 'öffnet', closing: 'schließt', locked: 'verriegelt',
  unlocked: 'entriegelt', home: 'zuhause', not_home: 'abwesend', playing: 'spielt', paused: 'pausiert', idle: 'bereit',
  unavailable: 'nicht verfügbar', unknown: 'unbekannt', heat: 'heizen', cool: 'kühlen', auto: 'auto',
  docked: 'angedockt', cleaning: 'saugt', returning: 'kehrt zurück',
};
const domainOf = e => String(e || '').split('.')[0];

function linkedEntities() {
  const set = new Set();
  plan.floors.forEach(f => {
    f.items.forEach(i => i.entity && set.add(i.entity));
    f.rooms.forEach(r => r.entity && set.add(r.entity));
  });
  return [...set];
}

function setHaBadge() {
  const b = $('#haBadge');
  b.hidden = false;
  b.className = 'badge ' + (haInfo.ha ? 'ok' : 'err');
  b.textContent = haInfo.ha ? 'Live' : 'Demo';
  b.title = haInfo.ha ? 'Mit Home Assistant verbunden' : 'Außerhalb von Home Assistant: keine Live-Daten';
}

function loadInfo() { try { haInfo = HOST.info() || haInfo; } catch (_) { /* Demo */ } setHaBadge(); }

// Gleicht `states` mit hass ab; true, wenn sich für verknüpfte Entitäten etwas geändert hat.
function syncStates() {
  let all = {};
  try { all = HOST.states() || {}; } catch (_) { /* egal */ }
  const next = {};
  let sig = '';
  linkedEntities().forEach(id => {
    const s = all[id];
    if (s) { next[id] = s; sig += id + '|' + s.state + '|' + (s.last_updated || '') + ';'; }
  });
  if (sig === statesSig) return false;
  states = next; statesSig = sig;
  return true;
}
function pollStates() { syncStates(); render(); }

async function loadEntities() {
  let all = {};
  try { all = HOST.states() || {}; } catch (_) { /* egal */ }
  entities = Object.keys(all).sort().map(id => ({ e: id, n: (all[id].attributes && all[id].attributes.friendly_name) || '', s: all[id].state }));
  try { if (HOST.entities) { const m = new Map(HOST.entities().map(x => [x.id, x])); entities.forEach(x => { const r = m.get(x.e); if (r) { x.a = r.area; x.dc = r.dc; } }); } } catch (_) { /* egal */ }
  $('#entlist').innerHTML = entities.map(e => `<option value="${esc(e.e)}">${esc(e.n)}</option>`).join('');
}

function isActive(s) {
  if (!s) return false;
  const d = domainOf(s.entity_id), a = s.attributes || {};
  if (d === 'climate') return a.hvac_action ? ['heating', 'cooling'].includes(a.hvac_action) : s.state !== 'off';
  if (d === 'cover') return s.state === 'open' || s.state === 'opening';
  if (d === 'lock') return s.state === 'unlocked';
  return ON_STATES.has(s.state);
}

function valueText(entity) {
  const s = states[entity];
  if (!s) return '';
  const a = s.attributes || {}, d = domainOf(entity), st = s.state;
  if (st === 'unavailable') return 'n/v';
  if (st === 'unknown') return '?';
  if (d === 'climate') {
    const p = [];
    if (a.current_temperature != null) p.push(fmtN(a.current_temperature, 1) + '°');
    if (a.temperature != null) p.push('→ ' + fmtN(a.temperature, 1) + '°');
    return p.join(' ') || (STATE_DE[st] || st);
  }
  if (d === 'light') return st === 'on' ? (a.brightness != null ? Math.round(a.brightness / 2.55) + ' %' : 'an') : 'aus';
  if (d === 'cover') return a.current_position != null ? a.current_position + ' %' : (STATE_DE[st] || st);
  if (d === 'sensor' || d === 'number' || d === 'input_number') {
    const n = parseFloat(st), v = Number.isFinite(n) ? fmtN(n, 1) : st;
    return a.unit_of_measurement ? v + ' ' + a.unit_of_measurement : v;
  }
  return STATE_DE[st] || st;
}

function glowColor(it, s) {
  const a = (s && s.attributes) || {};
  if (it.onColor) return it.onColor;
  if (Array.isArray(a.rgb_color) && a.rgb_color.length === 3) return `rgb(${a.rgb_color.join(',')})`;
  return '#ffc94d';
}

// ---------- Aktionen ----------
async function callService(domain, service, data = {}) {
  try { await HOST.callService(domain, service, data); return true; }
  catch (e) { toast('Fehler: ' + ((e && e.message) || e)); return false; }
}
function openDetails(entity) { if (entity) HOST.moreInfo(entity); }

function tapPlan(it) {
  if (it.tap === 'none') return null;
  if (it.tap === 'details') return { details: true };
  if (it.tap === 'service') {
    const m = /^([a-z0-9_]+)\.([a-z0-9_]+)$/.exec(it.svc || '');
    if (!m) return null;
    let data = {};
    try { data = it.svcData ? JSON.parse(it.svcData) : {}; } catch (_) { toast('Ungültiges JSON in den Dienst-Daten'); return null; }
    if (it.entity && data.entity_id === undefined) data.entity_id = it.entity;
    return { domain: m[1], service: m[2], data };
  }
  if (!it.entity) return null;
  const d = domainOf(it.entity), data = { entity_id: it.entity };
  if (it.tap === 'toggle') return { domain: 'homeassistant', service: 'toggle', data };
  if (TOGGLE_DOMAINS.has(d)) return { domain: 'homeassistant', service: 'toggle', data };
  switch (d) {
    case 'cover': return { domain: 'cover', service: 'toggle', data };
    case 'script': return { domain: 'script', service: 'turn_on', data };
    case 'scene': return { domain: 'scene', service: 'turn_on', data };
    case 'button': return { domain: 'button', service: 'press', data };
    case 'input_button': return { domain: 'input_button', service: 'press', data };
    case 'media_player': return { domain: 'media_player', service: 'media_play_pause', data };
    default: return { details: true };
  }
}

function onItemTap(it, long) {
  if (!it.entity && it.tap !== 'service') return;
  const p = tapPlan(it);
  const wantDetails = long ? S().liveTap !== 'details' : S().liveTap === 'details';
  if (!p || p.details || (wantDetails && it.entity)) {
    if (it.entity) openDetails(it.entity);
    return;
  }
  if (!haInfo.allowControl) {
    toast('Schalten ist hier nicht möglich.');
    if (it.entity) openDetails(it.entity);
    return;
  }
  callService(p.domain, p.service, p.data);
}

/* ---- render.js ---- */
const svgEl = $('#svg'), gWorld = $('#world'), gGrid = $('#gridL'), gBg = $('#bgL'), gRooms = $('#roomsL'),
  gWalls = $('#wallsL'), gItems = $('#itemsL'), gOver = $('#overlayL'), gDefs = $('#glowDefs');
let C = {}, rq = false;
const NS = 'vector-effect="non-scaling-stroke"';

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const g = (n, d) => (cs.getPropertyValue(n) || '').trim() || d;
  C = {
    canvas: g('--canvas', '#fbfbfc'), grid: g('--grid', '#e8eaee'), gridMajor: g('--grid-major', '#d5d9e0'),
    wall: g('--wall', '#2b3240'), text: g('--room-text', '#3a4152'), accent: g('--accent', '#03a9f4'),
    stroke: g('--item-stroke', 'rgba(40,50,70,.55)'), muted: g('--muted', '#6b7385'),
  };
}

function render() {
  if (rq || !plan) return;
  rq = true;
  requestAnimationFrame(() => { rq = false; renderNow(); });
}

function renderNow() {
  readColors();
  const f = curFloor(), v = V(), live = mode === 'live', { w, h } = stageSize();
  gWorld.setAttribute('transform', `translate(${v.tx} ${v.ty}) rotate(${v.a || 0}) scale(${v.k})`);
  gGrid.innerHTML = live || !S().showGrid ? '' : gridMarkup(v, w, h);
  gBg.innerHTML = bgMarkup(f);
  gRooms.innerHTML = f.rooms.map(r => roomMarkup(r)).join('');
  gWalls.innerHTML = f.walls.map(wl => wallMarkup(wl, live, v)).join('');
  const ctx = { glows: new Map(), glowOut: [] };
  gItems.innerHTML = f.items.map(i => itemMarkup(i, ctx)).join('') + ctx.glowOut.join('');
  gDefs.innerHTML = [...ctx.glows].map(([col, id]) =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset=".5" stop-color="${col}" stop-opacity=".42"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`).join('');
  gOver.innerHTML = live ? '' : overlayMarkup(f, v);
  const empty = !f.walls.length && !f.rooms.length && !f.items.length && !(f.bg && f.bg.url);
  $('#empty').hidden = !(empty && !live && tool === 'select' && !drawing);
  updateStatus();
}

function glowId(map, col) { if (!map.has(col)) map.set(col, 'gl' + map.size); return map.get(col); }

function gridMarkup(v, w, h) {
  let step = S().grid;
  while (step * v.k < 9) step *= 2;
  const cs = [s2w(v, 0, 0), s2w(v, w, 0), s2w(v, 0, h), s2w(v, w, h)];
  const x0 = Math.min(...cs.map(p => p.x)), x1 = Math.max(...cs.map(p => p.x)), y0 = Math.min(...cs.map(p => p.y)), y1 = Math.max(...cs.map(p => p.y));
  const every = Math.max(1, Math.round(100 / step));
  let minor = '', major = '', n = 0;
  for (let i = Math.floor(x0 / step); i <= Math.ceil(x1 / step) && n < 1500; i++, n++) {
    const d = `M${i * step} ${y0}V${y1}`;
    if (i % every === 0) major += d; else minor += d;
  }
  for (let j = Math.floor(y0 / step); j <= Math.ceil(y1 / step) && n < 3000; j++, n++) {
    const d = `M${x0} ${j * step}H${x1}`;
    if (j % every === 0) major += d; else minor += d;
  }
  return `<path d="${minor}" stroke="${C.grid}" stroke-width="1" fill="none" ${NS}/><path d="${major}" stroke="${C.gridMajor}" stroke-width="1" fill="none" ${NS}/>`;
}

function bgMarkup(f) {
  const b = f.bg;
  if (!b || !b.url) return '';
  return `<image data-k="bg" href="${esc(b.url)}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.w * (b.ar || 1)}" opacity="${b.opacity ?? 0.5}" preserveAspectRatio="none" style="${b.locked ? 'pointer-events:none' : 'cursor:move'}"/>`;
}

const FLOORS = {
  wood: [240, 40, '<rect width="120" height="20" fill="#fff" opacity=".10"/><rect x="120" y="20" width="120" height="20" fill="#fff" opacity=".10"/><path d="M0 0H240M0 20H240M0 40H240M0 0V20M120 20V40" stroke="#000" stroke-opacity=".28" stroke-width="1.2" fill="none"/>'],
  tile: [120, 120, '<rect width="60" height="60" fill="#fff" opacity=".14"/><rect x="60" y="60" width="60" height="60" fill="#fff" opacity=".14"/><path d="M0 0H120M0 60H120M0 120H120M0 0V120M60 0V120M120 0V120" stroke="#000" stroke-opacity=".25" stroke-width="1.2" fill="none"/>'],
  stone: [100, 50, '<path d="M0 0H100M0 25H100M0 50H100M0 0V25M50 25V50" stroke="#000" stroke-opacity=".3" stroke-width="1.4" fill="none"/><rect width="50" height="25" fill="#000" opacity=".05"/><rect x="50" y="25" width="50" height="25" fill="#000" opacity=".05"/>'],
  carpet: [10, 10, '<circle cx="2.5" cy="2.5" r="1" fill="#000" opacity=".22"/><circle cx="7.5" cy="7.5" r="1" fill="#fff" opacity=".35"/>'],
  grass: [24, 24, '<path d="M4 10l2-5 2 5M16 20l2-5 2 5M14 8l1.5-4 1.5 4" stroke="#1b5e20" stroke-opacity=".45" stroke-width="1.2" fill="none"/>'],
  concrete: [60, 60, '<circle cx="12" cy="15" r="1.2" fill="#000" opacity=".15"/><circle cx="40" cy="44" r="1.6" fill="#000" opacity=".12"/><circle cx="50" cy="12" r="1" fill="#fff" opacity=".3"/><circle cx="25" cy="50" r="1" fill="#fff" opacity=".3"/>'],
};
const FLOOR_OPTIONS = [['', 'Nur Farbe'], ['wood', 'Holz / Parkett'], ['tile', 'Fliesen'], ['stone', 'Stein / Klinker'], ['carpet', 'Teppich'], ['grass', 'Rasen'], ['concrete', 'Beton']];
function floorMarkup(r, pts) {
  const d = FLOORS[r.floor];
  if (!d) return '';
  const id = 'fl-' + r.id, sc = r.floorScale > 0 ? r.floorScale : 1;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${d[0]}" height="${d[1]}" patternTransform="scale(${sc}) rotate(${r.floorRot || 0})">${d[2]}</pattern>` +
    `<polygon points="${pts}" fill="url(#${id})" fill-opacity="${r.floor === 'grass' || r.floor === 'concrete' ? 0.9 : 1}" pointer-events="none"/>`;
}

function roomMarkup(r) {
  const pts = r.pts.map(p => p.join(',')).join(' ');
  const [cx, cy] = polyCentroid(r.pts), fs = S().labelSize * 1.15, area = polyArea(r.pts) / 10000;
  const lines = [];
  if (S().showRoomNames && r.name) lines.push({ t: r.name, s: fs, c: C.text, o: 1 });
  const val = r.entity ? valueText(r.entity) : '';
  if (val) lines.push({ t: val, s: fs * 0.95, c: C.accent, o: 1 });
  if (S().showArea) lines.push({ t: fmtN(area, 1) + ' m²', s: fs * 0.72, c: C.text, o: 0.65 });
  const total = lines.reduce((a, l) => a + l.s * 1.25, 0);
  let y = cy - total / 2;
  const txt = lines.map(l => {
    y += l.s * 1.25;
    return `<text x="${cx}" y="${y - l.s * 0.45}" text-anchor="middle" font-size="${l.s}" fill="${l.c}" opacity="${l.o}" font-weight="${l.o === 1 ? 600 : 400}" pointer-events="none" style="user-select:none">${esc(l.t)}</text>`;
  }).join('');
  const col = r.color || '#90caf9';
  return `<g data-k="room" data-id="${r.id}"><polygon points="${pts}" fill="${col}" fill-opacity="${r.floor ? Math.max(S().roomOpacity, 0.55) : S().roomOpacity}" stroke="${col}" stroke-opacity=".6" stroke-width="1" ${NS}/>${floorMarkup(r, pts)}${txt}</g>`;
}

function wallMarkup(w, live, v) {
  const col = w.color || S().wallColor || C.wall, L = wallLen(w);
  const dash = w.style === 'dashed' ? `stroke-dasharray="${w.t * 1.5} ${w.t}"` : '';
  let out = `<line data-k="wall" data-id="${w.id}" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="transparent" stroke-width="${Math.max(w.t, 18 / v.k)}" stroke-linecap="round"/>`;
  out += `<line data-k="wall" data-id="${w.id}" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${col}" stroke-width="${w.t}" stroke-linecap="square" ${dash} pointer-events="none"/>`;
  if (!live && S().showDims && L * v.k > 60) {
    let a = Math.atan2(w.y2 - w.y1, w.x2 - w.x1) * 180 / Math.PI;
    if (a > 90) a -= 180;
    if (a <= -90) a += 180;
    const ar = a * Math.PI / 180, fs = Math.max(S().labelSize * 0.7, 11 / v.k), off = w.t / 2 + fs * 0.9;
    const mx = (w.x1 + w.x2) / 2 + Math.sin(ar) * off, my = (w.y1 + w.y2) / 2 - Math.cos(ar) * off;
    out += `<text x="${mx}" y="${my}" dy=".35em" text-anchor="middle" font-size="${fs}" fill="${C.muted}" transform="rotate(${a} ${mx} ${my})" pointer-events="none" style="user-select:none">${fmtN(L / 100, 2)} m</text>`;
  }
  return out;
}

function doorSvg(it) {
  const w = it.w, t = Math.max(it.h, 6), sx = it.flipX ? -1 : 1, sy = it.flipY ? -1 : 1;
  return `<g transform="scale(${sx} ${sy})"><rect x="${-w / 2}" y="${-t / 2 - 1}" width="${w}" height="${t + 2}" fill="${C.canvas}"/>` +
    `<path d="M ${-w / 2} ${-w} A ${w} ${w} 0 0 1 ${w / 2} 0 L ${-w / 2} 0 Z" fill="${C.wall}" fill-opacity=".06" stroke="${C.wall}" stroke-width="1.2" ${NS}/>` +
    `<line x1="${-w / 2}" y1="0" x2="${-w / 2}" y2="${-w}" stroke="${C.wall}" stroke-width="3" ${NS}/></g>`;
}
function windowSvg(it) {
  const w = it.w, t = Math.max(it.h, 6);
  return `<rect x="${-w / 2}" y="${-t / 2 - 1}" width="${w}" height="${t + 2}" fill="${C.canvas}"/>` +
    `<rect x="${-w / 2}" y="${-t / 2}" width="${w}" height="${t}" fill="#b3e5fc" fill-opacity=".6" stroke="${C.wall}" stroke-width="1.2" ${NS}/>` +
    `<line x1="${-w / 2}" y1="0" x2="${w / 2}" y2="0" stroke="${C.wall}" stroke-width="1.2" ${NS}/>`;
}

function iconMarkup(it) {
  if (!it.icon || ['door', 'window', 'text'].includes(it.shape) || symKeyFor(it)) return '';
  const sc = it.iconScale || 1, mn = Math.min(it.w, it.h), mx = Math.max(it.w, it.h);
  const base = mx / mn > 3 ? mn * 2 : mn, rot = -(it.rot || 0);
  if (it.icon.startsWith('img:')) {
    const sz = base * 0.8 * sc;
    return `<image href="${esc(it.icon.slice(4))}" x="${-sz / 2}" y="${-sz / 2}" width="${sz}" height="${sz}" transform="rotate(${rot})" pointer-events="none"/>`;
  }
  const size = clamp(base * 0.62 * sc, 6, 120 * sc);
  const grey = symStyleKey() && SYM_STYLES[symStyleKey()].grey ? ';filter:grayscale(1);opacity:.8' : '';
  return `<text transform="rotate(${rot})" text-anchor="middle" dy=".35em" font-size="${size}" pointer-events="none" style="user-select:none${grey}">${esc(it.icon)}</text>`;
}

function itemMarkup(it, ctx) {
  const s = !ctx.noState && it.entity ? states[it.entity] : null;
  const act = isActive(s), na = s && (s.state === 'unavailable' || s.state === 'unknown');
  const w = it.w, h = it.h, rot = it.rot || 0, isLight = domainOf(it.entity) === 'light';
  let out = '';
  if (act && it.glow && ctx.glows) {
    const col = glowColor(it, s), id = glowId(ctx.glows, col);
    const R = Math.max(w, h) * 2.2 + 90, br = s.attributes && s.attributes.brightness != null ? clamp(s.attributes.brightness / 255, 0.35, 1) : 1;
    const glowSvg = `<circle cx="${it.x}" cy="${it.y}" r="${R}" fill="url(#${id})" opacity="${br * 0.8}" pointer-events="none"/>`;
    if (ctx.glowOut) ctx.glowOut.push(glowSvg); else out += glowSvg;
  }
  const sk = symStyleKey(), SS = sk ? SYM_STYLES[sk] : null, symKey = symKeyFor(it);
  const baseFill = SS && SS.fill && !isCustomColor(it) ? SS.fill : (it.color || '#cfd8dc');
  const fill = act ? (it.onColor || (isLight ? glowColor(it, s) : C.accent)) : baseFill;
  const st = `stroke="${SS && SS.stroke ? SS.stroke : C.stroke}" stroke-width="${SS ? SS.bw : 1.5}" ${NS}`;
  let body;
  switch (it.shape) {
    case 'text': {
      const lines = String(it.label || '').split('\n'), fs = it.fs || 28;
      body = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="transparent"/><text text-anchor="middle" font-size="${fs}" font-weight="500" fill="${it.color || C.text}" style="user-select:none">` +
        lines.map((ln, i) => `<tspan x="0" y="${(i - (lines.length - 1) / 2) * fs * 1.2}" dy=".35em">${esc(ln)}</tspan>`).join('') + '</text>';
      break;
    }
    case 'door': body = doorSvg(it); break;
    case 'window': body = windowSvg(it); break;
    case 'ellipse': body = `<ellipse rx="${w / 2}" ry="${h / 2}" fill="${fill}" ${st}/>`; break;
    case 'none': body = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="transparent"/>`; break;
    default: body = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(8, Math.min(w, h) / 4)}" fill="${fill}" ${st}/>`;
  }
  const sh = S().itemShadow !== false && it.shape !== 'text' && it.shape !== 'door' && it.shape !== 'window' && it.shape !== 'none' ? ' filter="url(#fpShadow)"' : '';
  const cls = 'item' + (it.entity && mode === 'live' ? ' act' : '');
  out += `<g class="${cls}" data-k="item" data-id="${it.id}" transform="translate(${it.x} ${it.y}) rotate(${rot})"${na ? ' opacity=".45"' : ''}><g${sh}>${body}</g>${symKey ? symDetail(symKey, w, h) : ''}${iconMarkup(it)}</g>`;

  const rad = rot * Math.PI / 180, hh = Math.abs(w / 2 * Math.sin(rad)) + Math.abs(h / 2 * Math.cos(rad)), fs = S().labelSize;
  if (it.shape !== 'text' && it.showLabel && it.label) {
    out += `<text data-k="item" data-id="${it.id}" x="${it.x}" y="${it.y + hh + fs * 1.05}" text-anchor="middle" font-size="${fs}" fill="${C.text}" paint-order="stroke" stroke="${C.canvas}" stroke-width="${fs * 0.22}" style="user-select:none">${esc(it.label)}</text>`;
  }
  if (!ctx.noState && it.entity && it.showValue) {
    const t = valueText(it.entity);
    if (t) {
      const vf = fs * 0.9, tw = t.length * vf * 0.58 + vf * 1.1, cy = it.y - hh - vf * 1.0;
      out += `<g data-k="item" data-id="${it.id}" style="user-select:none"><rect x="${it.x - tw / 2}" y="${cy - vf * 0.75}" width="${tw}" height="${vf * 1.5}" rx="${vf * 0.75}" fill="${act ? C.accent : C.muted}"/>` +
        `<text x="${it.x}" y="${cy}" dy=".35em" text-anchor="middle" font-size="${vf}" fill="#fff" font-weight="600">${esc(t)}</text></g>`;
    }
  }
  return out;
}

// ---------- Overlay: Auswahl, Zeichenvorschau ----------
function handle(t, x, y, extra, s, r = 7) {
  return `<circle data-k="h" data-t="${t}" ${extra} cx="${x}" cy="${y}" r="${r * s}" fill="#fff" stroke="${C.accent}" stroke-width="2" ${NS} style="cursor:pointer"/>` +
    `<circle data-k="h" data-t="${t}" ${extra} cx="${x}" cy="${y}" r="${16 * s}" fill="transparent"/>`;
}

function overlayMarkup(f, v) {
  const s = 1 / v.k;
  let out = '';
  const o = selObj();
  if (o && sel.k === 'item') {
    const hw = o.w / 2, hh = o.h / 2;
    out += `<g transform="translate(${o.x} ${o.y}) rotate(${o.rot || 0})"><rect x="${-hw}" y="${-hh}" width="${o.w}" height="${o.h}" fill="none" stroke="${C.accent}" stroke-width="1.5" stroke-dasharray="6 4" pointer-events="none" ${NS}/>`;
    if (o.shape !== 'text') [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].forEach((c, i) => { out += handle('size', c[0], c[1], `data-c="${i}"`, s, 6); });
    out += `<line x1="0" y1="${-hh}" x2="0" y2="${-hh - 28 * s}" stroke="${C.accent}" stroke-width="1.5" pointer-events="none" ${NS}/>` + handle('rot', 0, -hh - 28 * s, '', s) + '</g>';
  } else if (o && sel.k === 'wall') {
    out += `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${C.accent}" stroke-opacity=".35" stroke-width="${o.t + 10 * s}" stroke-linecap="square" pointer-events="none"/>`;
    out += handle('wa', o.x1, o.y1, '', s) + handle('wb', o.x2, o.y2, '', s);
    out += `<text x="${(o.x1 + o.x2) / 2}" y="${(o.y1 + o.y2) / 2 - o.t - 8 * s}" text-anchor="middle" font-size="${13 * s}" fill="${C.accent}" font-weight="600" pointer-events="none" paint-order="stroke" stroke="${C.canvas}" stroke-width="${3 * s}">${fmtN(wallLen(o) / 100, 2)} m</text>`;
  } else if (o && sel.k === 'room') {
    out += `<polygon points="${o.pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${C.accent}" stroke-width="2" stroke-dasharray="6 4" pointer-events="none" ${NS}/>`;
    o.pts.forEach((p, i) => {
      const q = o.pts[(i + 1) % o.pts.length];
      out += handle('rm', (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, `data-i="${i}"`, s, 4);
    });
    o.pts.forEach((p, i) => { out += handle('rv', p[0], p[1], `data-i="${i}"`, s); });
  } else if (o && sel.k === 'bg') {
    out += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.w * (o.ar || 1)}" fill="none" stroke="${C.accent}" stroke-width="2" stroke-dasharray="6 4" pointer-events="none" ${NS}/>`;
  }
  out += drawingMarkup(f, v, s);
  return out;
}

function drawingMarkup(f, v, s) {
  let out = '';
  const cur = hover;
  if (drawing && cur) {
    const pts = drawing.pts;
    if (drawing.k === 'wall') {
      const a = pts[pts.length - 1];
      out += `<line x1="${a.x}" y1="${a.y}" x2="${cur.x}" y2="${cur.y}" stroke="${C.accent}" stroke-width="${S().wallThickness}" stroke-opacity=".5" stroke-linecap="square" pointer-events="none"/>`;
      out += `<text x="${(a.x + cur.x) / 2}" y="${(a.y + cur.y) / 2 - S().wallThickness - 6 * s}" text-anchor="middle" font-size="${13 * s}" fill="${C.accent}" font-weight="600" pointer-events="none" paint-order="stroke" stroke="${C.canvas}" stroke-width="${3 * s}">${fmtN(dist(a, cur) / 100, 2)} m</text>`;
    } else if (drawing.k === 'room') {
      const all = pts.concat([cur]).map(p => `${p.x},${p.y}`).join(' ');
      out += `<polygon points="${all}" fill="${C.accent}" fill-opacity=".15" stroke="${C.accent}" stroke-width="2" pointer-events="none" ${NS}/>`;
      pts.forEach((p, i) => { out += `<circle cx="${p.x}" cy="${p.y}" r="${(i === 0 ? 7 : 4) * s}" fill="${i === 0 ? C.accent : '#fff'}" stroke="${C.accent}" stroke-width="2" pointer-events="none" ${NS}/>`; });
    }
  }
  if (drag && drag.t === 'rect' && hover) {
    const a = drag.a, b = hover;
    out += `<rect x="${Math.min(a.x, b.x)}" y="${Math.min(a.y, b.y)}" width="${Math.abs(a.x - b.x)}" height="${Math.abs(a.y - b.y)}" fill="${C.accent}" fill-opacity=".15" stroke="${C.accent}" stroke-width="2" pointer-events="none" ${NS}/>`;
    out += `<text x="${(a.x + b.x) / 2}" y="${Math.min(a.y, b.y) - 8 * s}" text-anchor="middle" font-size="${13 * s}" fill="${C.accent}" font-weight="600" pointer-events="none" paint-order="stroke" stroke="${C.canvas}" stroke-width="${3 * s}">${fmtN(Math.abs(a.x - b.x) / 100, 2)} × ${fmtN(Math.abs(a.y - b.y) / 100, 2)} m</text>`;
  }
  if (tool === 'calib' && calibPts.length) {
    const a = calibPts[0], b = calibPts[1] || hover || a;
    out += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#e5484d" stroke-width="2" pointer-events="none" ${NS}/><circle cx="${a.x}" cy="${a.y}" r="${5 * s}" fill="#e5484d" pointer-events="none"/>`;
  }
  if (tool === 'place' && placeType && hover) {
    const g = { ...newItemFromType(placeType, hover.x, hover.y), id: 'ghost' };
    if (placeType.wall) snapToWall(g, hover);
    out += `<g opacity=".55" pointer-events="none">${itemMarkup(g, { glows: null, noState: true })}</g>`;
  }
  if (hover && hover.pt && ['wall', 'room', 'rect'].includes(tool)) {
    out += `<circle cx="${hover.x}" cy="${hover.y}" r="${8 * s}" fill="none" stroke="#e5484d" stroke-width="2" pointer-events="none" ${NS}/>`;
  }
  return out;
}

function updateStatus() {
  const v = V(), st = $('#status');
  st.textContent = (hover && mode === 'edit' ? `x ${fmtN(hover.x / 100)} m · y ${fmtN(hover.y / 100)} m · ` : '') + Math.round(v.k * 100) + ' %' + (v.a ? ' · ' + Math.round(v.a) + '°' : '');
}

// ---------- Export ----------
async function toDataUrl(url) {
  const blob = await (await fetch(url)).blob();
  return new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
}
async function exportSvgString(f, withBg = true) {
  readColors();
  const b = contentBounds(f), pad = 80, x0 = b.x - pad, y0 = b.y - pad, w = b.w + pad * 2, h = b.h + pad * 2;
  let bg = '';
  if (withBg && f.bg && f.bg.url) {
    try { bg = bgMarkup({ bg: { ...f.bg, url: await toDataUrl(f.bg.url), locked: true } }); } catch (_) { /* Bild fehlt */ }
  }
  const ctx = { glows: null, noState: true };
  const body = f.rooms.map(r => roomMarkup(r)).join('') + f.walls.map(wl => wallMarkup(wl, false, { k: 1 })).join('') + f.items.map(i => itemMarkup(i, ctx)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" width="${w}" height="${h}" font-family="system-ui,sans-serif"><defs><filter id="fpShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".3"/></filter></defs><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${C.canvas}"/>${bg}${body}</svg>`;
}

/* ---- card.src.js ---- */
// ---------- Dashboard-Karte (Teil des Bündels; teilt Code mit dem Editor) ----------
let mode = 'live', tool = 'select', drawing = null, hover = null;
let ACTIVE = null;
const HOST = {
  demo: false,
  info: () => ({ ha: true, allowControl: true, admin: false }),
  states: () => (ACTIVE && ACTIVE._hass ? ACTIVE._hass.states : {}),
  callService: (d, s, data) => ACTIVE._hass.callService(d, s, data),
  moreInfo: entityId => ACTIVE && ACTIVE.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true })),
};
function toast(msg) { console.warn('[floorplan-studio-card]', msg); }

const CARD_CSS = `
:host { display: block; }
ha-card { overflow: hidden; }
.hd { padding: 12px 16px 0; font-size: 18px; font-weight: 500; color: var(--primary-text-color); }
.tabs { display: flex; gap: 6px; flex-wrap: wrap; padding: 8px 12px 0; }
.tabs button { border: 1px solid var(--divider-color); background: transparent; color: var(--primary-text-color); border-radius: 16px; padding: 4px 12px; font: inherit; font-size: 13px; cursor: pointer; }
.tabs button.on { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: var(--primary-color); }
svg { width: 100%; height: auto; display: block; touch-action: manipulation; user-select: none; -webkit-user-select: none; }
.item.act, [data-k="room"].act { cursor: pointer; }
.msg { padding: 24px 16px; color: var(--secondary-text-color); text-align: center; }
`;

class FloorplanStudioCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._cfg = {}; this._plan = null; this._floor = null; this._sig = ''; this._unsub = null; this._err = '';
    this._hass = null; this._loading = false; this._rev = null; this._drag = null;
  }
  static getStubConfig() { return {}; }
  getCardSize() { return 6; }
  setConfig(c) { this._cfg = c || {}; this._sig = ''; this._pickFloor(); this._draw(); }

  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (first) this._start();
    else this._maybeDraw();
  }
  connectedCallback() { if (this._hass && !this._unsub) this._start(); }
  disconnectedCallback() { if (this._unsub) { try { this._unsub(); } catch (_) { /* egal */ } this._unsub = null; } clearTimeout(this._drag && this._drag.timer); }

  async _start() {
    await this._load();
    if (this._unsub || !this._hass) return;
    this._unsub = () => { };
    this._hass.connection.subscribeMessage(ev => {
      if (ev && ev.rev !== this._rev) this._load();
    }, { type: 'floorplan_studio/subscribe' }).then(u => { this._unsub = u; }).catch(() => { this._unsub = null; });
  }
  async _load() {
    if (this._loading || !this._hass) return;
    this._loading = true;
    try {
      const r = await this._hass.callWS({ type: 'floorplan_studio/get' });
      this._rev = r.rev;
      this._plan = r.plan && Array.isArray(r.plan.floors) ? normalizeSafe(r.plan) : null;
      this._err = '';
      this._pickFloor();
    } catch (e) { this._err = (e && e.message) || 'Plan konnte nicht geladen werden'; }
    this._loading = false;
    this._sig = '';
    this._draw();
  }
  _pickFloor() {
    if (!this._plan) return;
    const want = this._cfg.floor;
    const fl = this._plan.floors;
    const byCfg = want != null ? fl.find(f => f.id === want || f.name === want) : null;
    if (byCfg) this._floor = byCfg.id;
    else if (!fl.some(f => f.id === this._floor)) this._floor = fl[0].id;
  }

  // Globale Editor-Variablen für diese Karte setzen (alles synchron, daher sicher bei mehreren Karten).
  _ctx() {
    ACTIVE = this;
    haInfo = { ha: true, allowControl: true };
    const dark = !!(this._hass && this._hass.themes && this._hass.themes.darkMode);
    const p = this._plan;
    const settings = { ...p.settings };
    if (dark && (!settings.wallColor || settings.wallColor.toLowerCase() === '#2b3240')) settings.wallColor = '#cfd6e4';
    plan = { ...p, settings };
    floorId = this._floor;
    const cs = getComputedStyle(this);
    const g = (n, d) => (cs.getPropertyValue(n) || '').trim() || d;
    C = {
      canvas: g('--card-background-color', dark ? '#1c1c1c' : '#fff'), grid: '', gridMajor: '',
      wall: g('--primary-text-color', '#2b3240'), text: g('--primary-text-color', '#3a4152'), accent: g('--primary-color', '#03a9f4'),
      stroke: g('--secondary-text-color', 'rgba(40,50,70,.55)'), muted: g('--secondary-text-color', '#6b7385'),
    };
    syncStates();
  }

  _maybeDraw() {
    if (!this._plan) return;
    ACTIVE = this;
    plan = this._plan; floorId = this._floor;
    const h = this._hass, th = h.themes || {};
    const before = this._sig;
    let all = h.states, sig = (th.darkMode ? 'd' : 'l') + (th.theme || '') + '|' + this._floor + '|';
    linkedEntities().forEach(id => { const s = all[id]; if (s) sig += id + '|' + s.state + '|' + (s.last_updated || '') + ';'; });
    if (sig !== before) { this._sig = sig; this._draw(true); }
  }

  _draw(fromSig) {
    const root = this.shadowRoot;
    if (!fromSig) this._sig = this._sig || '';
    const head = this._cfg.title ? `<div class="hd">${esc(this._cfg.title)}</div>` : '';
    if (!this._plan) {
      root.innerHTML = `<style>${CARD_CSS}</style><ha-card>${head}<div class="msg">${esc(this._err || 'Lade Grundriss …')}</div></ha-card>`;
      return;
    }
    this._ctx();
    const f = curFloor(), b = contentBounds(f), pad = 60;
    const rotDeg = Number(this._cfg.rotate != null ? this._cfg.rotate : (plan.settings.viewRot || 0)) || 0;
    const rr = rotDeg * Math.PI / 180, rc = Math.abs(Math.cos(rr)), rs = Math.abs(Math.sin(rr));
    const ccx = b.x + b.w / 2, ccy = b.y + b.h / 2;
    const w = (b.w + pad * 2) * rc + (b.h + pad * 2) * rs, h = (b.w + pad * 2) * rs + (b.h + pad * 2) * rc;
    const x0 = ccx - w / 2, y0 = ccy - h / 2;
    const ctx = { glows: new Map(), glowOut: [] };
    const rooms = f.rooms.map(r => {
      let m = roomMarkup(r);
      if (r.entity) m = m.replace('<g data-k="room"', '<g class="act" data-k="room"');
      return m;
    }).join('');
    const walls = f.walls.map(wl => wallMarkup(wl, true, { k: 1 })).join('');
    const items = f.items.map(i => itemMarkup(i, ctx)).join('') + ctx.glowOut.join('');
    const defs = [...ctx.glows].map(([col, id]) =>
      `<radialGradient id="${id}"><stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset=".5" stop-color="${col}" stop-opacity=".42"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`).join('');
    const empty = !f.walls.length && !f.rooms.length && !f.items.length && !(f.bg && f.bg.url);
    const tabs = !this._cfg.floor && this._plan.floors.length > 1
      ? `<div class="tabs">${this._plan.floors.map(fl => `<button data-floor="${esc(fl.id)}" class="${fl.id === this._floor ? 'on' : ''}">${esc(fl.name)}</button>`).join('')}</div>` : '';
    const body = empty
      ? '<div class="msg">Der Grundriss ist noch leer. Öffne das Panel „Grundriss“ in der Seitenleiste, um ihn zu zeichnen.</div>'
      : `<svg viewBox="${x0} ${y0} ${w} ${h}" font-family="var(--paper-font-body1_-_font-family, system-ui, sans-serif)"><defs><filter id="fpShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".3"/></filter>${defs}</defs><g transform="rotate(${rotDeg} ${ccx} ${ccy})">${f.bg && f.bg.url ? bgMarkup({ bg: { ...f.bg, locked: true } }) : ''}${rooms}${walls}${items}</g></svg>`;
    root.innerHTML = `<style>${CARD_CSS}</style><ha-card>${head}${tabs}${body}</ha-card>`;
    root.querySelectorAll('.tabs button').forEach(bt => { bt.onclick = () => { this._floor = bt.dataset.floor; this._sig = ''; this._draw(); }; });
    const svg = root.querySelector('svg');
    if (svg) this._bind(svg);
  }

  _bind(svg) {
    svg.addEventListener('pointerdown', e => {
      this._ctx();
      const itg = e.target.closest('[data-k="item"]'), rg = e.target.closest('[data-k="room"]');
      const it = itg && findItem(itg.dataset.id);
      clearTimeout(this._drag && this._drag.timer);
      if (it && (it.entity || it.tap === 'service')) {
        const d = this._drag = { t: 'item', id: it.id, sx: e.clientX, sy: e.clientY, moved: false, long: false };
        d.timer = setTimeout(() => { if (this._drag === d && !d.moved) { d.long = true; this._ctx(); const cur = findItem(d.id); if (cur) onItemTap(cur, true); } }, 550);
      } else if (rg && findRoom(rg.dataset.id) && findRoom(rg.dataset.id).entity) {
        this._drag = { t: 'room', id: rg.dataset.id, sx: e.clientX, sy: e.clientY, moved: false };
      } else this._drag = null;
    });
    svg.addEventListener('pointermove', e => {
      const d = this._drag;
      if (d && !d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 8) { d.moved = true; clearTimeout(d.timer); }
    });
    const end = e => {
      const d = this._drag; this._drag = null;
      if (!d) return;
      clearTimeout(d.timer);
      if (e.type === 'pointercancel' || d.moved || d.long) return;
      this._ctx();
      if (d.t === 'item') { const it = findItem(d.id); if (it) onItemTap(it, false); }
      else { const r = findRoom(d.id); if (r && r.entity) openDetails(r.entity); }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('contextmenu', e => { if (e.target.closest('[data-k="item"]')) e.preventDefault(); });
  }
}

function normalizeSafe(p) { try { return normalize(p); } catch (_) { return null; } }

if (!customElements.get('floorplan-studio-card')) customElements.define('floorplan-studio-card', FloorplanStudioCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'floorplan-studio-card')) {
  window.customCards.push({ type: 'floorplan-studio-card', name: 'Floorplan Studio', description: 'Zeigt deinen gezeichneten Grundriss live mit allen Komponenten.', preview: false });
}

})();