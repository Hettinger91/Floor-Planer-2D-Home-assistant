/* Floorplan Studio Karte – GENERIERT von tools/build_card.py, nicht von Hand ändern. */
(function () {
'use strict';
/* ---- i18n.js ---- */
// Übersetzung zur Laufzeit: Die Oberfläche ist deutsch geschrieben; Texte (Textknoten, title,
// placeholder, aria-label) werden anhand von i18n/<sprache>.json ersetzt. Schlüssel = deutscher
// Text; „{}“ steht für Platzhalter (Zahlen, Namen).
const FPI = (() => {
  const NAMES = { de: 'Deutsch', en: 'English', 'de-CH': 'Schwiizerdütsch', fr: 'Français', zh: '中文', ja: '日本語', nl: 'Nederlands', da: 'Dansk', fi: 'Suomi', pl: 'Polski', ru: 'Русский', it: 'Italiano', es: 'Español', pt: 'Português', sv: 'Svenska', hi: 'हिन्दी' };
  let lang = 'de', dict = null, pats = [], base = '';
  const roots = new Set(), orig = new WeakMap(), obsList = [], missing = new Set(), listeners = [];
  const DOT = { en: 1, zh: 1, ja: 1, hi: 1, 'de-CH': 1 };
  const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  function norm(l) {
    l = String(l || '').trim().replace('_', '-');
    if (!l || l === 'auto') return '';
    if (/^(gsw|de-ch)/i.test(l)) return 'de-CH';
    const p = l.toLowerCase().split('-')[0];
    return NAMES[p] ? p : 'en';
  }
  function compile(d) {
    pats = [];
    Object.keys(d).forEach(k => {
      if (k.indexOf('{}') < 0) return;
      const re = new RegExp('^' + k.split('{}').map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+?)') + '$', 's');
      pats.push([re, d[k]]);
    });
  }
  function dec(x) { return DOT[lang] ? x.replace(/,/g, '.') : x; }
  function trCap(v) { const r = dict[v]; return r != null ? r : (/^\d[\d,.]*$/.test(v) ? dec(v) : v); }
  function tr(s) {
    if (!dict || typeof s !== 'string') return s;
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/); const t = m[2];
    if (!t) return s;
    let r = dict[t];
    if (r == null) {
      for (const [re, out] of pats) { const mm = t.match(re); if (mm) { let i = 1; r = out.replace(/\{\}/g, () => { const v = mm[i++]; return v == null ? '' : trCap(v); }); break; } }
    }
    if (r == null) { const d = t.match(/^(.+?) \((\d[\d,]*×\d[\d,]*) m\)$/); if (d && dict[d[1]] != null) r = dict[d[1]] + ' (' + dec(d[2]) + ' m)'; }
    if (r == null) { if (/[A-Za-zÄÖÜäöüß]{3,}/.test(t)) missing.add(t); return s; }
    return m[1] + r + m[3];
  }
  function textNode(n) {
    const o = orig.get(n); if (o && n.data === o.tr) { const v = tr(o.src); if (v !== o.tr) { o.tr = v; n.data = v; } return; }
    const v = tr(n.data); if (v !== n.data) { orig.set(n, { src: n.data, tr: v }); n.data = v; } else if (o) orig.delete(n);
  }
  function attrs(el) {
    for (const a of ATTRS) {
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      const key = a + '\u0001', cur = el.getAttribute(a); let o = orig.get(el); o = o && o[key] ? o : null;
      if (o && o[key].tr === cur) { const v = tr(o[key].src); if (v !== cur) { o[key].tr = v; el.setAttribute(a, v); } continue; }
      const v = tr(cur); if (v !== cur) { const m = orig.get(el) || {}; m[key] = { src: cur, tr: v }; orig.set(el, m); el.setAttribute(a, v); }
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (SKIP[root.nodeName]) return; attrs(root); }
    const w = document.createTreeWalker(root, 5, { acceptNode: n => n.nodeType === 1 && SKIP[n.nodeName] ? 2 : 1 });
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) textNode(n); else attrs(n); }
  }
  function apply(root) { if (!dict) return; walk(root); }
  function observe(root) {
    if (!root || roots.has(root)) return; roots.add(root);
    const mo = new MutationObserver(ms => {
      if (!dict) return;
      for (const m of ms) {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') attrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    });
    mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    obsList.push(mo); if (dict) walk(root);
  }
  async function setLang(l, b) {
    if (b != null) base = b;
    const n = norm(l) || 'de';
    if (n === lang && (dict || n === 'de')) return n;
    lang = n;
    try { document.documentElement.lang = n === 'de-CH' ? 'gsw' : n; } catch (_) { /* egal */ }
    if (n === 'de') { dict = null; pats = []; }
    else {
      try { const r = await fetch(base + 'i18n/' + n + '.json'); dict = r.ok ? await r.json() : null; } catch (_) { dict = null; }
      if (dict) compile(dict); else pats = [];
    }
    roots.forEach(r => walk(r)); listeners.forEach(f => { try { f(n); } catch (_) { /* egal */ } });
    return n;
  }
  return { NAMES, norm, tr, apply, observe, setLang, get lang() { return lang; }, get missing() { return [...missing]; }, onChange: f => listeners.push(f), setBase: b => { base = b; } };
})();
try { window.__fpi = FPI; } catch (_) { /* egal */ }

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
  lang: 'auto',
  grid: 25, snap: true, showGrid: true, showDims: true, showArea: true, showRoomNames: true,
  labelSize: 20, wallThickness: 15, wallColor: '', roomOpacity: 0.28, itemShadow: true, symStyle: 'b', viewRot: 0, unit: 'm', wallH3: 250, look3d: 'auto', walls3d: 'auto', all3d: false, theme: 'auto',
  pollSec: 4, rectWalls: true, liveTap: 'toggle',
};

// Farben je Kategorie
const CF = '#d7ccc8', CA = '#cfd8dc', CW = '#b3e5fc', CH = '#ffccbc', CS = '#c5e1a5', CB = '#eceff1';

function T(cat, id, name, icon, w, h, color, o = {}) {
  return { cat, id, name, icon, w, h, color, leaves: o.leaves || 0, shape: o.shape || 'rect', glow: !!o.glow, hint: o.hint || '', wall: !!o.wall };
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

  T('Licht', 'lamp_pendant', 'Pendelleuchte', '🏮', 40, 40, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'chandelier', 'Kronleuchter', '🕯️', 60, 60, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_table', 'Tischlampe', '💡', 22, 22, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_desk', 'Schreibtischlampe', '💡', 20, 20, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_night', 'Nachtlicht', '🌙', 12, 12, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_mirror', 'Spiegelleuchte', '✨', 60, 10, CB, { glow: true, hint: 'light' }),
  T('Licht', 'light_panel', 'LED-Panel', '⬜', 60, 60, CB, { glow: true, hint: 'light' }),
  T('Licht', 'lamp_bulb', 'Smarte Glühbirne', '💡', 10, 10, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Garten', 'lamp_outdoor', 'Außenleuchte', '🏮', 22, 22, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Garten', 'lamp_garden', 'Gartenleuchte', '🌿', 15, 15, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Möbel', 'sofa_corner', 'Ecksofa', '🛋️', 250, 180, CF),
  T('Möbel', 'sofa_2', '2er-Sofa', '🛋️', 150, 90, CF),
  T('Möbel', 'stool', 'Hocker', '🪑', 40, 40, CF, { shape: 'ellipse' }),
  T('Möbel', 'bench', 'Sitzbank', '🪑', 120, 40, CF),
  T('Möbel', 'table_side', 'Beistelltisch', '', 45, 45, CF, { shape: 'ellipse' }),
  T('Möbel', 'table_round', 'Runder Tisch', '🍽️', 110, 110, CF, { shape: 'ellipse' }),
  T('Möbel', 'table_bar', 'Bartisch', '🍸', 140, 60, CF),
  T('Möbel', 'sideboard', 'Sideboard', '🗄️', 180, 45, CF),
  T('Möbel', 'wall_unit', 'Schrankwand', '🗄️', 300, 50, CF),
  T('Möbel', 'bookcase', 'Bücherregal', '📚', 80, 30, CF),
  T('Möbel', 'nightstand', 'Nachttisch', '', 45, 40, CF),
  T('Möbel', 'vanity', 'Frisiertisch', '🪞', 100, 45, CF),
  T('Möbel', 'wardrobe_sliding', 'Schiebetürenschrank', '👔', 250, 65, CF),
  T('Möbel', 'coat_rack', 'Garderobe', '🧥', 100, 30, CF),
  T('Möbel', 'shoe_rack', 'Schuhschrank', '👟', 80, 30, CF),
  T('Möbel', 'bed_bunk', 'Hochbett', '🛏️', 90, 200, CF),
  T('Möbel', 'crib', 'Babybett', '🍼', 60, 120, CF),
  T('Möbel', 'changing', 'Wickelkommode', '🍼', 90, 70, CF),
  T('Möbel', 'highchair', 'Hochstuhl', '🪑', 50, 50, CF),
  T('Möbel', 'desk_corner', 'Eckschreibtisch', '🖥️', 160, 140, CF),
  T('Möbel', 'office_chair', 'Bürostuhl', '🪑', 60, 60, CF, { shape: 'ellipse' }),
  T('Möbel', 'piano', 'Klavier', '🎹', 150, 60, CF),
  T('Möbel', 'mirror', 'Spiegel', '🪞', 60, 5, CF),
  T('Möbel', 'daybed', 'Gästebett / Schlafsofa', '🛏️', 140, 200, CF),
  T('Möbel', 'recliner', 'Relaxsessel', '🛋️', 85, 95, CF),
  T('Möbel', 'ottoman', 'Sitzpuff', '', 50, 50, CF, { shape: 'ellipse' }),
  T('Möbel', 'cabinet', 'Schrank', '🗄️', 90, 45, CF),
  T('Möbel', 'tv_stand', 'TV-Wand / Lowboard', '📺', 200, 45, CF),
  T('Möbel', 'bar_stool', 'Barhocker', '🪑', 38, 38, CF, { shape: 'ellipse' }),
  T('Küche & Bad', 'kitchen_island', 'Kücheninsel', '🍽️', 180, 90, CA),
  T('Küche & Bad', 'counter', 'Arbeitsplatte / Zeile', '', 120, 60, CA),
  T('Küche & Bad', 'cabinet_base', 'Unterschrank', '', 60, 60, CA),
  T('Küche & Bad', 'cabinet_wall', 'Oberschrank', '', 60, 35, CA),
  T('Küche & Bad', 'oven', 'Backofen', '♨️', 60, 60, CA),
  T('Küche & Bad', 'microwave', 'Mikrowelle', '📦', 45, 35, CA),
  T('Küche & Bad', 'hood', 'Dunstabzug', '🌀', 60, 50, CA),
  T('Küche & Bad', 'freezer', 'Gefrierschrank', '🧊', 60, 65, CA),
  T('Küche & Bad', 'fridge_side', 'Side-by-Side-Kühlschrank', '🧊', 90, 70, CA),
  T('Küche & Bad', 'coffee', 'Kaffeemaschine', '☕', 25, 35, CA, { hint: 'switch' }),
  T('Küche & Bad', 'kettle', 'Wasserkocher', '♨️', 20, 20, CA, { hint: 'switch' }),
  T('Küche & Bad', 'dryer', 'Trockner', '🧺', 60, 60, CA),
  T('Küche & Bad', 'dishwasher_tall', 'Geschirrspüler (hoch)', '🫧', 60, 60, CA),
  T('Küche & Bad', 'trash', 'Mülleimer', '🗑️', 35, 35, CA),
  T('Küche & Bad', 'pantry', 'Vorratsschrank', '🥫', 60, 50, CA),
  T('Küche & Bad', 'basin_double', 'Doppelwaschbecken', '🚰', 120, 50, CW),
  T('Küche & Bad', 'bidet', 'Bidet', '🚽', 40, 60, CW),
  T('Küche & Bad', 'mirror_cabinet', 'Spiegelschrank', '🪞', 60, 15, CW),
  T('Küche & Bad', 'towel_radiator', 'Handtuchheizkörper', '♨️', 60, 12, CH, { hint: 'climate' }),
  T('Küche & Bad', 'sauna', 'Sauna', '🧖', 200, 200, CW),
  T('Küche & Bad', 'whirlpool', 'Whirlpool', '🛁', 200, 200, CW, { shape: 'ellipse' }),
  T('Küche & Bad', 'water_heater', 'Boiler / Durchlauferhitzer', '🚿', 40, 40, CW, { hint: 'switch' }),
  T('Küche & Bad', 'utility_sink', 'Ausguss / Waschtrog', '🚰', 60, 50, CW),
  T('Küche & Bad', 'washstand', 'Waschtisch', '🚰', 90, 50, CW),
  T('Küche & Bad', 'shower_tray', 'Duschwanne', '🚿', 90, 90, CW),
  T('Küche & Bad', 'shower_walkin', 'Walk-in-Dusche', '🚿', 120, 90, CW),
  T('Küche & Bad', 'toilet_wall', 'Wand-WC', '🚽', 40, 55, CW),
  T('Heizung & Klima', 'floor_heating', 'Fußbodenheizung', '♨️', 100, 100, CH, { hint: 'climate' }),
  T('Heizung & Klima', 'heat_pump', 'Wärmepumpe', '♨️', 120, 80, CH, { hint: 'climate' }),
  T('Heizung & Klima', 'air_purifier', 'Luftreiniger', '🌬️', 30, 30, CH, { shape: 'ellipse', hint: 'fan' }),
  T('Heizung & Klima', 'humidifier', 'Luftbefeuchter', '💧', 25, 25, CH, { shape: 'ellipse', hint: 'humidifier' }),
  T('Heizung & Klima', 'dehumidifier', 'Luftentfeuchter', '💧', 35, 25, CH, { hint: 'humidifier' }),
  T('Heizung & Klima', 'ventilation', 'Lüftungsgerät', '🌀', 60, 60, CH, { hint: 'fan' }),
  T('Heizung & Klima', 'fan_ceiling', 'Deckenventilator', '🌀', 100, 100, CH, { shape: 'ellipse', hint: 'fan' }),
  T('Heizung & Klima', 'pellet', 'Pelletofen', '🔥', 60, 60, CH),
  T('Heizung & Klima', 'water_tank', 'Pufferspeicher', '🛢️', 80, 80, CH, { shape: 'ellipse' }),
  T('Heizung & Klima', 'heater_elec', 'Heizlüfter / Heizstrahler', '♨️', 30, 25, CH, { hint: 'switch' }),
  T('Heizung & Klima', 'heat_valve', 'Heizkörperventil', '🌡️', 12, 12, CH, { shape: 'ellipse', hint: 'climate' }),
  T('Heizung & Klima', 'heat_dist', 'Heizkreisverteiler', '♨️', 60, 20, CH),
  T('Heizung & Klima', 'split_ac', 'Split-Klimagerät', '❄️', 90, 25, CH, { hint: 'climate' }),
  T('Heizung & Klima', 'solar_thermal', 'Solarthermie-Station', '☀️', 50, 40, CH),
  T('Heizung & Klima', 'chimney_stove', 'Kaminofen', '🔥', 60, 50, CH),
  T('Smart Home', 'plug', 'Zwischenstecker', '🔌', 12, 12, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'dimmer', 'Dimmer', '🎚️', 14, 14, CS, { shape: 'ellipse', hint: 'light' }),
  T('Smart Home', 'button', 'Taster / Knopf', '🔘', 12, 12, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'scene_switch', 'Szenentaster', '🔘', 14, 14, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'remote', 'Fernbedienung', '🎛️', 10, 18, CS),
  T('Smart Home', 'wall_tablet', 'Wand-Tablet / Display', '📱', 25, 16, CS),
  T('Smart Home', 'hub', 'Hub / Gateway', '📡', 15, 15, CS, { shape: 'ellipse' }),
  T('Smart Home', 'sensor_presence', 'Präsenzsensor', '👁️', 14, 14, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'sensor_lux', 'Helligkeitssensor', '☀️', 14, 14, CS, { shape: 'ellipse', hint: 'sensor' }),
  T('Smart Home', 'sensor_co2', 'CO₂-/Luftqualitätssensor', '🌫️', 16, 16, CS, { shape: 'ellipse', hint: 'sensor' }),
  T('Smart Home', 'sensor_leak', 'Wassermelder', '💧', 14, 14, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'sensor_vibr', 'Vibrationssensor', '〰️', 12, 12, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'sensor_co', 'CO-Melder', '🚨', 16, 16, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'sensor_gas', 'Gasmelder', '🚨', 16, 16, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'glassbreak', 'Glasbruchmelder', '🚨', 14, 14, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'siren', 'Sirene', '🚨', 16, 16, CS, { shape: 'ellipse' }),
  T('Smart Home', 'doorbell_cam', 'Video-Türklingel', '🔔', 14, 22, CS, { hint: 'camera' }),
  T('Smart Home', 'camera_ptz', 'Schwenk-Kamera', '📹', 20, 20, CS, { shape: 'ellipse', hint: 'camera' }),
  T('Smart Home', 'garage_opener', 'Garagentorantrieb', '🚪', 30, 20, CS, { hint: 'cover' }),
  T('Smart Home', 'curtain_motor', 'Vorhangmotor', '🪟', 150, 8, CS, { hint: 'cover' }),
  T('Smart Home', 'awning', 'Markise', '⛱️', 300, 25, CS, { hint: 'cover' }),
  T('Smart Home', 'shutter_outdoor', 'Raffstore', '🪟', 120, 10, CS, { hint: 'cover' }),
  T('Smart Home', 'smart_meter', 'Smart Meter', '⚡', 30, 20, CS, { hint: 'sensor' }),
  T('Smart Home', 'inverter', 'Solar-Wechselrichter', '☀️', 40, 25, CS, { hint: 'sensor' }),
  T('Smart Home', 'battery', 'Batteriespeicher', '🔋', 50, 25, CS, { hint: 'sensor' }),
  T('Smart Home', 'heat_meter', 'Wärmemengenzähler', '🌡️', 25, 20, CS, { hint: 'sensor' }),
  T('Smart Home', 'water_meter', 'Wasserzähler', '💧', 25, 20, CS, { hint: 'sensor' }),
  T('Garten', 'weather', 'Wetterstation', '🌦️', 20, 20, CS, { shape: 'ellipse', hint: 'sensor' }),
  T('Garten', 'irrigation', 'Bewässerungsventil', '💧', 16, 16, CS, { shape: 'ellipse', hint: 'valve' }),
  T('Garten', 'pool_pump', 'Poolpumpe', '🌊', 40, 30, CS, { hint: 'switch' }),
  T('Smart Home', 'smart_tv', 'Smart-TV', '📺', 120, 8, CS, { hint: 'media_player' }),
  T('Smart Home', 'soundbar', 'Soundbar', '🔊', 100, 10, CS, { hint: 'media_player' }),
  T('Smart Home', 'smart_speaker', 'Smart Speaker', '🔊', 15, 15, CS, { shape: 'ellipse', hint: 'media_player' }),
  T('Smart Home', 'led_ctrl', 'LED-Controller', '💡', 15, 10, CS, { hint: 'light' }),
  T('Smart Home', 'zigbee_router', 'Zigbee-Router', '📶', 14, 14, CS, { shape: 'ellipse' }),
  T('Smart Home', 'ble_proxy', 'Bluetooth-Proxy', '📶', 14, 14, CS, { shape: 'ellipse' }),
  T('Smart Home', 'esp', 'ESP-/DIY-Gerät', '🧩', 18, 12, CS),
  T('Smart Home', 'alarm_panel', 'Alarmzentrale', '🛡️', 20, 15, CS, { hint: 'alarm_control_panel' }),
  T('Smart Home', 'keypad', 'Codeschloss / Keypad', '🔢', 12, 16, CS),
  T('Smart Home', 'fingerprint', 'Fingerprint-Leser', '☝️', 12, 12, CS, { shape: 'ellipse', hint: 'lock' }),
  T('Smart Home', 'mailbox_sensor', 'Briefkasten-Sensor', '📬', 14, 14, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'pet_feeder', 'Futterautomat', '🐾', 25, 25, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'nas', 'NAS / Server', '🗄️', 20, 30, CS),
  T('Smart Home', 'pc', 'PC / Rechner', '🖥️', 20, 45, CS),
  T('Smart Home', 'ups', 'USV', '🔋', 25, 35, CS, { hint: 'sensor' }),
  T('Smart Home', 'knx', 'KNX-/Aktor-Verteilung', '🧰', 60, 20, CS),
  T('Smart Home', 'ir_blaster', 'IR-Sender', '📡', 12, 12, CS, { shape: 'ellipse' }),
  T('Smart Home', 'smart_valve', 'Wasser-Hauptventil', '🚰', 16, 16, CS, { shape: 'ellipse', hint: 'valve' }),
  T('Garten', 'rain_sensor', 'Regensensor', '🌧️', 14, 14, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'wind_sensor', 'Windsensor', '🌬️', 14, 14, CS, { shape: 'ellipse', hint: 'sensor' }),
  T('Smart Home', 'window_handle', 'Fenstergriff-Sensor', '🧲', 12, 12, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'radiator_valve', 'Smartes Heizkörperthermostat', '🌡️', 14, 14, CS, { shape: 'ellipse', hint: 'climate' }),
  T('Smart Home', 'smart_blind_ctrl', 'Rollladen-Aktor', '🪟', 16, 16, CS, { shape: 'ellipse', hint: 'cover' }),
  T('Smart Home', 'smart_light_sw', 'Lichtschalter', '💡', 14, 14, CS, { shape: 'ellipse', hint: 'light' }),
  T('Smart Home', 'powerstrip', 'Steckdosenleiste', '🔌', 40, 8, CS, { hint: 'switch' }),
  T('Smart Home', 'thread', 'Thread-Border-Router', '📶', 16, 16, CS, { shape: 'ellipse' }),
  T('Smart Home', 'ev_charger', 'Ladepunkt E-Auto', '🔌', 25, 20, CS, { hint: 'switch' }),
  T('Büro & Medien', 'monitor', 'Monitor', '🖥️', 60, 20, CB),
  T('Büro & Medien', 'printer', 'Drucker', '🖨️', 40, 35, CB),
  T('Büro & Medien', 'printer3d', '3D-Drucker', '🧱', 40, 40, CB),
  T('Büro & Medien', 'server_rack', 'Serverschrank', '🗄️', 60, 80, CB),
  T('Büro & Medien', 'console', 'Spielkonsole', '🎮', 30, 22, CB),
  T('Büro & Medien', 'projector', 'Beamer', '📽️', 30, 25, CB),
  T('Büro & Medien', 'hifi', 'HiFi-Anlage', '🎶', 45, 35, CB),
  T('Büro & Medien', 'aquarium', 'Aquarium', '🐠', 100, 40, CB),
  T('Büro & Medien', 'workbench', 'Werkbank', '🛠️', 150, 60, CB),
  T('Büro & Medien', 'tool_cabinet', 'Werkzeugschrank', '🧰', 60, 50, CB),
  T('Büro & Medien', 'whiteboard', 'Whiteboard / Pinnwand', '📋', 120, 5, CB),
  T('Garten', 'tree_fruit', 'Obstbaum', '🍎', 200, 200, '#a5d6a7', { shape: 'ellipse' }),
  T('Garten', 'tree_conifer', 'Nadelbaum', '🌲', 160, 160, '#81c784', { shape: 'ellipse' }),
  T('Garten', 'palm', 'Palme', '🌴', 150, 150, '#a5d6a7', { shape: 'ellipse' }),
  T('Garten', 'bush_flower', 'Blühstrauch', '🌸', 90, 90, '#f8bbd0', { shape: 'ellipse' }),
  T('Garten', 'planter', 'Pflanzkübel', '🪴', 50, 50, '#bcaaa4', { shape: 'ellipse' }),
  T('Garten', 'raised_bed', 'Hochbeet', '🥬', 120, 80, '#c5e1a5'),
  T('Garten', 'veggie_patch', 'Gemüsebeet', '🥕', 200, 100, '#a1887f'),
  T('Garten', 'meadow', 'Blumenwiese', '🌼', 300, 200, '#dce775'),
  T('Garten', 'rocks', 'Steine / Findlinge', '🪨', 100, 80, '#cfd8dc', { shape: 'ellipse' }),
  T('Garten', 'hedge_corner', 'Hecke (kurz)', '🌿', 120, 50, '#a5d6a7'),
  T('Garten', 'trellis', 'Rankgitter', '🌱', 100, 6, '#bcaaa4'),
  T('Garten', 'vineyard', 'Spalierobst', '🍇', 300, 20, '#c5e1a5'),
  T('Garten', 'pond', 'Gartenteich', '🪷', 250, 180, '#81d4fa', { shape: 'ellipse' }),
  T('Garten', 'fountain', 'Springbrunnen', '⛲', 80, 80, '#b3e5fc', { shape: 'ellipse' }),
  T('Garten', 'birdbath', 'Vogeltränke', '🐦', 40, 40, '#cfd8dc', { shape: 'ellipse' }),
  T('Garten', 'water_tap', 'Außenwasserhahn', '🚰', 14, 14, '#b0bec5', { shape: 'ellipse' }),
  T('Garten', 'hose_reel', 'Schlauchtrommel', '🪢', 40, 30, '#80cbc4'),
  T('Garten', 'cistern', 'Zisterne / Regenspeicher', '💧', 120, 120, '#90a4ae', { shape: 'ellipse' }),
  T('Garten', 'well', 'Brunnen', '🪣', 90, 90, '#bcaaa4', { shape: 'ellipse' }),
  T('Garten', 'stream', 'Bachlauf', '〰️', 300, 60, '#81d4fa'),
  T('Garten', 'greenhouse', 'Gewächshaus', '🪟', 250, 350, '#e0f2f1'),
  T('Garten', 'pergola', 'Pergola', '🏛️', 300, 400, '#d7ccc8'),
  T('Garten', 'gazebo', 'Pavillon', '⛺', 300, 300, '#d7ccc8', { shape: 'ellipse' }),
  T('Garten', 'woodshed', 'Holzlager', '🪵', 200, 80, '#d7ccc8'),
  T('Garten', 'compost', 'Komposter', '♻️', 100, 100, '#a1887f'),
  T('Garten', 'bin_shelter', 'Mülltonnenbox', '🗑️', 200, 80, '#b0bec5'),
  T('Garten', 'playhouse', 'Spielhaus', '🏠', 150, 150, '#ffe0b2'),
  T('Garten', 'chicken_coop', 'Hühnerstall', '🐔', 150, 100, '#ffe0b2'),
  T('Garten', 'rabbit_hutch', 'Kaninchenstall', '🐇', 120, 60, '#ffe0b2'),
  T('Garten', 'doghouse', 'Hundehütte', '🐕', 70, 90, '#ffe0b2'),
  T('Garten', 'hammock', 'Hängematte', '🛌', 100, 250, '#fff59d'),
  T('Garten', 'bench_garden', 'Gartenbank', '🪑', 150, 55, '#d7ccc8'),
  T('Garten', 'chair_garden', 'Gartenstuhl', '💺', 55, 55, '#d7ccc8'),
  T('Garten', 'swing_seat', 'Hollywoodschaukel', '🛋️', 200, 120, '#fff59d'),
  T('Garten', 'slide', 'Rutsche', '🛝', 80, 250, '#ffcc80'),
  T('Garten', 'birdhouse', 'Vogelhaus', '🏡', 25, 25, '#ffe0b2', { shape: 'ellipse' }),
  T('Garten', 'bee_hotel', 'Insektenhotel', '🐝', 30, 12, '#ffe0b2'),
  T('Garten', 'statue', 'Gartenfigur', '🗿', 30, 30, '#cfd8dc', { shape: 'ellipse' }),
  T('Garten', 'outdoor_kitchen', 'Außenküche', '🍳', 200, 70, '#cfd8dc'),
  T('Garten', 'pizza_oven', 'Pizzaofen', '🍕', 80, 80, '#d7ccc8'),
  T('Garten', 'wood_pile', 'Holzstapel', '🪵', 200, 60, '#d7ccc8'),
  T('Garten', 'wheelbarrow', 'Schubkarre', '🛒', 60, 130, '#cfd8dc'),
  T('Garten', 'solar_panel', 'Solarpanel', '☀️', 170, 100, '#90a4ae'),
  T('Garten', 'privacy_screen', 'Sichtschutz', '🧱', 180, 8, '#d7ccc8'),
  T('Garten', 'garden_gate', 'Gartentür', '🚪', 100, 8, '#bcaaa4'),
  T('Garten', 'stone_wall', 'Mauer / Trockenmauer', '🧱', 300, 30, '#bdbdbd'),
  T('Garten', 'edging', 'Rasenkante / Beetrand', '➖', 300, 6, '#9e9e9e'),
  T('Garten', 'path_stone', 'Gartenweg (Platten)', '🟫', 100, 300, '#d7ccc8'),
  T('Garten', 'path_gravel', 'Kiesweg', '▫️', 100, 300, '#e0e0e0'),
  T('Garten', 'stepping_stones', 'Trittsteine', '👣', 100, 220, '#bdbdbd'),
  T('Garten', 'gravel_area', 'Kiesfläche', '▫️', 300, 200, '#eeeeee'),
  T('Garten', 'patio', 'Pflasterfläche', '🟫', 400, 300, '#cfd8dc'),
  T('Garten', 'deck', 'Holzdeck', '🟫', 400, 300, '#d7b98e'),
  T('Garten', 'lamp_solar', 'Solarleuchte', '🔆', 14, 14, '#fff9c4', { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Garten', 'lamp_post', 'Mastleuchte', '💡', 24, 24, '#fff9c4', { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Garten', 'lamp_spike', 'Erdspieß-Strahler', '🔦', 14, 14, '#fff9c4', { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Garten', 'lamp_flood', 'Fluter / Strahler', '🔦', 25, 15, '#fff9c4', { glow: true, hint: 'light' }),
  T('Garten', 'mower_robot', 'Mähroboter', '🤖', 60, 45, '#a5d6a7'),
  T('Garten', 'mower_station', 'Mäh-Ladestation', '🔌', 40, 30, '#a5d6a7'),
  T('Garten', 'sensor_soil', 'Bodenfeuchtesensor', '🌱', 12, 12, '#c5e1a5', { shape: 'ellipse' }),
  T('Garten', 'sprinkler', 'Rasensprenger', '💦', 16, 16, '#80deea', { shape: 'ellipse' }),
  T('Garten', 'valve_box', 'Ventilbox Bewässerung', '🚿', 40, 30, '#80cbc4'),
  T('Garten', 'pool_robot', 'Poolroboter', '🤖', 50, 40, '#80deea'),
  T('Garten', 'pool_heater', 'Pool-Wärmepumpe', '♨️', 50, 40, '#cfd8dc'),
  T('Garten', 'gate_motor', 'Torantrieb', '⚙️', 30, 20, '#b0bec5'),
  T('Garten', 'cam_garden', 'Garten-Kamera', '📷', 20, 20, '#cfd8dc', { shape: 'ellipse' }),
  T('Garten', 'garden_speaker', 'Garten-Lautsprecher', '🔊', 25, 25, '#b0bec5', { shape: 'ellipse' }),
  T('Garten', 'sensor_garden_motion', 'Außen-Bewegungsmelder', '🚶', 16, 16, '#cfd8dc', { shape: 'ellipse' }),
  T('Außen & Garage', 'car', 'Auto', '🚗', 180, 450, '#cfd8dc'),
  T('Außen & Garage', 'carport', 'Stellplatz / Carport', '🅿️', 280, 520, '#eceff1'),
  T('Außen & Garage', 'garage_door', 'Garagentor', '🚪', 250, 15, CB, { shape: 'door', wall: true }),
  T('Außen & Garage', 'bike', 'Fahrrad / Ständer', '🚲', 60, 180, CB),
  T('Garten', 'terrace_table', 'Gartentisch', '🍽️', 150, 90, CF),
  T('Garten', 'lounger', 'Sonnenliege', '🏖️', 70, 190, CF),
  T('Garten', 'grill', 'Grill', '🍖', 60, 45, CA),
  T('Garten', 'pool', 'Pool', '🏊', 300, 600, '#b3e5fc'),
  T('Garten', 'hot_tub', 'Außen-Whirlpool', '♨️', 200, 200, '#b3e5fc', { shape: 'ellipse' }),
  T('Garten', 'tree', 'Baum', '🌳', 150, 150, '#a5d6a7', { shape: 'ellipse' }),
  T('Garten', 'bush', 'Busch', '🌿', 80, 80, '#c8e6c9', { shape: 'ellipse' }),
  T('Garten', 'hedge', 'Hecke', '🌿', 300, 50, '#a5d6a7'),
  T('Garten', 'fence', 'Zaun', '', 300, 6, '#8d6e63'),
  T('Garten', 'flowerbed', 'Beet', '🌷', 200, 80, '#c5e1a5'),
  T('Garten', 'lawn', 'Rasenfläche', '', 400, 300, '#c8e6c9'),
  T('Garten', 'mailbox', 'Briefkasten', '📬', 30, 20, CB),
  T('Garten', 'gate', 'Gartentor', '🚪', 120, 10, CB),
  T('Garten', 'shed', 'Gartenhaus', '🏠', 250, 200, CF),
  T('Garten', 'trash_bin', 'Mülltonne', '🗑️', 60, 70, '#b0bec5'),
  T('Garten', 'rain_barrel', 'Regentonne', '🛢️', 60, 60, '#b0bec5', { shape: 'ellipse' }),
  T('Garten', 'sandbox', 'Sandkasten', '🏖️', 120, 120, '#ffe0b2'),
  T('Garten', 'trampoline', 'Trampolin', '🤸', 300, 300, '#cfd8dc', { shape: 'ellipse' }),
  T('Garten', 'swing', 'Schaukel', '🛝', 200, 150, CF),
  T('Garten', 'terrace', 'Terrasse (Platten 40 cm)', '', 400, 300, '#d7ccc8'),
  T('Garten', 'terrace_slabs', 'Terrasse (Großplatten 60 cm)', '', 420, 300, '#d7ccc8'),
  T('Garten', 'terrace_stone', 'Terrasse (Naturstein)', '', 400, 300, '#d7ccc8'),
  T('Garten', 'gazebo_round', 'Pavillon rund', '⛺', 320, 320, '#d7ccc8', { shape: 'ellipse' }),
  T('Garten', 'gazebo_wood', 'Pavillon Holz', '🛖', 360, 300, '#d7ccc8'),
  T('Garten', 'fountain_tiered', 'Zierbrunnen (Etagen)', '⛲', 140, 140, '#b3e5fc', { shape: 'ellipse', hint: 'switch' }),
  T('Garten', 'wall_fountain', 'Wandbrunnen', '⛲', 80, 40, '#b3e5fc', { hint: 'switch' }),
  T('Garten', 'bbq', 'Kugelgrill', '🍖', 70, 60, '#cfd8dc', { shape: 'ellipse' }),
  T('Garten', 'jetty', 'Steg', '', 120, 400, '#d7ccc8'),
  T('Garten', 'bridge_garden', 'Gartenbrücke', '', 110, 300, '#d7ccc8'),
  T('Garten', 'strandkorb', 'Strandkorb', '🏖️', 120, 90, '#ffe0b2'),
  T('Außen & Garage', 'driveway', 'Einfahrt', '', 300, 600, '#cfd8dc'),
  T('Garten', 'firepit', 'Feuerstelle', '🔥', 90, 90, '#ffccbc', { shape: 'ellipse' }),
  T('Garten', 'parasol', 'Sonnenschirm', '⛱️', 200, 200, '#ffe0b2', { shape: 'ellipse' }),
  T('Kinder & Haustiere', 'playmat', 'Spielteppich', '🧸', 150, 150, '#ffe0b2'),
  T('Kinder & Haustiere', 'toy_box', 'Spielzeugkiste', '🧸', 60, 40, CF),
  T('Kinder & Haustiere', 'kid_table', 'Kindertisch', '', 60, 60, CF),
  T('Kinder & Haustiere', 'cat_tree', 'Kratzbaum', '🐈', 60, 60, CF, { shape: 'ellipse' }),
  T('Kinder & Haustiere', 'dog_bed', 'Hundebett', '🐕', 80, 60, '#d7ccc8', { shape: 'ellipse' }),
  T('Kinder & Haustiere', 'litter', 'Katzenklo', '🐈', 40, 50, CB),
  T('Kinder & Haustiere', 'pet_flap', 'Katzenklappe', '🐾', 20, 10, CB),
  T('Kinder & Haustiere', 'cage', 'Käfig / Terrarium', '🐹', 80, 40, CB),
  T('Kinder & Haustiere', 'playpen', 'Laufstall', '🍼', 100, 100, '#ffe0b2'),
  T('Bau & Deko', 'door_sliding', 'Schiebetür', '', 100, 12, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'door_front', 'Haustür', '', 100, 15, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'door_terrace', 'Terrassentür', '', 180, 15, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'window_skylight', 'Dachfenster', '', 80, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'window_small', 'Fenster klein', '', 60, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'window_corner', 'Fensterband', '', 300, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'archway', 'Durchgang', '', 100, 15, CB, { wall: true }),
  T('Bau & Deko', 'stairs_spiral', 'Wendeltreppe', '🪜', 150, 150, CB, { shape: 'ellipse' }),
  T('Bau & Deko', 'elevator', 'Aufzug', '🛗', 110, 140, CB),
  T('Bau & Deko', 'chimney', 'Schornstein', '', 40, 40, '#b0bec5'),
  T('Bau & Deko', 'pillar_round', 'Säule rund', '', 30, 30, '#b0bec5', { shape: 'ellipse' }),
  T('Bau & Deko', 'curtain', 'Vorhang', '', 150, 8, '#e1bee7'),
  T('Bau & Deko', 'painting', 'Bild / Gemälde', '🖼️', 80, 4, CB),
  T('Bau & Deko', 'rug_round', 'Teppich rund', '', 160, 160, '#e1bee7', { shape: 'ellipse' }),
  T('Bau & Deko', 'plant_big', 'Große Pflanze', '🪴', 60, 60, '#c8e6c9', { shape: 'ellipse' }),
  T('Bau & Deko', 'plant_small', 'Kleine Pflanze', '🌱', 25, 25, '#c8e6c9', { shape: 'ellipse' }),
  T('Bau & Deko', 'niche', 'Nische / Vorsprung', '', 80, 30, '#cfd8dc'),
  T('Bau & Deko', 'safe', 'Tresor', '🔐', 40, 40, '#b0bec5'),
  T('Bau & Deko', 'fire_ext', 'Feuerlöscher', '🧯', 15, 15, '#ffccbc', { shape: 'ellipse' }),
  T('Bau & Deko', 'electric_panel', 'Sicherungskasten', '⚡', 40, 15, CS),
  T('Bau & Deko', 'cable_duct', 'Kabelschacht', '', 20, 20, '#b0bec5'),

  T('Garten', 'lamp_arc', 'Bogenleuchte', '🪔', 40, 40, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Garten', 'light_string', 'Lichterkette', '✨', 200, 6, CB, { glow: true, hint: 'light' }),
  T('Smart Home', 'outlet_double', 'Doppelsteckdose', '🔌', 28, 14, CS, { hint: 'switch' }),
  T('Smart Home', 'outlet_usb', 'USB-Steckdose', '🔌', 16, 16, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Garten', 'outlet_outdoor', 'Außensteckdose', '🔌', 16, 16, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'outlet_floor', 'Bodensteckdose', '🔌', 16, 16, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'outlet_smart', 'Smarte Steckdose', '🔌', 16, 16, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'outlet_cee', 'Herd-/Starkstromanschluss', '⚡', 18, 18, CS, { shape: 'ellipse' }),
  T('Smart Home', 'switch_double', 'Doppelschalter', '🎚️', 16, 16, CS, { hint: 'switch' }),
  T('Smart Home', 'lan_socket', 'LAN-Dose', '🌐', 14, 14, CS),
  T('Smart Home', 'tv_socket', 'Antennen-/TV-Dose', '📺', 14, 14, CS),
  T('Bau & Deko', 'door', 'Tür', '', 90, 15, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'door_double', 'Doppeltür', '', 160, 15, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'window', 'Fenster (einflügelig)', '', 100, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'window_double', 'Fenster doppelflügelig', '', 140, 15, CB, { shape: 'window', wall: true, leaves: 2 }),
  T('Bau & Deko', 'window_double_big', 'Fenster doppelflügelig groß', '', 200, 15, CB, { shape: 'window', wall: true, leaves: 2 }),
  T('Bau & Deko', 'window_big', 'Fenster groß (einflügelig)', '', 200, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'stairs', 'Treppe gerade', '🪜', 100, 260, CB),
  T('Bau & Deko', 'stairs_wide', 'Treppe gerade breit', '🪜', 130, 300, CB),
  T('Bau & Deko', 'stairs_L', 'Treppe L-förmig (Viertelwendel)', '🪜', 200, 200, CB),
  T('Bau & Deko', 'stairs_U', 'Treppe U-förmig (Halbwendel)', '🪜', 200, 280, CB),
  T('Bau & Deko', 'stairs_spiral_small', 'Wendeltreppe klein', '🪜', 120, 120, CB, { shape: 'ellipse' }),
  T('Bau & Deko', 'stairs_outdoor', 'Außentreppe', '🪜', 120, 200, '#d7ccc8'),
  T('Bau & Deko', 'stairs_basement', 'Kellertreppe', '🪜', 90, 260, CB),
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
    icon: t.icon || '', image: t.image || '', imgMode: t.imgMode || 'contain', color: t.color || '', label: '', showLabel: true, entity: '',
    showValue: false, glow: !!t.glow, onColor: '', tap: 'auto', svc: '', svcData: '',
    flipX: false, flipY: false, leaves: t.leaves || 1, iconScale: 1, hint: t.hint || '',
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
  floorlamp: (w, h) => { const r = Math.min(w, h) / 2; return `<circle cx="0" cy="0" r="${r * 0.72}"/><circle cx="0" cy="0" r="${r * 0.22}"/><path d="M0 ${r * 0.22}V${r * 0.72}"/>`; },
  pendant: (w, h) => { const r = Math.min(w, h) / 2; return `<circle cx="0" cy="0" r="${r * 0.62}"/><circle cx="0" cy="0" r="${r * 0.82}" stroke-dasharray="3 3"/><circle cx="0" cy="0" r="${r * 0.12}"/>`; },
  spot: (w, h) => { const r = Math.min(w, h) / 2; let d = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; d += `M${Math.cos(a) * r * 0.55} ${Math.sin(a) * r * 0.55}L${Math.cos(a) * r * 0.85} ${Math.sin(a) * r * 0.85}`; } return `<circle cx="0" cy="0" r="${r * 0.3}"/><path d="${d}"/>`; },
  tablelamp: (w, h) => { const r = Math.min(w, h) / 2; return `<circle cx="0" cy="0" r="${r * 0.62}"/><path d="M${-r * 0.4} ${r * 0.1}Q0 ${-r * 0.5} ${r * 0.4} ${r * 0.1}"/>`; },
  chandelier: (w, h) => { const r = Math.min(w, h) / 2; let c = `<circle cx="0" cy="0" r="${r * 0.18}"/>`; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c += `<circle cx="${Math.cos(a) * r * 0.62}" cy="${Math.sin(a) * r * 0.62}" r="${r * 0.14}"/><path d="M${Math.cos(a) * r * 0.18} ${Math.sin(a) * r * 0.18}L${Math.cos(a) * r * 0.48} ${Math.sin(a) * r * 0.48}"/>`; } return c; },
  bulb: (w, h) => { const r = Math.min(w, h) / 2; return `<circle cx="0" cy="${-r * 0.1}" r="${r * 0.5}"/><path d="M${-r * 0.22} ${r * 0.4}H${r * 0.22}M${-r * 0.16} ${r * 0.58}H${r * 0.16}"/>`; },
  outlet: (w, h) => { const r = Math.min(w, h) / 2; return `<circle cx="0" cy="0" r="${r * 0.62}"/><circle cx="${-r * 0.24}" cy="0" r="${r * 0.08}"/><circle cx="${r * 0.24}" cy="0" r="${r * 0.08}"/><path d="M${-r * 0.1} ${-r * 0.62}V${-r * 0.5}M${r * 0.1} ${-r * 0.62}V${-r * 0.5}"/>`; },
  outlet2: (w, h) => { const r = Math.min(w, h) / 2; return `<circle cx="${-w * 0.2}" cy="0" r="${r * 0.55}"/><circle cx="${w * 0.2}" cy="0" r="${r * 0.55}"/><circle cx="${-w * 0.2 - r * 0.2}" cy="0" r="${r * 0.07}"/><circle cx="${-w * 0.2 + r * 0.2}" cy="0" r="${r * 0.07}"/><circle cx="${w * 0.2 - r * 0.2}" cy="0" r="${r * 0.07}"/><circle cx="${w * 0.2 + r * 0.2}" cy="0" r="${r * 0.07}"/>`; },
  plug: (w, h) => { const r = Math.min(w, h) / 2; return `<rect x="${-r * 0.55}" y="${-r * 0.55}" width="${r * 1.1}" height="${r * 1.1}" rx="${r * 0.2}"/><path d="M${-r * 0.22} ${-r * 0.2}V${r * 0.05}M${r * 0.22} ${-r * 0.2}V${r * 0.05}"/>`; },
  powerstrip: (w, h) => { let c = ''; const n = Math.max(2, Math.floor(w / 12)); for (let i = 0; i < n; i++) c += `<circle cx="${-w / 2 + (i + 0.5) * w / n}" cy="0" r="${Math.min(h * 0.28, w / n * 0.3)}"/>`; return c; },
  switchw: (w, h) => { const r = Math.min(w, h) / 2; return `<rect x="${-r * 0.5}" y="${-r * 0.62}" width="${r}" height="${r * 1.24}" rx="${r * 0.15}"/><path d="M${-r * 0.5} ${r * 0.05}H${r * 0.5}"/>`; },
  dimmer: (w, h) => { const r = Math.min(w, h) / 2; return `<circle cx="0" cy="0" r="${r * 0.6}"/><path d="M0 ${-r * 0.6}V${-r * 0.2}"/>`; },
  button: (w, h) => { const r = Math.min(w, h) / 2; return `<circle cx="0" cy="0" r="${r * 0.55}"/><circle cx="0" cy="0" r="${r * 0.22}"/>`; },
  lan: (w, h) => { const r = Math.min(w, h) / 2; return `<rect x="${-r * 0.55}" y="${-r * 0.45}" width="${r * 1.1}" height="${r * 0.9}" rx="${r * 0.1}"/><path d="M${-r * 0.3} ${r * 0.1}V${r * 0.45}M0 ${r * 0.1}V${r * 0.45}M${r * 0.3} ${r * 0.1}V${r * 0.45}"/>`; },
  spiral: (w, h) => { const r = Math.min(w, h) / 2; let d = ''; for (let i = 0; i < 14; i++) { const a = i * Math.PI * 2 / 14; d += `M${Math.cos(a) * r * 0.16} ${Math.sin(a) * r * 0.16}L${Math.cos(a) * r * 0.94} ${Math.sin(a) * r * 0.94}`; } return `<circle cx="0" cy="0" r="${r * 0.16}"/><path d="${d}"/>`; },
  stairsL: (w, h) => { const c = Math.min(w, h) * 0.4; let d = `M${-w / 2 + c} ${-h / 2}V${h / 2 - c}H${w / 2}M${-w / 2} ${h / 2 - c}H${-w / 2 + c}`; for (let y = -h / 2 + 22; y < h / 2 - c - 4; y += 22) d += `M${-w / 2} ${y}H${-w / 2 + c}`; for (let x = -w / 2 + c + 22; x < w / 2 - 4; x += 22) d += `M${x} ${h / 2 - c}V${h / 2}`; return `<path d="${d}"/>`; },
  stairsU: (w, h) => { const lw = Math.min(w * 0.45, h * 0.3); let d = `M0 ${-h / 2}V${h / 2 - lw}M${-w / 2} ${h / 2 - lw}H${w / 2}`; for (let y = -h / 2 + 22; y < h / 2 - lw - 4; y += 22) d += `M${-w / 2} ${y}H${w / 2}`; return `<path d="${d}"/>`; },
};
const SYMMAP = {
  stairs_spiral: 'spiral', stairs_spiral_small: 'spiral', stairs_L: 'stairsL', stairs_U: 'stairsU', stairs_wide: 'stairs', stairs_outdoor: 'stairs', stairs_basement: 'stairs',
  lamp_floor: 'floorlamp', lamp_arc: 'floorlamp', lamp_pendant: 'pendant', lamp_spot: 'spot', lamp_table: 'tablelamp', lamp_desk: 'tablelamp', lamp_night: 'tablelamp',
  chandelier: 'chandelier', lamp_bulb: 'bulb', lamp_outdoor: 'pendant', lamp_garden: 'floorlamp', light_string: 'strip',
  outlet: 'outlet', outlet_outdoor: 'outlet', outlet_floor: 'outlet', outlet_smart: 'outlet', outlet_usb: 'outlet', outlet_cee: 'outlet', outlet_double: 'outlet2', plug: 'plug', powerstrip: 'powerstrip',
  switch: 'switchw', switch_double: 'switchw', smart_light_sw: 'switchw', dimmer: 'dimmer', button: 'button', scene_switch: 'button', lan_socket: 'lan', tv_socket: 'lan',
  lamp_ceiling: 'lamp', lamp_wall: 'lampwall', lamp_strip: 'strip',
  bed_double: 'bed', bed_single: 'bed', bed_kid: 'bed', sofa: 'sofa', armchair: 'armchair', table_coffee: 'table', table_dining: 'table',
  chair: 'chair', desk: 'desk', wardrobe: 'wardrobe', shelf: 'shelf', dresser: 'dresser', tv_board: 'tv',
  fridge: 'fridge', stove: 'stove', sink_kitchen: 'sink', dishwasher: 'dish', washer: 'washer', bathtub: 'bath', shower: 'shower', toilet: 'toilet', basin: 'sink',
  radiator: 'radiator', ac: 'ac', fan: 'fan', fireplace: 'fireplace', stairs: 'stairs', plant: 'plant', rug: 'rug', pillar: 'pillar',
  sofa_corner: 'sofa', sofa_2: 'sofa', recliner: 'armchair', ottoman: 'chair', stool: 'chair', bench: 'chair', bar_stool: 'chair', highchair: 'chair', office_chair: 'chair',
  table_side: 'table', table_round: 'table', table_bar: 'table', terrace_table: 'table', kid_table: 'table', desk_corner: 'desk', workbench: 'desk',
  sideboard: 'dresser', nightstand: 'dresser', cabinet: 'dresser', changing: 'dresser', tv_stand: 'tv', wall_unit: 'shelf', bookcase: 'shelf', shoe_rack: 'dresser',
  wardrobe_sliding: 'wardrobe', bed_bunk: 'bed', crib: 'bed', daybed: 'bed',
  lamp_mirror: 'lampwall',
  oven: 'stove', hood: 'ac', freezer: 'fridge', fridge_side: 'fridge', dryer: 'washer', dishwasher_tall: 'dish', basin_double: 'sink', washstand: 'sink', utility_sink: 'sink',
  shower_tray: 'shower', shower_walkin: 'shower', toilet_wall: 'toilet', bidet: 'toilet', whirlpool: 'bath', hot_tub: 'bath', sauna: 'rug',
  towel_radiator: 'radiator', fan_ceiling: 'fan', ventilation: 'fan', air_purifier: 'fan', chimney_stove: 'fireplace', pellet: 'fireplace', split_ac: 'ac', heat_pump: 'ac',
  rug_round: 'rug', playmat: 'rug', pillar_round: 'pillar', chimney: 'pillar', plant_big: 'plant', plant_small: 'plant', tree: 'plant', bush: 'plant',
  monitor: 'tv', smart_tv: 'tv',
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
  if (!symStyleKey() || it.image) return '';
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

function newFloor(name, kind) { const f = { id: uid(), name, bg: null, walls: [], rooms: [], items: [] }; if (kind) f.kind = kind; return f; }
// Standard für neue Wände: Garten-Etage = Zaun (dünn, braun)
function wallDef() { const g = typeof curFloor === 'function' && curFloor() && curFloor().kind === 'garden'; return g ? { t: 8, style: 'solid', color: '#8d6e4a' } : { t: S().wallThickness, style: 'solid', color: '' }; }
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

// ---------- Räume ↔ Home-Assistant-Bereiche ----------
function areaList() { try { return (HOST.areas ? HOST.areas() : []) || []; } catch (_) { return []; } }
let _am = null, _amN = -1;
function areaMembers() {
  const n = Object.keys(states).length;
  if (_am && _amN === n) return _am;
  _am = new Map(); _amN = n;
  try { (HOST.entities ? HOST.entities() : []).forEach(e => { if (e.areaId) { if (!_am.has(e.areaId)) _am.set(e.areaId, []); _am.get(e.areaId).push(e.id); } }); } catch (_) { /* egal */ }
  return _am;
}
function areaSummary(areaId) {
  const r = { temp: null, hum: null, co2: null, lights: 0, on: 0, open: 0 };
  (areaMembers().get(areaId) || []).forEach(id => {
    const s = states[id]; if (!s) return;
    const d = domainOf(id), a = s.attributes || {}, dc = a.device_class, v = parseFloat(s.state);
    if (d === 'sensor' && dc === 'temperature' && r.temp == null && isFinite(v)) r.temp = v;
    else if (d === 'sensor' && dc === 'humidity' && r.hum == null && isFinite(v)) r.hum = v;
    else if (d === 'sensor' && dc === 'carbon_dioxide' && r.co2 == null && isFinite(v)) r.co2 = v;
    else if (d === 'light') { r.lights++; if (s.state === 'on') r.on++; }
    else if (d === 'binary_sensor' && ['window', 'door', 'opening', 'garage_door'].includes(dc) && s.state === 'on') r.open++;
    else if (d === 'cover' && ['window', 'door', 'garage', 'gate'].includes(dc) && (s.state === 'open' || s.state === 'opening')) r.open++;
  });
  return r;
}
function areaSummaryText(areaId) {
  const r = areaSummary(areaId), p = [];
  if (r.temp != null) p.push(fmtN(r.temp, 1) + '°');
  if (r.hum != null) p.push(Math.round(r.hum) + '%');
  if (r.co2 != null) p.push('CO₂ ' + Math.round(r.co2));
  if (r.lights) p.push('💡 ' + r.on + '/' + r.lights);
  if (r.open) p.push('🪟 ' + r.open);
  return p.join(' · ');
}
function onRoomTap(room, wantDetails) {
  if (room.entity) { openDetails(room.entity); return; }
  if (room.area && !wantDetails) callService('light', 'toggle', { area_id: room.area });
}

function linkedEntities() {
  const set = new Set();
  plan.floors.forEach(f => {
    f.items.forEach(i => { if (i.entity) set.add(i.entity); if (i.entity2) set.add(i.entity2); });
    f.rooms.forEach(r => { if (r.entity) set.add(r.entity); if (r.area) (areaMembers().get(r.area) || []).forEach(id => { if (/^(light|sensor|binary_sensor|cover)\./.test(id)) set.add(id); }); });
  });
  const w = weatherId(); if (w) set.add(w);
  if (typeof ovlEntities === 'function') ovlEntities().forEach(id => set.add(id));
  if (HOST_HAS('sun.sun')) set.add('sun.sun');
  return [...set];
}
// ---------- Heatmap der Räume (Temperatur / Feuchte / CO₂) ----------
function heatMetric() { const c = window.FP_CARDCFG; const m = (c && c.heat) || (typeof S === 'function' && S().heat) || 'none'; return ['temp', 'hum', 'co2'].includes(m) ? m : 'none'; }
const HEAT_SCALE = {
  temp: [[16, [60, 120, 230]], [20, [70, 190, 200]], [22, [90, 200, 110]], [25, [245, 200, 70]], [29, [235, 80, 60]]],
  hum: [[25, [235, 140, 60]], [40, [200, 210, 90]], [50, [90, 200, 110]], [60, [70, 170, 210]], [75, [60, 90, 220]]],
  co2: [[400, [90, 200, 110]], [800, [200, 210, 90]], [1100, [245, 170, 60]], [1600, [235, 70, 60]]],
};
function heatRgb(m, v) {
  const sc = HEAT_SCALE[m]; if (v <= sc[0][0]) return sc[0][1]; if (v >= sc[sc.length - 1][0]) return sc[sc.length - 1][1];
  for (let i = 1; i < sc.length; i++) if (v <= sc[i][0]) { const [a, ca] = sc[i - 1], [b, cb] = sc[i], t = (v - a) / (b - a); return ca.map((x, k) => Math.round(x + (cb[k] - x) * t)); }
  return sc[0][1];
}
// Farbe (#rrggbb) für den Raum-Bereich oder null
function heatFill(areaId) {
  const m = heatMetric(); if (m === 'none' || !areaId) return null;
  const v = areaSummary(areaId)[m]; if (v == null) return null;
  return '#' + heatRgb(m, v).map(x => x.toString(16).padStart(2, '0')).join('');
}
function heatSig() {
  if (heatMetric() === 'none') return '';
  let sg = ''; plan.floors.forEach(f => f.rooms.forEach(r => { if (r.area) { const v = areaSummary(r.area)[heatMetric()]; if (v != null) sg += r.id + Math.round(v * 2) + ';'; } })); return sg;
}
function HOST_HAS(id) { try { return !!(HOST.states() || {})[id]; } catch (_) { return false; } }
// Wetter-Entität für die Live-Ansicht: Karte/Einstellung, sonst die erste weather.*-Entität.
let _wid = null, _widAt = 0;
function weatherId() {
  const set = (typeof S === 'function' && S().weather3) || window.FP_WEATHER;
  if (set === 'none') return '';
  if (set) return set;
  const now = Date.now(); if (_wid !== null && now - _widAt < 30000) return _wid;
  let all = {}; try { all = HOST.states() || {}; } catch (_) { /* egal */ }
  _wid = Object.keys(all).find(k => k.startsWith('weather.')) || ''; _widAt = now; return _wid;
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

// Öffnungszustand von Fenster/Tür/Tor/Rollladen: { o: 0..1 offen, tilt: gekippt } oder null (keine Daten)
function openInfo(it) {
  const rd = x => {
    if (!x) return null; const st = String(x.state).toLowerCase(), a = x.attributes || {};
    if (st === 'unavailable' || st === 'unknown') return null;
    if (/^(tilt|kipp|gekippt)/.test(st)) return 'tilt';
    if (a.current_position != null && isFinite(a.current_position)) return Math.max(0, Math.min(1, a.current_position / 100));
    if (['open', 'opening', 'on', 'true', 'unlocked'].includes(st)) return 1;
    if (['closed', 'closing', 'off', 'false', 'locked'].includes(st)) return 0;
    return null;
  };
  const v = it.entity ? rd(states[it.entity]) : null, t = it.entity2 ? rd(states[it.entity2]) : null;
  if (v == null && t == null) return null;
  let o = typeof v === 'number' ? v : 0, tilt = v === 'tilt' || (t === 1 || t === 'tilt') && o === 0;
  if (v === 'tilt') o = 0;
  return { o, tilt };
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
// Rollladen/Tor per Ziehen: Position setzen (oder öffnen/schließen, wenn keine Position unterstützt wird)
function coverCommand(it, v) {
  if (!it.entity) return;
  const s = states[it.entity], a = (s && s.attributes) || {}, pos = Math.round(Math.max(0, Math.min(1, v)) * 100);
  if (a.current_position != null || ((a.supported_features | 0) & 4)) return callService('cover', 'set_cover_position', { entity_id: it.entity, position: pos });
  return callService('cover', v > 0.5 ? 'open_cover' : 'close_cover', { entity_id: it.entity });
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
  requestAnimationFrame(() => { rq = false; if (typeof v3Hook === 'function' && v3Hook()) { ovlRefresh(); return; } renderNow(); ovlRefresh(); });
}
function ovlRefresh() {
  try { ovlMount(document.getElementById('stage'), { show: mode === 'live', v3: typeof v3On !== 'undefined' && v3On && typeof v3 !== 'undefined' ? v3 : null }); } catch (e) { /* egal */ }
}

function renderNow() {
  readColors();
  const f = curFloor(), v = V(), live = mode === 'live', { w, h } = stageSize();
  gWorld.setAttribute('transform', `translate(${v.tx} ${v.ty}) rotate(${v.a || 0}) scale(${v.k})`);
  gGrid.innerHTML = live || !S().showGrid ? '' : gridMarkup(v, w, h);
  gBg.innerHTML = gardenBaseMarkup(f) + bgMarkup(f);
  gRooms.innerHTML = f.rooms.map(r => roomMarkup(r)).join('');
  gWalls.innerHTML = f.walls.map(wl => wallMarkup(wl, live, v)).join('');
  const ctx = { glows: new Map(), glowOut: [] };
  gItems.innerHTML = f.items.map(i => itemMarkup(i, ctx)).join('') + ctx.glowOut.join('');
  gDefs.innerHTML = glowDefsMarkup(ctx.glows);
  gOver.innerHTML = live ? '' : overlayMarkup(f, v);
  const empty = !f.walls.length && !f.rooms.length && !f.items.length && !(f.bg && f.bg.url);
  $('#empty').hidden = !(empty && !live && tool === 'select' && !drawing);
  updateStatus();
}

function glowId(map, col, style) { const key = col + '|' + (style || 'soft'); if (!map.has(key)) map.set(key, 'gl' + map.size); return map.get(key); }
const GLOW_STOPS = {
  soft: [[0, .95], [.5, .42], [1, 0]],
  strong: [[0, 1], [.55, .7], [.85, .25], [1, 0]],
  ring: [[0, 0], [.45, .15], [.72, .75], [1, 0]],
  pulse: [[0, .95], [.5, .42], [1, 0]],
};
function glowDefsMarkup(map) {
  return [...map].map(([key, id]) => {
    const i = key.lastIndexOf('|'), col = key.slice(0, i), st = GLOW_STOPS[key.slice(i + 1)] || GLOW_STOPS.soft;
    return `<radialGradient id="${id}">${st.map(([o, a]) => `<stop offset="${o}" stop-color="${col}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
  }).join('');
}

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
  gravel: [30, 30, '<circle cx="5" cy="6" r="2" fill="#000" opacity=".16"/><circle cx="18" cy="9" r="1.6" fill="#fff" opacity=".5"/><circle cx="11" cy="21" r="2.2" fill="#000" opacity=".14"/><circle cx="25" cy="24" r="1.8" fill="#fff" opacity=".45"/><circle cx="23" cy="4" r="1.2" fill="#000" opacity=".18"/>'],
  pavers: [60, 40, '<path d="M0 0H60M0 20H60M0 40H60M0 0V20M30 20V40" stroke="#000" stroke-opacity=".28" stroke-width="1.6" fill="none"/><rect x="2" y="2" width="26" height="16" fill="#fff" opacity=".1"/><rect x="32" y="22" width="26" height="16" fill="#000" opacity=".06"/>'],
  deck: [200, 24, '<path d="M0 0H200M0 12H200M0 24H200" stroke="#3e2a1a" stroke-opacity=".4" stroke-width="1.2" fill="none"/><path d="M60 0V12M140 12V24" stroke="#3e2a1a" stroke-opacity=".35" stroke-width="1"/>'],
  sand: [20, 20, '<circle cx="4" cy="5" r="0.8" fill="#000" opacity=".2"/><circle cx="13" cy="11" r="0.7" fill="#fff" opacity=".5"/><circle cx="8" cy="16" r="0.8" fill="#000" opacity=".18"/>'],
  soil: [20, 20, '<circle cx="5" cy="6" r="1.3" fill="#000" opacity=".3"/><circle cx="14" cy="13" r="1.1" fill="#fff" opacity=".15"/><circle cx="9" cy="17" r="1.4" fill="#000" opacity=".25"/>'],
  water: [60, 30, '<path d="M0 8q7-5 15 0t15 0 15 0 15 0M0 22q7-5 15 0t15 0 15 0 15 0" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" fill="none"/>'],
  concrete: [60, 60, '<circle cx="12" cy="15" r="1.2" fill="#000" opacity=".15"/><circle cx="40" cy="44" r="1.6" fill="#000" opacity=".12"/><circle cx="50" cy="12" r="1" fill="#fff" opacity=".3"/><circle cx="25" cy="50" r="1" fill="#fff" opacity=".3"/>'],
};
const FLOOR_OPTIONS = [['', 'Nur Farbe'], ['wood', 'Holz / Parkett'], ['tile', 'Fliesen'], ['stone', 'Stein / Klinker'], ['carpet', 'Teppich'], ['grass', 'Rasen'], ['concrete', 'Beton'], ['gravel', 'Kies'], ['pavers', 'Pflaster'], ['deck', 'Holzdeck (Terrasse)'], ['sand', 'Sand'], ['soil', 'Erde'], ['water', 'Wasser']];
// Garten-Etage: Rasen-Untergrund + blasser Hausumriss (Orientierung)
function gardenBaseMarkup(f) {
  if (!f || f.kind !== 'garden') return '';
  const d = FLOORS.grass, strip = s => s.replace(/ data-(k|id|t)="[^"]*"/g, '');
  let ghost = '';
  const hf = plan.floors.find(x => x.kind !== 'garden');
  if (hf) ghost = `<g opacity=".4" pointer-events="none">${hf.rooms.map(r => strip(roomMarkup(r))).join('')}${hf.walls.map(w => strip(wallMarkup(w, true, { k: 1 }))).join('')}</g>`;
  return `<pattern id="gardenbase" patternUnits="userSpaceOnUse" width="${d[0]}" height="${d[1]}">${d[2]}</pattern>` +
    `<rect x="-6000" y="-6000" width="14000" height="14000" fill="#d4e8c2" pointer-events="none"/><rect x="-6000" y="-6000" width="14000" height="14000" fill="url(#gardenbase)" pointer-events="none"/>` + ghost;
}
function floorMarkup(r, pts) {
  const d = FLOORS[r.floor];
  if (!d) return '';
  const id = 'fl-' + r.id, sc = r.floorScale > 0 ? r.floorScale : 1;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${d[0]}" height="${d[1]}" patternTransform="scale(${sc}) rotate(${r.floorRot || 0})">${d[2]}</pattern>` +
    `<polygon points="${pts}" fill="url(#${id})" fill-opacity="${['grass', 'concrete', 'gravel', 'sand', 'soil', 'water'].includes(r.floor) ? 0.9 : 1}" pointer-events="none"/>`;
}

function roomMarkup(r) {
  const pts = r.pts.map(p => p.join(',')).join(' ');
  const [cx, cy] = polyCentroid(r.pts), fs = S().labelSize * 1.15, area = polyArea(r.pts) / 10000;
  const lines = [];
  if (S().showRoomNames && r.name) lines.push({ t: r.name, s: fs, c: C.text, o: 1 });
  const val = r.entity ? valueText(r.entity) : '';
  if (val) lines.push({ t: val, s: fs * 0.95, c: C.accent, o: 1 });
  if (r.area && mode === 'live') { const at = areaSummaryText(r.area); if (at) lines.push({ t: at, s: fs * 0.8, c: C.accent, o: 1 }); }
  if (S().showArea) lines.push({ t: fmtN(area, 1) + ' m²', s: fs * 0.72, c: C.text, o: 0.65 });
  const total = lines.reduce((a, l) => a + l.s * 1.25, 0);
  let y = cy - total / 2;
  const txt = lines.map(l => {
    y += l.s * 1.25;
    return `<text x="${cx}" y="${y - l.s * 0.45}" text-anchor="middle" font-size="${l.s}" fill="${l.c}" opacity="${l.o}" font-weight="${l.o === 1 ? 600 : 400}" pointer-events="none" style="user-select:none">${esc(l.t)}</text>`;
  }).join('');
  let col = r.color || '#90caf9', op = r.floor ? Math.max(S().roomOpacity, 0.55) : S().roomOpacity;
  const hc = mode === 'live' && r.area ? heatFill(r.area) : null; if (hc) { col = hc; op = 0.62; }
  return `<g data-k="room" data-id="${r.id}"><polygon points="${pts}" fill="${col}" fill-opacity="${op}" stroke="${col}" stroke-opacity=".6" stroke-width="1" ${NS}/>${floorMarkup(r, pts)}${txt}</g>`;
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

const OPEN_COL = '#fb8c00';
function doorSvg(it) {
  const w = it.w, t = Math.max(it.h, 6), sx = it.flipX ? -1 : 1, sy = it.flipY ? -1 : 1, oi = openInfo(it);
  const base = `<rect x="${-w / 2}" y="${-t / 2 - 1}" width="${w}" height="${t + 2}" fill="${C.canvas}"/>`;
  if (it.type === 'door_sliding' || it.type === 'garage_door') {
    const o = oi ? oi.o : 0, col = oi && o > 0.05 ? OPEN_COL : C.wall, sh = o * w * 0.85, g = it.type === 'garage_door';
    return `<g transform="scale(${sx} 1)">${base}<rect x="${-w / 2 + sh}" y="${-t / 2}" width="${w}" height="${t}" fill="${g ? '#cfd8dc' : '#b3e5fc'}" fill-opacity=".7" stroke="${col}" stroke-width="1.6" ${NS} clip-path="none"/>` +
      (g ? `<line x1="${-w / 2 + sh}" y1="0" x2="${w / 2 + sh}" y2="0" stroke="${col}" stroke-width="1" stroke-dasharray="6 4" ${NS}/>` : '') + '</g>';
  }
  const th = oi ? oi.o * Math.PI / 2 : Math.PI / 2, col = oi && oi.o > 0.05 ? OPEN_COL : C.wall;
  const ex = -w / 2 + w * Math.cos(th), ey = -w * Math.sin(th);
  const arc = !oi || oi.o > 0.05 ? `<path d="M ${-w / 2} ${-w} A ${w} ${w} 0 0 1 ${w / 2} 0 L ${-w / 2} 0 Z" fill="${col}" fill-opacity=".07" stroke="${col}" stroke-width="1.2" stroke-dasharray="${oi ? '5 3' : 'none'}" ${NS}/>` : '';
  return `<g transform="scale(${sx} ${sy})">${base}${arc}<line x1="${-w / 2}" y1="0" x2="${ex}" y2="${ey}" stroke="${col}" stroke-width="3" ${NS}/></g>`;
}
function windowSvg(it) {
  const w = it.w, t = Math.max(it.h, 6), two = Number(it.leaves) === 2, sx = it.flipX ? -1 : 1, oi = openInfo(it);
  const st = oi ? (oi.tilt ? 'tilt' : oi.o > 0.05 ? 'open' : 'closed') : null, hot = st === 'open' || st === 'tilt', col = hot ? OPEN_COL : C.wall;
  const ln = (a, b, c, d, extra = '') => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${col}" stroke-width="1.2" ${NS} ${extra}/>`;
  // Öffnungsdreieck: Spitze am Scharnier, offene Seite am freien Flügelrand
  const swing = (hx, fx) => `<path d="M ${fx} ${-t / 2} L ${hx} 0 L ${fx} ${t / 2}" fill="none" stroke="${col}" stroke-width="${st === 'tilt' ? 1.8 : 1}" stroke-dasharray="${st === 'tilt' ? 'none' : '4 3'}" ${NS}/>`;
  const sash = (hx, dir, lw) => { const th = oi.o * Math.PI / 2; return `<line x1="${hx}" y1="0" x2="${hx + dir * lw * Math.cos(th)}" y2="${-lw * Math.sin(th)}" stroke="${OPEN_COL}" stroke-width="3" ${NS}/>`; };
  let o = `<rect x="${-w / 2}" y="${-t / 2 - 1}" width="${w}" height="${t + 2}" fill="${C.canvas}"/>` +
    `<rect x="${-w / 2}" y="${-t / 2}" width="${w}" height="${t}" fill="${hot ? '#ffe0b2' : '#b3e5fc'}" fill-opacity=".6" stroke="${C.wall}" stroke-width="1.2" ${NS}/>` +
    (st === 'open' ? '' : ln(-w / 2, 0, w / 2, 0));
  if (st === 'closed') return o;
  if (st === 'open') {
    o += two ? sash(-w / 2, 1, w / 2) + sash(w / 2, -1, w / 2) : `<g transform="scale(${sx} 1)">${sash(-w / 2, 1, w)}</g>`;
    return o;
  }
  if (two) o += ln(0, -t / 2, 0, t / 2).replace('stroke-width="1.2"', 'stroke-width="2.4"') + swing(-w / 2, -2) + swing(w / 2, 2);
  else o += `<g transform="scale(${sx} 1)">${swing(-w / 2, w / 2 - 2)}</g>`;
  return o;
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

function labelText(it) {
  const st = it.entity ? states[it.entity] : null;
  const fn = it.labelEnt && st && st.attributes && st.attributes.friendly_name;
  return fn || it.label || '';
}
function valuePos(it) {
  const rad = (it.rot || 0) * Math.PI / 180, hh = Math.abs(it.w / 2 * Math.sin(rad)) + Math.abs(it.h / 2 * Math.cos(rad)), vf = S().labelSize * 0.9;
  return { x: it.x, y: it.y - hh - vf };
}
function labelPos(it) {
  const rad = (it.rot || 0) * Math.PI / 180, hh = Math.abs(it.w / 2 * Math.sin(rad)) + Math.abs(it.h / 2 * Math.cos(rad)), fs = S().labelSize;
  return { x: it.x, y: it.y + hh + fs * 1.05 - fs * 0.3 };
}
function itemMarkup(it, ctx) {
  const s = !ctx.noState && it.entity ? states[it.entity] : null;
  const act = isActive(s), na = s && (s.state === 'unavailable' || s.state === 'unknown');
  const w = it.w, h = it.h, rot = it.rot || 0, isLight = domainOf(it.entity) === 'light';
  let out = '';
  if (act && it.glow && ctx.glows) {
    const gs = ['soft', 'strong', 'ring', 'pulse'].includes(it.glowStyle) ? it.glowStyle : 'soft';
    const col = glowColor(it, s), id = glowId(ctx.glows, col, gs);
    const R = it.glowR > 0 ? it.glowR : Math.max(w, h) * 2.2 + 90, br = s.attributes && s.attributes.brightness != null ? clamp(s.attributes.brightness / 255, 0.35, 1) : 1;
    const str = clamp(it.glowStr > 0 ? it.glowStr : 1, 0.1, 1.5), op = clamp(br * 0.8 * str, 0, 1);
    const glowSvg = `<circle cx="${it.x}" cy="${it.y}" r="${R}" fill="url(#${id})" opacity="${op}" pointer-events="none">` +
      (gs === 'pulse' ? `<animate attributeName="opacity" values="${op};${op * 0.45};${op}" dur="2.4s" repeatCount="indefinite"/>` : '') + '</circle>';
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
  const imgBare = it.image && it.imgMode === 'bare';
  if (imgBare && !['text', 'door', 'window'].includes(it.shape)) body = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="transparent"/>`;
  const imgSvg = it.image && !['text', 'door', 'window'].includes(it.shape)
    ? `<image href="${esc(it.image)}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="${it.imgMode === 'stretch' ? 'none' : 'xMidYMid meet'}" pointer-events="none"/>` : '';
  const sh = S().itemShadow !== false && !imgBare && it.shape !== 'text' && it.shape !== 'door' && it.shape !== 'window' && it.shape !== 'none' ? ' filter="url(#fpShadow)"' : '';
  const cls = 'item' + (it.entity && mode === 'live' ? ' act' : '');
  out += `<g class="${cls}" data-k="item" data-id="${it.id}" transform="translate(${it.x} ${it.y}) rotate(${rot})"${na ? ' opacity=".45"' : ''}><g${sh}>${body}</g>${imgSvg}${symKey ? symDetail(symKey, w, h) : ''}${iconMarkup(it)}</g>`;

  const rad = rot * Math.PI / 180, hh = Math.abs(w / 2 * Math.sin(rad)) + Math.abs(h / 2 * Math.cos(rad)), fs = S().labelSize;
  if (it.shape !== 'text' && it.showLabel && labelText(it)) {
    out += `<text data-k="item" data-id="${it.id}" x="${it.x}" y="${it.y + hh + fs * 1.05}" text-anchor="middle" font-size="${fs}" fill="${C.text}" paint-order="stroke" stroke="${C.canvas}" stroke-width="${fs * 0.22}"${it.labelRot ? ` transform="rotate(${it.labelRot} ${it.x} ${it.y + hh + fs * 1.05 - fs * 0.3})"` : ''} style="user-select:none">${esc(labelText(it))}</text>`;
  }
  if (!ctx.noState && it.entity && it.showValue) {
    const t = valueText(it.entity);
    if (t) {
      const vf = fs * 0.9, tw = t.length * vf * 0.58 + vf * 1.1, cy = it.y - hh - vf * 1.0;
      out += `<g data-k="item" data-id="${it.id}"${it.valueRot ? ` transform="rotate(${it.valueRot} ${it.x} ${cy})"` : ''} style="user-select:none"><rect x="${it.x - tw / 2}" y="${cy - vf * 0.75}" width="${tw}" height="${vf * 1.5}" rx="${vf * 0.75}" fill="${act ? C.accent : C.muted}"/>` +
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

// Auffälliger Dreh-Griff für Bezeichnung / Wert (orange, mit Dreh-Symbol)
function rotHandle(t, x, y, s) {
  return `<circle data-k="h" data-t="${t}" cx="${x}" cy="${y}" r="${11 * s}" fill="#ff9800" stroke="#fff" stroke-width="${2 * s}" ${NS} style="cursor:grab"/>` +
    `<text x="${x}" y="${y}" dy=".36em" text-anchor="middle" font-size="${14 * s}" fill="#fff" font-weight="700" pointer-events="none" ${NS}>↻</text>` +
    `<circle data-k="h" data-t="${t}" cx="${x}" cy="${y}" r="${20 * s}" fill="transparent"/>`;
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
    // Griff zum Drehen der Bezeichnung direkt im Plan
    if (o.shape !== 'text' && o.showLabel && labelText(o)) {
      const L = labelPos(o), lr = (o.labelRot || 0) * Math.PI / 180, rr = Math.max(S().labelSize * 2.2, 40 * s);
      const hx = L.x + Math.sin(lr) * rr, hy = L.y - Math.cos(lr) * rr;
      out += `<line x1="${L.x}" y1="${L.y}" x2="${hx}" y2="${hy}" stroke="${C.accent}" stroke-width="1.2" stroke-dasharray="3 3" pointer-events="none" ${NS}/>` + rotHandle('lrot', hx, hy, s);
    }
    if (o.entity && o.showValue && valueText(o.entity)) {
      const V0 = valuePos(o), vr = (o.valueRot || 0) * Math.PI / 180, rr = Math.max(S().labelSize * 2.6, 46 * s);
      const hx = V0.x + Math.sin(vr) * rr, hy = V0.y - Math.cos(vr) * rr;
      out += `<line x1="${V0.x}" y1="${V0.y}" x2="${hx}" y2="${hy}" stroke="${C.accent}" stroke-width="1.2" stroke-dasharray="3 3" pointer-events="none" ${NS}/>` + rotHandle('vrot', hx, hy, s);
    }
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

// ---------- Blueprint-Stil (2D): reines CSS, überschreibt die Füllungen/Linien des Plans ----------
const BP_CSS = `
.bp svg { background: #0c3f82 !important; }
.bp svg #gridL * , .bp svg #gridL { stroke: #8fc0f5 !important; stroke-opacity: .28 !important; }
.bp svg polygon { fill: #ffffff !important; fill-opacity: .06 !important; stroke: #cfe6ff !important; stroke-opacity: .55 !important; stroke-width: 1.2 !important; }
.bp svg line[pointer-events="none"] { stroke: #eaf4ff !important; }
.bp svg .item :is(rect, ellipse, path, circle, polyline, polygon, line) { fill: #dcecff !important; fill-opacity: .08 !important; stroke: #eaf4ff !important; stroke-opacity: 1 !important; filter: none !important; }
.bp svg .item [fill="none"], .bp svg .item line, .bp svg .item polyline { fill: none !important; }
.bp svg text { fill: #eaf4ff !important; stroke: none !important; }
.bp svg .item g[filter] { filter: none !important; }
`;

/* ---- overlay.js ---- */
// Gemeinsame Live-Übersicht (Editor-Live-Modus + Karte): Alarme, Anwesenheit, Energiefluss,
// Szenen und Tageszeit-Regler (3D „Live“). Alles wird aus den verknüpften HA-Zuständen gebaut.

const OVL_CSS = `
.ovl, .ovb { position: absolute; left: 8px; z-index: 5; font-size: 12px; color: var(--primary-text-color, var(--text, #222)); max-width: calc(100% - 16px); pointer-events: none; }
.ovl { top: 8px; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.ovb { bottom: 8px; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.ovb[hidden], .ovt[hidden] { display: none !important; }
.ovl > *, .ovb > * { pointer-events: auto; }
.ovc { display: flex; gap: 6px; flex-wrap: wrap; }
.oc, .os { border: 1px solid var(--divider-color, var(--line, #ccc)); background: var(--card-background-color, var(--panel, #fff)); color: inherit; border-radius: 16px; padding: 3px 10px; font: inherit; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.18); opacity: .94; }
.oc.on { border-color: var(--primary-color, var(--accent, #03a9f4)); }
.oc.alarm { background: #e5484d; border-color: #e5484d; color: #fff; animation: ovlpulse 1.2s ease-in-out infinite; }
@keyframes ovlpulse { 50% { box-shadow: 0 0 0 5px rgba(229,72,77,.35); } }
.ovp { background: var(--card-background-color, var(--panel, #fff)); border: 1px solid var(--divider-color, var(--line, #ccc)); border-radius: 10px; padding: 8px 10px; box-shadow: 0 2px 8px rgba(0,0,0,.22); max-width: 260px; }
.ovp .row { padding: 2px 0; } .ovp .dim { opacity: .5; } .ovp .red { color: #e5484d; font-weight: 600; }
.ovp svg { width: 220px; height: 150px; display: block; max-height: none; }
.ovp svg text { fill: var(--primary-text-color, var(--text, #222)); font-size: 11px; text-anchor: middle; }
.fl { stroke: var(--secondary-text-color, #888); stroke-width: 2.2; stroke-dasharray: 4 4; opacity: .25; fill: none; }
.fl.on { opacity: 1; stroke: var(--primary-color, var(--accent, #03a9f4)); animation: ovlfl .9s linear infinite; }
.fl.rev { animation-direction: reverse; }
@keyframes ovlfl { to { stroke-dashoffset: -8; } }
.ovs { display: flex; gap: 6px; flex-wrap: wrap; }
.os:active { transform: scale(.96); }
.ovt { display: flex; align-items: center; gap: 6px; background: var(--card-background-color, var(--panel, #fff)); border: 1px solid var(--divider-color, var(--line, #ccc)); border-radius: 16px; padding: 3px 10px; box-shadow: 0 1px 4px rgba(0,0,0,.18); }
.ovt input[type=range] { width: 130px; margin: 0; }
.ovt button { border: 0; background: transparent; color: var(--primary-color, var(--accent, #03a9f4)); font: inherit; cursor: pointer; padding: 0 2px; }
`;

const ALARM_DC = ['smoke', 'gas', 'moisture', 'carbon_monoxide', 'safety', 'problem', 'tamper', 'heat'];
let ovlOpen = '', ovlHour = null, _ovlC = null, _ovlAt = 0;

const ovlEnabled = () => { const c = window.FP_CARDCFG; if (c && c.overlay === false) return false; return !(typeof S === 'function' && plan && S().overlayOff); };
function ovlScenes() {
  const t = String((typeof S === 'function' && plan && S().scenes) || '');
  return t.split(/\n|,/).map(x => x.trim()).filter(Boolean).map(x => { const [id, label] = x.split('|'); return { id: id.trim(), label: (label || '').trim() }; });
}
// Entitäten, die zusätzlich zu den Plan-Verknüpfungen mitgelesen werden müssen
function ovlEntities() {
  if (!plan || !ovlEnabled()) return [];
  const now = Date.now(), s = S(), base = [s.energyPv, s.energyGrid, s.energyBat, s.energyHome, ...ovlScenes().map(x => x.id)].filter(Boolean);
  if (_ovlC && now - _ovlAt < 10000) return base.concat(_ovlC);
  let all = {}; try { all = HOST.states() || {}; } catch (_) { /* egal */ }
  _ovlC = Object.keys(all).filter(id => { const d = id.split('.')[0]; return d === 'person' || (d === 'binary_sensor' && ALARM_DC.includes((all[id].attributes || {}).device_class)); });
  _ovlAt = now;
  return base.concat(_ovlC);
}

const fmtPow = v => v == null ? '–' : Math.abs(v) >= 1000 ? fmtN(v / 1000, 2) + ' kW' : Math.round(v) + ' W';
function ovlModel() {
  const s = S(), m = { alarms: [], persons: [], energy: null, scenes: [] };
  Object.keys(states).forEach(id => {
    const st = states[id], d = id.split('.')[0], a = st.attributes || {};
    if (d === 'binary_sensor' && ALARM_DC.includes(a.device_class) && st.state === 'on') m.alarms.push({ n: a.friendly_name || id, dc: a.device_class });
    else if (d === 'person') m.persons.push({ n: a.friendly_name || id, home: st.state === 'home' });
  });
  if (m.persons.length && m.persons.every(p => !p.home)) {
    let n = 0;
    plan.floors.forEach(f => f.items.forEach(it => { if (it.entity && /^(window|door|sliding|garage|skylight|roof_window|terrace_door)/.test(it.type)) { const o = openInfo(it); if (o && (o.o > 0 || o.tilt)) n++; } }));
    if (n) m.alarms.push({ n: n + ' Fenster/Türen offen, niemand zuhause', dc: 'open' });
  }
  const num = id => { const st = id && states[id]; if (!st) return null; const v = parseFloat(st.state); if (!isFinite(v)) return null; const u = String((st.attributes || {}).unit_of_measurement || 'W'); return /^kW/i.test(u) ? v * 1000 : /^MW/i.test(u) ? v * 1e6 : v; };
  const pv = num(s.energyPv), gr = num(s.energyGrid), bt = num(s.energyBat), hm = num(s.energyHome);
  if (pv != null || gr != null || bt != null || hm != null) {
    const g = gr == null ? null : (s.energyGridInv ? -gr : gr), b = bt == null ? null : (s.energyBatInv ? -bt : bt);
    m.energy = { pv, g, b, home: hm != null ? hm : Math.max(0, (pv || 0) + (g || 0) - (b || 0)) };
  }
  m.scenes = ovlScenes().map(x => { const st = states[x.id], a = (st && st.attributes) || {}; return { id: x.id, n: x.label || a.friendly_name || x.id }; });
  return m;
}

function ovlEnergySvg(e) {
  const T = 10, ln = (x1, y1, x2, y2, on, rev) => `<line class="fl${on ? ' on' : ''}${rev ? ' rev' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const node = (x, y, ico, val, r = 15) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="var(--divider-color, #bbb)" stroke-width="1.5"/><text x="${x}" y="${y + 5}" style="font-size:15px">${ico}</text><text x="${x}" y="${y + r + 13}">${val}</text>`;
  const pvOn = e.pv != null && e.pv > T, gImp = e.g != null && e.g > T, gExp = e.g != null && e.g < -T, bCh = e.b != null && e.b > T, bDis = e.b != null && e.b < -T;
  return `<svg viewBox="0 0 200 150">${ln(30, 28, 100, 70, pvOn, false)}${ln(170, 28, 100, 70, gImp || gExp, gExp)}${ln(30, 112, 100, 70, bCh || bDis, bCh)}` +
    node(30, 28, '☀️', fmtPow(e.pv)) + node(170, 28, '🔌', fmtPow(e.g)) + node(30, 112, '🔋', fmtPow(e.b)) + node(100, 70, '🏠', fmtPow(e.home), 17) + '</svg>';
}

function ovlTopHtml(m) {
  const chips = [];
  if (m.alarms.length) chips.push(`<button class="oc alarm" data-o="a">🚨 ${m.alarms.length}</button>`);
  if (m.persons.length) chips.push(`<button class="oc${ovlOpen === 'p' ? ' on' : ''}" data-o="p">👤 ${m.persons.filter(p => p.home).length}/${m.persons.length}</button>`);
  if (m.energy) chips.push(`<button class="oc${ovlOpen === 'e' ? ' on' : ''}" data-o="e">⚡ ${fmtPow(m.energy.home)}</button>`);
  if (!chips.length) return '';
  let panel = '';
  if (ovlOpen === 'a' && m.alarms.length) panel = m.alarms.map(a => `<div class="row red">${a.dc === 'open' ? '🪟' : '⚠️'} ${esc(a.n)}</div>`).join('');
  else if (ovlOpen === 'p' && m.persons.length) panel = m.persons.map(p => `<div class="row${p.home ? '' : ' dim'}">${p.home ? '🏠' : '🚶'} ${esc(p.n)} · ${p.home ? 'zuhause' : 'unterwegs'}</div>`).join('');
  else if (ovlOpen === 'e' && m.energy) panel = ovlEnergySvg(m.energy);
  return `<div class="ovc">${chips.join('')}</div>${panel ? `<div class="ovp">${panel}</div>` : ''}`;
}

const pad2 = n => String(n).padStart(2, '0');
const hourTxt = h => pad2(Math.floor(h)) + ':' + pad2(Math.round((h % 1) * 60) % 60);
function ovlNowHour() { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }

// Hängt die Übersicht in `host` (position: relative). o = { show, v3 }
function ovlMount(host, o = {}) {
  if (!host || !plan) return;
  let top = host.querySelector(':scope > .ovl'), bar = host.querySelector(':scope > .ovb');
  if (!o.show || !ovlEnabled()) { if (top) top.remove(); if (bar) bar.remove(); return; }
  if (!top) { top = document.createElement('div'); top.className = 'ovl'; host.appendChild(top); }
  if (!bar) { bar = document.createElement('div'); bar.className = 'ovb'; bar.innerHTML = '<div class="ovs"></div><div class="ovt" hidden></div>'; host.appendChild(bar); }
  host._ovlO = o;
  if (!host._ovlBound) {
    host._ovlBound = true;
    host.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-o],[data-scene]'); if (!b) return;
      if (b.dataset.scene) { const id = b.dataset.scene, d = id.split('.')[0]; callService(d, d === 'button' || d === 'input_button' ? 'press' : 'turn_on', { entity_id: id }); return; }
      if (b.dataset.o === 'now') { ovlHour = null; const v = host._ovlO && host._ovlO.v3; if (v && v.setSim) v.setSim((v.opts.sim && v.opts.sim.cond) ? { cond: v.opts.sim.cond } : null); const tt = host.querySelector('.ovt'); if (tt) tt._k = ''; ovlMount(host, host._ovlO); return; }
      ovlOpen = ovlOpen === b.dataset.o ? '' : b.dataset.o; ovlMount(host, host._ovlO);
    });
    host.addEventListener('input', e => {
      const r = e.target.closest && e.target.closest('.ovt input'); if (!r) return;
      ovlHour = Number(r.value); const t = host.querySelector('.ovt span'); if (t) t.textContent = hourTxt(ovlHour);
      const v = host._ovlO && host._ovlO.v3; if (v && v.setSim) v.setSim(Object.assign({}, v.opts.sim || {}, { hour: ovlHour }));
    });
  }
  const m = ovlModel(), th = ovlTopHtml(m);
  if (top._h !== th) { top._h = th; top.innerHTML = th; }
  const sc = m.scenes.map(x => `<button class="os" data-scene="${esc(x.id)}">${esc(x.n)}</button>`).join('');
  const se = bar.querySelector('.ovs'); if (se._h !== sc) { se._h = sc; se.innerHTML = sc; }
  const tm = bar.querySelector('.ovt'), wantT = !!(o.v3 && o.v3.hasEnv && o.v3.hasEnv()), tk = wantT ? 't' : '';
  if (tm._k !== tk) {
    tm._k = tk; tm.hidden = !wantT;
    if (wantT) { const sh = o.v3 && o.v3.opts && o.v3.opts.sim && o.v3.opts.sim.hour != null ? o.v3.opts.sim.hour : null, h = ovlHour != null ? ovlHour : (sh != null ? sh : ovlNowHour()); tm.innerHTML = `🕒 <input type="range" min="0" max="24" step="0.25" value="${h}"><span>${hourTxt(h)}</span><button data-o="now" title="Aktuelle Zeit">Jetzt</button>`; } else tm.innerHTML = '';
  }
  bar.hidden = !(sc || wantT);
}

/* ---- models3d.js ---- */
// ---------- Prozedurale 3D-Modelle (realistische Möbel, Geräte, Smart-Home-Objekte) ----------
// Jedes Modell wird aus einfachen Körpern zusammengesetzt. Ursprung = Mitte der Grundfläche, y = 0 am Boden,
// Rückseite = -z, Vorderseite = +z. Einheit: cm.
const FPM = (() => {
  let T = null, cache = new Map();
  const P = {
    white: '#f1f2f3', offwhite: '#e6e4df', steel: '#b8bdc3', chrome: '#dfe3e8', black: '#202328', dark: '#33373d', grey: '#7d848d', lgrey: '#c7ccd2',
    oak: '#c19a6b', walnut: '#6e4b33', birch: '#dcc29a', pine: '#d8b27a', fabric: '#8d949d', leather: '#5b4636', cream: '#e8dfcf', ceramic: '#f8f9fa',
    green: '#4f8a4a', leaf: '#5d9b52', dgreen: '#3b6e3a', soil: '#5a4331', brick: '#a8553b', stone: '#a9a399', concrete: '#aeb3b9', water: '#4aa8d8',
  };
  function mat(c, r, m, o) {
    r = r == null ? 0.7 : r; m = m || 0;
    const k = c + '|' + r + '|' + m + (o ? JSON.stringify(o) : '');
    let x = cache.get(k);
    if (!x) { x = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, o || {})); cache.set(k, x); }
    return x;
  }
  const glassM = () => mat('#cfe9f7', 0.04, 0.2, { transparent: true, opacity: 0.3, depthWrite: false });
  const mirrorM = () => mat('#dfe8ee', 0.05, 0.9);

  function mk(it, w, d, h, col) {
    const g = new T.Group(), live = [];
    const add = (geo, m, x, y, z, sh) => { const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = sh !== false; me.receiveShadow = true; g.add(me); return me; };
    const b = {
      g, w, d, h, col, it, live, mat, P, glass: glassM, mirror: mirrorM, add,
      box: (W, H, D, x, y, z, m) => add(new T.BoxGeometry(W, H, D), m, x, y + H / 2, z),
      cyl: (rt, rb, H, x, y, z, m, seg) => add(new T.CylinderGeometry(rt, rb, H, seg || 20), m, x, y + H / 2, z),
      sph: (r, x, y, z, m, sx, sy, sz) => { const me = add(new T.SphereGeometry(r, 18, 12), m, x, y, z); me.scale.set(sx || 1, sy || 1, sz || 1); return me; },
      tor: (R, r, x, y, z, m, seg) => add(new T.TorusGeometry(R, r, 8, seg || 24), m, x, y, z),
      // abgerundeter Quader (Mitte unten bei x,y,z)
      rb: (W, H, D, r, x, y, z, m) => {
        r = Math.max(0.2, Math.min(r, W / 2 - 0.1, H / 2 - 0.1, D / 2 - 0.1));
        const sh = new T.Shape(), a = W / 2 - r, c = H / 2 - r;
        sh.moveTo(-a, -c); sh.lineTo(a, -c); sh.lineTo(a, c); sh.lineTo(-a, c); sh.closePath();
        const geo = new T.ExtrudeGeometry(sh, { depth: Math.max(0.1, D - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 2, curveSegments: 1 });
        geo.translate(0, 0, -(D - 2 * r) / 2);
        return add(geo, m, x, y + H / 2, z);
      },
      // leuchtendes / schaltbares Material (reagiert auf den Zustand der Entität)
      lv: (base, on, ei) => {
        const m = new T.MeshStandardMaterial({ color: base, roughness: 0.4, emissive: 0x000000 });
        m.userData.base = new T.Color(base); m.userData.on = on || null; m.userData.ei = ei == null ? 0.9 : ei; live.push(m); return m;
      },
    };
    return b;
  }

  const R = {}; // Typ-ID -> Baufunktion (b)
  const reg = (ids, fn) => ids.split(' ').forEach(i => { if (i) R[i] = fn; });
  const fabricOf = (b, def) => mat(b.col || def || P.fabric, 0.95);

  // ---------- Betten ----------
  function bed(b, o) {
    o = o || {};
    const { w, d, h } = b, wood = mat(o.wood || P.walnut, 0.6), fab = fabricOf(b, o.fab || '#cfd6df'), white = mat('#f4f4f2', 0.9);
    b.box(w, h * 0.38, d, 0, 0, 0, wood);
    b.rb(w - 6, h * 0.42, d - 8, 4, 0, h * 0.34, 3, mat('#f1efe9', 0.95));
    b.box(w, h * 1.45, 6, 0, 0, -d / 2 + 3, wood);
    const n = w > 130 ? 2 : 1, pw = (w - 20) / n - 6;
    for (let i = 0; i < n; i++) b.rb(pw, h * 0.2, 36, 6, (i - (n - 1) / 2) * (pw + 6), h * 0.74, -d / 2 + 30, white);
    if (!o.noDuvet) b.rb(w - 2, h * 0.2, d * 0.62, 6, 0, h * 0.7, d * 0.17, fab);
  }
  reg('bed_double bed_single bed_kid daybed', b => bed(b, b.it.type === 'bed_kid' ? { wood: P.birch, fab: '#9fc5e8' } : b.it.type === 'daybed' ? { wood: P.oak, noDuvet: false } : {}));
  reg('bed_bunk', b => {
    const { w, d, h } = b, wd = mat(P.pine, 0.6);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(6, h, 6, x * (w / 2 - 3), 0, z * (d / 2 - 3), wd));
    [28, h * 0.62].forEach(y => { b.box(w, 6, d, 0, y, 0, wd); b.rb(w - 8, 14, d - 12, 4, 0, y + 6, 0, mat('#f1efe9', 0.95)); });
    b.box(w, 24, 3, 0, h * 0.62 + 6, d / 2 - 2, wd); b.box(w, 24, 3, 0, h * 0.62 + 6, -d / 2 + 2, wd);
    for (let i = 0; i < 5; i++) b.box(w - 14, 2.5, 3, 0, 8 + i * 22, d / 2, wd);
  });
  reg('crib', b => {
    const { w, d, h } = b, wd = mat(P.birch, 0.6);
    b.box(w, 4, d, 0, 18, 0, wd); b.rb(w - 6, 10, d - 6, 3, 0, 22, 0, mat('#f6f4ee', 0.95));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(4, h, 4, x * (w / 2 - 2), 0, z * (d / 2 - 2), wd));
    for (let i = 0; i < 9; i++) { const x = -w / 2 + 6 + i * (w - 12) / 8; b.box(1.6, h - 30, 1.6, x, 28, d / 2 - 2, wd); b.box(1.6, h - 30, 1.6, x, 28, -d / 2 + 2, wd); }
    for (let i = 0; i < 6; i++) { const z = -d / 2 + 6 + i * (d - 12) / 5; b.box(1.6, h - 30, 1.6, w / 2 - 2, 28, z, wd); b.box(1.6, h - 30, 1.6, -w / 2 + 2, 28, z, wd); }
    b.box(w, 3, 3, 0, h - 4, d / 2 - 2, wd); b.box(w, 3, 3, 0, h - 4, -d / 2 + 2, wd);
  });

  // ---------- Sofas & Sessel ----------
  function seat(b, x, z, W, D, o) {
    const { h } = b, f = fabricOf(b, o.fab), arm = o.arm == null ? 14 : o.arm, bh = h, sh = h * 0.45;
    b.rb(W, sh, D, 5, x, 6, z, f);
    const nn = Math.max(1, Math.round((W - 2 * arm) / (o.seatW || 62))), cw = (W - 2 * arm) / nn;
    for (let i = 0; i < nn; i++) {
      b.rb(cw - 1, h * 0.18, D * 0.7, 5, x - (W - 2 * arm) / 2 + cw * (i + 0.5), sh + 3, z + D * 0.12, f);
      b.rb(cw - 1, bh * 0.42, D * 0.22, 6, x - (W - 2 * arm) / 2 + cw * (i + 0.5), sh + 2, z - D / 2 + D * 0.14, f).rotation.x = -0.12;
    }
    if (arm > 0) [-1, 1].forEach(s => b.rb(arm, bh * 0.62, D, 6, x + s * (W / 2 - arm / 2), 6, z, f));
    b.rb(W, bh * 0.85, D * 0.2, 6, x, 6, z - D / 2 + D * 0.1, f);
    if (o.legs !== false) [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => b.cyl(2, 1.6, 8, x + sx * (W / 2 - 6), 0, z + sz * (D / 2 - 6), mat(P.black, 0.4, 0.5), 8));
  }
  reg('sofa sofa_2', b => seat(b, 0, 0, b.w, b.d, {}));
  reg('armchair', b => seat(b, 0, 0, b.w, b.d, { arm: 11, seatW: 60, fab: '#9aa7b4' }));
  reg('recliner', b => { seat(b, 0, 0, b.w, b.d, { arm: 12, fab: P.leather }); b.rb(b.w - 24, 12, b.d * 0.4, 5, 0, 8, b.d / 2 - 10, mat(P.leather, 0.7)); });
  reg('sofa_corner', b => {
    const { w, d } = b, a = d * 0.5;
    seat(b, 0, -d / 2 + a / 2, w, a, { seatW: 64 });
    const cw = w * 0.34; seat(b, w / 2 - cw / 2, a / 2, cw, d - a, { arm: 0, legs: false });
    b.rb(cw - 4, b.h * 0.2, d - a - 6, 5, w / 2 - cw / 2, b.h * 0.45 + 3, a / 2, fabricOf(b));
  });
  reg('ottoman', b => { b.rb(b.w, b.h * 0.8, b.d, 5, 0, 5, 0, fabricOf(b, '#a58d78')); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.cyl(2, 1.5, 6, x * (b.w / 2 - 6), 0, z * (b.d / 2 - 6), mat(P.walnut), 8)); });
  reg('stool bar_stool', b => {
    const bar = b.it.type === 'bar_stool', hh = b.h, r = Math.min(b.w, b.d) / 2;
    b.cyl(r, r, 5, 0, hh - 5, 0, mat(bar ? '#2b2e33' : P.oak, 0.6), 24);
    [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2 + 0.78; const m = b.cyl(1.4, 1.4, hh - 5, Math.cos(a) * r * 0.62, 0, Math.sin(a) * r * 0.62, mat(bar ? P.chrome : P.oak, 0.4, bar ? 0.9 : 0), 8); m.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); });
    if (bar) b.tor(r * 0.55, 0.9, 0, hh * 0.4, 0, mat(P.chrome, 0.3, 0.9)).rotation.x = Math.PI / 2;
  });
  reg('bench', b => {
    const wd = mat(b.col || P.oak, 0.6);
    b.rb(b.w, 5, b.d, 1.5, 0, b.h - 5, 0, wd);
    [-1, 1].forEach(s => b.box(5, b.h - 5, b.d - 4, s * (b.w / 2 - 8), 0, 0, wd));
  });
  reg('highchair', b => {
    const wd = mat(P.birch, 0.6), { w, d, h } = b;
    b.box(w * 0.8, 4, d * 0.7, 0, h * 0.45, 0, wd); b.box(w * 0.8, h * 0.45, 3, 0, h * 0.5, -d * 0.35, wd);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => { const m = b.box(3, h * 0.48, 3, x * w * 0.38, 0, z * d * 0.38, wd); m.rotation.set(z * 0.1, 0, -x * 0.1); });
    b.box(w * 0.8, 3, d * 0.3, 0, h * 0.58, d * 0.3, mat('#ffffff', 0.5));
  });

  // ---------- Tische ----------
  function table(b, o) {
    o = o || {};
    const { w, d, h } = b, top = mat(b.col || o.top || P.oak, 0.55), leg = mat(o.leg || P.walnut, 0.5, o.metal ? 0.8 : 0), th = o.th || 4;
    if (o.round || b.it.shape === 'ellipse') {
      const r = Math.min(w, d) / 2; b.cyl(r, r, th, 0, h - th, 0, top, 32); b.cyl(3, 4, h - th, 0, 0, 0, leg, 12); b.cyl(r * 0.45, r * 0.5, 3, 0, 0, 0, leg, 20);
    } else {
      b.rb(w, th, d, 1.5, 0, h - th, 0, top);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(o.lw || 5, h - th, o.lw || 5, x * (w / 2 - 6), 0, z * (d / 2 - 6), leg));
    }
  }
  reg('table_dining table_coffee table_side table_bar terrace_table kid_table', b => {
    const t = b.it.type;
    table(b, { top: t === 'table_coffee' ? P.walnut : P.oak, leg: t === 'table_bar' ? P.black : P.walnut, metal: t === 'table_bar', lw: t === 'table_side' ? 3 : 6, th: t === 'table_dining' ? 5 : 4 });
    if (t === 'table_dining') { const n = Math.max(2, Math.round(b.w / 55)); for (let i = 0; i < n; i++) [-1, 1].forEach(s => { /* Stühle */ const x = (i - (n - 1) / 2) * 50; chairAt(b, x, s * (b.d / 2 + 14), s > 0 ? Math.PI : 0, 0.9); }); }
    if (t === 'terrace_table') { const n = 3; for (let i = 0; i < n; i++) [-1, 1].forEach(s => chairAt(b, (i - 1) * 50, s * (b.d / 2 + 14), s > 0 ? Math.PI : 0, 0.9)); }
  });
  reg('table_round', b => { table(b, { round: true }); const r = b.w / 2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; chairAt(b, Math.cos(a) * (r + 12), Math.sin(a) * (r + 12), -a - Math.PI / 2, 0.9); } });
  function chairAt(b, x, z, ry, sc) {
    const grp = new T.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; grp.scale.setScalar(sc || 1); b.g.add(grp);
    const wd = mat(P.walnut, 0.55), sf = mat('#b9b4aa', 0.9), tmp = b.g;
    const sub = { __proto__: b, g: grp, add: (geo, m, px, py, pz, sh) => { const me = new T.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = sh !== false; me.receiveShadow = true; grp.add(me); return me; } };
    sub.box = (W, H, D, px, py, pz, m) => sub.add(new T.BoxGeometry(W, H, D), m, px, py + H / 2, pz);
    sub.box(42, 4, 42, 0, 44, 0, sf); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => sub.box(3.5, 44, 3.5, sx * 19, 0, sz * 19, wd));
    sub.box(42, 38, 3, 0, 48, -20, wd); sub.box(34, 24, 1.5, 0, 56, -18.2, sf);
    void tmp;
  }
  reg('chair', b => {
    const wd = mat(b.col || P.walnut, 0.55), sf = mat('#b9b4aa', 0.9), { w, d, h } = b, sh = h * 0.98;
    b.rb(w, 4, d, 1.5, 0, sh - 4, 0, sf); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(3.5, sh - 4, 3.5, x * (w / 2 - 3), 0, z * (d / 2 - 3), wd));
    b.box(w, sh * 0.85, 3, 0, sh, -d / 2 + 2, wd).scale.y = 1; b.box(w - 8, sh * 0.4, 1.5, 0, sh + 5, -d / 2 + 3.6, sf);
  });
  reg('office_chair', b => {
    const bk = mat('#2a2d33', 0.7), { w, d, h } = b, r = Math.min(w, d) / 2;
    b.cyl(2.2, 2.2, h * 0.38, 0, 8, 0, mat(P.steel, 0.3, 0.9), 10);
    for (let i = 0; i < 5; i++) { const a = i * 2 * Math.PI / 5; const m = b.box(r, 3, 4, Math.cos(a) * r / 2, 4, Math.sin(a) * r / 2, bk); m.rotation.y = -a; b.cyl(2.2, 2.2, 3, Math.cos(a) * r * 0.95, 0, Math.sin(a) * r * 0.95, bk, 8); }
    b.rb(r * 1.6, 8, r * 1.6, 3, 0, h * 0.43, 2, bk); b.rb(r * 1.5, h * 0.42, 6, 3, 0, h * 0.5, -r * 0.7, bk).rotation.x = -0.1;
  });
  reg('desk desk_corner workbench', b => {
    const { w, d, h } = b, top = mat(b.col || (b.it.type === 'workbench' ? P.pine : P.birch), 0.5), leg = mat(P.dark, 0.4, 0.6);
    b.rb(w, 4, d, 1.2, 0, h - 4, 0, top);
    if (b.it.type === 'desk_corner') { b.rb(w * 0.4, 4, d, 1.2, w * 0.3, h - 4, 0, top); }
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(4, h - 4, 4, x * (w / 2 - 5), 0, z * (d / 2 - 5), leg));
    if (b.it.type !== 'workbench') { b.box(w * 0.2, h * 0.5, d - 12, w / 2 - w * 0.12 - 4, h * 0.45 - 4, 0, mat(P.white, 0.5)); [0, 1, 2].forEach(i => b.box(w * 0.18, 1, 0.8, w / 2 - w * 0.12 - 4, h * 0.45 + i * 10, d / 2 - 5.6, leg)); }
  });

  // ---------- Schränke ----------
  function cab(b, o) {
    o = o || {};
    const { w, d, h } = b, body = mat(b.col || o.col || P.white, 0.45), grv = mat('#2c2f35', 0.8), hd = mat(P.chrome, 0.3, 0.9), lz = o.legs || 0;
    b.box(w, h - lz, d, 0, lz, 0, body);
    if (lz) [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.cyl(2, 1.6, lz, x * (w / 2 - 5), 0, z * (d / 2 - 5), mat(P.black), 8));
    const doors = o.doors == null ? Math.max(1, Math.round(w / 55)) : o.doors, dr = o.drawers || 0, fh = h - lz - 4;
    const dh = dr ? fh * (o.drawerShare || 0.4) : 0, doorH = fh - dh;
    for (let i = 0; i < doors; i++) {
      const dw = (w - 4) / doors, x = -w / 2 + 2 + dw * (i + 0.5);
      if (doorH > 8) { b.box(dw - 1.2, doorH, 0.8, x, lz + 2, d / 2 + 0.2, mat(b.col || o.col || P.white, 0.4)); b.box(1.2, Math.min(24, doorH * 0.5), 1.6, x + (i % 2 ? -1 : 1) * (dw / 2 - 5), lz + 2 + doorH * 0.5 - 8, d / 2 + 1.6, hd); }
    }
    for (let i = 0; i < dr; i++) {
      const y = lz + 2 + doorH + i * dh / dr; b.box(w - 4, dh / dr - 1, 0.8, 0, y, d / 2 + 0.2, mat(b.col || o.col || P.white, 0.4)); b.box(Math.min(24, w * 0.3), 1.2, 1.6, 0, y + dh / dr * 0.6, d / 2 + 1.6, hd);
    }
    b.cab = { top: h, d };
  }
  reg('wardrobe wardrobe_sliding', b => cab(b, { col: b.it.type === 'wardrobe' ? '#e9e5dd' : '#d9d4ca', doors: Math.max(2, Math.round(b.w / 50)), drawers: 0 }));
  reg('dresser', b => cab(b, { col: P.birch, doors: 0, drawers: 4, drawerShare: 1, legs: 8 }));
  reg('sideboard tv_board tv_stand', b => cab(b, { col: b.it.type === 'sideboard' ? P.white : P.walnut, doors: Math.max(2, Math.round(b.w / 60)), legs: 12 }));
  reg('nightstand', b => cab(b, { col: P.birch, doors: 0, drawers: 2, drawerShare: 1, legs: 10 }));
  reg('cabinet cabinet_base pantry tool_cabinet', b => cab(b, { col: b.it.type === 'tool_cabinet' ? '#c0392b' : b.it.type === 'cabinet' ? P.oak : '#dfe3e6', doors: b.it.type === 'cabinet_base' ? 1 : 2, drawers: b.it.type === 'cabinet_base' ? 1 : 0 }));
  reg('shoe_rack', b => cab(b, { col: P.pine, doors: 2, legs: 8 }));
  reg('wall_unit', b => { cab(b, { col: '#e6e2da', doors: Math.max(3, Math.round(b.w / 55)), drawers: 0 }); });
  reg('changing', b => { cab(b, { col: P.white, doors: 0, drawers: 3, drawerShare: 0.7 }); b.rb(b.w, 5, b.d, 2, 0, b.h - 12, 0, mat('#cfe3ef', 0.8)); });
  reg('vanity', b => { cab(b, { col: P.white, doors: 0, drawers: 2, drawerShare: 1, legs: 10 }); b.rb(b.w * 0.5, 4, b.d * 0.7, 2, 0, b.h, 4, mat(P.ceramic, 0.2)); });
  reg('shelf bookcase', b => {
    const { w, d, h } = b, wd = mat(b.col || P.birch, 0.55), n = Math.max(3, Math.round(h / 38));
    b.box(2.5, h, d, -w / 2 + 1.25, 0, 0, wd); b.box(2.5, h, d, w / 2 - 1.25, 0, 0, wd); b.box(w, h, 1, 0, 0, -d / 2 + 0.5, wd);
    const cols = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#34495e'];
    for (let i = 0; i <= n; i++) {
      const y = i * (h - 2.5) / n; b.box(w, 2.5, d, 0, y, 0, wd);
      if (i < n && i % 2 === 0) { let x = -w / 2 + 5; let k = 0; while (x < w / 2 - 8) { const bw = 2.2 + (k * 7 % 3), bh = 18 + (k * 5 % 9); b.box(bw, bh, d * 0.7, x + bw / 2, y + 2.5, 0, mat(cols[k % cols.length], 0.8)); x += bw + 0.3; k++; if (k % 9 === 8) x += 12; } }
    }
  });
  reg('coat_rack', b => {
    const { w, d, h } = b, wd = mat(P.birch, 0.55);
    b.box(w, h * 0.12, 2.5, 0, h * 0.82, -d / 2 + 2, wd); b.box(w, h * 0.04, 2.5, 0, h * 0.5, -d / 2 + 2, wd);
    for (let i = 0; i < 5; i++) b.cyl(1.2, 1.2, 8, -w / 2 + 10 + i * (w - 20) / 4, h * 0.82, -d / 2 + 6, mat(P.chrome, 0.3, 0.9), 8).rotation.x = Math.PI / 2;
    b.box(w * 0.6, h * 0.3, d * 0.5, 0, 0, 0, wd);
  });
  reg('mirror', b => { const { w, d, h } = b; b.box(w, h, d * 0.9, 0, 0, 0, mat(P.walnut, 0.5)); b.box(w - 6, h - 6, 0.6, 0, 3, d * 0.45, b.mirror()); });
  reg('painting', b => {
    const { w, d, h } = b; b.box(w, h, d, 0, 0, 0, mat(P.black, 0.5));
    const cs = ['#d98c5f', '#5f8fd9', '#7bb86f', '#e7c35e']; b.box(w - 6, h - 6, 0.6, 0, 3, d / 2, mat(b.col || cs[(w + h) % 4], 0.9));
    b.box((w - 6) * 0.5, (h - 6) * 0.35, 0.7, -w * 0.1, h * 0.35, d / 2 + 0.1, mat('#f3efe6', 0.9));
  });
  reg('piano', b => {
    const { w, d, h } = b, bk = mat('#16181c', 0.25);
    b.box(w, h * 0.7, d * 0.75, 0, 0, -d * 0.12, bk); b.box(w, h * 0.3, d * 0.1, 0, h * 0.7, -d * 0.45, bk);
    b.box(w - 4, 4, d * 0.28, 0, h * 0.4, d * 0.34, mat('#f5f5f0', 0.4)); for (let i = 0; i < 24; i++) b.box(1.2, 4.4, d * 0.16, -w / 2 + 6 + i * (w - 12) / 23, h * 0.4 + 0.3, d * 0.28, bk);
    [-1, 1].forEach(s => b.box(5, h * 0.4, 5, s * (w / 2 - 8), 0, d * 0.3, bk)); b.box(w * 0.6, 2, 18, 0, 8, d * 0.4, bk);
  });

  // ---------- Küche ----------
  const handleV = (b, x, y, z, L) => b.box(1.6, L, 1.8, x, y, z, mat(P.chrome, 0.25, 0.9));
  reg('fridge freezer fridge_side', b => {
    const { w, d, h } = b, wh = mat(b.col || P.white, 0.3, 0.1), seam = mat('#9aa0a6', 0.5);
    if (b.it.type === 'fridge_side') {
      b.rb(w, h, d, 2, 0, 0, 0, wh); b.box(1.2, h - 6, 1, 0, 3, d / 2 + 0.2, seam);
      handleV(b, -4, h * 0.4, d / 2 + 2.4, 60); handleV(b, 4, h * 0.4, d / 2 + 2.4, 60);
      b.box(16, 24, 1, w * 0.18, h * 0.62, d / 2 + 0.3, b.lv('#1b2530', '#8fd4ff', 0.7)); return;
    }
    b.rb(w, h, d, 2, 0, 0, 0, wh);
    if (b.it.type === 'fridge') { b.box(w - 2, 1, 1, 0, h * 0.32, d / 2 + 0.2, seam); handleV(b, w / 2 - 6, h * 0.5, d / 2 + 2.4, 45); handleV(b, w / 2 - 6, h * 0.1, d / 2 + 2.4, 25); }
    else handleV(b, w / 2 - 6, h * 0.45, d / 2 + 2.4, 55);
    b.box(7, 3, 0.8, 0, h * 0.9, d / 2 + 0.3, b.lv('#1b2530', '#9be37a', 0.8));
  });
  reg('stove oven', b => {
    const { w, d, h } = b, wh = mat(b.col || P.white, 0.35), isStove = b.it.type === 'stove';
    b.rb(w, h, d, 1.5, 0, 0, 0, isStove ? mat(P.steel, 0.3, 0.8) : mat(P.steel, 0.3, 0.8));
    b.box(w - 8, h * 0.45, 1, 0, h * 0.18, d / 2 + 0.2, mat('#15171b', 0.15, 0.2)); b.box(w - 14, 2, 3, 0, h * 0.7, d / 2 + 2, mat(P.chrome, 0.2, 0.9));
    for (let i = 0; i < 4; i++) b.cyl(1.6, 1.6, 2.5, -w / 2 + 9 + i * (w - 18) / 3, h * 0.84, d / 2 + 0.5, mat(P.black), 12).rotation.x = Math.PI / 2;
    if (isStove) {
      b.box(w - 2, 0.8, d - 2, 0, h, 0, mat('#111317', 0.12, 0.3));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z], i) => { const r = i % 3 === 0 ? 8 : 6; const m = b.cyl(r, r, 0.4, x * w * 0.23, h + 0.8, z * d * 0.22, b.lv('#2b2f36', '#ff6a2a', 0.8), 20); });
    } else b.box(w - 2, 0.6, d - 2, 0, h, 0, wh);
    void wh;
  });
  reg('sink_kitchen counter kitchen_island', b => {
    const { w, d, h } = b, body = mat(b.col || '#e4e1da', 0.5), top = mat('#8a8f96', 0.25, 0.1);
    b.box(w, h - 4, d - 2, 0, 0, -1, body); b.rb(w + 1, 4, d + (b.it.type === 'kitchen_island' ? 8 : 2), 0.8, 0, h - 4, 0, top);
    const n = Math.max(1, Math.round(w / 60)); for (let i = 0; i < n; i++) { b.box(w / n - 1.5, h - 10, 0.8, -w / 2 + w / n * (i + 0.5), 4, d / 2 - 0.4, mat('#f0eee8', 0.4)); b.box(10, 1.2, 1.6, -w / 2 + w / n * (i + 0.5), h - 14, d / 2 + 0.8, mat(P.chrome, 0.3, 0.9)); }
    if (b.it.type === 'sink_kitchen') {
      b.box(w * 0.34, 0.8, d * 0.6, -w * 0.15, h, 0, mat('#aab0b7', 0.2, 0.9)); b.box(w * 0.3, 1, d * 0.52, -w * 0.15, h + 0.2, 0, mat('#6b7078', 0.3, 0.9));
      b.cyl(1.2, 1.2, 22, 0, h, -d * 0.3, mat(P.chrome, 0.15, 1), 10); b.tor(7, 1.2, 0, h + 22, -d * 0.3 + 7, mat(P.chrome, 0.15, 1), 14).rotation.y = 0;
      b.box(w * 0.2, 0.8, d * 0.6, w * 0.3, h, 0, mat('#c4c9cf', 0.2, 0.7));
    }
    if (b.it.type === 'counter') b.box(w * 0.3, 0.6, d * 0.5, w * 0.2, h, 0, mat('#222', 0.2));
  });
  reg('cabinet_wall', b => { cab(b, { col: '#e9e6df', doors: Math.max(1, Math.round(b.w / 45)) }); });
  reg('dishwasher dishwasher_tall washer dryer', b => {
    const { w, d, h } = b, wh = mat(b.col || P.white, 0.35, 0.1), t = b.it.type;
    b.rb(w, h, d, 1.5, 0, 0, 0, wh);
    if (t === 'washer' || t === 'dryer') {
      const r = Math.min(w, h) * 0.32; b.tor(r, 2.5, 0, h * 0.46, d / 2 + 1, mat(P.steel, 0.2, 0.9), 28);
      const gl = b.cyl(r, r, 1.5, 0, h * 0.46, d / 2 + 0.2, mat('#223344', 0.08, 0.3, { transparent: true, opacity: 0.8 }), 28); gl.rotation.x = Math.PI / 2;
      b.cyl(r * 0.6, r * 0.6, 1, 0, h * 0.46, d / 2 + 1, mat('#9fb4c8', 0.2, 0.2, { transparent: true, opacity: 0.5 }), 20).rotation.x = Math.PI / 2;
      b.box(w * 0.7, 6, 1, 0, h * 0.86, d / 2 + 0.2, b.lv('#1b2530', '#6fd0ff', 0.7)); b.cyl(3, 3, 1.4, w * 0.3, h * 0.88, d / 2 + 0.6, mat(P.steel, 0.2, 0.9), 14).rotation.x = Math.PI / 2;
    } else {
      b.box(w - 4, 5, 0.8, 0, h - 8, d / 2 + 0.2, b.lv('#1b2530', '#8fe36a', 0.7)); b.box(w - 14, 1.4, 2, 0, h - 14, d / 2 + 1.4, mat(P.chrome, 0.2, 0.9));
    }
  });
  reg('microwave', b => { const { w, d, h } = b; b.rb(w, h, d, 2, 0, 0, 0, mat(P.steel, 0.3, 0.8)); b.box(w * 0.64, h * 0.7, 0.8, -w * 0.12, h * 0.15, d / 2 + 0.1, b.lv('#12161b', '#ffd27a', 0.5)); b.box(w * 0.18, h * 0.7, 0.8, w * 0.36, h * 0.15, d / 2 + 0.1, mat('#1e2227', 0.4)); });
  reg('hood', b => { const { w, d, h } = b; b.box(w, 5, d, 0, 0, 0, mat(P.steel, 0.3, 0.8)); b.box(w * 0.3, h - 5, d * 0.4, 0, 5, -d * 0.25, mat(P.steel, 0.3, 0.8)); b.box(w * 0.8, 0.8, d * 0.6, 0, -0.5, 0, b.lv('#ddd', '#fff1c4', 1)); });
  reg('coffee', b => { const { w, d, h } = b; b.rb(w, h * 0.9, d * 0.8, 3, 0, 0, -d * 0.1, mat('#1f2226', 0.4)); b.box(w * 0.7, 3, d * 0.3, 0, 2, d * 0.28, mat(P.steel, 0.3, 0.8)); b.cyl(3, 3, 8, 0, 3, d * 0.3, mat('#f1f1f1', 0.3), 10); b.box(w * 0.5, 4, 3, 0, h * 0.7, d * 0.05, b.lv('#2a2d33', '#6fe0ff', 0.9)); });
  reg('kettle', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r * 0.7, r, b.h * 0.8, 0, 0, 0, mat(P.steel, 0.25, 0.9), 20); b.cyl(r * 0.7, r * 0.7, 2, 0, b.h * 0.8, 0, b.lv('#222', '#4fb0ff', 1), 20); b.box(2, b.h * 0.6, 4, r * 0.9, 2, 0, mat(P.black)); });
  reg('trash trash_bin', b => { const r = Math.min(b.w, b.d) / 2, big = b.it.type === 'trash_bin'; b.cyl(r * 0.85, r, b.h * 0.92, 0, 0, 0, mat(b.col || (big ? '#2f5d3a' : P.steel), 0.5, big ? 0 : 0.7), 20); b.cyl(r * 1.02, r * 1.02, 3, 0, b.h * 0.92, 0, mat(big ? '#27492f' : P.dark, 0.5), 20); });

  // ---------- Bad ----------
  const tub = (b, x, z, W, D, H, wallT) => {
    const cer = mat(P.ceramic, 0.15);
    b.box(W, 3, D, x, H * 0.12, z, cer); b.box(W, H, wallT, x, 0, z - D / 2 + wallT / 2, cer); b.box(W, H, wallT, x, 0, z + D / 2 - wallT / 2, cer);
    b.box(wallT, H, D, x - W / 2 + wallT / 2, 0, z, cer); b.box(wallT, H, D, x + W / 2 - wallT / 2, 0, z, cer);
  };
  reg('bathtub', b => { const { w, d, h } = b; tub(b, 0, 0, w, d, h, 6); b.box(w - 14, 1, d - 14, 0, h * 0.14, 0, mat('#eef4f7', 0.1)); b.cyl(1.4, 1.4, 14, -w / 2 + 10, h, 0, mat(P.chrome, 0.15, 1), 10); b.cyl(1, 1, 8, -w / 2 + 14, h + 12, 0, mat(P.chrome, 0.15, 1), 10).rotation.z = Math.PI / 2; });
  reg('whirlpool', b => { const { w, d, h } = b; b.rb(w, h, d, 14, 0, 0, 0, mat('#e8eef2', 0.2)); b.rb(w - 24, 2, d - 24, 10, 0, h - 1, 0, mat(P.water, 0.05, 0.2, { transparent: true, opacity: 0.75 })); });
  reg('hot_tub', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r, r, b.h, 0, 0, 0, mat('#6b4a32', 0.6), 32); b.cyl(r - 5, r - 5, 2, 0, b.h - 3, 0, mat(P.water, 0.05, 0.2, { transparent: true, opacity: 0.8 }), 32); b.cyl(r + 1, r + 1, 5, 0, b.h - 5, 0, mat('#e8e2d6', 0.4), 32); });
  reg('shower shower_tray shower_walkin', b => {
    const { w, d, h } = b, t = b.it.type; b.rb(w, 6, d, 2, 0, 0, 0, mat(P.ceramic, 0.3)); b.cyl(3, 3, 0.4, 0, 6, 0, mat(P.chrome, 0.2, 1), 14);
    if (t === 'shower_tray') return;
    const H = 195; b.box(w, H, 0.8, 0, 6, d / 2 - 0.4, b.glass()); if (t === 'shower') b.box(0.8, H, d, w / 2 - 0.4, 6, 0, b.glass());
    [[0, d / 2 - 0.4, w, 1.4], [w / 2 - 0.4, 0, 1.4, d]].forEach(([x, z, W, D]) => b.box(W, 1.6, D, x, H + 5, z, mat(P.chrome, 0.2, 1)));
    b.cyl(1, 1, 190, -w / 2 + 6, 6, -d / 2 + 4, mat(P.chrome, 0.2, 1), 8); b.cyl(7, 7, 1.4, -w / 2 + 14, 190, -d / 2 + 10, mat(P.chrome, 0.2, 1), 16);
  });
  reg('toilet toilet_wall bidet', b => {
    const { w, d, h } = b, cer = mat(P.ceramic, 0.12), bidet = b.it.type === 'bidet';
    b.rb(w * 0.9, h * 0.55, d * 0.62, 6, 0, h * 0.0 + (b.it.type === 'toilet_wall' ? 14 : 0), d * 0.17, cer);
    b.rb(w * 0.8, 4, d * 0.56, 3, 0, h * 0.62, d * 0.18, mat('#ffffff', 0.2));
    if (!bidet) { b.rb(w * 0.82, h * 0.5, d * 0.2, 3, 0, h * 0.55, -d * 0.4, cer); b.cyl(2.5, 2.5, 1.6, 0, h * 1.05, -d * 0.4, mat(P.chrome, 0.2, 1), 12); b.rb(w * 0.74, 2.5, d * 0.5, 3, 0, h * 0.66, d * 0.2, cer); }
    else b.cyl(1, 1, 8, 0, h * 0.6, -d * 0.2, mat(P.chrome, 0.2, 1), 8);
  });
  const faucet = (b, x, y, z) => { b.cyl(1.2, 1.2, 12, x, y, z, mat(P.chrome, 0.15, 1), 10); b.cyl(0.9, 0.9, 8, x, y + 11, z + 4, mat(P.chrome, 0.15, 1), 8).rotation.x = Math.PI / 2; };
  reg('basin basin_double washstand', b => {
    const { w, d, h } = b, cer = mat(P.ceramic, 0.12), t = b.it.type, n = t === 'basin_double' ? 2 : 1;
    if (t === 'washstand') { cab(b, { col: P.oak, doors: 0, drawers: 2, drawerShare: 1, legs: 8, }); b.g.children[0].scale.y = 1; }
    else if (t === 'basin') { b.cyl(4, 6, h * 0.62, 0, 0, -d * 0.2, cer, 16); }
    const by = t === 'washstand' ? h : h * 0.8;
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * (w / n); b.rb(w / n * 0.92, 12, d * 0.92, 6, x, by - 4, 0, cer); b.box(w / n * 0.62, 0.6, d * 0.58, x, by + 8, 1, mat('#e1e9ee', 0.1)); faucet(b, x, by + 8, -d * 0.36); }
  });
  reg('mirror_cabinet', b => { const { w, d, h } = b; b.box(w, h, d, 0, 0, 0, mat(P.white, 0.4)); b.box(w - 3, h - 3, 0.6, 0, 1.5, d / 2 + 0.1, b.mirror()); });
  reg('towel_radiator', b => { const { w, d, h } = b, m = mat(P.white, 0.3, 0.4); [-1, 1].forEach(s => b.box(2.5, h, d, s * (w / 2 - 1.5), 0, 0, m)); for (let i = 0; i < 9; i++) b.cyl(1, 1, w - 4, 0, 5 + i * (h - 10) / 8, 0, m, 8).rotation.z = Math.PI / 2; });
  reg('sauna', b => {
    const { w, d, h } = b, wd = mat('#c98f55', 0.7), dk = mat('#a0683a', 0.7);
    b.box(w, 4, d, 0, 0, 0, dk); [[0, -d / 2 + 2, w, 4], [-w / 2 + 2, 0, 4, d], [w / 2 - 2, 0, 4, d]].forEach(([x, z, W, D]) => { b.box(W, h, D, x, 4, z, wd); });
    b.box(w, h - 4, 4, 0, 4, d / 2 - 2, wd); b.box(w * 0.34, h * 0.88, 2, w * 0.24, 4, d / 2 - 0.5, b.glass()); b.box(w, 4, d, 0, h, 0, dk);
    b.box(w * 0.8, 4, 45, 0, 50, -d / 2 + 30, dk); b.box(w * 0.8, 4, 45, 0, 100, -d / 2 + 24, dk); b.box(26, 40, 26, -w / 2 + 26, 4, -d / 2 + 26, mat('#3a3d42', 0.6));
  });
  reg('water_heater water_tank boiler', b => { const t = b.it.type, r = Math.min(b.w, b.d) / 2; if (t === 'boiler') { b.rb(b.w, b.h, b.d, 3, 0, 0, 0, mat(P.white, 0.35)); b.box(b.w * 0.5, 14, 1, 0, b.h * 0.7, b.d / 2 + 0.1, b.lv('#1b2530', '#7fe3a0', 0.8)); b.cyl(2, 2, 12, -b.w * 0.25, -8, b.d * 0.3, mat(P.steel, 0.3, 0.9), 8); return; } b.cyl(r, r, b.h * 0.92, 0, 0, 0, mat(t === 'water_tank' ? P.steel : P.white, 0.3, t === 'water_tank' ? 0.8 : 0.1), 28); b.sph(r, 0, b.h * 0.92, 0, mat(t === 'water_tank' ? P.steel : P.white, 0.3, t === 'water_tank' ? 0.8 : 0.1), 1, 0.25, 1); });
  reg('utility_sink', b => { const { w, d, h } = b; b.box(w, h - 28, d, 0, 0, 0, mat('#d7dbe0', 0.5)); b.rb(w, 28, d, 4, 0, h - 28, 0, mat(P.ceramic, 0.15)); b.box(w - 10, 1, d - 10, 0, h - 1, 0, mat('#dce5ea', 0.1)); faucet(b, 0, h, -d * 0.36); });

  // ---------- Heizung & Klima ----------
  reg('radiator heater_elec towel_heater', b => { const { w, d, h } = b, m = mat(P.white, 0.4, 0.2); b.box(w, h, d * 0.5, 0, 0, -d * 0.2, m); for (let i = 0; i < Math.round(w / 6); i++) b.box(1.2, h, d * 0.5, -w / 2 + 3 + i * 6, 0, d * 0.2, m); b.box(w, 1.5, d, 0, h, 0, mat(P.white, 0.4)); });
  reg('thermostat radiator_valve heat_valve smart_valve', b => { const r = Math.min(b.w, b.d, b.h) / 2; b.cyl(r * 0.7, r * 0.7, b.h * 0.9, 0, 0, 0, mat(P.white, 0.4), 18); b.cyl(r * 0.5, r * 0.5, 1.2, 0, b.h * 0.9, 0, b.lv('#1b2530', '#ff9d4a', 0.9), 18); });
  reg('ac split_ac', b => { const { w, d, h } = b; b.rb(w, h, d, 5, 0, 0, 0, mat(P.white, 0.35)); b.box(w * 0.85, 2, d * 0.35, 0, 2, d * 0.35, mat('#d3d8dd', 0.5)); b.box(6, 1.6, 0.8, w * 0.38, h * 0.62, d / 2 + 0.2, b.lv('#2a2d33', '#8fe0ff', 1)); });
  reg('fan', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r * 0.6, r * 0.7, 3, 0, 0, 0, mat(P.dark, 0.5), 20); b.cyl(1.5, 1.5, b.h * 0.7, 0, 3, 0, mat(P.chrome, 0.3, 0.8), 8); const ring = b.tor(r * 0.8, 1.2, 0, b.h * 0.85, 0, mat(P.steel, 0.3, 0.8), 28); ring.rotation.x = 0.1; b.cyl(r * 0.8, r * 0.8, 1, 0, b.h * 0.85, 0, mat('#e9eef2', 0.3, 0.2, { transparent: true, opacity: 0.35 }), 28).rotation.x = Math.PI / 2 + 0.1; });
  reg('fan_ceiling', b => { const r = b.w / 2; b.cyl(6, 6, 10, 0, b.h - 10, 0, mat(P.white, 0.4), 16); b.cyl(1.4, 1.4, 10, 0, b.h, 0, mat(P.dark), 8); const bl = new T.Group(); bl.position.set(0, b.h - 8, 0); b.g.add(bl); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, m = new T.Mesh(new T.BoxGeometry(r * 0.8, 1.2, 14), mat(P.walnut, 0.6)); m.position.set(Math.cos(a) * r * 0.5, 0, Math.sin(a) * r * 0.5); m.rotation.y = -a; m.castShadow = true; bl.add(m); } b.cyl(5, 5, 4, 0, b.h - 14, 0, b.lv('#eee', '#fff0c8', 1), 14); let sp = 0; b.anim = { type: 'spin', step: (dt, on) => { sp = on ? Math.min(1, sp + dt * 0.8) : Math.max(0, sp - dt * 0.6); bl.rotation.y += dt * 14 * sp; return sp > 0.01; } }; });
  reg('fireplace pellet chimney_stove', b => {
    const { w, d, h } = b, t = b.it.type, stone = mat(t === 'fireplace' ? '#9a948a' : '#25282d', t === 'fireplace' ? 0.9 : 0.5, t === 'fireplace' ? 0 : 0.5);
    b.box(w, h, d, 0, 0, 0, stone); b.box(w * 0.6, h * 0.5, 1, 0, h * 0.18, d / 2 + 0.1, mat('#08090b', 0.2)); b.box(w * 0.5, h * 0.36, 0.6, 0, h * 0.2, d / 2 + 0.3, b.lv('#1d1410', '#ff7a1a', 1.1));
    b.box(w + 4, 4, d + 4, 0, h, 0, t === 'fireplace' ? mat('#6e6860', 0.8) : stone);
    if (t !== 'fireplace') b.cyl(6, 6, 80, 0, h, -d * 0.2, mat('#2b2e33', 0.5, 0.6), 16);
  });
  reg('heat_pump', b => { const { w, d, h } = b; b.rb(w, h, d, 4, 0, 0, 0, mat('#d9dde1', 0.5, 0.2)); b.cyl(h * 0.36, h * 0.36, 1.2, -w * 0.12, h * 0.5, d / 2 + 0.1, mat('#1a1c20', 0.5), 28).rotation.x = Math.PI / 2; for (let i = 0; i < 6; i++) b.box(w * 0.26, 0.8, 0.8, w * 0.32, h * 0.2 + i * h * 0.1, d / 2 + 0.2, mat('#6f757c', 0.5)); });
  reg('air_purifier humidifier dehumidifier ventilation', b => {
    const { w, d, h } = b, t = b.it.type;
    if (t === 'ventilation') { b.box(w, 4, d, 0, 0, 0, mat(P.white, 0.4)); b.box(w - 10, 1, d - 10, 0, -0.5, 0, mat('#cfd4d9', 0.5)); return; }
    if (t === 'dehumidifier') { b.rb(w, h, d, 3, 0, 0, 0, mat('#e9edf0', 0.4)); b.box(w * 0.7, h * 0.12, 0.8, 0, h * 0.78, d / 2 + 0.2, b.lv('#1b2530', '#7fd3ff', 0.8)); return; }
    const r = Math.min(w, d) / 2; b.cyl(r * 0.85, r, h, 0, 0, 0, mat(P.white, 0.4), 24); b.cyl(r * 0.5, r * 0.5, 0.8, 0, h, 0, b.lv('#9aa4ab', '#6fe0ff', 0.9), 20);
  });
  reg('heat_dist', b => { const { w, d, h } = b; b.box(w, h, d, 0, 0, 0, mat('#caced3', 0.5, 0.4)); for (let i = 0; i < 5; i++) b.cyl(1.6, 1.6, 8, -w / 2 + 6 + i * (w - 12) / 4, -6, 0, i % 2 ? mat('#c0392b') : mat('#2e86c1'), 8); });
  reg('solar_thermal', b => { const { w, d, h } = b; const m = b.box(w, 6, d, 0, h * 0.2, 0, mat('#1d2d44', 0.15, 0.3)); m.rotation.x = -0.5; for (let i = 1; i < 4; i++) { const l = b.box(0.6, 1, d, -w / 2 + i * w / 4, h * 0.2 + 3, 0, mat('#8da2bf', 0.3, 0.7)); l.rotation.x = -0.5; } });
  reg('floor_heating', b => { const { w, d } = b; b.box(w, 2, d, 0, 0, 0, mat('#8e949b', 0.8)); const pm = b.lv('#c0392b', '#ff6a2a', 0.9); for (let i = 0; i < 8; i++) b.box(w - 10, 1.2, 1.4, 0, 2, -d / 2 + 8 + i * (d - 16) / 7, pm); });

  // ---------- Licht ----------
  const shadeColor = '#fbf5e8', onWarm = '#ffe2a8';
  reg('lamp_ceiling', b => { const r = b.w / 2; b.cyl(r, r, 2, 0, b.h - 2, 0, mat(P.white, 0.4), 28); b.sph(r * 0.85, 0, b.h - 2, 0, b.lv(shadeColor, onWarm, 1.2), 1, 0.4, 1); });
  reg('lamp_spot', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r, r, 3, 0, b.h - 3, 0, mat(P.white, 0.4), 18); b.cyl(r * 0.7, r * 0.7, 1, 0, b.h - 4, 0, b.lv('#f2f2f2', onWarm, 1.4), 16); });
  reg('lamp_panel light_panel', b => { b.box(b.w, 3, b.d, 0, b.h - 3, 0, mat(P.white, 0.5)); b.box(b.w - 4, 1, b.d - 4, 0, b.h - 3.6, 0, b.lv('#f4f6f7', '#fff6dc', 1.3)); });
  reg('lamp_strip light_string', b => { const s = b.it.type === 'light_string'; if (s) { b.box(b.w, 0.6, 0.6, 0, b.h, 0, mat(P.black)); for (let i = 0; i < 12; i++) b.sph(2, -b.w / 2 + 8 + i * (b.w - 16) / 11, b.h - 3 - (i % 2) * 2, 0, b.lv('#fff2c0', '#ffd77a', 1.6)); } else b.box(b.w, 2, 2.5, 0, b.h - 2, 0, b.lv('#eef2f5', onWarm, 1.6)); });
  reg('lamp_floor', b => { const { h } = b, r = Math.min(b.w, b.d) / 2; b.cyl(r * 0.55, r * 0.6, 2.5, 0, 0, 0, mat(P.black, 0.4, 0.4), 22); b.cyl(1, 1, h * 0.8, 0, 2, 0, mat(P.black, 0.4, 0.4), 8); b.cyl(r * 0.7, r, h * 0.2, 0, h * 0.8, 0, b.lv(shadeColor, onWarm, 1.1), 24); });
  reg('lamp_arc', b => { const { w, d, h } = b; b.cyl(8, 9, 4, -w * 0.4, 0, 0, mat('#d4d6d8', 0.2, 0.8), 20); const curve = new T.CatmullRomCurve3([new T.Vector3(-w * 0.4, 4, 0), new T.Vector3(-w * 0.4, h * 0.7, 0), new T.Vector3(-w * 0.1, h * 0.95, 0), new T.Vector3(w * 0.3, h * 0.82, 0)]); b.add(new T.TubeGeometry(curve, 24, 1.2, 8), mat('#d4d6d8', 0.2, 0.8), 0, 0, 0); b.sph(14, w * 0.38, h * 0.72, 0, b.lv(shadeColor, onWarm, 1.1), 1, 0.8, 1); });
  reg('lamp_wall', b => { const { w, d, h } = b; b.box(w * 0.5, h * 0.4, 2, 0, h * 0.3, -d / 2 + 1, mat(P.black, 0.4, 0.5)); b.cyl(w * 0.28, w * 0.2, h * 0.6, 0, h * 0.2, -d * 0.05, b.lv(shadeColor, onWarm, 1.1), 18); });
  reg('lamp_mirror', b => { b.box(b.w, 2.5, 3, 0, b.h - 2.5, 0, b.lv('#f2f2f2', onWarm, 1.4)); });
  reg('lamp_pendant', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(0.3, 0.3, 40, 0, b.h, 0, mat(P.black), 4); b.cyl(r * 0.2, r * 0.9, b.h * 0.7, 0, 0, 0, b.lv(shadeColor, onWarm, 1.1), 28); b.cyl(r * 0.2, r * 0.2, 2, 0, b.h * 0.7, 0, mat(P.black, 0.4), 10); b.sph(5, 0, 6, 0, b.lv('#fffbe8', '#fff1c4', 1.5)); });
  reg('chandelier', b => { const { w, h } = b, r = w / 2; b.cyl(0.4, 0.4, 40, 0, h, 0, mat(P.black), 4); b.tor(r * 0.8, 1.3, 0, h * 0.5, 0, mat('#c9a24a', 0.25, 0.9), 32).rotation.x = Math.PI / 2; b.cyl(2, 2, h * 0.6, 0, h * 0.4, 0, mat('#c9a24a', 0.25, 0.9), 8); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; b.cyl(1.4, 1.1, 10, Math.cos(a) * r * 0.8, h * 0.5 + 1, Math.sin(a) * r * 0.8, mat('#f4efe6', 0.4), 8); b.sph(3, Math.cos(a) * r * 0.8, h * 0.5 + 14, Math.sin(a) * r * 0.8, b.lv('#fffbe8', '#ffe6a8', 1.6), 1, 1.2, 1); } });
  reg('lamp_table', b => { const { h } = b, r = Math.min(b.w, b.d) / 2; b.cyl(r * 0.35, r * 0.45, h * 0.5, 0, 0, 0, mat('#d8d2c4', 0.3, 0.1), 18); b.cyl(r * 0.6, r, h * 0.5, 0, h * 0.5, 0, b.lv(shadeColor, onWarm, 1.1), 22); });
  reg('lamp_desk', b => { const { h } = b; b.cyl(7, 8, 2, 0, 0, 0, mat(P.black, 0.4, 0.5), 18); const a1 = b.box(1.6, h * 0.8, 1.6, 0, 2, 0, mat(P.black, 0.4, 0.5)); a1.rotation.z = 0.15; const a2 = b.box(1.6, h * 0.55, 1.6, 6, h * 0.7, 0, mat(P.black, 0.4, 0.5)); a2.rotation.z = -1.1; b.cyl(1, 6, 8, 16, h * 0.78, 0, b.lv('#eee', onWarm, 1.4), 16).rotation.z = 0.5; });
  reg('lamp_night lamp_bulb', b => { const r = Math.min(b.w, b.d) / 2; if (b.it.type === 'lamp_bulb') { b.cyl(2, 2, 3, 0, 0, 0, mat(P.steel, 0.3, 0.8), 10); b.sph(r, 0, r + 3, 0, b.lv('#fffbe8', '#fff0b8', 1.8), 1, 1.15, 1); } else { b.sph(r * 0.9, 0, r * 0.9, 0, b.lv('#f6f3ea', '#ffd9a0', 1.3)); } });
  reg('lamp_outdoor', b => { const { w, d, h } = b; b.box(w * 0.5, h * 0.18, 4, 0, h * 0.4, -d / 2 + 2, mat(P.black, 0.5, 0.5)); b.cyl(w * 0.22, w * 0.3, h * 0.6, 0, h * 0.2, -d * 0.1, b.lv('#f3f3ef', '#ffe3a0', 1.3), 14); b.cyl(w * 0.34, w * 0.2, 3, 0, h * 0.8, -d * 0.1, mat(P.black, 0.4, 0.5), 14); });
  reg('lamp_garden', b => { const { h } = b; b.cyl(2.2, 2.6, h * 0.7, 0, 0, 0, mat('#2b2e33', 0.5, 0.5), 10); b.cyl(5, 5, h * 0.25, 0, h * 0.7, 0, b.lv('#f3f1ea', '#ffe3a0', 1.4), 14); b.cyl(6, 1, 3, 0, h * 0.95, 0, mat('#2b2e33', 0.5, 0.5), 14); });

  // ---------- Elektro / Smart Home (Wand) ----------
  function plate(b, n, o) {
    o = o || {};
    const s = Math.min(b.h, 11), W = o.w || s * (n || 1) * (n > 1 ? 0.95 : 1), z = b.d / 2 - 0.2;
    b.rb(W, s, 1.4, 0.4, 0, 0, z, mat(o.col || '#f4f4f2', 0.35));
    return { z: z + 0.8, s, W };
  }
  reg('outlet outlet_double outlet_smart outlet_usb outlet_outdoor outlet_floor outlet_cee plug', b => {
    const t = b.it.type, n = t === 'outlet_double' ? 2 : 1;
    if (t === 'plug') { const r = Math.min(b.w, b.d, b.h) / 2; b.rb(r * 1.6, r * 1.4, r * 1.2, 2, 0, 0, 0, mat('#f3f3f1', 0.35)); b.box(0.8, 3, 0.4, -1.4, r * 0.4, r * 0.6 + 1, mat(P.chrome, 0.2, 1)); b.box(0.8, 3, 0.4, 1.4, r * 0.4, r * 0.6 + 1, mat(P.chrome, 0.2, 1)); b.sph(0.8, 0, r * 1.2, r * 0.6, b.lv('#444', '#3de07a', 1.4)); return; }
    const p = plate(b, n, { col: t === 'outlet_outdoor' ? '#6c7a89' : t === 'outlet_cee' ? '#2e6bd3' : '#f4f4f2' });
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * p.s * 0.9; b.cyl(p.s * 0.34, p.s * 0.34, 0.6, x, p.s * 0.5, p.z, mat('#e2e2de', 0.5), 18).rotation.x = Math.PI / 2; b.cyl(0.55, 0.55, 0.4, x - 1.2, p.s * 0.5, p.z + 0.3, mat('#222'), 8).rotation.x = Math.PI / 2; b.cyl(0.55, 0.55, 0.4, x + 1.2, p.s * 0.5, p.z + 0.3, mat('#222'), 8).rotation.x = Math.PI / 2; }
    if (t === 'outlet_smart') b.sph(0.7, 0, 1.2, p.z + 0.3, b.lv('#444', '#3de07a', 1.4)); if (t === 'outlet_usb') [-1, 1].forEach(s => b.box(2, 0.8, 0.4, s * 2.2, p.s * 0.2, p.z, mat('#1a1a1a')));
  });
  reg('switch switch_double dimmer button scene_switch smart_light_sw', b => {
    const t = b.it.type, n = t === 'switch_double' ? 2 : 1, p = plate(b, n);
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * p.s * 0.9; if (t === 'dimmer') b.cyl(p.s * 0.28, p.s * 0.28, 1, x, p.s * 0.5, p.z + 0.2, mat('#d9d9d4', 0.4), 18).rotation.x = Math.PI / 2; else if (t === 'button' || t === 'scene_switch') b.rb(p.s * 0.55, p.s * 0.55, 0.8, 0.5, x, p.s * 0.22, p.z, b.lv('#e9e9e4', '#9ad7ff', 1)); else b.rb(p.s * 0.6, p.s * 0.7, 0.8, 0.5, x, p.s * 0.15, p.z, b.lv('#eeeeea', '#ffe27a', 1)); }
  });
  reg('lan_socket tv_socket', b => { const p = plate(b, 1); b.box(p.s * 0.5, p.s * 0.35, 0.8, 0, p.s * 0.32, p.z, mat('#2a2a2a', 0.5)); });
  reg('electric_panel', b => { const { w, d, h } = b; b.box(w, h, d, 0, 0, 0, mat('#cdd2d7', 0.5, 0.4)); b.box(w - 4, h - 4, 1, 0, 2, d / 2, mat('#e8ebee', 0.5)); for (let i = 0; i < 12; i++) b.box(2, 4, 1, -w / 2 + 6 + (i % 6) * 5.4, h * (i < 6 ? 0.62 : 0.3), d / 2 + 1, mat(i % 3 ? '#333' : '#c0392b')); });
  reg('camera camera_ptz doorbell_cam', b => {
    const { w, d, h } = b, t = b.it.type;
    if (t === 'doorbell_cam') { b.rb(w, h, d * 0.6, 3, 0, 0, 0, mat('#2c3036', 0.4)); b.cyl(3, 3, 1, 0, h * 0.7, d * 0.3, b.lv('#101214', '#6fd0ff', 1.2), 16).rotation.x = Math.PI / 2; b.cyl(2.2, 2.2, 1, 0, h * 0.25, d * 0.3, b.lv('#ddd', '#7fe0ff', 1.4), 14).rotation.x = Math.PI / 2; return; }
    if (t === 'camera_ptz') { b.cyl(2, 2, 8, 0, h - 8, 0, mat(P.white, 0.4), 12); b.sph(Math.min(w, d) * 0.4, 0, h - 14, 0, mat('#2a2d33', 0.15, 0.3)); b.sph(Math.min(w, d) * 0.4, 0, h - 14, 0, mat('#8aa', 0.05, 0.2, { transparent: true, opacity: 0.25 }), 1.05, 1.05, 1.05); return; }
    b.box(5, 5, 8, 0, h - 8, -d / 2 + 4, mat(P.white, 0.4)); const body = b.cyl(5, 5, 14, 0, h - 14, 2, mat(P.white, 0.35), 18); body.rotation.x = Math.PI / 2 - 0.15; b.cyl(4, 4, 1, 0, h - 11.5, 9.2, b.lv('#0c0e10', '#6fd0ff', 1.2), 16).rotation.x = Math.PI / 2 - 0.15; b.sph(0.8, 3.5, h - 8, 7, b.lv('#400', '#ff3030', 1.6));
  });
  reg('sensor_motion sensor_presence sensor_lux glassbreak sensor_vibr', b => { const r = Math.min(b.w, b.d, 14) / 2, up = b.h > 12; b.cyl(r, r, 2.4, 0, up ? b.h - 2.4 : 0, 0, mat(P.white, 0.35), 24); b.sph(r * 0.62, 0, up ? b.h - 2.4 : 2.4, 0, mat('#eef1f2', 0.2, 0, { transparent: true, opacity: 0.9 }), 1, 0.7, 1); b.sph(0.6, r * 0.7, up ? b.h - 1 : 1.2, r * 0.3, b.lv('#400', '#3de07a', 1.6)); });
  reg('smoke sensor_co sensor_co2 sensor_gas siren', b => { const r = Math.min(b.w, b.d, 18) / 2; b.cyl(r, r, 3.4, 0, b.h - 3.4, 0, mat(P.white, 0.35), 28); b.cyl(r * 0.6, r * 0.6, 0.6, 0, b.h - 3.8, 0, mat('#d8dcdf', 0.5), 20); b.sph(0.7, r * 0.7, b.h - 3.9, 0, b.lv('#400', '#3de07a', 1.6)); });
  reg('sensor_temp sensor_hum sensor_contact sensor_leak sensor_vibr mailbox_sensor rain_sensor wind_sensor window_handle weather', b => {
    const t = b.it.type;
    if (t === 'weather') { b.cyl(1.2, 1.2, b.h * 0.7, 0, 0, 0, mat(P.grey, 0.4, 0.6), 8); for (let i = 0; i < 3; i++) b.sph(3, Math.cos(i * 2.1) * 6, b.h * 0.75, Math.sin(i * 2.1) * 6, mat(P.white, 0.3)); return; }
    const s = Math.min(b.w, b.d, 10); b.rb(s, s, 2, 1.2, 0, 0, 0, mat(P.white, 0.35));
    if (t === 'sensor_temp' || t === 'sensor_hum') b.box(s * 0.55, s * 0.3, 0.5, 0, s * 0.45, 1.1, b.lv('#1b2530', '#9be37a', 0.9)); else if (t === 'sensor_contact') { b.box(s * 0.28, s, 2, s * 1.1, 0, 0, mat(P.white, 0.35)); } else b.sph(0.7, 0, s * 0.5, 1.2, b.lv('#400', '#3de07a', 1.6));
  });
  reg('speaker', b => { const { w, d, h } = b; b.rb(w * 0.7, h, d * 0.7, 3, 0, 0, 0, mat('#26282c', 0.6)); b.cyl(w * 0.2, w * 0.2, 1, 0, h * 0.3, d * 0.35, mat('#111', 0.5), 18).rotation.x = Math.PI / 2; b.cyl(w * 0.08, w * 0.08, 1, 0, h * 0.78, d * 0.35, mat('#111', 0.5), 12).rotation.x = Math.PI / 2; });
  reg('smart_speaker', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r * 0.8, r, b.h, 0, 0, 0, mat('#4a4f57', 0.95), 28); b.cyl(r * 0.8, r * 0.8, 1.2, 0, b.h, 0, b.lv('#222', '#4fb0ff', 1.3), 28); });
  reg('soundbar', b => { b.rb(b.w, b.h, b.d, 2, 0, 0, 0, mat('#1e2024', 0.55)); b.box(b.w - 6, b.h * 0.5, 0.6, 0, b.h * 0.25, b.d / 2 + 0.1, mat('#111', 0.9)); b.sph(0.6, b.w / 2 - 4, b.h * 0.5, b.d / 2 + 0.3, b.lv('#222', '#4fd0ff', 1.6)); });
  reg('smart_tv', b => {
    const { w, d, h } = b; b.rb(w, 62, Math.max(3, d * 0.6), 1, 0, 6, 0, mat('#15171a', 0.35)); b.box(w - 2, 58, 0.5, 0, 8, Math.max(3, d * 0.6) / 2 + 0.1, b.lv('#07090c', '#7fb3ff', 0.55)); b.box(w * 0.3, 3, 18, 0, 0, 0, mat('#222', 0.4, 0.5)); b.box(4, 8, 4, 0, 0, -1, mat('#222', 0.4, 0.5));
    void h;
  });
  reg('monitor projector', b => {
    const { w, d, h } = b; if (b.it.type === 'projector') { b.rb(w, h, d, 3, 0, 0, 0, mat(P.white, 0.4)); b.cyl(h * 0.3, h * 0.3, 2, 0, h * 0.5, d / 2, mat('#222', 0.2), 16).rotation.x = Math.PI / 2; return; }
    b.rb(w, h * 0.65, 2.5, 0.8, 0, h * 0.3, 0, mat('#16181b', 0.4)); b.box(w - 2, h * 0.6, 0.4, 0, h * 0.32, 1.4, b.lv('#080a0e', '#8fc0ff', 0.55)); b.box(3, h * 0.3, 3, 0, 0, -1, mat('#222', 0.4, 0.6)); b.box(w * 0.3, 1.4, d * 0.6, 0, 0, 2, mat('#222', 0.4, 0.6));
  });
  reg('pc nas ups server_rack hifi console knx smart_meter inverter battery heat_meter water_meter meter_power meter_gas pool_pump ev_charger wallbox alarm_panel keypad wall_tablet hub led_ctrl esp zigbee_router ble_proxy thread ir_blaster garage_opener fingerprint remote pet_feeder', b => {
    const { w, d, h } = b, t = b.it.type;
    if (t === 'server_rack') { b.box(w, h, d, 0, 0, 0, mat('#1b1d21', 0.5, 0.4)); for (let i = 0; i < 9; i++) { b.box(w - 8, h / 11, 1, 0, 5 + i * h / 10.5, d / 2 + 0.1, mat(i % 2 ? '#3a3d44' : '#2a2c31', 0.4, 0.5)); b.sph(0.6, w / 2 - 8, 5 + i * h / 10.5 + 2, d / 2 + 0.5, b.lv('#400', '#3de07a', 1.6)); } return; }
    if (t === 'pc' || t === 'nas' || t === 'ups') { b.rb(w, h, d, 2, 0, 0, 0, mat('#1c1e22', 0.45, 0.2)); b.box(w * 0.7, h * 0.5, 0.4, 0, h * 0.2, d / 2 + 0.1, mat('#0e1013', 0.8)); b.sph(0.9, 0, h * 0.85, d / 2 + 0.3, b.lv('#223', '#4fa8ff', 1.8)); return; }
    if (t === 'wall_tablet' || t === 'alarm_panel' || t === 'keypad') { b.rb(w, h, 2.5, 1.2, 0, 0, d / 2 - 1, mat('#1b1d21', 0.4)); b.box(w - 3, h - 3, 0.4, 0, 1.5, d / 2 + 0.3, b.lv('#07090c', '#7fb3ff', 0.6)); return; }
    if (t === 'ev_charger' || t === 'wallbox') { b.rb(w, h, d, 4, 0, 0, 0, mat('#f1f2f3', 0.35)); b.box(w * 0.6, h * 0.12, 0.8, 0, h * 0.7, d / 2 + 0.2, b.lv('#1b2530', '#4fe08a', 1)); b.tor(8, 1, 0, h * 0.3, d / 2 + 1, mat('#222', 0.5), 14).rotation.y = 0; return; }
    if (t === 'inverter' || t === 'battery' || t === 'heat_meter' || t === 'water_meter' || t === 'meter_power' || t === 'meter_gas' || t === 'smart_meter') { b.rb(w, h, d, 2, 0, 0, 0, mat(t === 'battery' ? '#d9dde1' : '#e6e8ea', 0.4)); b.box(w * 0.55, h * 0.22, 0.6, 0, h * 0.62, d / 2 + 0.1, b.lv('#1b2530', '#9be37a', 0.9)); if (t === 'meter_gas' || t === 'water_meter') b.cyl(3, 3, 1, 0, h * 0.3, d / 2 + 0.3, mat('#5a6068', 0.3, 0.7), 16).rotation.x = Math.PI / 2; return; }
    b.rb(w * 0.9, Math.min(h, 12) || 8, d * 0.9, 1.5, 0, 0, 0, mat('#e9ebec', 0.4)); b.sph(0.7, w * 0.3, 7, d * 0.3, b.lv('#400', '#3de07a', 1.6));
  });
  reg('router', b => { const { w, d, h } = b; b.rb(w, h * 0.7, d, 2, 0, 0, 0, mat(P.white, 0.4)); [-1, 1].forEach(s => b.cyl(0.8, 0.8, h * 3, s * w * 0.38, h * 0.6, -d * 0.3, mat(P.black, 0.5), 8)); for (let i = 0; i < 4; i++) b.sph(0.6, -w * 0.3 + i * w * 0.2, h * 0.35, d / 2, b.lv('#262', '#3de07a', 1.6)); });
  reg('dongle', b => { b.rb(b.w * 0.9, 5, b.d * 0.4, 1.4, 0, 0, 0, mat('#2a2d33', 0.4)); b.box(b.w * 0.3, 3, b.d * 0.3, 0, 0.5, b.d * 0.34, mat(P.chrome, 0.2, 1)); b.sph(0.7, -b.w * 0.2, 5, 0, b.lv('#400', '#3dc0ff', 1.6)); });
  reg('vacuum', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r, r, b.h * 0.9, 0, 0, 0, mat('#2b2e33', 0.35), 32); b.cyl(r * 0.6, r * 0.6, 0.8, 0, b.h * 0.9, 0, mat('#dfe3e6', 0.3), 28); b.sph(r * 0.1, 0, b.h * 0.95, r * 0.4, b.lv('#222', '#4fe08a', 1.6)); });
  reg('lock', b => { const { w, d, h } = b; b.rb(w * 0.55, h, 3, 1.5, 0, 0, d / 2 - 1.5, mat('#2a2d33', 0.4, 0.5)); b.cyl(h * 0.3, h * 0.3, 2, 0, h * 0.62, d / 2 + 1, mat(P.chrome, 0.2, 1), 16).rotation.x = Math.PI / 2; b.sph(0.7, 0, h * 0.2, d / 2 + 1.5, b.lv('#400', '#3de07a', 1.6)); });
  reg('printer printer3d', b => {
    const { w, d, h } = b; if (b.it.type === 'printer3d') { const fr = mat('#2a2d33', 0.4, 0.4); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(2.5, h, 2.5, x * (w / 2 - 1.5), 0, z * (d / 2 - 1.5), fr)); b.box(w, 3, d, 0, 0, 0, fr); b.box(w, 3, 3, 0, h - 3, 0, fr); b.box(w * 0.6, 1.4, d * 0.6, 0, h * 0.25, 0, mat('#4d5560', 0.4, 0.6)); b.box(w * 0.7, h * 0.5, 0.4, 0, h * 0.25, d / 2 - 1, b.glass()); return; }
    b.rb(w, h, d, 2, 0, 0, 0, mat('#e5e7e9', 0.45)); b.box(w * 0.7, 2, d * 0.3, 0, h * 0.35, d / 2 + 4, mat('#f7f7f5', 0.7)); b.box(w * 0.7, 1.2, 4, 0, h * 0.4, d / 2 - 1, mat('#222')); b.box(8, 3, 0.6, w * 0.3, h * 0.85, d / 2 + 0.1, b.lv('#1b2530', '#7fe3a0', 0.9));
  });
  function stripeTex(col) {
    const k = 'stripe|' + col;
    if (!cache.has(k)) { const c = document.createElement('canvas'); c.width = 8; c.height = 16; const g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 8, 16); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 12, 8, 4); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, 8, 2); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; cache.set(k, t); }
    const t = cache.get(k).clone(); t.needsUpdate = true; return t;
  }
  // Rollladen / Außenrollo: Panzer fährt hoch/runter (anim.set(offen 0..1))
  reg('blind shutter_outdoor', b => {
    const { w, h } = b, out = b.it.type === 'shutter_outdoor', L = Math.max(20, h - 8), tex = stripeTex(out ? '#8a8f96' : '#ece8dc');
    b.box(w + 4, 8, 9, 0, h - 8, 0, mat(P.white, 0.4)); [-1, 1].forEach(s2 => b.box(3, L, 4, s2 * (w / 2 + 1), 0, 0, mat(P.white, 0.5)));
    const geo = new T.BoxGeometry(w - 4, L, 1.4); geo.translate(0, -L / 2, 0);
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: out ? 0.4 : 0 })); m.position.set(0, h - 8, 0); m.castShadow = true; b.g.add(m);
    const bar = b.box(w - 2, 3, 3, 0, 0, 0, mat(P.white, 0.4));
    b.anim = { type: 'cover', set: o => { const f = Math.max(0.03, 1 - o); m.scale.y = f; tex.repeat.set(1, L * f / 5); bar.position.y = h - 8 - L * f - 0.5; } };
    b.anim.set(0.4);
  });
  reg('curtain_motor', b => {
    const { w, h } = b, col = '#cdbfa9', mk2 = sx => { const g2 = new T.BoxGeometry(1, h - 8, 3); g2.translate(sx * 0.5, 0, 0); const mm = new T.Mesh(g2, new T.MeshStandardMaterial({ map: stripeTex(col), roughness: 0.95 })); mm.rotation.z = 0; mm.position.set(sx * -w / 2, h / 2 - 3, 0); mm.castShadow = true; b.g.add(mm); mm.material.map.repeat.set(4, 1); return mm; };
    b.cyl(1, 1, w + 8, 0, h - 3, 0, mat(P.black, 0.4, 0.6), 8).rotation.z = Math.PI / 2;
    const L = mk2(-1), R = mk2(1);
    b.anim = { type: 'cover', set: o => { const wd = Math.max(0.1, 1 - o) * w * 0.5; L.scale.x = wd; R.scale.x = wd; } };
    b.anim.set(0.4);
  });
  reg('awning', b => {
    const { w, h } = b, geo = new T.BoxGeometry(w, 1.6, 1); geo.translate(0, 0, 0.5);
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: stripeTex('#e0554f'), roughness: 0.85 })); m.position.set(0, h - 4, 6); m.castShadow = true; b.g.add(m); m.material.map.repeat.set(1, 1);
    b.box(w, 9, 9, 0, h - 9, 0, mat(P.white, 0.4)); const bar = b.box(w, 4, 3, 0, 0, 0, mat(P.white, 0.4));
    b.anim = { type: 'cover', set: o => { const ext = 200 * Math.max(0.06, o); m.scale.z = ext; m.rotation.x = 0.16; m.position.y = h - 6; bar.position.set(0, h - 6 - Math.sin(0.16) * ext, 6 + ext * Math.cos(0.16)); } };
    b.anim.set(0.4);
  });
  reg('curtain', b => { const { w, d, h } = b, n = Math.max(6, Math.round(w / 8)); b.cyl(1, 1, w, 0, h - 3, 0, mat(P.black, 0.4, 0.6), 8).rotation.z = Math.PI / 2; for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * w / n, dz = (i % 2) * 2.4; b.box(w / n * 0.92, h - 6, 1.4, x, 0, dz - 1, mat(b.col || '#d9d2c3', 0.95)); } });

  // ---------- Treppen ----------
  reg('stairs stairs_wide stairs_basement stairs_outdoor', b => {
    const { w, d, h } = b, n = Math.max(6, Math.round(h / 18)), th = h / n, rd = d / n, wd = mat(b.it.type === 'stairs_outdoor' ? P.concrete : P.oak, 0.6), st = mat(b.it.type === 'stairs_outdoor' ? '#9aa0a6' : P.walnut, 0.6);
    for (let i = 0; i < n; i++) { b.box(w, th * (i + 1) * 0.98, rd, 0, 0, d / 2 - rd * (i + 0.5), st); b.box(w + 1, 2.5, rd + 1, 0, th * (i + 1) - 2.5, d / 2 - rd * (i + 0.5), wd); }
    [-1, 1].forEach(s => { const L = Math.hypot(d, h), m = b.box(2.5, 3, L, s * (w / 2 - 1.5), 0, 0, mat(P.walnut, 0.5)); m.position.set(s * (w / 2 - 1.5), h / 2 + 85, 0); m.rotation.x = Math.atan2(h, d); b.cyl(1.3, 1.3, 85, s * (w / 2 - 1.5), h + 0, -d / 2 + 2, mat(P.walnut, 0.5), 8).position.y = h + 42; });
    for (let i = 0; i < n; i += 3) [-1, 1].forEach(s => b.cyl(1.3, 1.3, 85, s * (w / 2 - 1.5), th * (i + 1), d / 2 - rd * (i + 0.5), mat(P.walnut, 0.5), 8));
  });
  reg('stairs_L', b => {
    const { w, d, h } = b, n = Math.max(8, Math.round(h / 18)), th = h / n, n1 = Math.round(n / 2), st = mat(P.walnut, 0.6), wd = mat(P.oak, 0.6), ww = Math.min(w, d) * 0.5;
    const rd = (d - ww) / n1; for (let i = 0; i < n1; i++) { b.box(ww, th * (i + 1), rd, -w / 2 + ww / 2, 0, d / 2 - rd * (i + 0.5), st); b.box(ww + 1, 2.5, rd + 1, -w / 2 + ww / 2, th * (i + 1) - 2.5, d / 2 - rd * (i + 0.5), wd); }
    b.box(ww, th * (n1 + 1), ww, -w / 2 + ww / 2, 0, -d / 2 + ww / 2, wd);
    const n2 = n - n1 - 1, rw = (w - ww) / Math.max(1, n2); for (let i = 0; i < n2; i++) { b.box(rw, th * (n1 + 2 + i), ww, -w / 2 + ww + rw * (i + 0.5), 0, -d / 2 + ww / 2, st); b.box(rw + 1, 2.5, ww + 1, -w / 2 + ww + rw * (i + 0.5), th * (n1 + 2 + i) - 2.5, -d / 2 + ww / 2, wd); }
  });
  reg('stairs_U', b => {
    const { w, d, h } = b, n = Math.max(8, Math.round(h / 18)), th = h / n, n1 = Math.round(n / 2) - 1, st = mat(P.walnut, 0.6), wd = mat(P.oak, 0.6), ww = (w - 6) / 2, ld = Math.min(ww * 1.1, d * 0.3), rd = (d - ld) / n1;
    for (let i = 0; i < n1; i++) { b.box(ww, th * (i + 1), rd, -w / 2 + ww / 2, 0, d / 2 - rd * (i + 0.5), st); b.box(ww + 1, 2.5, rd + 1, -w / 2 + ww / 2, th * (i + 1) - 2.5, d / 2 - rd * (i + 0.5), wd); }
    b.box(w, th * (n1 + 1), ld, 0, 0, -d / 2 + ld / 2, wd);
    const n2 = n - n1 - 1; const rd2 = (d - ld) / Math.max(1, n2); for (let i = 0; i < n2; i++) { b.box(ww, th * (n1 + 2 + i), rd2, w / 2 - ww / 2, 0, -d / 2 + ld + rd2 * (i + 0.5), st); b.box(ww + 1, 2.5, rd2 + 1, w / 2 - ww / 2, th * (n1 + 2 + i) - 2.5, -d / 2 + ld + rd2 * (i + 0.5), wd); }
  });
  reg('stairs_spiral stairs_spiral_small', b => {
    const { w, d, h } = b, R0 = Math.min(w, d) / 2, n = Math.max(12, Math.round(h / 19)), th = h / n, st = mat(P.oak, 0.55), mt = mat(P.black, 0.4, 0.6), turn = 1.35 * Math.PI * 2 * (h / 260), da = turn / n;
    b.cyl(5, 5, h, 0, 0, 0, mt, 14);
    for (let i = 0; i < n; i++) {
      const a0 = i * da - Math.PI / 2, geo = new T.CylinderGeometry(R0, R0, 4, 8, 1, false, a0, da * 1.15), m = b.add(geo, st, 0, th * (i + 1) - 2, 0); void m;
      const a = a0 + da / 2 + Math.PI / 2; b.cyl(1, 1, 80, Math.sin(a) * (R0 - 2), th * (i + 1), Math.cos(a) * (R0 - 2), mt, 6);
    }
  });

  // ---------- Deko / Pflanzen ----------
  reg('plant plant_big plant_small', b => {
    const { w, d, h } = b, r = Math.min(w, d) / 2, ph = h * 0.28;
    b.cyl(r * 0.75, r * 0.55, ph, 0, 0, 0, mat('#b5653a', 0.8), 16); b.cyl(r * 0.7, r * 0.7, 1, 0, ph, 0, mat(P.soil, 1), 16);
    for (let i = 0; i < 9; i++) { const a = i * 2.4, k = 0.5 + (i % 3) * 0.25; b.sph(r * 0.5, Math.cos(a) * r * 0.5 * k, ph + (h - ph) * (0.3 + 0.07 * i), Math.sin(a) * r * 0.5 * k, mat(i % 2 ? P.leaf : '#4a8f45', 0.8), 1, 1.4, 1); }
  });
  reg('rug rug_round playmat', b => { const { w, d } = b; if (b.it.shape === 'ellipse' || b.it.type === 'rug_round') { b.cyl(w / 2, w / 2, 1.4, 0, 0, 0, mat(b.col || '#b9a58c', 1), 36); b.cyl(w / 2 - 6, w / 2 - 6, 1.6, 0, 0, 0, mat('#d8cbb4', 1), 36); } else { b.rb(w, 1.6, d, 0.6, 0, 0, 0, mat(b.col || '#b9a58c', 1)); b.rb(w - 12, 1.8, d - 12, 0.6, 0, 0, 0, mat('#d8cbb4', 1)); } });
  reg('pillar pillar_round chimney', b => { const t = b.it.type, m = mat(b.col || (t === 'chimney' ? P.brick : '#d8d6d0'), 0.8); if (t === 'pillar_round') b.cyl(b.w / 2, b.w / 2, b.h, 0, 0, 0, m, 24); else b.box(b.w, b.h, b.d, 0, 0, 0, m); });
  reg('niche', b => { b.box(b.w, b.h, b.d, 0, 0, 0, mat('#d5d0c7', 0.8)); });
  reg('elevator', b => { const { w, d, h } = b; b.box(w, h, d, 0, 0, 0, mat('#c8ccd1', 0.35, 0.7)); b.box(w * 0.7, h * 0.85, 1, 0, 0, d / 2 + 0.2, mat('#aab0b6', 0.25, 0.9)); b.box(1, h * 0.85, 1.4, 0, 0, d / 2 + 0.6, mat('#2a2d33')); });
  reg('safe', b => { const { w, d, h } = b; b.rb(w, h, d, 2, 0, 0, 0, mat('#3a3f47', 0.4, 0.7)); b.cyl(h * 0.2, h * 0.2, 2, 0, h * 0.5, d / 2 + 0.3, mat(P.chrome, 0.2, 1), 20).rotation.x = Math.PI / 2; b.box(h * 0.14, h * 0.1, 1, w * 0.3, h * 0.78, d / 2 + 0.2, b.lv('#101214', '#7fe3a0', 1)); });
  reg('fire_ext', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r * 0.7, r * 0.7, b.h * 0.75, 0, 0, 0, mat('#c0392b', 0.4, 0.3), 16); b.cyl(r * 0.25, r * 0.25, b.h * 0.1, 0, b.h * 0.75, 0, mat(P.black), 10); b.box(r * 1.2, 1.5, 1.5, 0, b.h * 0.87, 0, mat(P.black)); });
  reg('cable_duct', b => b.box(b.w, b.h, b.d, 0, 0, 0, mat('#e4e6e8', 0.6)));
  reg('aquarium', b => { const { w, d, h } = b; b.box(w, h * 0.35, d, 0, 0, 0, mat('#3a2e26', 0.6)); b.box(w - 2, h * 0.6, d - 2, 0, h * 0.35, 0, mat(P.water, 0.05, 0.1, { transparent: true, opacity: 0.4, depthWrite: false })); b.box(w - 4, 3, d - 4, 0, h * 0.35, 0, mat('#d8c9a0', 1)); for (let i = 0; i < 4; i++) b.sph(2.4, -w * 0.3 + i * w * 0.2, h * 0.6, (i % 2 - 0.5) * d * 0.3, mat(i % 2 ? '#ff8a3d' : '#ffd23d', 0.4), 1.6, 1, 0.7); b.box(w, 2, d, 0, h * 0.95, 0, b.lv('#222', '#bfe9ff', 0.8)); });
  reg('whiteboard', b => { b.box(b.w, b.h, b.d, 0, 0, 0, mat('#8f949a', 0.4, 0.6)); b.box(b.w - 3, b.h - 3, 0.6, 0, 1.5, b.d / 2, mat('#fbfbfb', 0.3)); });
  reg('toy_box', b => { b.rb(b.w, b.h, b.d, 2, 0, 0, 0, mat(b.col || '#e8a33d', 0.7)); b.sph(5, -b.w * 0.2, b.h + 3, 0, mat('#e74c3c', 0.5)); b.box(8, 8, 8, b.w * 0.15, b.h, 0, mat('#3498db', 0.6)); });
  reg('cat_tree', b => { const { w, d, h } = b, c = mat('#cdb996', 0.95); b.cyl(w * 0.5, w * 0.5, 4, 0, 0, 0, c, 20); b.cyl(4, 4, h * 0.9, 0, 0, 0, mat('#b49a74', 1), 12); b.cyl(w * 0.4, w * 0.4, 3, 0, h * 0.4, 0, c, 20); b.cyl(w * 0.35, w * 0.35, 3, 0, h * 0.9, 0, c, 20); });
  reg('dog_bed', b => { const { w, d, h } = b; b.rb(w, h, d, h * 0.45, 0, 0, 0, mat(b.col || '#8a6f5a', 1)); b.rb(w - 14, h * 0.5, d - 14, 3, 0, h * 0.4, 0, mat('#cbb8a2', 1)); });
  reg('litter cage pet_flap', b => { b.rb(b.w, b.h, b.d, 2, 0, 0, 0, mat('#cfd6dc', 0.6)); });
  reg('playpen', b => { const { w, d, h } = b, wd = mat(P.birch, 0.5); b.box(w, 3, d, 0, 0, 0, mat('#8fb8d8', 1)); for (let i = 0; i < 8; i++) { const x = -w / 2 + 3 + i * (w - 6) / 7; b.box(1.6, h - 6, 1.6, x, 3, d / 2 - 1.5, wd); b.box(1.6, h - 6, 1.6, x, 3, -d / 2 + 1.5, wd); const z = -d / 2 + 3 + i * (d - 6) / 7; b.box(1.6, h - 6, 1.6, w / 2 - 1.5, 3, z, wd); b.box(1.6, h - 6, 1.6, -w / 2 + 1.5, 3, z, wd); } [[0, d / 2 - 1.5, w, 3], [0, -d / 2 + 1.5, w, 3]].forEach(([x, z, W, D]) => b.box(W, 3, D, x, h - 4, z, wd)); [[w / 2 - 1.5, 0, 3, d], [-w / 2 + 1.5, 0, 3, d]].forEach(([x, z, W, D]) => b.box(W, 3, D, x, h - 4, z, wd)); });
  reg('console', b => { b.rb(b.w, b.h, b.d, 2, 0, 0, 0, mat('#e8eaed', 0.35)); b.sph(0.7, b.w * 0.4, b.h * 0.7, b.d / 2, b.lv('#222', '#4fb0ff', 1.6)); });

  // ---------- Außen ----------
  reg('car', b => {
    const { w, d, h } = b, col = mat(b.col || '#b8bfc7', 0.25, 0.6), tire = mat('#16171a', 0.8);
    b.rb(w, h * 0.42, d, 10, 0, h * 0.2, 0, col); b.rb(w * 0.9, h * 0.34, d * 0.52, 12, 0, h * 0.6, -d * 0.03, mat('#1d2a38', 0.08, 0.4));
    b.rb(w * 0.86, h * 0.1, d * 0.5, 8, 0, h * 0.92, -d * 0.03, col);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => { const m = b.cyl(h * 0.2, h * 0.2, 22, x * (w / 2 - 6), 0, z * d * 0.32, tire, 20); m.rotation.z = Math.PI / 2; m.position.y = h * 0.2; b.cyl(h * 0.12, h * 0.12, 23, x * (w / 2 - 6), 0, z * d * 0.32, mat(P.chrome, 0.2, 0.9), 14).rotation.z = Math.PI / 2; });
    [-1, 1].forEach(s => { b.box(w * 0.2, 6, 2, s * w * 0.33, h * 0.36, d / 2, b.lv('#fff', '#fff6d0', 1.3)); b.box(w * 0.2, 6, 2, s * w * 0.33, h * 0.36, -d / 2, mat('#b1262c', 0.4)); });
  });
  reg('carport', b => { const { w, d, h } = b; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(10, 250, 10, x * (w / 2 - 5), 0, z * (d / 2 - 5), mat('#4a4f57', 0.5, 0.5))); b.box(w, 8, d, 0, 250, 0, mat('#8b9096', 0.5, 0.4)); });
  reg('garage_door', b => { const { w, d, h } = b; for (let i = 0; i < 6; i++) b.box(w - 2, h / 6 - 0.5, d, 0, i * h / 6, 0, mat('#d9dce0', 0.5)); });
  reg('bike', b => { const { w, d, h } = b, m = mat('#c0392b', 0.4, 0.5); [-1, 1].forEach(s => { const t = b.tor(h * 0.36, 1.4, 0, h * 0.36, s * d * 0.34, mat('#1a1a1a', 0.9), 28); t.rotation.y = Math.PI / 2; }); b.box(1.6, 1.6, d * 0.7, 0, h * 0.55, 0, m); b.box(1.6, h * 0.4, 1.6, 0, h * 0.4, -d * 0.1, m).rotation.x = 0.3; b.box(w, 1.5, 1.5, 0, h * 0.95, d * 0.34, mat(P.black)); });
  reg('lounger', b => { const { w, d, h } = b, f = mat(P.white, 0.5), wd = mat('#8c6a4a', 0.6); b.box(w, 4, d * 0.6, 0, h * 0.5, d * 0.2, mat('#d9d5c9', 0.9)); const bk = b.box(w, 4, d * 0.4, 0, h * 0.7, -d * 0.33, mat('#d9d5c9', 0.9)); bk.rotation.x = 0.7; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(3, h * 0.5, 3, x * (w / 2 - 3), 0, z * d * 0.4, wd)); void f; });
  reg('grill', b => { const r = Math.min(b.w, b.d) / 2; b.sph(r * 0.9, 0, b.h * 0.62, 0, mat('#1e2024', 0.35, 0.5), 1, 0.7, 1); b.sph(r * 0.9, 0, b.h * 0.62, 0, mat('#2a2d33', 0.35, 0.5), 1, 0.35, 1); [[-1, -1], [1, -1], [0, 1]].forEach(([x, z]) => b.cyl(1.5, 1, b.h * 0.55, x * r * 0.6, 0, z * r * 0.55, mat(P.black), 8)); b.box(r * 1.4, 2, 3, 0, b.h * 0.85, r * 0.85, mat(P.black)); });
  reg('pool', b => { const { w, d } = b; b.box(w, 4, d, 0, 0, 0, mat('#e6e1d6', 0.6)); b.box(w - 24, 3, d - 24, 0, 1, 0, mat(P.water, 0.04, 0.25, { transparent: true, opacity: 0.82, emissive: 0x0a3a52, emissiveIntensity: 0.25 })); });
  reg('tree', b => { const { w, d, h } = b, r = Math.min(w, d) / 2; b.cyl(r * 0.08, r * 0.12, h * 0.45, 0, 0, 0, mat('#6b4a32', 0.9), 10); [[0, 0.62, 0, 0.95], [0.4, 0.5, 0.2, 0.7], [-0.35, 0.55, -0.2, 0.7], [0.1, 0.8, 0.1, 0.6]].forEach(([x, y, z, s], i) => b.sph(r * s, x * r, h * y, z * r, mat(i % 2 ? '#4f8a3f' : '#5d9b4a', 0.9), 1, 0.95, 1)); });
  reg('bush', b => { const r = Math.min(b.w, b.d) / 2; [[0, 0, 0, 1], [0.5, 0, 0.2, 0.7], [-0.5, 0, -0.2, 0.7]].forEach(([x, y, z, s], i) => b.sph(r * s, x * r, r * 0.8 * s, z * r, mat(i % 2 ? '#468a3d' : '#59a04a', 0.9), 1, 0.85, 1)); });
  reg('hedge', b => { b.rb(b.w, b.h, b.d, 6, 0, 0, 0, mat('#3f7d3a', 0.95)); });
  reg('fence', b => { const { w, d, h } = b, wd = mat('#a97c50', 0.7), n = Math.max(2, Math.round(w / 60)); for (let i = 0; i <= n; i++) b.box(5, h, 5, -w / 2 + i * w / n, 0, 0, wd); [0.3, 0.75].forEach(y => b.box(w, 5, 2.5, 0, h * y, 2, wd)); for (let i = 0; i < n * 5; i++) b.box(7, h * 0.9, 1.5, -w / 2 + 6 + i * (w - 12) / (n * 5 - 1), 2, -1, mat('#b98a58', 0.7)); void d; });
  reg('gate', b => { const { w, d, h } = b, m = mat('#2d3238', 0.4, 0.6); [-1, 1].forEach(s => b.box(8, h, 8, s * (w / 2 - 4), 0, 0, m)); b.box(w - 16, 4, 3, 0, h * 0.2, 0, m); b.box(w - 16, 4, 3, 0, h * 0.85, 0, m); for (let i = 0; i < 12; i++) b.box(2, h * 0.7, 2, -w / 2 + 12 + i * (w - 24) / 11, h * 0.2, 0, m); void d; });
  reg('flowerbed', b => { const { w, d, h } = b; b.rb(w, h, d, 3, 0, 0, 0, mat('#8e8a82', 0.9)); b.box(w - 8, 1, d - 8, 0, h - 0.5, 0, mat(P.soil, 1)); const cs = ['#e74c3c', '#f1c40f', '#e67eb4', '#9b59b6']; for (let i = 0; i < 14; i++) { const x = -w / 2 + 12 + (i * 37 % 100) / 100 * (w - 24), z = -d / 2 + 10 + ((i * 53) % 100) / 100 * (d - 20); b.cyl(0.5, 0.5, 10, x, h, z, mat(P.leaf), 5); b.sph(3, x, h + 11, z, mat(cs[i % 4], 0.6)); } });
  reg('lawn', b => { b.rb(b.w, b.h + 1, b.d, 0.5, 0, 0, 0, mat(b.col || '#6aa84f', 1)); });
  reg('driveway', b => { b.box(b.w, b.h + 1, b.d, 0, 0, 0, mat(b.col || '#9a9ea3', 0.95)); });
  reg('mailbox', b => { const { w, d, h } = b; b.box(3, h * 0.55, 3, 0, 0, 0, mat('#4a4f57', 0.5, 0.5)); b.rb(w, h * 0.35, d, 3, 0, h * 0.62, 0, mat('#d9a521', 0.5)); b.box(w * 0.7, 1, 1, 0, h * 0.76, d / 2, mat(P.black)); });
  reg('shed', b => { const { w, d, h } = b; b.box(w, h * 0.78, d, 0, 0, 0, mat('#a97c50', 0.75)); const sh = new T.Shape(); sh.moveTo(-w / 2 - 8, 0); sh.lineTo(w / 2 + 8, 0); sh.lineTo(0, h * 0.28); sh.closePath(); const geo = new T.ExtrudeGeometry(sh, { depth: d + 12, bevelEnabled: false }); geo.translate(0, 0, -(d + 12) / 2); b.add(geo, mat('#5a3d2a', 0.8), 0, h * 0.78, 0).rotation.y = 0; b.box(w * 0.3, h * 0.6, 1, -w * 0.2, 0, d / 2 + 0.3, mat('#7d5a38', 0.7)); b.box(w * 0.22, h * 0.25, 1, w * 0.22, h * 0.3, d / 2 + 0.3, b.glass()); });
  reg('rain_barrel', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r, r * 0.92, b.h, 0, 0, 0, mat('#2f6f4a', 0.5), 24); [0.2, 0.8].forEach(y => b.tor(r * 0.97, 1, 0, b.h * y, 0, mat('#1f3d2c', 0.5), 28).rotation.x = Math.PI / 2); });
  reg('sandbox', b => { const { w, d, h } = b, wd = mat('#a97c50', 0.7); b.box(w, h * 0.5, d, 0, 0, 0, mat('#e2cf9a', 1)); b.box(w, h, 3, 0, 0, d / 2 - 1.5, wd); b.box(w, h, 3, 0, 0, -d / 2 + 1.5, wd); b.box(3, h, d, w / 2 - 1.5, 0, 0, wd); b.box(3, h, d, -w / 2 + 1.5, 0, 0, wd); });
  reg('trampoline', b => { const { w, d, h } = b, r = Math.min(w, d) / 2; b.tor(r * 0.95, 2, 0, h, 0, mat('#2a4d8f', 0.5), 36).rotation.x = Math.PI / 2; b.cyl(r * 0.9, r * 0.9, 1, 0, h - 1, 0, mat('#1a1a1a', 0.9), 36); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; b.cyl(1.4, 1.4, h, Math.cos(a) * r * 0.9, 0, Math.sin(a) * r * 0.9, mat(P.chrome, 0.3, 0.8), 8); } });
  reg('swing', b => { const { w, d, h } = b, wd = mat('#a97c50', 0.7); [-1, 1].forEach(s => { [-1, 1].forEach(z => { const m = b.box(6, h, 6, s * (w / 2 - 3), 0, z * d * 0.4, wd); m.rotation.z = -s * 0.12; m.rotation.x = z * 0.0; }); }); b.box(w, 8, 8, 0, h - 8, 0, wd); [-0.25, 0.25].forEach(x => { b.cyl(0.4, 0.4, h * 0.75, x * w, h * 0.22, 0, mat(P.chrome, 0.3, 0.8), 6); b.box(w * 0.2, 3, 22, x * w, h * 0.2, 0, mat('#2e86c1', 0.6)); }); });
  reg('firepit', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(r, r * 0.9, b.h, 0, 0, 0, mat('#4a4f57', 0.6, 0.5), 28); b.cyl(r * 0.8, r * 0.8, 1, 0, b.h - 0.5, 0, mat('#15110d'), 28); b.sph(r * 0.4, 0, b.h + 4, 0, b.lv('#2a1a10', '#ff7a1a', 1.5), 1, 1.2, 1); });
  reg('parasol', b => { const r = Math.min(b.w, b.d) / 2; b.cyl(1.6, 1.6, b.h, 0, 0, 0, mat(P.chrome, 0.4, 0.7), 8); b.add(new T.CylinderGeometry(2, r, b.h * 0.14, 18, 1, true), mat('#e8dcc4', 0.9, 0, { side: T.DoubleSide }), 0, b.h * 0.86, 0); b.cyl(r * 0.2, r * 0.2, 4, 0, 0, 0, mat('#555'), 10); });
  reg('bell', b => { const p = plate(b, 1); b.cyl(p.s * 0.28, p.s * 0.28, 1, 0, p.s * 0.5, p.z + 0.2, b.lv('#d9d9d4', '#ffe27a', 1.2), 18).rotation.x = Math.PI / 2; });
  reg('irrigation smart_blind_ctrl', b => { const r = Math.min(b.w, b.d) / 2; b.rb(r * 1.6, Math.max(6, b.h), r * 1.6, 2, 0, 0, 0, mat('#2f6f4a', 0.5)); b.sph(0.7, 0, Math.max(6, b.h), 0, b.lv('#400', '#3de07a', 1.6)); });
  reg('powerstrip', b => { const { w, d } = b; b.rb(w, 3.2, 8, 1.2, 0, 0, 0, mat('#f1f1ef', 0.4)); for (let i = 0; i < 5; i++) b.box(5, 0.6, 5, -w / 2 + 6 + i * (w - 12) / 4, 3.2, 0, mat('#1c1c1c', 0.5)); b.box(4, 1.4, 1.5, w / 2 - 3, 3.2, 3, b.lv('#400', '#ff4a3a', 1.4)); void d; });
  reg('window_small window_skylight archway door_front door_terrace door_sliding window_corner window_double_big', () => null);


  // ---------- Garten ----------
  const crown = (b, r, cx, cy, cz, cols, n) => { for (let i = 0; i < (n || 6); i++) { const a = i * 2.4, k = i === 0 ? 0 : 0.55; b.sph(r * (i === 0 ? 1 : 0.62), cx + Math.cos(a) * r * k, cy + (i % 3) * r * 0.18, cz + Math.sin(a) * r * k, mat(cols[i % cols.length], 0.9), 1, 0.9, 1); } };
  reg('tree_fruit', b => { const r = Math.min(b.w, b.d) / 2, h = b.h; b.cyl(r * 0.07, r * 0.1, h * 0.42, 0, 0, 0, mat('#6b4a32', 0.9), 10); crown(b, r * 0.85, 0, h * 0.7, 0, ['#5d9b4a', '#6aa84f', '#4f8a3f'], 7); for (let i = 0; i < 7; i++) b.sph(3.2, Math.cos(i * 1.9) * r * 0.7, h * 0.68 + (i % 3) * 14, Math.sin(i * 1.9) * r * 0.7, mat('#d9382c', 0.5)); });
  reg('tree_conifer', b => { const r = Math.min(b.w, b.d) / 2, h = b.h; b.cyl(r * 0.06, r * 0.08, h * 0.2, 0, 0, 0, mat('#5b3f2b', 0.9), 8); for (let i = 0; i < 5; i++) b.cyl(r * (0.12 + 0.18 * (4 - i) / 4 * 1.0 + 0.0), r * (0.35 + 0.65 * (4 - i) / 4), h * 0.28, 0, h * 0.14 + i * h * 0.16, 0, mat(i % 2 ? '#2f6b3c' : '#3a7a46', 0.9), 14); });
  reg('palm', b => { const r = Math.min(b.w, b.d) / 2, h = b.h; const tr = b.cyl(r * 0.07, r * 0.1, h * 0.8, 0, 0, 0, mat('#8a6a46', 0.9), 10); tr.rotation.z = 0.06; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, lf = b.box(r * 1.1, 1.2, 10, Math.cos(a) * r * 0.5, h * 0.82 - 6, Math.sin(a) * r * 0.5, mat('#4f9a3f', 0.8)); lf.rotation.y = -a; lf.rotation.z = Math.cos(a) * 0.0; lf.rotation.x = 0; lf.position.y = h * 0.8 - Math.abs(0); } b.sph(8, 0, h * 0.8, 0, mat('#6b4a32'), 1, 0.8, 1); });
  reg('bush_flower', b => { const r = Math.min(b.w, b.d) / 2; [[0, 1], [0.5, 0.65], [-0.5, 0.65]].forEach(([x, s2], i) => b.sph(r * s2, x * r, r * 0.8 * s2, 0, mat('#4a8f45', 0.9), 1, 0.85, 1)); const cs = ['#f48fb1', '#f8bbd0', '#ce93d8', '#fff59d']; for (let i = 0; i < 14; i++) b.sph(3, Math.cos(i * 2.2) * r * 0.75, r * 0.55 + (i % 4) * 7, Math.sin(i * 2.2) * r * 0.6, mat(cs[i % 4], 0.6)); });
  reg('planter', b => { const r = Math.min(b.w, b.d) / 2, h = b.h; b.cyl(r * 0.85, r * 0.6, h * 0.55, 0, 0, 0, mat(b.col || '#b5653a', 0.8), 20); b.cyl(r * 0.8, r * 0.8, 1, 0, h * 0.55, 0, mat(P.soil, 1), 20); for (let i = 0; i < 6; i++) b.sph(r * 0.4, Math.cos(i * 1.1) * r * 0.35, h * 0.55 + r * 0.4 + i * 3, Math.sin(i * 1.1) * r * 0.35, mat(i % 2 ? '#5d9b52' : '#4a8f45', 0.8), 1, 1.2, 1); });
  reg('raised_bed veggie_patch', b => { const { w, d, h } = b, wd = mat('#a97c50', 0.8), raised = b.it.type === 'raised_bed', bh = raised ? h : Math.min(h, 12); b.box(w, bh, 4, 0, 0, d / 2 - 2, wd); b.box(w, bh, 4, 0, 0, -d / 2 + 2, wd); b.box(4, bh, d - 8, w / 2 - 2, 0, 0, wd); b.box(4, bh, d - 8, -w / 2 + 2, 0, 0, wd); b.box(w - 8, bh - 2, d - 8, 0, 0, 0, mat(P.soil, 1)); const n = Math.round(w / 22), m = Math.max(2, Math.round(d / 30)); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { b.cyl(0.6, 0.6, 14, -w / 2 + 16 + i * (w - 32) / Math.max(1, n - 1), bh, -d / 2 + 14 + j * (d - 28) / Math.max(1, m - 1), mat(P.leaf), 5); b.sph(6, -w / 2 + 16 + i * (w - 32) / Math.max(1, n - 1), bh + 14, -d / 2 + 14 + j * (d - 28) / Math.max(1, m - 1), mat((i + j) % 2 ? '#5d9b52' : '#7cb342', 0.8), 1, 0.9, 1); } });
  reg('meadow', b => { const { w, d } = b; b.rb(w, 3, d, 1, 0, 0, 0, mat('#8fb857', 1)); const cs = ['#fff176', '#f48fb1', '#ffffff', '#ba68c8', '#ffb74d']; for (let i = 0; i < 40; i++) { const x = ((i * 37) % 100) / 100 * (w - 20) - (w - 20) / 2, z = ((i * 53) % 100) / 100 * (d - 20) - (d - 20) / 2; b.cyl(0.4, 0.4, 14, x, 3, z, mat(P.leaf), 4); b.sph(2.6, x, 18, z, mat(cs[i % 5], 0.6)); } });
  reg('rocks', b => { const r = Math.min(b.w, b.d) / 2; [[0, 0, 1, 0.7], [0.55, 0.3, 0.6, 0.6], [-0.5, -0.25, 0.7, 0.55]].forEach(([x, z, s2, hy], i) => b.sph(r * s2, x * r, r * s2 * hy * 0.7, z * r, mat(i % 2 ? '#9a9a96' : '#8c8c88', 1), 1, hy, 0.9)); });
  reg('hedge_corner', b => b.rb(b.w, b.h, b.d, 6, 0, 0, 0, mat('#3f7d3a', 0.95)));
  reg('trellis', b => { const { w, d, h } = b, wd = mat('#8c6a4a', 0.7); for (let i = 0; i <= 8; i++) b.box(2, h, 2, -w / 2 + i * w / 8, 0, 0, wd); for (let j = 1; j < 8; j++) b.box(w, 2, 2, 0, j * h / 8, 0, wd); for (let i = 0; i < 12; i++) b.sph(7, -w / 2 + 6 + (i % 6) * (w - 12) / 5, h * 0.3 + Math.floor(i / 6) * h * 0.4, 2, mat('#4a8f45', 0.9), 1, 1, 0.5); void d; });
  reg('vineyard', b => { const { w, h } = b, wd = mat('#8c6a4a', 0.7); for (let i = 0; i <= 5; i++) b.box(4, h, 4, -w / 2 + i * w / 5, 0, 0, wd); [0.35, 0.65, 0.95].forEach(y => b.box(w, 0.8, 0.8, 0, h * y, 0, mat('#555'))); for (let i = 0; i < 14; i++) b.sph(6, -w / 2 + 10 + i * (w - 20) / 13, h * (0.3 + (i % 3) * 0.3), 3, mat('#5d9b52', 0.9), 1, 1, 0.6); });
  reg('pond', b => { const { w, d } = b; b.add(new T.CylinderGeometry(0.5, 0.5, 6, 32), mat('#8c8c88', 1), 0, 0, 0).scale.set(w / 2 + 6, 1, d / 2 + 6); const m = b.add(new T.CylinderGeometry(0.5, 0.5, 2, 32), mat('#2f8fc8', 0.04, 0.2, { transparent: true, opacity: 0.85 }), 0, 3, 0); m.scale.set(w - 10, 1, d - 10); b.sph(14, w * 0.2, 4, 0, mat('#8c8c88', 1), 1, 0.4, 1); for (let i = 0; i < 4; i++) b.cyl(7, 7, 0.6, -w * 0.2 + i * 14, 4, d * 0.1 - i * 8, mat('#5fa04e', 0.8), 14); });
  reg('fountain', b => { const r = Math.min(b.w, b.d) / 2, h = b.h; b.cyl(r, r, 30, 0, 0, 0, mat('#b9b6ae', 0.9), 32); b.cyl(r - 6, r - 6, 2, 0, 29, 0, mat('#2f8fc8', 0.05, 0.2, { transparent: true, opacity: 0.85 }), 32); b.cyl(6, 8, h * 0.5, 0, 30, 0, mat('#b9b6ae', 0.9), 14); b.cyl(r * 0.5, r * 0.3, 8, 0, h * 0.5, 0, mat('#b9b6ae', 0.9), 20); sprayAnim(b, { y: h * 0.62, n: 40, jets: 8, range: r * 0.55, height: 55, rot: 0, speed: 0.9, size: 1.1 }); });
  reg('birdbath', b => { b.cyl(4, 6, b.h * 0.7, 0, 0, 0, mat('#b9b6ae', 0.9), 12); b.cyl(b.w / 2, 6, 6, 0, b.h * 0.7, 0, mat('#b9b6ae', 0.9), 22); b.cyl(b.w / 2 - 3, b.w / 2 - 3, 1, 0, b.h * 0.7 + 5, 0, mat('#6fb8e8', 0.05, 0.2, { transparent: true, opacity: 0.8 }), 22); });
  reg('water_tap', b => { b.cyl(1.4, 1.4, b.h * 0.85, 0, 0, 0, mat(P.steel, 0.3, 0.8), 8); b.box(2, 2, 10, 0, b.h * 0.85, 3, mat(P.steel, 0.3, 0.8)); b.cyl(2.4, 2.4, 1.2, 0, b.h * 0.7, 0, b.lv('#3a6bd3', '#4fc3f7', 1), 10); });
  reg('hose_reel', b => { const { w, d, h } = b; b.cyl(h * 0.42, h * 0.42, d * 0.7, 0, h * 0.5, 0, mat('#3aa376', 0.7), 24).rotation.x = Math.PI / 2; b.tor(h * 0.3, 2.5, 0, h * 0.5, 0, mat('#2f8a62', 0.7), 24); b.box(w, 2, d, 0, 0, 0, mat('#555')); [-1, 1].forEach(s2 => b.box(2, h, 2, s2 * w * 0.4, 0, 0, mat('#555'))); });
  reg('cistern well', b => { const r = Math.min(b.w, b.d) / 2, well = b.it.type === 'well'; if (well) { b.cyl(r, r, b.h * 0.35, 0, 0, 0, mat('#a8a39a', 1), 22); [-1, 1].forEach(s2 => b.box(4, b.h * 0.6, 4, s2 * r * 0.8, b.h * 0.3, 0, mat('#6b4a32', 0.8))); const rf = b.box(r * 2.2, 3, r * 1.6, 0, b.h * 0.92, 0, mat('#8a4b3a', 0.8)); rf.rotation.z = 0; b.cyl(r * 0.85, r * 0.85, 1, 0, b.h * 0.3, 0, mat('#2b5f7d', 0.1, 0.2), 20); return; } b.cyl(r, r, b.h, 0, 0, 0, mat('#4a4f57', 0.5, 0.2), 28); b.cyl(r * 0.3, r * 0.3, 8, 0, b.h, 0, mat('#2b2e33'), 12); });
  reg('stream', b => { const { w, d } = b; b.box(w, 4, d, 0, 0, 0, mat('#8c8c88', 1)); b.box(w - 8, 2, d - 10, 0, 3, 0, mat('#5fb4e6', 0.05, 0.2, { transparent: true, opacity: 0.85 })); });
  reg('greenhouse', b => {
    const { w, d, h } = b, fr = mat('#d9dde1', 0.4, 0.6), gl = b.glass(); b.box(w, 20, d, 0, 0, 0, mat('#8c8c88', 1));
    b.box(w - 4, h * 0.62, d - 4, 0, 20, 0, gl); const sh = new T.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h * 0.28); sh.closePath(); const geo = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); geo.translate(0, 0, -d / 2); const rf = b.add(geo, gl, 0, h * 0.62 + 20, 0); rf.castShadow = false; void rf;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(3, h * 0.62, 3, x * (w / 2 - 2), 20, z * (d / 2 - 2), fr)); b.box(w, 3, 3, 0, h * 0.62 + 20, d / 2 - 1.5, fr); b.box(w, 3, 3, 0, h * 0.62 + 20, -d / 2 + 1.5, fr); for (let i = 0; i < 3; i++) b.box(3, h * 0.62, 3, -w / 2 + (i + 1) * w / 4, 20, d / 2 - 1.5, fr); b.box(w * 0.8, 6, 30, 0, 20, -d * 0.3, mat('#a97c50', 0.8)); b.sph(8, -w * 0.2, 36, -d * 0.3, mat('#5d9b52', 0.8));
  });
  reg('pergola gazebo', b => {
    const { w, d, h } = b, wd = mat('#8c6a4a', 0.7), g2 = b.it.type === 'gazebo'; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(12, h, 12, x * (w / 2 - 6), 0, z * (d / 2 - 6), wd));
    [-1, 1].forEach(z => b.box(w, 12, 8, 0, h - 12, z * (d / 2 - 4), wd)); const n = 9; for (let i = 0; i < n; i++) b.box(6, 6, d + 40, -w / 2 + 10 + i * (w - 20) / (n - 1), h, 0, wd);
    if (g2) b.add(new T.CylinderGeometry(2, Math.max(w, d) * 0.62, h * 0.18, 4, 1, false, Math.PI / 4), mat('#8a4b3a', 0.85), 0, h + 3, 0).rotation.y = 0;
  });
  reg('woodshed', b => { const { w, d, h } = b, wd = mat('#a97c50', 0.8); b.box(w, 6, d, 0, 0, 0, wd); [[-1], [1]].forEach(([s2]) => b.box(6, h, d, s2 * (w / 2 - 3), 6, 0, wd)); b.box(w, h, 4, 0, 6, -d / 2 + 2, wd); const rf = b.box(w + 16, 4, d + 20, 0, h + 4, 4, mat('#5a3d2a', 0.8)); rf.rotation.x = -0.12; for (let i = 0; i < 24; i++) b.cyl(7, 7, d - 12, -w / 2 + 14 + (i % 12) * (w - 28) / 11, 14 + Math.floor(i / 12) * 15, 0, mat('#c8a27a', 0.8), 12).rotation.x = Math.PI / 2; });
  reg('compost bin_shelter', b => { const { w, d, h } = b, wd = mat(b.it.type === 'compost' ? '#8a6a46' : '#6b7a68', 0.8); [[0, d / 2 - 2, w, 4], [0, -d / 2 + 2, w, 4]].forEach(([x, z, W, D]) => b.box(W, h, D, x, 0, z, wd)); [[w / 2 - 2, 0, 4, d - 8], [-w / 2 + 2, 0, 4, d - 8]].forEach(([x, z, W, D]) => b.box(W, h, D, x, 0, z, wd)); if (b.it.type === 'compost') b.box(w - 10, h * 0.7, d - 10, 0, 0, 0, mat('#4a3626', 1)); else { b.box(w, 4, d, 0, h, 0, mat('#4d5a4a', 0.8)); const n2 = Math.max(1, Math.round(w / 70)); for (let i = 0; i < n2; i++) b.rb(50, 70, 45, 4, -w / 2 + (i + 0.5) * w / n2, 0, 0, mat(['#2f5d3a', '#2b4a8a', '#c9a227'][i % 3], 0.6)); } });
  reg('playhouse chicken_coop rabbit_hutch doghouse', b => {
    const { w, d, h } = b, t = b.it.type, wl = mat(t === 'playhouse' ? '#e6c28a' : t === 'doghouse' ? '#b98a5a' : '#a97c50', 0.8), lift = t === 'chicken_coop' || t === 'rabbit_hutch' ? 28 : 0;
    if (lift) [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(5, lift, 5, x * (w / 2 - 4), 0, z * (d / 2 - 4), wl));
    b.box(w, h * 0.65 - lift * 0.3, d, 0, lift, 0, wl); const sh = new T.Shape(); sh.moveTo(-w / 2 - 6, 0); sh.lineTo(w / 2 + 6, 0); sh.lineTo(0, h * 0.35); sh.closePath(); const geo = new T.ExtrudeGeometry(sh, { depth: d + 8, bevelEnabled: false }); geo.translate(0, 0, -(d + 8) / 2); b.add(geo, mat(t === 'playhouse' ? '#c0392b' : '#5a3d2a', 0.8), 0, h * 0.65 + lift * 0.7, 0).rotation.y = 0;
    const dw = Math.min(30, w * 0.3); b.box(dw, h * 0.4, 1, 0, lift, d / 2 + 0.3, mat('#2a1f18', 0.9)); if (t === 'chicken_coop') b.box(10, 3, 22, w * 0.3, lift - 4, d / 2 + 10, mat('#7a5a3a')).rotation.x = 0.3;
    if (t === 'rabbit_hutch') b.box(w * 0.4, h * 0.4, 1, w * 0.25, lift + 4, d / 2 + 0.3, mat('#9aa', 0.5, 0.5, { transparent: true, opacity: 0.4 }));
  });
  reg('hammock', b => { const { w, d, h } = b, wd = mat('#6b4a32', 0.8); [-1, 1].forEach(s2 => b.cyl(4, 4, h, 0, 0, s2 * (d / 2 - 6), wd, 10)); const m = b.add(new T.CylinderGeometry(1, 1, 1, 24, 1, true), mat('#f2d27a', 0.95, 0, { side: T.DoubleSide }), 0, h * 0.45, 0); m.scale.set(w * 0.4, w * 0.9, w * 0.4); m.rotation.x = Math.PI / 2; m.scale.set(w * 0.4, d * 0.9, w * 0.4); m.rotation.set(Math.PI / 2, 0, 0); m.position.y = h * 0.4; });
  reg('bench_garden chair_garden', b => { const { w, d, h } = b, wd = mat('#a97c50', 0.7), bench = b.it.type === 'bench_garden', sh = h * 0.5; for (let i = 0; i < 4; i++) b.box(w, 2.5, d / 5, 0, sh, -d / 2 + (i + 0.5) * d / 4 * 0.9 + 4, wd); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(4, sh, 4, x * (w / 2 - 4), 0, z * (d / 2 - 5), wd)); for (let i = 0; i < 3; i++) { const m = b.box(w, 6, 2, 0, sh + 14 + i * 10, -d / 2 + 4 - i * 2, wd); m.rotation.x = -0.18; } if (bench) [-1, 1].forEach(s2 => b.box(4, 22, d * 0.8, s2 * (w / 2 - 2), sh + 3, 0, wd)); });
  reg('swing_seat', b => { const { w, d, h } = b, m = mat('#4a4f57', 0.5, 0.5); [-1, 1].forEach(s2 => { const a = b.box(5, h, 5, s2 * (w / 2 - 3), 0, 0, m); a.rotation.z = 0; b.box(5, 5, d, s2 * (w / 2 - 3), 0, 0, m); }); b.box(w, 5, 5, 0, h - 5, 0, m); b.rb(w - 30, 18, d * 0.5, 6, 0, h * 0.28, 0, mat('#f1e3a8', 0.95)); b.rb(w - 30, 40, 14, 6, 0, h * 0.28 + 10, -d * 0.2, mat('#f1e3a8', 0.95)); const rf = b.box(w + 10, 4, d, 0, h, 0, mat('#2a7a5a', 0.9)); rf.rotation.z = 0; });
  reg('slide', b => { const { w, d, h } = b, m = mat('#3a7bd5', 0.5), y = mat('#ffb300', 0.5); [-1, 1].forEach(s2 => b.box(4, h * 0.85, 4, s2 * (w / 2 - 3), 0, -d / 2 + 14, mat('#a97c50', 0.8))); b.box(w, 4, 40, 0, h * 0.7, -d / 2 + 22, mat('#a97c50', 0.8)); const L = Math.hypot(d - 40, h * 0.7), sl = b.box(w * 0.8, 3, L, 0, h * 0.35, 20, y); sl.rotation.x = Math.atan2(h * 0.7, d - 40); sl.position.set(0, h * 0.37, -d / 2 + 40 + (d - 40) / 2 - 6); sl.rotation.x = -Math.atan2(h * 0.7, d - 40) * -1; void m; });
  reg('birdhouse bee_hotel', b => { const { w, d, h } = b, bee = b.it.type === 'bee_hotel'; if (bee) { b.box(w, 50, d, 0, 0, 0, mat('#a97c50', 0.85)); for (let i = 0; i < 18; i++) b.cyl(1, 1, 1, -w / 2 + 4 + (i % 6) * (w - 8) / 5, 4 + Math.floor(i / 6) * 14, d / 2, mat('#2a1f18'), 8).rotation.x = Math.PI / 2; b.box(w + 4, 3, d + 4, 0, 50, 0, mat('#5a3d2a')); return; } b.box(16, 20, 16, 0, 0, 0, mat('#d2a56a', 0.85)); b.box(24, 2, 22, 0, 19, 0, mat('#8a4b3a')).rotation.z = 0; b.cyl(3, 3, 1, 0, 10, 8.4, mat('#222'), 12).rotation.x = Math.PI / 2; });
  reg('statue', b => { const r = Math.min(b.w, b.d) / 2, h = b.h; b.box(r * 1.6, h * 0.25, r * 1.6, 0, 0, 0, mat('#b9b6ae', 0.95)); b.cyl(r * 0.5, r * 0.65, h * 0.45, 0, h * 0.25, 0, mat('#cfcac0', 0.9), 14); b.sph(r * 0.4, 0, h * 0.82, 0, mat('#cfcac0', 0.9)); });
  reg('outdoor_kitchen', b => { const { w, d, h } = b; b.box(w, h - 4, d, 0, 0, 0, mat('#6a7078', 0.7)); b.rb(w + 2, 4, d + 4, 1, 0, h - 4, 0, mat('#3a3d42', 0.35)); b.box(w * 0.32, 20, d * 0.55, -w * 0.28, h, 0, mat('#222', 0.5)); b.sph(d * 0.3, -w * 0.28, h + 14, 0, mat('#1e2024', 0.4, 0.5), 1, 0.5, 1); b.box(w * 0.2, 1, d * 0.4, w * 0.2, h, 0, mat('#aab0b7', 0.2, 0.9)); for (let i = 0; i < 3; i++) b.box(w / 3 - 3, h * 0.6, 1, -w / 2 + (i + 0.5) * w / 3, 8, d / 2, mat('#5b6169', 0.6)); });
  reg('pizza_oven', b => { const { w, d, h } = b; b.box(w, h * 0.42, d, 0, 0, 0, mat('#8a8a84', 0.9)); b.add(new T.SphereGeometry(w * 0.5, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat('#b5653a', 0.85), 0, h * 0.42, 0).scale.set(1, 0.8, d / w); b.box(w * 0.3, h * 0.22, 2, 0, h * 0.5, d * 0.46, b.lv('#1a1210', '#ff7a1a', 1.4)); b.cyl(6, 6, h * 0.3, 0, h * 0.82, -d * 0.2, mat('#555', 0.5, 0.6), 12); });
  reg('wood_pile', b => { const { w, d, h } = b; const rows = Math.max(3, Math.floor(h / 15)), n = Math.max(4, Math.floor(w / 15)); for (let r = 0; r < rows; r++) for (let i = 0; i < n - (r % 2); i++) b.cyl(7, 7, d - 6, -w / 2 + 8 + i * 15 + (r % 2) * 7.5, 7 + r * 13, 0, mat((i + r) % 3 ? '#b88a5a' : '#9a6f44', 0.85), 12).rotation.x = Math.PI / 2; });
  reg('wheelbarrow', b => { const { w, d, h } = b, m = mat('#3a7a5a', 0.5); const tub = b.rb(w * 0.9, h * 0.5, d * 0.5, 6, 0, h * 0.35, d * 0.12, m); tub.rotation.x = 0.12; b.cyl(h * 0.3, h * 0.3, 6, 0, 0, d * 0.42, mat('#1a1a1a', 0.9), 20).rotation.z = Math.PI / 2; b.cyl(h * 0.3, h * 0.3, 6, 0, 0, d * 0.42, mat('#1a1a1a', 0.9), 20).position.y = h * 0.3; [-1, 1].forEach(s2 => { b.box(3, 3, d * 0.55, s2 * w * 0.3, h * 0.28, -d * 0.2, mat('#a97c50')); b.box(3, h * 0.3, 3, s2 * w * 0.3, 0, -d * 0.4, mat('#555')); }); });
  reg('solar_panel', b => { const { w, d, h } = b; const p = b.box(w, 4, d, 0, h * 0.5, 0, mat('#1d2d4a', 0.12, 0.4)); p.rotation.x = -0.45; for (let i = 1; i < 6; i++) { const l = b.box(0.5, 0.6, d, -w / 2 + i * w / 6, h * 0.5 + 2.2, 0, mat('#a9bcd8', 0.4, 0.6)); l.rotation.x = -0.45; } [-1, 1].forEach(s2 => b.box(4, h * 0.6, 4, s2 * w * 0.35, 0, d * 0.25, mat('#9aa0a6', 0.4, 0.8))); });
  reg('privacy_screen', b => { const { w, d, h } = b, wd = mat('#b98a5a', 0.75); for (let i = 0; i <= 3; i++) b.box(7, h, 7, -w / 2 + i * w / 3, 0, 0, mat('#6b4a32', 0.8)); for (let i = 0; i < Math.round(h / 10); i++) b.box(w - 6, 8, d * 0.6, 0, i * 10 + 2, 0, mat(i % 2 ? '#c49a6a' : '#b98a5a', 0.8)); void wd; });
  reg('garden_gate', b => { const { w, d, h } = b, m = mat('#8c6a4a', 0.7); [-1, 1].forEach(s2 => b.box(8, h, 8, s2 * (w / 2 - 4), 0, 0, mat('#6b4a32', 0.8))); b.box(w - 16, 6, 3, 0, h * 0.2, 0, m); b.box(w - 16, 6, 3, 0, h * 0.8, 0, m); for (let i = 0; i < 9; i++) b.box(6, h * 0.85, 2, -w / 2 + 14 + i * (w - 28) / 8, h * 0.1, 0, m); const dg = b.box(w - 16, 4, 3, 0, h * 0.5, 1, m); dg.rotation.z = 0.5; void d; });
  reg('stone_wall', b => { const { w, d, h } = b; const rows = Math.max(3, Math.round(h / 20)); for (let r = 0; r < rows; r++) { const n = Math.max(3, Math.round(w / 40)); for (let i = 0; i < n; i++) b.rb(w / n - 1, h / rows - 1, d - (i + r) % 3 * 2, 2, -w / 2 + (i + 0.5 + (r % 2 ? 0.4 : 0)) * w / n - (r % 2 && i === n - 1 ? w / n * 0.4 : 0), r * h / rows, 0, mat(['#a9a39a', '#9a948b', '#b5afa5'][(i * 7 + r * 3) % 3], 0.95)); } });
  reg('edging', b => b.rb(b.w, b.h, b.d, 1, 0, 0, 0, mat('#8e8e8a', 0.8)));
  reg('path_stone patio', b => { const { w, d } = b, big = b.it.type === 'patio'; b.box(w, 2, d, 0, 0, 0, mat('#a8a39a', 1)); const s2 = big ? 60 : 50, nx = Math.max(1, Math.round(w / s2)), nz = Math.max(1, Math.round(d / (big ? 40 : s2))); for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) b.rb(w / nx - 2, 3, d / nz - 2, 0.6, -w / 2 + (i + 0.5) * w / nx, 0, -d / 2 + (j + 0.5) * d / nz, mat(((i * 3 + j * 5) % 3) ? '#c9c4ba' : '#bbb5aa', 0.9)); });
  reg('path_gravel gravel_area', b => { b.box(b.w, 3, b.d, 0, 0, 0, mat('#d9d6cf', 1)); for (let i = 0; i < 60; i++) b.sph(2.2, ((i * 37) % 100) / 100 * (b.w - 8) - (b.w - 8) / 2, 3, ((i * 53) % 100) / 100 * (b.d - 8) - (b.d - 8) / 2, mat(i % 2 ? '#bdb8ae' : '#e8e5de', 1), 1, 0.5, 1); });
  reg('stepping_stones', b => { const n = Math.max(3, Math.round(b.d / 55)); for (let i = 0; i < n; i++) { const s2 = b.cyl(22, 24, 4, ((i % 2) - 0.5) * 18, 0, -b.d / 2 + 28 + i * (b.d - 56) / Math.max(1, n - 1), mat('#a9a59c', 0.95), 14); s2.scale.z = 0.85; } });
  reg('deck', b => { const { w, d } = b; b.box(w, 6, d, 0, 0, 0, mat('#6b4a32', 0.9)); const n = Math.max(2, Math.round(d / 14)); for (let i = 0; i < n; i++) b.box(w, 6, d / n - 0.8, 0, 6, -d / 2 + (i + 0.5) * d / n, mat(i % 2 ? '#b8895a' : '#a97c50', 0.75)); });
  // Gartenbeleuchtung & Smart Garden
  reg('lamp_solar', b => { b.cyl(0.8, 0.8, b.h * 0.7, 0, 0, 0, mat('#333', 0.5, 0.5), 8); b.sph(4.5, 0, b.h * 0.8, 0, b.lv('#f3f1e6', '#fff0b0', 1.5)); b.box(6, 0.6, 6, 0, b.h, 0, mat('#1d2d4a', 0.2, 0.4)); b.cyl(1.4, 3, 6, 0, 0, 0, mat('#333', 0.5, 0.5), 8); });
  reg('lamp_post', b => { const h = b.h; b.cyl(8, 10, 6, 0, 0, 0, mat('#2d3238', 0.5, 0.5), 16); b.cyl(3, 4, h * 0.88, 0, 6, 0, mat('#2d3238', 0.5, 0.5), 12); b.cyl(10, 5, h * 0.1, 0, h * 0.9, 0, b.lv('#f3f1e6', '#ffe6a8', 1.3), 16); b.cyl(1, 11, 5, 0, h * 0.98, 0, mat('#2d3238', 0.5, 0.5), 16); });
  reg('lamp_spike', b => { b.cyl(0.5, 0.5, 14, 0, 0, 0, mat('#555', 0.5, 0.6), 6); const c = b.cyl(4, 4, 12, 0, 14, 0, mat('#2d3238', 0.5, 0.5), 12); c.rotation.x = 0.4; b.cyl(3, 3, 1, 0, 20, 3.4, b.lv('#f3f1e6', '#fff0b8', 1.5), 12).rotation.x = Math.PI / 2 + 0.4; });
  reg('lamp_flood', b => { const { w, d, h } = b; b.box(w * 0.4, h * 0.3, 8, 0, h * 0.55, -d / 2 + 4, mat('#2d3238', 0.5, 0.5)); b.rb(w, h * 0.6, 8, 2, 0, 0, 1, mat('#2d3238', 0.4, 0.5)); b.box(w - 4, h * 0.5 - 2, 0.6, 0, 2, 5.4, b.lv('#f3f1e6', '#fff6d0', 1.6)); });
  reg('mower_robot', b => { const { w, d, h } = b; b.rb(w, h * 0.8, d, h * 0.35, 0, 3, 0, mat('#f0953b', 0.5)); b.rb(w * 0.7, h * 0.35, d * 0.5, 8, 0, h * 0.62, -d * 0.05, mat('#2a2d33', 0.4)); [-1, 1].forEach(s2 => b.cyl(7, 7, 4, s2 * w * 0.46, 0, -d * 0.2, mat('#1a1a1a', 0.9), 16).rotation.z = Math.PI / 2); b.cyl(7, 7, 4, 0, 0, 0, mat('#1a1a1a', 0.9), 16).visible = false; b.sph(1.4, w * 0.2, h * 0.9, d * 0.1, b.lv('#400', '#3de07a', 1.6)); });
  reg('mower_station', b => { const { w, d, h } = b; b.rb(w, 4, d, 1.5, 0, 0, 0, mat('#3a3d42', 0.5)); b.rb(w * 0.8, h, d * 0.3, 2, 0, 4, -d * 0.32, mat('#f0953b', 0.5)); b.sph(1.2, 0, h - 2, -d * 0.16, b.lv('#400', '#3de07a', 1.6)); });
  reg('sensor_soil', b => { b.box(2.2, b.h, 0.8, 0, 0, 0, mat('#eee', 0.5)); b.rb(7, 8, 3, 1, 0, b.h - 2, 0, mat('#2f6f4a', 0.5)); b.sph(0.8, 0, b.h + 3, 1.6, b.lv('#400', '#3de07a', 1.6)); });
  reg('sprinkler', b => { b.cyl(3, 4, 4, 0, 0, 0, mat('#2a2d33', 0.5), 14); b.cyl(1.5, 1.5, 6, 0, 4, 0, mat('#3a7bd5', 0.5), 10); sprayAnim(b, { y: 11, n: 54, jets: 3, range: 230, height: 85, rot: 1.1, speed: 0.75 }); });
  reg('valve_box', b => { const { w, d, h } = b; b.rb(w, h, d, 2, 0, 0, 0, mat('#2f6f4a', 0.6)); b.rb(w - 6, 2, d - 6, 1, 0, h, 0, mat('#255a3d', 0.6)); for (let i = 0; i < 3; i++) b.cyl(2, 2, 3, -w * 0.25 + i * w * 0.25, h, 0, b.lv('#2a3d63', '#4fc3f7', 1), 10); });
  reg('pool_robot', b => { const { w, d, h } = b; b.rb(w, h, d, 5, 0, 2, 0, mat('#2b5aa8', 0.5)); [-1, 1].forEach(s2 => b.box(5, h * 0.6, d * 0.9, s2 * (w / 2 - 1), 0, 0, mat('#1a1a1a', 0.9))); b.sph(1.6, 0, h + 2, d * 0.2, b.lv('#400', '#3de07a', 1.6)); });
  reg('pool_heater', b => { const { w, d, h } = b; b.rb(w, h, d, 3, 0, 0, 0, mat('#d5d9dd', 0.5)); b.cyl(h * 0.32, h * 0.32, 1, 0, h * 0.55, d / 2 + 0.2, mat('#1a1c20', 0.5), 24).rotation.x = Math.PI / 2; b.box(10, 4, 1, w * 0.3, h * 0.9, d / 2 + 0.3, b.lv('#1b2530', '#7fe3a0', 1)); });
  reg('gate_motor', b => { const { w, d, h } = b; b.rb(w, h, d, 3, 0, 0, 0, mat('#2d3238', 0.5, 0.4)); b.cyl(3, 3, 3, w * 0.3, h, 0, mat('#777', 0.4, 0.7), 10); b.sph(1.2, -w * 0.3, h * 0.7, d / 2, b.lv('#400', '#ffb300', 1.6)); });
  reg('cam_garden', b => { const { h } = b; b.cyl(1.2, 1.2, h * 0.8, 0, 0, 0, mat('#555', 0.5, 0.6), 8); b.cyl(5, 5, 14, 0, h * 0.8, 0, mat(P.white, 0.35), 18).rotation.x = Math.PI / 2 - 0.2; b.cyl(4, 4, 1, 0, h * 0.82, 8.2, b.lv('#0c0e10', '#6fd0ff', 1.2), 16).rotation.x = Math.PI / 2 - 0.2; });
  reg('garden_speaker', b => { const r = Math.min(b.w, b.d) / 2; const rk = b.sph(r, 0, r * 0.55, 0, mat('#8c8a84', 0.95), 1, 0.65, 0.9); rk.castShadow = true; b.cyl(r * 0.28, r * 0.28, 1, 0, r * 0.9, r * 0.5, mat('#2a2d33', 0.6), 14).rotation.x = Math.PI / 2 - 0.5; b.sph(0.8, r * 0.4, r * 0.8, r * 0.55, b.lv('#222', '#4fd0ff', 1.6)); });
  reg('sensor_garden_motion', b => { b.rb(8, 14, 6, 2, 0, 0, 0, mat(P.white, 0.4)); b.sph(3.2, 0, 9, 3.4, mat('#eef1f2', 0.2, 0, { transparent: true, opacity: 0.9 }), 1, 1, 0.5); b.sph(0.7, 2.5, 3, 3, b.lv('#400', '#3de07a', 1.6)); });



  // ---------- Terrasse, Pavillons, Brunnen & mehr ----------
  const rndSeed = k => { let x = k * 9301 + 49297; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  reg('terrace terrace_slabs terrace_stone', b => {
    const { w, d } = b, t = b.it.type, hh = Math.max(3, b.h), fug = mat('#7d7a74', 1), rnd = rndSeed(w + d);
    b.box(w, hh * 0.55, d, 0, 0, 0, fug);
    const shades = t === 'terrace_stone' ? ['#b9ada0', '#aea294', '#c4b9ac', '#a89d90'] : ['#cfcac1', '#c6c1b8', '#d6d1c8'];
    const base = b.col && b.col !== '#d7ccc8' ? b.col : null, pick = i => mat(base || shades[i % shades.length], 0.92);
    if (t === 'terrace_stone') {
      let z = -d / 2, row = 0;
      while (z < d / 2 - 4) { const rh = Math.min(d / 2 - z, 34 + rnd() * 26); let x = -w / 2; while (x < w / 2 - 4) { const cw = Math.min(w / 2 - x, 32 + rnd() * 44); b.box(cw - 1.6, hh * 0.5, rh - 1.6, x + cw / 2, hh * 0.55, z + rh / 2, pick(Math.floor(rnd() * 4))); x += cw; } z += rh; row++; }
      return;
    }
    const ps = t === 'terrace_slabs' ? 60 : 40, nx = Math.max(1, Math.round(w / ps)), nz = Math.max(1, Math.round(d / ps));
    const pw = w / nx, pd = d / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) b.box(pw - 1.4, hh * 0.5, pd - 1.4, -w / 2 + (i + 0.5) * pw, hh * 0.55, -d / 2 + (j + 0.5) * pd, pick(i * 3 + j * 5 + Math.floor(rnd() * 3)));
  });
  reg('gazebo_round', b => {
    const r = Math.min(b.w, b.d) / 2, h = b.h, wd = mat('#8c6a4a', 0.7), n = 8;
    b.cyl(r, r, 8, 0, 0, 0, mat('#a89c8c', 0.95), 8);
    for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n + Math.PI / 8, x = Math.cos(a) * (r - 8), z = Math.sin(a) * (r - 8); b.box(9, h * 0.78, 9, x, 8, z, wd); }
    b.add(new T.TorusGeometry(r - 8, 4, 6, 8), wd, 0, h * 0.78 + 6, 0).rotation.x = Math.PI / 2;
    b.cyl(2, r * 1.12, h * 0.24, 0, h * 0.78 + 8, 0, mat('#8a4b3a', 0.85), 8);
    b.sph(5, 0, h * 1.03 + 8, 0, mat('#6d3a2c', 0.6));
    for (let i = 0; i < 5; i++) { const a = Math.PI * 0.2 + i * Math.PI * 0.4; b.box(36, 5, 12, Math.cos(a) * (r - 24), 24, Math.sin(a) * (r - 24), wd).rotation.y = -a + Math.PI / 2; }
  });
  reg('gazebo_wood', b => {
    const { w, d, h } = b, wd = mat('#9a7650', 0.7), dk = mat('#6d4a2f', 0.75);
    b.box(w, 10, d, 0, 0, 0, mat('#b08a5e', 0.8));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => b.box(12, h * 0.72, 12, x * (w / 2 - 8), 10, z * (d / 2 - 8), wd));
    [-1, 1].forEach(z => b.box(w - 4, 12, 9, 0, h * 0.72 - 2, z * (d / 2 - 8), dk)); [-1, 1].forEach(x => b.box(9, 12, d - 4, x * (w / 2 - 8), h * 0.72 - 2, 0, dk));
    [-1, 1].forEach(z => { b.box(w - 40, 5, 5, 0, 70, z * (d / 2 - 8), wd); for (let i = 0; i < Math.round(w / 22); i++) b.box(3.5, 60, 3.5, -w / 2 + 28 + i * (w - 56) / Math.max(1, Math.round(w / 22) - 1), 10, z * (d / 2 - 8), wd); });
    const sh = new T.Shape(); sh.moveTo(-w / 2 - 14, 0); sh.lineTo(w / 2 + 14, 0); sh.lineTo(0, h * 0.3); sh.closePath();
    const geo = new T.ExtrudeGeometry(sh, { depth: d + 28, bevelEnabled: false }); geo.translate(0, 0, -(d + 28) / 2); b.add(geo, mat('#5a3d2a', 0.85), 0, h * 0.72 + 10, 0);
    b.box(w * 0.6, 6, 28, 0, 22, -d / 2 + 24, wd);
  });
  function fallAnim(b, o) {
    const grp = new T.Group(); grp.position.set(o.x || 0, o.y, o.z || 0); b.g.add(grp);
    const dm = new T.MeshBasicMaterial({ color: 0x9bd8ff, transparent: true, opacity: 0.8, depthWrite: false }), geo = new T.SphereGeometry(o.size || 1, 6, 5), drops = [];
    for (let i = 0; i < o.n; i++) { const mm = new T.Mesh(geo, dm); mm.visible = false; grp.add(mm); drops.push({ m: mm, ph: i / o.n, jx: ((i * 37) % 11 - 5) / 5 * (o.spread || 6) }); }
    b.anim = { type: 'spray', step: (dt, on) => {
      if (!on) { drops.forEach(d => { d.m.visible = false; }); return; }
      drops.forEach(d => { d.ph = (d.ph + dt * (o.speed || 0.8)) % 1; d.m.visible = true; d.m.position.set(d.jx * (0.4 + d.ph), -d.ph * d.ph * o.h, (o.out || 0) * Math.sqrt(d.ph)); });
    } };
  }
  reg('fountain_tiered', b => {
    const r = Math.min(b.w, b.d) / 2, h = b.h, st = mat('#bdb8ae', 0.9), wt = mat('#2f8fc8', 0.05, 0.2, { transparent: true, opacity: 0.85 });
    b.cyl(r, r, 34, 0, 0, 0, st, 36); b.cyl(r - 6, r - 6, 2, 0, 33, 0, wt, 36);
    b.cyl(r * 0.16, r * 0.2, h * 0.42, 0, 34, 0, st, 16);
    b.cyl(r * 0.62, r * 0.4, 9, 0, 34 + h * 0.3, 0, st, 28); b.cyl(r * 0.55, r * 0.55, 1.6, 0, 34 + h * 0.3 + 8, 0, wt, 28);
    b.cyl(r * 0.09, r * 0.12, h * 0.2, 0, 34 + h * 0.3 + 9, 0, st, 12);
    b.cyl(r * 0.34, r * 0.2, 7, 0, 34 + h * 0.5, 0, st, 22); b.cyl(r * 0.29, r * 0.29, 1.4, 0, 34 + h * 0.5 + 6, 0, wt, 22);
    b.sph(r * 0.08, 0, 34 + h * 0.5 + 12, 0, st);
    sprayAnim(b, { y: 34 + h * 0.5 + 12, n: 36, jets: 6, range: r * 0.42, height: 60, rot: 0, speed: 0.85, size: 1.1 });
  });
  reg('wall_fountain', b => {
    const { w, d, h } = b, st = mat('#b9b3a8', 0.9), wt = mat('#2f8fc8', 0.05, 0.2, { transparent: true, opacity: 0.85 });
    b.box(w, h * 0.8, 10, 0, h * 0.2, -d / 2 + 5, st); b.box(w + 8, 5, 14, 0, h, -d / 2 + 6, st);
    b.cyl(2.2, 2.2, 14, 0, h * 0.62, -d / 2 + 14, mat(P.steel, 0.3, 0.8), 10).rotation.x = Math.PI / 2;
    b.box(w, 18, d - 6, 0, 0, 3, st); b.box(w - 10, 2, d - 18, 0, 17, 3, wt);
    fallAnim(b, { x: 0, y: h * 0.62, z: -d / 2 + 22, n: 26, h: h * 0.62 - 16, speed: 0.9, spread: 2, out: 6, size: 1 });
  });
  reg('bbq', b => {
    const { w, d, h } = b, bl = mat('#25282d', 0.45, 0.3), r = Math.min(w, d) * 0.5;
    [[-1, -1], [1, -1], [0, 1]].forEach(([x, z]) => { const l = b.cyl(1.4, 1.4, h * 0.58, x * r * 0.55, 0, z * r * 0.5, mat(P.steel, 0.4, 0.7), 8); l.rotation.z = x * 0.12; });
    b.add(new T.SphereGeometry(r, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bl, 0, h * 0.58, 0).rotation.x = Math.PI;
    const lid = b.add(new T.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#2a2d33', 0.4, 0.3), 0, h * 0.62, 0); lid.rotation.x = -0.5; lid.position.z = -r * 0.25;
    b.cyl(r * 0.92, r * 0.92, 0.8, 0, h * 0.62, 0, mat('#8a8e94', 0.4, 0.6), 24); b.cyl(r * 0.2, r * 0.2, 5, 0, h * 0.95, -r * 0.45, bl, 8);
    b.box(w * 0.5, 3, 18, w * 0.7, h * 0.4, 0, mat('#6b4a32', 0.8));
  });
  reg('jetty', b => {
    const { w, d, h } = b, wd = mat('#8f7556', 0.85), n = Math.max(3, Math.round(d / 14));
    for (let i = 0; i < n; i++) b.box(w, 4, d / n - 1, 0, h - 4, -d / 2 + (i + 0.5) * d / n, mat(i % 2 ? '#a58862' : '#97795a', 0.85));
    [-1, 1].forEach(x => { b.box(5, 5, d, x * (w / 2 - 6), h - 9, 0, wd); for (let i = 0; i < Math.max(2, Math.round(d / 110)); i++) b.box(9, h, 9, x * (w / 2 - 6), 0, -d / 2 + 14 + i * (d - 28) / Math.max(1, Math.round(d / 110) - 1), wd); });
  });
  reg('bridge_garden', b => {
    const { w, d, h } = b, wd = mat('#8f7556', 0.8), n = 14;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), y = Math.sin(Math.PI * t) * h * 0.55; const pl = b.box(w - 14, 4, d / n + 0.4, 0, y + h * 0.3, -d / 2 + (i + 0.5) * d / n, mat(i % 2 ? '#a58862' : '#97795a', 0.85)); pl.rotation.x = Math.cos(Math.PI * t) * 0.35 * (h / 60); }
    [-1, 1].forEach(x => { for (let i = 0; i < 7; i++) { const t = i / 6, y = Math.sin(Math.PI * t) * h * 0.55; b.box(4, 36, 4, x * (w / 2 - 4), y + h * 0.3 + 2, -d / 2 + 6 + t * (d - 12), wd); } for (let i = 0; i < n - 1; i++) { const t = (i + 0.5) / (n - 1), y = Math.sin(Math.PI * t) * h * 0.55; b.box(3.5, 3.5, d / n + 1, x * (w / 2 - 4), y + h * 0.3 + 38, -d / 2 + (i + 1) * d / n, wd).rotation.x = Math.cos(Math.PI * t) * 0.35 * (h / 60); } });
  });
  reg('strandkorb', b => {
    const { w, d, h } = b, wk = mat('#c9a56a', 0.9), st = mat('#2a5d9a', 0.9);
    b.box(w, h * 0.3, d * 0.8, 0, 0, d * 0.1, wk); b.rb(w - 10, h * 0.2, d * 0.7, 4, 0, h * 0.3, d * 0.12, mat('#f1efe9', 0.95));
    b.box(w, h * 0.62, 10, 0, h * 0.2, -d / 2 + 5, wk); [-1, 1].forEach(x => b.box(10, h * 0.5, d * 0.7, x * (w / 2 - 5), h * 0.2, -d * 0.02, wk));
    const hood = b.add(new T.CylinderGeometry(w * 0.5, w * 0.5, d * 0.6, 20, 1, false, 0, Math.PI), st, 0, h * 0.82, -d * 0.1); hood.rotation.set(Math.PI / 2, Math.PI / 2, 0); hood.scale.set(1, 1, 0.9);
    b.box(w * 0.9, 2, 14, 0, h * 0.27, d * 0.52, wk);
  });

  function sprayAnim(b, o) {
    const grp = new T.Group(); grp.position.set(o.x || 0, o.y, o.z || 0); b.g.add(grp);
    const dm = new T.MeshBasicMaterial({ color: 0x9bd8ff, transparent: true, opacity: 0.8, depthWrite: false }), geo = new T.SphereGeometry(o.size || 1.4, 6, 5), drops = [];
    for (let i = 0; i < o.n; i++) { const mm = new T.Mesh(geo, dm); mm.visible = false; grp.add(mm); drops.push({ m: mm, ph: i / o.n, j: i % o.jets }); }
    let ang = 0;
    b.anim = { type: 'spray', step: (dt, on) => {
      if (!on) { drops.forEach(d => { d.m.visible = false; }); return; }
      ang += dt * (o.rot || 0);
      drops.forEach(d => { d.ph = (d.ph + dt * (o.speed || 0.7)) % 1; const a = ang + d.j * 2 * Math.PI / o.jets, r = (o.range || 200) * d.ph, y = 4 * (o.height || 80) * d.ph * (1 - d.ph); d.m.visible = true; d.m.position.set(Math.cos(a) * r, y, Math.sin(a) * r); });
    } };
  }

  function build(THREE, it, w, d, h, col) {
    T = THREE;
    const fn = R[it.type];
    if (!fn) return null;
    const b = mk(it, w, d, h, col);
    try { fn(b); } catch (e) { if (typeof console !== 'undefined') console.warn('3D-Modell ' + it.type + ':', e.message); return null; }
    if (!b.g.children.length) return null;
    return { group: b.g, live: b.live, anim: b.anim || null };
  }
  function reset(THREE) { T = THREE; cache = new Map(); }
  const has = (type) => !!R[type];
  return { build, reset, has, count: () => Object.keys(R).length };
})();

/* ---- view3d.js ---- */
// ---------- 3D-Ansicht (three.js wird bei Bedarf nachgeladen; geteilt von Editor und Karte) ----------
// Einheiten: 1 Einheit = 1 cm. Plan-X → X, Plan-Y → Z, Höhe → Y.
const FP3D = (() => {
  let loading = null;
  function load(base) {
    if (window.THREE_LITE) return Promise.resolve(window.THREE_LITE);
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = base + 'three-lite.js';
      s.onload = () => (window.THREE_LITE ? res(window.THREE_LITE) : rej(new Error('three.js fehlt')));
      s.onerror = () => { loading = null; rej(new Error('3D-Bibliothek konnte nicht geladen werden')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  // [Höhe, Höhe über Boden]; Höhe über Boden -1 = an der Decke
  const H3 = {
    bed_double: [55, 0], bed_single: [55, 0], bed_kid: [45, 0], bed_bunk: [160, 0], crib: [80, 0], daybed: [50, 0],
    sofa: [85, 0], sofa_corner: [85, 0], sofa_2: [85, 0], armchair: [85, 0], recliner: [95, 0], ottoman: [40, 0], stool: [45, 0], bench: [45, 0], bar_stool: [75, 0], highchair: [80, 0],
    table_coffee: [42, 0], table_dining: [75, 0], table_side: [50, 0], table_round: [75, 0], table_bar: [105, 0], chair: [45, 0], office_chair: [50, 0], desk: [75, 0], desk_corner: [75, 0],
    wardrobe: [210, 0], wardrobe_sliding: [230, 0], shelf: [180, 0], bookcase: [190, 0], dresser: [85, 0], tv_board: [50, 0], sideboard: [80, 0], wall_unit: [210, 0], nightstand: [50, 0],
    vanity: [75, 0], coat_rack: [190, 0], shoe_rack: [110, 0], cabinet: [120, 0], mirror: [160, 30], piano: [120, 0], changing: [95, 0], tv_stand: [60, 0],
    fridge: [180, 0], freezer: [180, 0], fridge_side: [180, 0], stove: [90, 0], oven: [90, 0], sink_kitchen: [90, 0], dishwasher: [85, 0], dishwasher_tall: [85, 0], washer: [85, 0], dryer: [85, 0],
    microwave: [30, 90], hood: [40, 150], coffee: [35, 90], kettle: [25, 90], counter: [90, 0], cabinet_base: [90, 0], cabinet_wall: [70, 140], kitchen_island: [92, 0], pantry: [210, 0], trash: [60, 0],
    bathtub: [55, 0], shower: [6, 0], shower_tray: [6, 0], shower_walkin: [6, 0], toilet: [42, 0], toilet_wall: [42, 0], bidet: [40, 0], basin: [85, 0], basin_double: [85, 0], washstand: [85, 0],
    mirror_cabinet: [70, 120], towel_radiator: [120, 20], sauna: [210, 0], whirlpool: [70, 0], water_heater: [80, 120], utility_sink: [85, 0],
    radiator: [60, 10], thermostat: [12, 130], ac: [30, 200], fan: [90, 0], fireplace: [110, 0], boiler: [130, 0], fan_ceiling: [25, -1], floor_heating: [3, 0], heat_pump: [130, 0],
    air_purifier: [60, 0], humidifier: [40, 0], dehumidifier: [60, 0], ventilation: [30, 0], pellet: [110, 0], water_tank: [160, 0], heater_elec: [30, 0], heat_valve: [8, 25], heat_dist: [60, 90],
    split_ac: [30, 210], chimney_stove: [110, 0], solar_thermal: [60, 0],
    lamp_ceiling: [8, -1], lamp_floor: [160, 0], lamp_wall: [14, 180], lamp_spot: [8, -1], lamp_strip: [3, -1], lamp_pendant: [30, -2], chandelier: [40, -2], lamp_table: [32, 75], lamp_desk: [40, 75],
    lamp_night: [12, 30], lamp_mirror: [8, 190], light_panel: [4, -1], lamp_bulb: [12, 190], lamp_outdoor: [25, 200], lamp_garden: [50, 0], lamp_arc: [200, 0], light_string: [3, -1],
    outlet: [8, 30], outlet_double: [8, 30], outlet_usb: [8, 30], outlet_outdoor: [8, 40], outlet_floor: [2, 0], outlet_smart: [8, 30], outlet_cee: [8, 100], plug: [10, 30], powerstrip: [5, 5],
    switch: [8, 105], switch_double: [8, 105], dimmer: [8, 105], button: [6, 105], scene_switch: [6, 105], smart_light_sw: [8, 105], lan_socket: [8, 30], tv_socket: [8, 30],
    camera: [14, 230], camera_ptz: [18, 230], doorbell_cam: [18, 130], sensor_motion: [10, 220], smoke: [6, -1], sensor_presence: [8, -1], sensor_temp: [8, 140], sensor_hum: [8, 140],
    speaker: [30, 100], smart_speaker: [22, 90], soundbar: [8, 50], smart_tv: [65, 80], monitor: [45, 75], pc: [45, 0], nas: [30, 0], server_rack: [190, 0], printer: [30, 75], printer3d: [45, 75],
    blind: [130, 80], shutter_outdoor: [130, 80], curtain_motor: [230, 0], awning: [25, 220], router: [10, 100], dongle: [10, 100], vacuum: [10, 0], lock: [10, 105], wallbox: [35, 110], meter_power: [30, 120], meter_gas: [30, 120],
    tree_fruit: [300, 0], tree_conifer: [450, 0], palm: [400, 0], bush_flower: [90, 0], planter: [60, 0], raised_bed: [80, 0], veggie_patch: [25, 0], meadow: [25, 0], rocks: [50, 0], hedge_corner: [150, 0], trellis: [200, 0], vineyard: [160, 0],
    pond: [4, 0], fountain: [110, 0], birdbath: [80, 0], water_tap: [60, 0], hose_reel: [45, 0], cistern: [150, 0], well: [100, 0], stream: [4, 0], greenhouse: [240, 0], pergola: [250, 0], gazebo: [270, 0], woodshed: [200, 0], compost: [90, 0], bin_shelter: [140, 0],
    playhouse: [190, 0], chicken_coop: [120, 0], rabbit_hutch: [90, 0], doghouse: [80, 0], hammock: [150, 0], bench_garden: [85, 0], chair_garden: [90, 0], swing_seat: [210, 0], slide: [200, 0], birdhouse: [30, 150], bee_hotel: [60, 120], statue: [80, 0], outdoor_kitchen: [95, 0], pizza_oven: [200, 0],
    wood_pile: [120, 0], wheelbarrow: [60, 0], solar_panel: [80, 0], privacy_screen: [180, 0], garden_gate: [130, 0], stone_wall: [90, 0], edging: [12, 0], path_stone: [3, 0], path_gravel: [3, 0], stepping_stones: [4, 0], gravel_area: [3, 0], patio: [3, 0], deck: [12, 0],
    lamp_solar: [40, 0], lamp_post: [350, 0], lamp_spike: [30, 0], lamp_flood: [20, 250], mower_robot: [25, 0], mower_station: [25, 0], sensor_soil: [25, 0], sprinkler: [12, 0], valve_box: [20, 0], pool_robot: [20, 0], pool_heater: [60, 0], gate_motor: [90, 0], cam_garden: [200, 0], garden_speaker: [30, 0], sensor_garden_motion: [16, 250],
    stairs: [260, 0], stairs_wide: [260, 0], stairs_L: [260, 0], stairs_U: [260, 0], stairs_spiral: [260, 0], stairs_spiral_small: [260, 0], stairs_outdoor: [100, 0], stairs_basement: [260, 0],
    plant: [90, 0], plant_big: [130, 0], plant_small: [30, 0], rug: [2, 0], rug_round: [2, 0], pillar: [250, 0], pillar_round: [250, 0], curtain: [240, 0], painting: [60, 140], playmat: [2, 0],
    car: [150, 0], carport: [2, 0], bike: [100, 0], terrace_table: [75, 0], lounger: [40, 0], grill: [95, 0], pool: [4, 0], hot_tub: [80, 0], tree: [350, 0], bush: [90, 0], hedge: [150, 0], fence: [110, 0],
    flowerbed: [20, 0], lawn: [2, 0], mailbox: [120, 0], gate: [150, 0], shed: [220, 0], trash_bin: [105, 0], rain_barrel: [90, 0], sandbox: [25, 0], trampoline: [30, 0], swing: [220, 0], terrace: [4, 0], terrace_slabs: [4, 0], terrace_stone: [4, 0], gazebo_round: [300, 0], gazebo_wood: [300, 0], fountain_tiered: [160, 0], wall_fountain: [140, 0], bbq: [110, 0], jetty: [42, 0], bridge_garden: [100, 0], strandkorb: [160, 0], driveway: [2, 0],
    firepit: [40, 0], parasol: [230, 0], elevator: [250, 0], chimney: [250, 0], safe: [50, 0], fire_ext: [40, 10], electric_panel: [50, 150], niche: [250, 0], cable_duct: [250, 0],
  };
  const CAT3 = { Garten: [60, 0],  Licht: [14, -1], Möbel: [80, 0], 'Küche & Bad': [90, 0], 'Heizung & Klima': [60, 0], 'Smart Home': [10, 110], 'Büro & Medien': [75, 0], 'Außen & Garage': [90, 0], 'Kinder & Haustiere': [45, 0], 'Bau & Deko': [100, 0] };
  const FLOOR_COL = { wood: '#c9a27a', tile: '#dfe3e6', stone: '#b8b2a7', carpet: '#b9a8c9', grass: '#8fc27a', concrete: '#b7bcc2', gravel: '#cfcac0', pavers: '#b9b2a8', deck: '#b8895a', sand: '#e6d6a8', soil: '#6b4f3a', water: '#3f9fd1' };
  const LOOKS = {
    day: { bg: '#cfe3f4', sky: ['#7fb2e0', '#cfe3f4', '#eef3f6'], ground: '#93b07f', wall: '#f3f0ea', edge: null, amb: 0.9, hemi: 1.5, hs: '#e8f2ff', hg: '#9a8a74', sunc: '#fff1d6', sun: 3.6, pl: 520, neon: false, real: true },
    dark: { bg: '#0f1626', sky: ['#070b16', '#121b2f', '#1d2840'], ground: '#1a2433', wall: '#cfc9bd', edge: null, amb: 0.35, hemi: 0.55, hs: '#6f86b8', hg: '#1b2230', sunc: '#8fa6d8', sun: 0.8, pl: 900, neon: false, real: true },
    live: { bg: '#cfe3f4', sky: ['#7fb2e0', '#cfe3f4', '#eef3f6'], ground: '#93b07f', wall: '#f3f0ea', edge: null, amb: 0.9, hemi: 1.5, hs: '#e8f2ff', hg: '#9a8a74', sunc: '#fff1d6', sun: 3.6, pl: 520, neon: false, real: true, live: true },
    blueprint: { bg: '#0b3b75', ground: '#0d4a94', wall: '#1456a8', edge: '#e6f3ff', amb: 0.9, hemi: 0.9, hs: '#ffffff', hg: '#9dc4f0', sunc: '#ffffff', sun: 1.0, pl: 900, neon: true, bp: true },
    neon: { bg: '#070a12', ground: '#0c1019', wall: '#141a2b', edge: '#26e6ff', amb: 0.8, hemi: 0.8, hs: '#ffffff', hg: '#8899aa', sunc: '#ffffff', sun: 1.0, pl: 900, neon: true },
  };


  const ROBOTS = new Set(['vacuum', 'mower_robot', 'pool_robot']);
  const ROBOT_SPEED = { vacuum: 20, mower_robot: 26, pool_robot: 14 };
  const ROBOT_ON = new Set(['cleaning', 'mowing', 'returning', 'washing', 'spot_cleaning', 'segment_cleaning', 'zone_cleaning', 'running', 'active', 'mowing_lawn']);
  const inPoly = (px, pz, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], zi = pts[i][1], xj = pts[j][0], zj = pts[j][1]; if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) c = !c; } return c; };

  function dims3(it) {
    const t = typeById(it.type) || {};
    let [h, z] = H3[it.type] || CAT3[t.cat] || [60, 0];
    if (it.h3 > 0) h = Number(it.h3);
    if (it.z3 > 0) z = Number(it.z3);
    return [h, z];
  }

  function create(container, opts) {
    const T = window.THREE_LITE;
    const o = Object.assign({ look: 'auto', walls: 'full', allFloors: false, dark: () => false, wheel: 'always', shadows: true }, opts);
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;overflow:hidden;user-select:none;-webkit-user-select:none';
    const applyTouch = () => { root.style.touchAction = o.touchScroll && !(o.touchTilt && o.touchTilt()) ? 'pan-y' : 'none'; };
    applyTouch();
    container.appendChild(root);
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: false }); }
    catch (e) { root.remove(); throw new Error('WebGL ist nicht verfügbar'); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.lowPower ? 1.5 : 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.shadowMap.enabled = !!o.shadows;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    const cv = renderer.domElement;
    cv.style.cssText = 'width:100%;height:100%;display:block;cursor:grab';
    root.appendChild(cv);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(42, 1, 5, 40000);
    const amb = new T.AmbientLight(0xffffff, 1), hemi = new T.HemisphereLight(0xffffff, 0x8899aa, 1), sun = new T.DirectionalLight(0xffffff, 1);
    sun.castShadow = !!o.shadows;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(amb, hemi, sun, sun.target);
    const world = new T.Group(); scene.add(world);

    let look = LOOKS.day, dirty = true, destroyed = false, built = '', liveSig = '', radius = 600, sizeSig = '';
    const cam = { az: 0.55, pol: 0.95, dist: 1200, tx: 0, ty: 60, tz: 0 };
    let items = [], pickables = [], fitted = false, fitKey = '';
    const texCache = new Map();

    function lookKey() { return o.look && LOOKS[o.look] ? o.look : (o.dark() ? 'dark' : 'day'); }
    function wallH() { return Math.max(180, Number(S().wallH3) || 250); }

    function colorOf(v, d) { try { return new T.Color(v || d); } catch (_) { return new T.Color(d); } }

    // ---------- Texturen ----------
    function canvasTex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
      return t;
    }
    function imgTex(src, cb) {
      const key = 'i|' + src;
      if (texCache.has(key)) { cb(texCache.get(key)); return; }
      const im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = () => {
        const t = canvasTex(256, 256, (g, w, h) => { const k = Math.min(w / im.width, h / im.height); g.drawImage(im, (w - im.width * k) / 2, (h - im.height * k) / 2, im.width * k, im.height * k); });
        texCache.set(key, t); cb(t); dirty = true;
      };
      im.onerror = () => { };
      im.src = src;
    }
    function svgTex(svg, w, h, cb) {
      const key = 's|' + svg;
      if (texCache.has(key)) { cb(texCache.get(key)); return; }
      const k = 256 / Math.max(w, h), pw = Math.max(8, Math.round(w * k)), ph = Math.max(8, Math.round(h * k));
      const im = new Image();
      im.onload = () => {
        const t = canvasTex(pw, ph, (g) => { g.drawImage(im, 0, 0, pw, ph); });
        texCache.set(key, t); cb(t); dirty = true;
      };
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2} ${-h / 2} ${w} ${h}" width="${pw}" height="${ph}">${svg}</svg>`);
    }
    function emojiTex(txt) {
      const key = 'e|' + txt;
      if (!texCache.has(key)) texCache.set(key, canvasTex(128, 128, (g, w, h) => { g.font = '96px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 6); }));
      return texCache.get(key);
    }
    function textTex(text, opt = {}) {
      text = FPI.tr(String(text));
      const key = 't|' + text + '|' + (opt.bg || '') + '|' + (opt.fg || '') + '|' + (opt.dark ? 1 : 0);
      let c = texCache.get(key);
      if (!c) {
        const fs = 56, pad = 22, m = document.createElement('canvas').getContext('2d');
        m.font = `600 ${fs}px system-ui, sans-serif`;
        const w = Math.ceil(m.measureText(text).width) + pad * 2, h = fs + pad;
        const t = canvasTex(w, h, (g) => {
          if (opt.bg) { g.fillStyle = opt.bg; g.beginPath(); if (g.roundRect) g.roundRect(2, 2, w - 4, h - 4, h / 2); else g.rect(2, 2, w - 4, h - 4); g.fill(); }
          g.font = `600 ${fs}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
          if (!opt.bg) { g.lineWidth = 9; g.strokeStyle = opt.dark ? 'rgba(10,14,24,.9)' : 'rgba(255,255,255,.95)'; g.lineJoin = 'round'; g.strokeText(text, w / 2, h / 2 + 2); }
          g.fillStyle = opt.fg || (opt.dark ? '#e6ebf5' : '#2b3240'); g.fillText(text, w / 2, h / 2 + 2);
        });
        c = { t, w, h }; texCache.set(key, c);
      }
      return c;
    }
    function textSprite(text, size, opt = {}) {
      const c = textTex(text, opt);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: c.t, transparent: true, depthTest: false, depthWrite: false }));
      sp.scale.set(size * c.w / c.h, size, 1);
      sp.renderOrder = 20;
      return sp;
    }
    function glowTex() {
      if (!texCache.has('glow')) texCache.set('glow', canvasTex(128, 128, (g, w, h) => {
        const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }));
      return texCache.get('glow');
    }

    // ---------- Aufbau ----------
    let heatRooms = [], wallGroups = [], robots = [], solar = null, groundY = 0, selBox = null, lastAnim = 0;
    function clearWorld() {
      world.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) { (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => m.dispose()); } });
      while (world.children.length) world.remove(world.children[0]);
      items = []; pickables = []; wallGroups = []; robots = []; opens = []; solar = null; selBox = null; envO = null; heatRooms = [];
    }

    function box(w, h, d, mat, x, y, z, ry = 0) {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true;
      return m;
    }

    // ---------- Öffnungen (Fenster/Türen/Tore) mit Zustand: offen, gekippt, geschlossen ----------
    let opens = [];
    const openCache = new Map();
    function sectionTex() {
      if (!texCache.has('sect')) texCache.set('sect', canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#e8ebee'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(70,80,95,.55)'; g.lineWidth = 3; for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(0, i * h / 5); g.lineTo(w, i * h / 5); g.stroke(); } g.strokeStyle = 'rgba(70,80,95,.25)'; g.lineWidth = 1; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, i * h / 5 + h / 10); g.lineTo(w, i * h / 5 + h / 10); g.stroke(); } }));
      return texCache.get('sect');
    }
    function buildOpening(op, c) {
      const { wl, ux, uy, ry, cx, cz, sill, top, win, wg, Hw, frameMat, doorMat, glassMat } = c, it = op.it, dw = op.b - op.a, inz = wg.userData.inz || 1;
      const pick3 = m => { m.userData.itemId = it.id; pickables.push(m); return m; };
      const at = s2 => [wl.x1 + ux * s2, wl.y1 + uy * s2];
      const rec = { it, o: 0, t: 0, def: 0, speed: 0.6, set: null, cover: false };
      if (win) {
        const gh = Math.min(top, Hw) - sill, flip = !!it.flipX, two = Number(it.leaves) === 2;
        [[op.a + 2], [op.b - 2]].forEach(([s2]) => { const [px, pz] = at(s2); wg.add(box(4, gh, 6, frameMat, px, sill + gh / 2, pz, ry)); });
        wg.add(box(dw, 4, 6, frameMat, cx, sill + 2, cz, ry)); wg.add(box(dw, 4, 6, frameMat, cx, sill + gh - 2, cz, ry));
        const leaves = two ? [{ hinge: op.a + 2, dir: 1, lw: dw / 2 - 2 }, { hinge: op.b - 2, dir: -1, lw: dw / 2 - 2 }] : [{ hinge: flip ? op.b - 2 : op.a + 2, dir: flip ? -1 : 1, lw: dw - 4 }];
        const sashes = leaves.map(L => {
          const hg = new T.Group(), sg = new T.Group(), [hx, hz] = at(L.hinge);
          hg.position.set(hx, sill + 3, hz); hg.add(sg); sg.position.set(L.lw / 2, 0, 0);
          const sh = gh - 6;
          const gl = box(L.lw - 5, sh - 5, 1.6, glassMat, 0, sh / 2, 0, 0); gl.castShadow = false; sg.add(gl); pick3(gl);
          [[L.lw, 2.6, 0, sh - 1.3], [L.lw, 2.6, 0, 1.3]].forEach(([w2, h2, x2, y2]) => sg.add(box(w2, h2, 3.5, frameMat, x2, y2, 0, 0)));
          [-L.lw / 2 + 1.3, L.lw / 2 - 1.3].forEach(x2 => sg.add(box(2.6, sh, 3.5, frameMat, x2, sh / 2, 0, 0)));
          wg.add(hg); return { hg, sg, dir: L.dir };
        });
        rec.kind = 'window'; rec.speed = 0.55;
        rec.set = (o, t) => sashes.forEach(S => {
          S.hg.rotation.y = ry + (S.dir < 0 ? Math.PI : 0) + (S.dir > 0 ? -inz : inz) * o * 1.35;
          S.sg.rotation.x = (S.dir > 0 ? inz : -inz) * t * 0.2;
        });
      } else {
        const dh = Math.min(top, Hw) - 4, typ = it.type;
        wg.add(box(dw, 4, 8, frameMat, cx, Math.min(top, Hw) - 2, cz, ry));
        if (typ === 'garage_door') {
          const g = new T.Group(); const [gx, gz] = at((op.a + op.b) / 2); g.position.set(gx, dh, gz); g.rotation.y = ry; wg.add(g);
          const m = new T.Mesh(new T.BoxGeometry(dw - 4, dh, 6), new T.MeshStandardMaterial({ map: sectionTex(), roughness: 0.6, metalness: 0.2 })); m.position.y = -dh / 2; m.castShadow = true; g.add(m); pick3(m);
          rec.kind = 'garage'; rec.speed = 0.22; rec.cover = true; rec.anchor = g; rec.hh = dh;
          rec.set = o => { g.scale.y = Math.max(0.02, 1 - o); };
        } else if (typ === 'door_sliding' || typ === 'door_terrace' && false) {
          const g = new T.Group(); g.rotation.y = ry; const [gx, gz] = at((op.a + op.b) / 2); g.position.set(gx, 0, gz); wg.add(g);
          const gl = box(dw * 0.52, dh, 2.2, glassMat, 0, dh / 2, 3, 0); gl.castShadow = false; g.add(gl); pick3(gl);
          [[dw * 0.52, 3, 0, dh - 1.5], [dw * 0.52, 3, 0, 1.5]].forEach(([w2, h2, x2, y2]) => g.add(box(w2, h2, 4, frameMat, x2, y2, 3, 0)));
          [-dw * 0.26 + 1.5, dw * 0.26 - 1.5].forEach(x2 => g.add(box(3, dh, 4, frameMat, x2, dh / 2, 3, 0)));
          const sgn = it.flipX ? -1 : 1, base = -sgn * dw * 0.24;
          rec.kind = 'slide'; rec.speed = 0.4;
          rec.set = o => { g.position.set(gx + ux * (base + sgn * o * dw * 0.46) - ux * 0, 0, gz + uy * (base + sgn * o * dw * 0.46)); };
          rec.base = [gx, gz];
          rec.set = o => { const k = base + sgn * o * dw * 0.46; g.position.set(gx + ux * k, 0, gz + uy * k); };
        } else {
          const two = typ === 'door_double' || Number(it.leaves) === 2, flip = !!it.flipX, sw = it.flipY ? -1 : 1;
          const leaves = two ? [{ hinge: op.a, dir: 0, lw: dw / 2 }, { hinge: op.b, dir: 1, lw: dw / 2 }] : [{ hinge: flip ? op.b : op.a, dir: flip ? 1 : 0, lw: dw }];
          const ps = leaves.map(L => {
            const pv = new T.Group(), [hx, hz] = at(L.hinge); pv.position.set(hx, 0, hz);
            const leaf = box(L.lw - 1, dh, 4, doorMat, L.lw / 2, dh / 2, 0, 0); pv.add(leaf); pick3(leaf);
            wg.add(pv); return { pv, dir: L.dir };
          });
          rec.kind = 'door'; rec.def = 0.8; rec.speed = 0.7;
          rec.set = o => ps.forEach(S => { S.pv.rotation.y = ry + (S.dir ? Math.PI : 0) + (S.dir ? -1 : 1) * sw * o * 1.5; });
        }
      }
      // Startwert: zuletzt gezeigter Zustand, sonst Ziel
      const tg = openTarget(rec), cc = openCache.get(it.id);
      rec.o = cc ? cc.o : tg.o; rec.t = cc ? cc.t : tg.t; rec.set(rec.o, rec.t); opens.push(rec);
    }
    function openTarget(rec) {
      if (rec.hold && performance.now() < rec.hold.until) return { o: rec.hold.v, t: 0 };
      const oi = openInfo(rec.it);
      return oi ? { o: oi.o, t: oi.tilt ? 1 : 0 } : { o: rec.def, t: 0 };
    }
    function animateOpens(dt) {
      let busy = false;
      opens.forEach(r => {
        const tg = openTarget(r), step = r.speed * dt, so = r.o, st = r.t;
        const mv = (v, g, k) => Math.abs(g - v) <= k ? g : v + Math.sign(g - v) * k;
        if (!r.dragging) { r.o = mv(r.o, tg.o, step); r.t = mv(r.t, tg.t, step * 1.2); }
        if (r.o !== so || r.t !== st) { r.set(r.o, r.t); busy = true; }
        openCache.set(r.it.id, { o: r.o, t: r.t });
      });
      return busy;
    }

    function openingsFor(wl, f) {
      const dx = wl.x2 - wl.x1, dy = wl.y2 - wl.y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, out = [];
      f.items.forEach(it => {
        if (it.shape !== 'door' && it.shape !== 'window') return;
        const px = it.x - wl.x1, py = it.y - wl.y1, s = px * ux + py * uy, d = Math.abs(-px * uy + py * ux);
        if (d > Math.max(wl.t, it.h || 10) / 2 + 12 || s < -10 || s > L + 10) return;
        const ang = Math.abs((((it.rot || 0) - Math.atan2(dy, dx) * 180 / Math.PI) % 180 + 180) % 180);
        if (Math.min(ang, 180 - ang) > 25) return;
        const a = Math.max(0, s - it.w / 2), b = Math.min(L, s + it.w / 2);
        if (b - a > 4) out.push({ a, b, it });
      });
      return out.sort((p, q) => p.a - q.a);
    }

    function buildFloor(f, idx, y0, Hw, L3, isTop) {
      const g = new T.Group(); g.position.y = y0; world.add(g);
      const garden = f.kind === 'garden';
      const wallMat = new T.MeshStandardMaterial({ color: colorOf(garden ? '#a97c50' : (o.wallColor || S().wallColor3 || L3.wall)), roughness: 0.9, metalness: 0 });
      const glassMat = new T.MeshStandardMaterial({ color: 0x9bd5ff, transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.1, depthWrite: false });
      const frameMat = new T.MeshStandardMaterial({ color: look.bp ? 0xe6f3ff : look.neon ? 0x26e6ff : 0xf4f4f4, roughness: 0.6, emissive: look.bp ? 0x1a4a80 : look.neon ? 0x0a4a55 : 0x000000 });
      const doorMat = new T.MeshStandardMaterial({ color: look.bp ? 0x1d5fae : look.neon ? 0x1c2a44 : 0xb98a5a, roughness: 0.7 });
      const edgeMat = L3.edge ? new T.LineBasicMaterial({ color: L3.edge, transparent: true, opacity: 0.85 }) : null;
      let wg = g; const fc = contentBounds(f); const cxm = fc.x + fc.w / 2, czm = fc.y + fc.h / 2;
      const addWallBox = (len, h, t, cx, cy, cz, ry) => {
        if (len < 0.5 || h < 0.5) return;
        const m = box(len, h, t, wallMat, cx, cy, cz, ry); wg.add(m);
        if (edgeMat) { const e = new T.LineSegments(new T.EdgesGeometry(m.geometry), edgeMat); e.position.copy(m.position); e.rotation.copy(m.rotation); wg.add(e); }
      };

      // Räume (Boden)
      (f.rooms || []).forEach(r => {
        if (!r.pts || r.pts.length < 3) return;
        const sh = new T.Shape(); r.pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
        const col = r.floor && FLOOR_COL[r.floor] ? FLOOR_COL[r.floor] : (r.color || '#90caf9');
        const mat = new T.MeshStandardMaterial({ color: colorOf(col), roughness: 0.95, side: T.DoubleSide });
        if (!(r.floor && FLOOR_COL[r.floor])) mat.color.lerp(new T.Color(look.bp ? 0x0b3b75 : look.neon ? 0x0b1020 : 0xffffff), look.bp ? 0.7 : look.neon ? 0.55 : 0.45);
        if (r.area && !(r.floor && FLOOR_COL[r.floor])) heatRooms.push({ mat, area: r.area, base: mat.color.clone() });
        const geo = new T.ExtrudeGeometry(sh, { depth: 14, bevelEnabled: false });
        const m = new T.Mesh(geo, mat); m.rotation.x = Math.PI / 2; m.position.y = 0; m.receiveShadow = true; g.add(m);
        const fd = typeof FLOORS !== 'undefined' ? FLOORS[r.floor] : null;
        if (fd) {
          const sc = r.floorScale > 0 ? r.floorScale : 1, rc = r.color || '#90caf9', key = 'f|' + r.floor + '|' + sc + '|' + rc + '|' + (look.bp ? 2 : look.neon ? 1 : 0);
          const apply = (t) => { t = t.clone(); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1 / (fd[0] * sc), 1 / (fd[1] * sc)); t.rotation = (r.floorRot || 0) * Math.PI / 180; t.needsUpdate = true; mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; dirty = true; };
          const hit = texCache.get(key);
          if (hit) apply(hit);
          else {
            const bx = -fd[0] / 2, by = -fd[1] / 2;
            svgTex(`<defs><pattern id="p" patternUnits="userSpaceOnUse" x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}">${fd[2]}</pattern></defs><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="${look.bp ? '#0e4a93' : look.neon ? '#141b2e' : '#ffffff'}"/><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="${rc}" fill-opacity="${look.neon ? 0.45 : 0.62}"/><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="url(#p)"/>`, fd[0], fd[1], t => { texCache.set(key, t); apply(t); });
          }
        }
      });

      // Wände mit Öffnungen
      (f.walls || []).forEach(wl => {
        const dx = wl.x2 - wl.x1, dy = wl.y2 - wl.y1, L = Math.hypot(dx, dy);
        if (L < 1) return;
        const ux = dx / L, uy = dy / L, t = wl.t || S().wallThickness || 15, ry = -Math.atan2(dy, dx), ext = t / 2;
        wg = new T.Group(); g.add(wg);
        if (!garden) { let nx = -uy, nz = ux; const mx = (wl.x1 + wl.x2) / 2 - cxm, mz = (wl.y1 + wl.y2) / 2 - czm; if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; } wg.userData.n = [nx, nz]; wg.userData.inz = Math.abs(nx + uy) < 1e-6 && Math.abs(nz - ux) < 1e-6 ? -1 : 1; wallGroups.push(wg); }
        const ops = garden ? [] : openingsFor(wl, f);
        const seg = (a, b, h, y) => { // Teilstück [a,b] entlang der Wand
          const len = b - a; if (len < 0.5) return;
          const mid = (a + b) / 2;
          addWallBox(len, h, t, wl.x1 + ux * mid, y + h / 2, wl.y1 + uy * mid, ry);
        };
        let cur = -ext;
        const solidH = Hw;
        ops.forEach(op => {
          seg(cur, op.a, solidH, 0);
          const win = op.it.shape === 'window', top = Math.min(Hw, 210), sill = win ? Math.min(90, Hw - 40) : 0;
          if (win) seg(op.a, op.b, sill, 0);
          if (Hw > top) seg(op.a, op.b, Hw - top, top);
          const mid = (op.a + op.b) / 2, cx = wl.x1 + ux * mid, cz = wl.y1 + uy * mid;
          buildOpening(op, { wl, ux, uy, ry, cx, cz, sill, top, win, wg, Hw, frameMat, doorMat, glassMat });
          cur = op.b;
        });
        seg(cur, L + ext, solidH, 0);
      });

      // Objekte
      (f.items || []).forEach(it => {
        if (it.shape === 'door' || it.shape === 'window') {
          // freistehend (nicht an einer Wand): dünne Fläche anzeigen
          const onWall = (f.walls || []).some(w => openingsFor(w, f).some(op => op.it === it));
          if (onWall) return;
          const hh = it.shape === 'door' ? 205 : 120, zz = it.shape === 'door' ? 0 : 90;
          const m = box(it.w, hh, Math.max(4, it.h * 0.4), it.shape === 'door' ? doorMat : glassMat, it.x, zz + hh / 2, it.y, -(it.rot || 0) * Math.PI / 180);
          g.add(m); return;
        }
        if (it.shape === 'text') {
          const c = textTex(String(it.label || '').split('\n').join(' '), { dark: !!look.neon || o.dark() }), sz = it.fs || 28;
          const sp = new T.Mesh(new T.PlaneGeometry(sz * c.w / c.h, sz), new T.MeshBasicMaterial({ map: c.t, transparent: true, depthWrite: false }));
          sp.rotation.set(-Math.PI / 2, 0, -(it.rot || 0) * Math.PI / 180, 'YXZ'); sp.position.set(it.x, 1.2, it.y); g.add(sp); return;
        }
        const [hd, zd] = dims3(it);
        const h = Math.max(1, hd);
        const z0 = zd === -1 ? Hw - h : zd === -2 ? Hw - h - 25 : zd;
        const ig = new T.Group(); ig.position.set(it.x, z0, it.y); ig.rotation.y = -(it.rot || 0) * Math.PI / 180; g.add(ig);
        const col = colorOf(it.color || (typeById(it.type) || {}).color, '#cfd8dc');
        const mat = new T.MeshStandardMaterial({ color: col, roughness: 0.75, metalness: 0.05, emissive: 0x000000 });
        if (look.neon) mat.color.lerp(new T.Color(look.bp ? 0x1f6fc2 : 0x1a2338), look.bp ? 0.65 : 0.55);
        let geo;
        if (it.shape === 'ellipse') { geo = new T.CylinderGeometry(1, 1, h, 28); }
        else geo = new T.BoxGeometry(it.w, h, it.h);
        const body = new T.Mesh(geo, mat);
        let model = null;
        if (!it.image && it.shape !== 'none' && !(it.icon && it.icon.startsWith('img:')) && typeof FPM !== 'undefined' && o.models !== false) model = FPM.build(T, it, it.w, it.h, h, typeof isCustomColor === 'function' && isCustomColor(it) ? it.color : null);
        if (model) { ig.add(model.group); mat.visible = false; }
        if (it.shape === 'ellipse') body.scale.set(it.w / 2, 1, it.h / 2);
        if (it.shape === 'none') { body.visible = false; }
        body.position.y = h / 2; body.castShadow = !model && h > 6; body.receiveShadow = true; body.userData.itemId = it.id;
        ig.add(body); pickables.push(body);
        if (!model && edgeMat && it.shape !== 'ellipse' && it.shape !== 'none') { const e = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: L3.edge, transparent: true, opacity: 0.55 })); e.position.y = h / 2; ig.add(e); }
        // Symbol / Bild auf der Oberseite
        const topY = h + 0.4, isz = Math.min(it.w, it.h) * 0.8 * (it.iconScale || 1);
        const iconPlane = (tex, w2, h2) => {
          const p = new T.Mesh(new T.PlaneGeometry(w2, h2), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
          p.rotation.x = -Math.PI / 2; p.position.y = topY; p.userData.itemId = it.id; ig.add(p); pickables.push(p); return p;
        };
        const sk = model ? '' : symKeyFor(it);
        if (model) { /* Modell statt Symbol */ }
        else if (it.image && it.imgMode !== 'stretch') { imgTex(it.image, tx => { const k = Math.min(it.w / 256, it.h / 256); iconPlane(tx, 256 * k, 256 * k); }); }
        else if (it.image) { imgTex(it.image, tx => iconPlane(tx, it.w, it.h)); }
        else if (sk) { svgTex(symDetail(sk, it.w, it.h), it.w, it.h, tx => iconPlane(tx, it.w, it.h)); }
        else if (it.icon && it.icon.startsWith('img:')) { imgTex(it.icon.slice(4), tx => iconPlane(tx, isz, isz)); }
        else if (it.icon && it.shape !== 'none' && h > 3) iconPlane(emojiTex(it.icon), isz, isz);
        else if (it.icon && it.shape === 'none') { const sp = new T.Sprite(new T.SpriteMaterial({ map: emojiTex(it.icon), transparent: true, depthTest: false })); sp.scale.set(Math.max(20, isz), Math.max(20, isz), 1); sp.position.y = h + 12; sp.renderOrder = 15; ig.add(sp); }
        const rec = { it, group: ig, body, mat, h, z0, live: model ? model.live : null, anim: model ? model.anim : null, labelName: null, labelVal: null, valTxt: '', pool: null, light: null, baseColor: mat.color.clone(), floorY: y0 };
        items.push(rec);
        if (ROBOTS.has(it.type) && it.roam !== 'off') setupRobot(rec, f);
      });
      return g;
    }

    // ---------- Roboter (Saug-/Mäh-/Poolroboter fahren umher) ----------
    function setupRobot(rec, f) {
      const it = rec.it; let area = null, excl = [];
      const mower = it.type === 'mower_robot';
      if (it.type === 'pool_robot') { const pl = f.items.find(x => x.type === 'pool' && Math.abs(it.x - x.x) <= x.w / 2 && Math.abs(it.y - x.y) <= x.h / 2); if (pl) area = { rect: [pl.x - pl.w / 2 + 25, pl.y - pl.h / 2 + 25, pl.x + pl.w / 2 - 25, pl.y + pl.h / 2 - 25] }; }
      if (mower) {
        // nur Rasenflächen im Garten, nie auf Terrasse/Kies/Wasser und nicht ins Haus
        const rs = (f.rooms || []).filter(r => r.pts && r.pts.length > 2);
        const grass = rs.filter(r => (r.floor || 'grass') === 'grass' && r.floor === 'grass');
        const g0 = grass.filter(r => inPoly(it.x, it.y, r.pts)); const use = g0.length ? g0 : grass;
        if (use.length) area = { polys: use.map(r => r.pts) };
        rs.filter(r => r.floor && r.floor !== 'grass').forEach(r => excl.push(r.pts));
        (plan.floors || []).filter(x => x.kind !== 'garden').forEach(x => (x.rooms || []).forEach(r => { if (r.pts && r.pts.length > 2) excl.push(r.pts); }));
        (plan.floors || []).filter(x => x.kind !== 'garden').forEach(x => (x.walls || []).forEach(w => { const t = (w.t || 10) / 2 + 2, dx = w.x2 - w.x1, dy = w.y2 - w.y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l * t, ny = dx / l * t; excl.push([[w.x1 + nx, w.y1 + ny], [w.x2 + nx, w.y2 + ny], [w.x2 - nx, w.y2 - ny], [w.x1 - nx, w.y1 - ny]]); }));
      }
      if (!area) { const rs = (f.rooms || []).filter(r => r.pts && r.pts.length > 2 && inPoly(it.x, it.y, r.pts)); if (rs.length) area = { poly: rs[rs.length - 1].pts }; }
      if (!area) { const b = contentBounds(f); area = { rect: [b.x, b.y, b.x + b.w, b.y + b.h] }; }
      const obst = f.items.filter(x => x !== it && !ROBOTS.has(x.type) && !['door', 'window', 'text', 'none'].includes(x.shape)).map(x => { const [hh, zz] = dims3(x); return { x, hh, zz }; }).filter(a => mower ? true : (a.hh > 14 && a.zz >= 0 && a.zz < 40)).map(a => a.x);
      rec.robot = { x: it.x, z: it.y, hd: [0, Math.PI / 2, Math.PI, -Math.PI / 2][Math.floor(Math.random() * 4)], vh: 0, area, excl, obst, mower, rad: Math.max(8, Math.min(it.w, it.h) / 2), speed: ROBOT_SPEED[it.type] || 18, wait: 0, mode: 'go', side: 1, run: 0, fails: 0 };
      rec.robot.vh = rec.robot.hd;
    }
    function robotFree(r, px, pz) {
      const a = r.area, m = r.rad * 0.8 + (r.mower ? 12 : 0);
      const pts = [[px, pz], [px + m, pz], [px - m, pz], [px, pz + m], [px, pz - m], [px + m * .7, pz + m * .7], [px - m * .7, pz + m * .7], [px + m * .7, pz - m * .7], [px - m * .7, pz - m * .7]];
      for (const [qx, qz] of pts) {
        if (a.polys ? !a.polys.some(p => inPoly(qx, qz, p)) : a.poly ? !inPoly(qx, qz, a.poly) : (qx < a.rect[0] || qx > a.rect[2] || qz < a.rect[1] || qz > a.rect[3])) return false;
        if (r.excl) for (const p of r.excl) if (inPoly(qx, qz, p)) return false;
      }
      for (const o2 of r.obst) {
        const dx = px - o2.x, dz = pz - o2.y, rr = -(o2.rot || 0) * Math.PI / 180, c = Math.cos(rr), sn = Math.sin(rr), lx = dx * c - dz * sn, lz = dx * sn + dz * c;
        if (Math.abs(lx) < o2.w / 2 + m && Math.abs(lz) < o2.h / 2 + m) return false;
      }
      return true;
    }
    function robotActive(it) {
      if (it.roam === 'always') return true;
      if (!it.entity) return false;
      const st = states[it.entity]; if (!st) return false;
      return isActive(st) || ROBOT_ON.has(st.state);
    }
    function animateRobots(dt) {
      let busy = false;
      items.forEach(rec => {
        const r = rec.robot; if (!r || rec.dragging) return;
        if (!robotActive(rec.it)) return;
        busy = true;
        const step = r.speed * dt;
        if (r.wait > 0) r.wait -= dt;
        else {
          const nx = r.x + Math.cos(r.hd) * step, nz = r.z + Math.sin(r.hd) * step;
          if (robotFree(r, nx, nz)) {
            r.x = nx; r.z = nz; r.run += step;
            if (r.mode === 'shift') { r.left -= step; if (r.left <= 0) { r.mode = 'go'; r.hd = r.base + Math.PI; r.wait = 0.2; r.run = 0; r.fails = 0; } }
          } else if (r.mode === 'go') {
            // Bahnende: seitlich versetzen, dann in Gegenrichtung zurück (Bahnen hin und her)
            if (r.run < r.rad && r.fails < 2) { r.side = -r.side; r.fails++; }
            r.base = r.hd; r.mode = 'shift'; r.left = r.rad * 2.2; r.hd = r.base + r.side * Math.PI / 2; r.wait = 0.2;
            if (r.fails >= 2) { r.mode = 'go'; r.hd = r.base + Math.PI; r.fails = 0; r.run = 0; }
          } else {
            // Versatz blockiert -> zurück in Gegenrichtung, nächste Bahn auf der anderen Seite
            r.mode = 'go'; r.hd = r.base + Math.PI; r.side = -r.side; r.wait = 0.2; r.run = 0;
          }
        }
        let d = r.hd - r.vh; d = Math.atan2(Math.sin(d), Math.cos(d)); r.vh += d * Math.min(1, dt * 12);
        rec.group.position.x = r.x; rec.group.position.z = r.z; rec.group.rotation.y = Math.PI / 2 - r.vh;
      });
      return busy;
    }

    // ---------- Dachgeometrie mit UV (Ziegel) ----------
    function roofGeo(mode, across, len, rh) {
      const a = across / 2, l = len / 2, faces = [];
      if (mode === 'shed') {
        faces.push([[-a, 0, -l], [-a, 0, l], [a, rh, l], [a, rh, -l]], [[a, 0, l], [a, 0, -l], [a, rh, -l], [a, rh, l]], [[-a, 0, l], [a, 0, l], [a, rh, l]], [[a, 0, -l], [-a, 0, -l], [a, rh, -l]]);
      } else if (mode === 'gable') {
        faces.push([[-a, 0, -l], [-a, 0, l], [0, rh, l], [0, rh, -l]], [[a, 0, l], [a, 0, -l], [0, rh, -l], [0, rh, l]], [[-a, 0, l], [a, 0, l], [0, rh, l]], [[a, 0, -l], [-a, 0, -l], [0, rh, -l]]);
      } else {
        const rl = Math.max(0, l - a), A = [-a, 0, -l], B = [a, 0, -l], C = [a, 0, l], D = [-a, 0, l], R1 = [0, rh, -rl], R2 = [0, rh, rl];
        faces.push([A, B, R1], [C, D, R2], [B, C, R2, R1], [D, A, R1, R2]);
      }
      const pos = [], uv = [], TW = 120, TH = 152;
      faces.forEach(f => {
        const p0 = f[0], e1 = new T.Vector3(f[1][0] - p0[0], f[1][1] - p0[1], f[1][2] - p0[2]), e2 = new T.Vector3(f[f.length - 1][0] - p0[0], f[f.length - 1][1] - p0[1], f[f.length - 1][2] - p0[2]);
        const n = new T.Vector3().crossVectors(e1, e2).normalize(); let hz = new T.Vector3().crossVectors(n, new T.Vector3(0, 1, 0));
        if (hz.lengthSq() < 1e-6) hz = new T.Vector3(1, 0, 0); hz.normalize();
        let up = new T.Vector3().crossVectors(n, hz).normalize(); if (up.y < 0) up.negate();
        const put = q => { pos.push(q[0], q[1], q[2]); const dv = new T.Vector3(q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]); uv.push(dv.dot(hz) / TW, dv.dot(up) / TH); };
        for (let i = 1; i < f.length - 1; i++) { put(f[0]); put(f[i]); put(f[i + 1]); }
      });
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
      return geo;
    }
    function roofTileTex(col) {
      const key = 'tile|' + col; let t = texCache.get(key); if (t) return t;
      const c0 = new T.Color(col);
      t = canvasTex(256, 256, (g, w2, h2) => {
        g.fillStyle = '#' + c0.clone().multiplyScalar(0.45).getHexString(); g.fillRect(0, 0, w2, h2);
        let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const cw = w2 / 4, ch = h2 / 4;
        for (let r = -1; r < 5; r++) for (let c = -1; c < 5; c++) {
          const x = c * cw + (((r % 2) + 2) % 2) * cw / 2, y = r * ch, k = 0.82 + rnd() * 0.32, cc = c0.clone().multiplyScalar(k);
          const gr = g.createLinearGradient(0, y, 0, y + ch * 1.35); gr.addColorStop(0, '#' + cc.clone().multiplyScalar(0.8).getHexString()); gr.addColorStop(0.6, '#' + cc.getHexString()); gr.addColorStop(1, '#' + cc.clone().multiplyScalar(1.12).getHexString());
          g.fillStyle = gr; g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + cw - 2, y); g.lineTo(x + cw - 2, y + ch * 1.05); g.quadraticCurveTo(x + cw / 2, y + ch * 1.45, x + 2, y + ch * 1.05); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.stroke();
        }
      });
      t.wrapS = t.wrapT = T.RepeatWrapping; texCache.set(key, t); return t;
    }

    // ---------- Solaranlage auf dem Dach ----------
    function buildSolar(P) {
      const { roofMode, W, D, cx2, cz2, by, rh, across, len, alongX, pitch } = P;
      const fill = Math.min(100, Math.max(10, Number(S().solarFill3) || 70)) / 100, side = (S().solarSide3 === 'B' ? -1 : 1) * (roofMode !== 'flat' && alongX ? -1 : 1), reqN = Math.max(0, Math.round(Number(S().solarCount3) || 0));
      const PW = 100, PH = 170, GAP = 3;
      const tex = canvasTex(128, 256, (g, w2, h2) => { g.fillStyle = '#12213d'; g.fillRect(0, 0, w2, h2); const gr = g.createLinearGradient(0, 0, w2, h2); gr.addColorStop(0, 'rgba(90,140,220,.35)'); gr.addColorStop(1, 'rgba(10,20,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, w2, h2); g.strokeStyle = 'rgba(190,210,240,.55)'; g.lineWidth = 2; for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(i * w2 / 6, 0); g.lineTo(i * w2 / 6, h2); g.stroke(); } for (let j = 0; j <= 10; j++) { g.beginPath(); g.moveTo(0, j * h2 / 10); g.lineTo(w2, j * h2 / 10); g.stroke(); } });
      const topM = new T.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.5, emissive: 0x2a5fb0, emissiveIntensity: 0.1 });
      const frameM = new T.MeshStandardMaterial({ color: 0xcfd4d9, roughness: 0.4, metalness: 0.8 });
      const pivot = new T.Group(); pivot.position.set(cx2, by, cz2); if (roofMode !== 'flat') pivot.rotation.y = alongX ? Math.PI / 2 : 0; world.add(pivot);
      const mkPanel = (dx, dz) => { const g = new T.Group(); const f2 = new T.Mesh(new T.BoxGeometry(dx, 3.2, dz), frameM); f2.castShadow = true; const tp = new T.Mesh(new T.PlaneGeometry(dx - 4, dz - 4), topM); tp.rotation.x = -Math.PI / 2; tp.position.y = 1.7; g.add(f2, tp); return g; };
      // gleichmäßig zentriertes Raster für n Module
      const gridPos = (n, colsMax, rowsMax) => {
        const rows = Math.min(rowsMax, Math.max(1, Math.ceil(n / colsMax))), cols = Math.min(colsMax, Math.ceil(n / rows)), out = []; let k = 0;
        for (let r = 0; r < rows && k < n; r++) { const cnt = Math.min(cols, n - k); for (let c = 0; c < cnt; c++) { out.push({ c: c - (cnt - 1) / 2, r }); k++; } }
        return { list: out, rows };
      };
      const spots = []; // [group-position, rotation]
      if (roofMode === 'flat') {
        const aw = W - 2 * Math.max(0, Number(S().roofOver3) || 0) - 60, ad = D - 2 * Math.max(0, Number(S().roofOver3) || 0) - 60, tilt = 0.4, pitchD = PH * Math.cos(tilt) + 55;
        const cols = Math.max(1, Math.floor((aw + GAP) / (PW + GAP))), rows = Math.max(1, Math.floor((ad + 40) / pitchD)), max = cols * rows, n = Math.min(max, reqN > 0 ? reqN : Math.max(1, Math.round(max * fill)));
        const gp = gridPos(n, cols, rows);
        gp.list.forEach(q => spots.push({ x: q.c * (PW + GAP), y: 7 + PH * Math.sin(tilt) / 2 + 8, z: (q.r - (gp.rows - 1) / 2) * pitchD, rx: side * tilt, rz: 0, flat: true }));
      } else if (roofMode === 'shed') {
        const Ls = Math.hypot(across, rh), alpha = Math.atan2(rh, across), s0 = Math.max(35, (Number(S().roofOver3) || 40) / Math.cos(alpha) + 12), rowsMax = Math.max(1, Math.floor((Ls - s0 - 25 + GAP) / (PH + GAP)));
        const cols = Math.max(1, Math.floor((Math.max(PW, len - 50) + GAP) / (PW + GAP))), max = rowsMax * cols, n = Math.min(max, reqN > 0 ? reqN : Math.max(1, Math.round(max * fill))), gp = gridPos(n, cols, rowsMax);
        gp.list.forEach(q => { const sc = s0 + PH / 2 + q.r * (PH + GAP); spots.push({ x: -across / 2 + Math.cos(alpha) * sc - Math.sin(alpha) * 2.4, y: Math.sin(alpha) * sc + Math.cos(alpha) * 2.4, z: q.c * (PW + GAP), rz: alpha, rx: 0, flat: false }); });
      } else {
        const Ls = Math.hypot(across / 2, rh), alpha = Math.atan2(rh, across / 2), s0 = Math.max(35, (Number(S().roofOver3) || 40) / Math.cos(alpha) + 12), rowsMax = Math.max(1, Math.floor((Ls - s0 - 25 + GAP) / (PH + GAP)));
        const regionLen = roofMode === 'hip' ? Math.max(PW, len - across - 20) : Math.max(PW, len - 50), cols = Math.max(1, Math.floor((regionLen + GAP) / (PW + GAP))), max = rowsMax * cols;
        const nAll = reqN > 0 ? reqN : Math.max(1, Math.round(max * fill)), nA = Math.min(nAll, max), nB = Math.min(nAll - nA, max);
        [[side, nA], [-side, nB]].forEach(([sd, cnt]) => {
          if (cnt <= 0) return;
          const ux = -sd * (across / 2) / Ls, uy = rh / Ls, nx = sd * rh / Ls, ny = (across / 2) / Ls, ex = sd * across / 2, gp = gridPos(cnt, cols, rowsMax);
          gp.list.forEach(q => { const sc = s0 + PH / 2 + q.r * (PH + GAP); spots.push({ x: ex + ux * sc + nx * 2.4, y: uy * sc + ny * 2.4, z: q.c * (PW + GAP), rz: -sd * alpha, rx: 0, flat: false }); });
        });
      }
      const centers = [];
      spots.forEach(sp => { const g = sp.flat ? mkPanel(PW, PH) : mkPanel(PH, PW); g.position.set(sp.x, sp.y, sp.z); g.rotation.set(sp.rx || 0, 0, sp.rz || 0); pivot.add(g); });
      pivot.updateMatrixWorld(true);
      pivot.children.forEach(ch => { const v = new T.Vector3(); ch.getWorldPosition(v); centers.push(v); });
      const dest = new T.Vector3(cx2, by - wallH() * 0.45, cz2);
      const sprMat = () => new T.SpriteMaterial({ map: glowTex(), color: 0xffd54f, blending: T.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false });
      const parts = []; for (let i = 0; i < 18; i++) { const sp2 = new T.Sprite(sprMat()); sp2.renderOrder = 40; sp2.visible = false; world.add(sp2); parts.push({ sp: sp2, t: i / 18, from: centers[Math.floor(Math.random() * centers.length)] }); }
      const hub = new T.Sprite(sprMat()); hub.material.color.set(0xffa000); hub.renderOrder = 41; hub.position.copy(dest); hub.scale.set(60, 60, 1); world.add(hub);
      solar = { centers, dest, parts, hub, topM };
    }
    function animateSolar(dt, now) {
      const sl = solar; if (!sl) return false;
      let pf = 1; const ent = S().solarEntity;
      if (ent) { const st = states[ent]; let v = st ? parseFloat(st.state) : NaN; if (st && st.attributes && /^kW$/i.test(st.attributes.unit_of_measurement || '')) v *= 1000; const mx = Number(S().solarMax3) || 5000; pf = isFinite(v) && v > 0 ? Math.max(0.12, Math.min(1, v / mx)) : 0; }
      sl.topM.emissiveIntensity = 0.06 + 0.7 * pf;
      const n = Math.ceil(pf * sl.parts.length), speed = 0.28 + 0.6 * pf;
      sl.parts.forEach((p, i) => {
        if (i >= n) { p.sp.visible = false; return; }
        p.t += dt * speed; if (p.t >= 1) { p.t -= 1; p.from = sl.centers[Math.floor(Math.random() * sl.centers.length)]; }
        const k = p.t, e = k * k * (3 - 2 * k);
        p.sp.visible = true; p.sp.position.set(p.from.x + (sl.dest.x - p.from.x) * e, p.from.y + (sl.dest.y - p.from.y) * e + Math.sin(Math.PI * k) * 25, p.from.z + (sl.dest.z - p.from.z) * e);
        const sc = 26 * (1 - 0.5 * k); p.sp.scale.set(sc, sc, 1); p.sp.material.opacity = Math.min(1, k * 6) * Math.min(1, (1 - k) * 5);
      });
      sl.hub.visible = pf > 0; sl.hub.scale.setScalar(50 + 14 * Math.sin(now * 0.006)); sl.hub.material.opacity = 0.35 + 0.4 * pf;
      return pf > 0;
    }
    const coverCache = new Map();
    function coverTarget(s) {
      if (!s) return null; const a = s.attributes || {};
      if (a.current_position != null && isFinite(a.current_position)) return Math.max(0, Math.min(1, a.current_position / 100));
      if (s.state === 'open' || s.state === 'opening') return 1; if (s.state === 'closed' || s.state === 'closing') return 0; return null;
    }
    function animateRecs(dt) {
      let busy = false;
      items.forEach(rec => {
        const a = rec.anim; if (!a) return; const it = rec.it, s = it.entity ? states[it.entity] : null;
        if (a.type === 'cover') {
          let tg = coverTarget(s); if (rec.hold && performance.now() < rec.hold.until) tg = rec.hold.v; if (tg == null) return;
          let cv = rec.cv != null ? rec.cv : (coverCache.has(it.id) ? coverCache.get(it.id) : tg);
          const d = tg - cv; if (Math.abs(d) > 0.002) { cv += Math.sign(d) * Math.min(Math.abs(d), dt * 0.3); busy = true; } else cv = tg;
          rec.cv = cv; coverCache.set(it.id, cv); a.set(cv);
        } else {
          const act = !!s && isActive(s), r = a.step(dt, act); if (act || r || a.wasOn) busy = true; a.wasOn = act;
        }
      });
      return busy;
    }
    function animateAll(dt, now) { let b = false; if (animateRecs(dt)) b = true; if (opens.length && animateOpens(dt)) b = true; if (robots.length || items.some(r => r.robot)) b = animateRobots(dt) || b; if (animateSolar(dt, now)) b = true; if (envO && animateEnv(dt, now)) b = true; return b; }

    // ---------- Live-Umgebung: Tageszeit + Wetter (Look „live“) ----------
    let envO = null;
    const wx = { rain: 0, snow: 0, fog: 0, cl: 0, light: 0, wind: 0, elev: 30, az: 180, d: 1 };
    const WCOND = {
      sunny: { cl: 0.04 }, 'clear-night': { cl: 0.03 }, partlycloudy: { cl: 0.45 }, cloudy: { cl: 0.88 },
      rainy: { cl: 0.88, rain: 0.55 }, pouring: { cl: 1, rain: 1 }, snowy: { cl: 0.88, snow: 0.65 }, 'snowy-rainy': { cl: 0.92, rain: 0.3, snow: 0.45 },
      fog: { cl: 0.6, fog: 1 }, hail: { cl: 1, rain: 0.9 }, lightning: { cl: 0.95, light: 1 }, 'lightning-rainy': { cl: 1, rain: 0.8, light: 1 },
      windy: { cl: 0.3, wind: 1 }, 'windy-variant': { cl: 0.6, wind: 1 }, exceptional: { cl: 0.5 },
    };
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    function readEnv() {
      const sim = o.sim || S().sim3 || null, now = new Date();
      let hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      if (sim && sim.hour != null) hour = sim.hour;
      const ss = states['sun.sun'], wid = typeof weatherId === 'function' ? weatherId() : '', ws = wid && states[wid];
      let elev, az;
      if (!(sim && sim.hour != null) && ss && ss.attributes && ss.attributes.elevation != null) { elev = Number(ss.attributes.elevation); az = Number(ss.attributes.azimuth) || 180; }
      else { elev = 55 * Math.sin((hour - 6) / 12 * Math.PI); az = ((hour - 6) / 24 * 360 + 90) % 360; }
      const cond = sim && sim.cond ? sim.cond : (ws ? String(ws.state) : 'sunny');
      const c = Object.assign({ cl: 0.1, rain: 0, snow: 0, fog: 0, light: 0, wind: 0 }, WCOND[cond] || {});
      const a = (ws && ws.attributes) || {};
      if (a.cloud_coverage != null && !(sim && sim.cond)) c.cl = Math.min(1, Math.max(0, Number(a.cloud_coverage) / 100));
      const wsp = Number(a.wind_speed); if (!isNaN(wsp) && !(sim && sim.cond)) c.wind = Math.max(c.wind, Math.min(1.5, wsp / 40));
      return Object.assign(c, { elev, az, cond, hour });
    }
    function buildEnv(cx, cz, R, maxY, gm) {
      const g = new T.Group(); world.add(g);
      const rTex = (stops, size = 128) => canvasTex(size, size, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); stops.forEach(([p, col]) => gr.addColorStop(p, col)); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
      const sunTex = rTex([[0, 'rgba(255,250,225,1)'], [0.12, 'rgba(255,244,200,1)'], [0.3, 'rgba(255,220,150,.35)'], [1, 'rgba(255,200,120,0)']]);
      const moonTex = rTex([[0, 'rgba(240,244,255,1)'], [0.2, 'rgba(225,232,250,.95)'], [0.3, 'rgba(180,200,240,.25)'], [1, 'rgba(150,170,220,0)']]);
      const cloudTex = canvasTex(256, 128, (c, w, h) => { for (let i = 0; i < 14; i++) { const x = w * (0.18 + 0.64 * Math.random()), y = h * (0.45 + 0.2 * Math.random()), r = h * (0.22 + 0.22 * Math.random()), gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); } });
      const dotTex = rTex([[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']], 32);
      const sp = (tex, sc) => { const m = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); m.scale.set(sc, sc, 1); m.renderOrder = -5; g.add(m); return m; };
      const sunS = sp(sunTex, R * 5), moonS = sp(moonTex, R * 2.4);
      const nCl = o.lowPower ? 9 : 16, cl = [];
      for (let i = 0; i < nCl; i++) { const m = sp(cloudTex, R * (3 + Math.random() * 3.5)); m.scale.y = m.scale.x * 0.45; cl.push({ m, a: Math.random() * 6.283, r: R * (6 + Math.random() * 5), y: R * (0.4 + Math.random() * 1.1), v: 0.6 + Math.random() * 0.8, k: i / nCl }); }
      const nSt = o.lowPower ? 150 : 350, sa = new Float32Array(nSt * 12), ss2 = R * 0.12;
      for (let i = 0; i < nSt; i++) { const u = Math.random() * 6.283, v = 0.08 + Math.random() * 0.9, r2 = R * 20, x = cx + Math.cos(u) * Math.cos(v) * r2, y = Math.sin(v) * r2, z = cz + Math.sin(u) * Math.cos(v) * r2, q = i * 12; sa.set([x - ss2, y, z, x + ss2, y, z, x, y - ss2, z, x, y + ss2, z], q); }
      const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sa, 3));
      const stars = new T.LineSegments(sg, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false })); stars.renderOrder = -6; stars.frustumCulled = false; g.add(stars);
      // Regen
      const nR = o.lowPower ? 450 : 1300, ra = new Float32Array(nR * 6), rp = new Float32Array(nR * 3), W = R * 2.4, H = Math.max(R * 1.6, maxY + 200);
      for (let i = 0; i < nR; i++) { rp[i * 3] = (Math.random() - 0.5) * W; rp[i * 3 + 1] = Math.random() * H; rp[i * 3 + 2] = (Math.random() - 0.5) * W; }
      const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(ra, 3));
      const rain = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0xcfe0f5, transparent: true, opacity: 0.85, fog: false, depthWrite: false })); rain.frustumCulled = false; rain.renderOrder = 20; g.add(rain);
      // Schnee
      const nS = o.lowPower ? 220 : 600, sn = new Float32Array(nS * 12), sq = new Float32Array(nS * 3), fs = Math.max(5, R * 0.014);
      for (let i = 0; i < nS; i++) { sq[i * 3] = (Math.random() - 0.5) * W; sq[i * 3 + 1] = Math.random() * H; sq[i * 3 + 2] = (Math.random() - 0.5) * W; }
      const ng = new T.BufferGeometry(); ng.setAttribute('position', new T.Float32BufferAttribute(sn, 3));
      const snow = new T.LineSegments(ng, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, fog: false })); snow.frustumCulled = false; snow.renderOrder = 20; g.add(snow);
      const gcol = colorOf(o.ground || S().ground3 || look.ground);
      envO = { g, sunS, moonS, cl, stars, rain, snow, rp, ra: rg.attributes.position.array, sq, sn: ng.attributes.position.array, fs, nR, nS, W, H, cx, cz, R, maxY, gm, gcol, snowAcc: 0, flash: 0, nextFlash: 3, sig: '', t0: 0, lastD: -1, skyCv: null, T0: performance.now(), wind: 0 };
      applyEnv(true);
    }
    function applyEnv(force) {
      const E = envO; if (!E) return false;
      const e = readEnv(), sg = [Math.round(e.elev * 2), Math.round(e.az), e.cl.toFixed(2), e.rain, e.snow, e.fog, e.light, e.wind.toFixed(1), o.lowPower].join('|');
      if (!force && sg === E.sig) return false;
      E.sig = sg; Object.assign(wx, e);
      const d = smooth(-6, 9, e.elev); wx.d = d;
      const tw = Math.exp(-Math.pow((e.elev - 3) / 7, 2)) * (1 - e.cl * 0.6);
      const C = (h) => new T.Color(h);
      const mix = (a, b, k) => a.clone().lerp(b, Math.min(1, Math.max(0, k)));
      const stops = [0, 1, 2].map(i => {
        let c = mix(C(['#050810', '#0d1526', '#1a2540'][i]), C(['#6aa6dd', '#cfe3f4', '#eef3f6'][i]), d);
        c = mix(c, C(['#3d5a99', '#f2a56b', '#ffd9a0'][i]), tw * 0.85);
        const grey = C(['#8d96a0', '#b3bac2', '#cfd4d9'][i]).multiplyScalar(0.18 + 0.82 * d);
        return mix(c, grey, e.cl * (0.7 + 0.2 * e.rain));
      });
      const stormy = Math.max(e.rain, e.light) * 0.45; if (stormy) stops.forEach(c => c.multiplyScalar(1 - stormy * 0.5));
      const tex = texCache.get('skylive') || canvasTex(8, 256, () => {}); texCache.set('skylive', tex);
      const cv2 = tex.image, g2 = cv2.getContext('2d'), gr = g2.createLinearGradient(0, 0, 0, cv2.height);
      gr.addColorStop(0, '#' + stops[0].getHexString()); gr.addColorStop(0.55, '#' + stops[1].getHexString()); gr.addColorStop(1, '#' + stops[2].getHexString());
      g2.fillStyle = gr; g2.fillRect(0, 0, cv2.width, cv2.height); tex.needsUpdate = true; scene.background = tex;
      const fogC = stops[1].clone(); const fogK = Math.min(1, e.fog);
      if (fogK) fogC.lerp(mix(C('#9aa3ab'), C('#10151c'), 1 - d), 0.6 * fogK);
      scene.fog = new T.Fog(fogC, radius * Math.max(0.6, 5 - 3.9 * e.fog - 1.5 * e.rain - 1 * e.snow), radius * Math.max(2.8, 16 - 11.5 * e.fog - 5 * e.rain - 3 * e.snow));
      // Licht: Sonne am Tag, Mond in der Nacht
      const useSun = e.elev > -1.5, ex = useSun ? Math.max(e.elev, 5) : Math.min(-e.elev, 45) + 20, eaz = useSun ? e.az : (e.az + 180) % 360;
      const rad = Math.PI / 180, dist = E.R * 3, dirx = Math.sin(eaz * rad) * Math.cos(ex * rad), diry = Math.sin(ex * rad), dirz = -Math.cos(eaz * rad) * Math.cos(ex * rad);
      sun.position.set(E.cx + dirx * dist, diry * dist + 10, E.cz + dirz * dist); sun.target.position.set(E.cx, 0, E.cz);
      const sunI = 3.6 * d * (1 - 0.78 * e.cl) + (useSun ? 0 : 0), moonI = 0.9 * (1 - d) * (1 - 0.6 * e.cl);
      sun.color.copy(useSun ? mix(C('#fff1d6'), C('#ff9a55'), tw * 1.1) : C('#9fb4e6'));
      E.baseSun = useSun ? Math.max(sunI, 0.05) : moonI;
      sun.intensity = E.baseSun;
      E.baseAmb = (0.35 + 0.55 * d) * (1 - 0.1 * e.cl); E.baseHemi = (0.55 + 0.95 * d) * (1 - 0.5 * e.cl);
      amb.intensity = E.baseAmb; hemi.intensity = E.baseHemi;
      hemi.color.copy(mix(C('#6f86b8'), C('#e8f2ff'), d)).lerp(C('#c9cfd6'), e.cl * 0.4 * d);
      hemi.groundColor.copy(mix(C('#1b2230'), C('#9a8a74'), d));
      // Sonne / Mond / Sterne / Wolken
      const sd = E.R * 14;
      const sdir = (el, az2) => [Math.sin(az2 * rad) * Math.cos(el * rad), Math.sin(el * rad), -Math.cos(az2 * rad) * Math.cos(el * rad)];
      const sv = sdir(Math.max(e.elev, -4), e.az); E.sunS.position.set(E.cx + sv[0] * sd, sv[1] * sd, E.cz + sv[2] * sd);
      E.sunS.material.opacity = smooth(-5, 2, e.elev) * (1 - 0.92 * e.cl); E.sunS.material.color.copy(mix(C('#ffffff'), C('#ff9d5c'), tw));
      const mv = sdir(Math.max(-e.elev, -4) + 8, (e.az + 180) % 360); E.moonS.position.set(E.cx + mv[0] * sd, mv[1] * sd, E.cz + mv[2] * sd);
      E.moonS.material.opacity = (1 - d) * (1 - 0.95 * e.cl) * smooth(-4, 3, -e.elev);
      E.stars.material.opacity = Math.pow(1 - d, 2) * (1 - e.cl) * 0.95;
      const ccol = mix(C('#ffffff'), C('#8d96a0'), e.cl * 0.8).multiplyScalar(0.22 + 0.78 * d).lerp(C('#ffb985'), tw * 0.45);
      E.cl.forEach(c => { c.m.visible = c.k < e.cl + 0.05; c.m.material.color.copy(ccol); c.m.material.opacity = Math.min(0.9, 0.3 + 0.55 * e.cl); });
      // Boden: Schnee
      E.snowTarget = Math.min(1, e.snow * 1.5);
      E.rainAmt = e.rain; E.snowAmt = e.snow;
      if (look.pl != null) { const np = Math.round(520 + (900 - 520) * (1 - d)); if (Math.abs(np - look.pl) > 40) { look.pl = np; applyLive(true); } }
      dirty = true; return true;
    }
    function animateEnv(dt, now) {
      const E = envO; if (!E) return false;
      let ch = false;
      if (!E.t0 || now - E.t0 > 1000) { E.t0 = now; if (applyEnv(false)) ch = true; }
      const w = wx.wind, wxs = (w * 260 + (wx.rain ? 60 : 0)) * 1;
      // Wolken ziehen
      E.cl.forEach(c => { if (!c.m.visible) return; c.a += dt * 0.012 * c.v * (1 + w * 2.5); c.m.position.set(E.cx + Math.cos(c.a) * c.r, c.y, E.cz + Math.sin(c.a) * c.r); }); ch = true;
      // Regen
      const rv = E.rainAmt || 0;
      E.rain.visible = rv > 0;
      if (rv > 0) {
        const n = Math.max(1, Math.round(E.nR * (0.25 + 0.75 * rv))), sp = 900 + 500 * rv, L = 40 + E.R * 0.06, lx = wxs / sp * L, ra = E.ra, rp = E.rp, W = E.W, H = E.H;
        for (let i = 0; i < n; i++) {
          let x = rp[i * 3] + wxs * dt, y = rp[i * 3 + 1] - sp * dt, z = rp[i * 3 + 2];
          if (y < 0) { y += H; x = (Math.random() - 0.5) * W; z = (Math.random() - 0.5) * W; }
          if (x > W / 2) x -= W;
          rp[i * 3] = x; rp[i * 3 + 1] = y; rp[i * 3 + 2] = z;
          const o6 = i * 6; ra[o6] = E.cx + x; ra[o6 + 1] = y; ra[o6 + 2] = E.cz + z; ra[o6 + 3] = E.cx + x - lx; ra[o6 + 4] = y + L; ra[o6 + 5] = E.cz + z;
        }
        E.rain.geometry.setDrawRange(0, n * 2); E.rain.geometry.attributes.position.needsUpdate = true;
        E.rain.material.color.set(wx.d > 0.3 ? 0xb4cbe6 : 0x8fa6c8); ch = true;
      }
      // Schnee
      const sv = E.snowAmt || 0;
      E.snow.visible = sv > 0;
      if (sv > 0) {
        const n = Math.max(1, Math.round(E.nS * (0.3 + 0.7 * Math.min(1, sv * 1.4)))), sq = E.sq, sn = E.sn, W = E.W, H = E.H, t = now / 1000;
        for (let i = 0; i < n; i++) {
          let x = sq[i * 3] + (wxs * 0.5 + Math.sin(t * 0.8 + i) * 12) * dt, y = sq[i * 3 + 1] - (70 + (i % 5) * 12) * dt, z = sq[i * 3 + 2] + Math.cos(t * 0.7 + i * 1.3) * 10 * dt;
          if (y < 0) { y += H; x = (Math.random() - 0.5) * W; z = (Math.random() - 0.5) * W; }
          if (x > W / 2) x -= W;
          sq[i * 3] = x; sq[i * 3 + 1] = y; sq[i * 3 + 2] = z; const X = E.cx + x, Z = E.cz + z, f = E.fs, q = i * 12; sn[q] = X - f; sn[q + 1] = y; sn[q + 2] = Z; sn[q + 3] = X + f; sn[q + 4] = y; sn[q + 5] = Z; sn[q + 6] = X; sn[q + 7] = y - f; sn[q + 8] = Z; sn[q + 9] = X; sn[q + 10] = y + f; sn[q + 11] = Z;
        }
        E.snow.geometry.setDrawRange(0, n * 4); E.snow.geometry.attributes.position.needsUpdate = true; ch = true;
      }
      // Schneedecke
      const tgt = E.snowTarget || 0, cur = E.snowAcc;
      if (Math.abs(tgt - cur) > 0.004 || E.snowShown == null) { E.snowAcc = cur + (tgt > cur ? 1 : -1) * Math.min(Math.abs(tgt - cur), dt * 0.05); E.snowShown = 1; if (E.gm && E.gm.material) E.gm.material.color.copy(E.gcol).lerp(new T.Color('#eef3f8'), E.snowAcc * 0.9); ch = true; }
      // Blitz
      if (wx.light) {
        E.nextFlash -= dt;
        if (E.nextFlash <= 0) { E.flash = 1; E.nextFlash = 3 + Math.random() * 6; }
      }
      if (E.flash > 0) { E.flash = Math.max(0, E.flash - dt * 3.2); const f = E.flash * (0.6 + 0.4 * Math.sin(E.flash * 30)); amb.intensity = E.baseAmb + 2.6 * f; hemi.intensity = E.baseHemi + 2.2 * f; sun.intensity = E.baseSun + 3 * f; renderer.toneMappingExposure = 1.12 + 0.6 * f; ch = true; if (E.flash === 0) { amb.intensity = E.baseAmb; hemi.intensity = E.baseHemi; sun.intensity = E.baseSun; renderer.toneMappingExposure = 1.12; } }
      return ch;
    }

    // ---------- Auswahl-Rahmen ----------
    function applySel() {
      const id = o.getSel ? o.getSel() : null;
      if (selBox && selBox.userData.id === id) return;
      if (selBox) { if (selBox.parent) selBox.parent.remove(selBox); selBox.geometry.dispose(); selBox = null; dirty = true; }
      if (!id) return;
      const r = items.find(x => x.it.id === id); if (!r) return;
      const hh = Math.max(r.h, 8) + 4;
      selBox = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(r.it.w + 4, hh, r.it.h + 4)), new T.LineBasicMaterial({ color: 0x03a9f4, depthTest: false, transparent: true }));
      selBox.renderOrder = 30; selBox.position.y = hh / 2 - 2; selBox.userData.id = id; r.group.add(selBox); dirty = true;
    }

    function buildAll() {
      clearWorld(); if (typeof FPM !== 'undefined') FPM.reset(T);
      const L3 = look, Hw = o.walls === 'half' ? Math.min(100, wallH()) : o.walls === 'flat' ? 6 : wallH();
      const slab = wallH() + 14, floors = plan.floors, curIdx = Math.max(0, floors.findIndex(f => f.id === o.getFloor()));
      const levels = floors.map((f, i) => i).filter(i => floors[i].kind !== 'garden'), gardens = floors.map((f, i) => i).filter(i => floors[i].kind === 'garden');
      const curIsGarden = floors[curIdx] && floors[curIdx].kind === 'garden', lvCur = curIsGarden ? levels.length - 1 : levels.indexOf(curIdx);
      const show = o.allFloors || curIsGarden ? levels : levels.filter((i, k) => k <= lvCur);
      groundY = curIsGarden ? -1 : Math.max(0, lvCur) * slab;
      let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9, maxY = 0;
      const grow = (b) => { minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x + b.w); minZ = Math.min(minZ, b.y); maxZ = Math.max(maxZ, b.y + b.h); };
      show.forEach((i, k) => {
        const f = floors[i];
        buildFloor(f, i, k * slab, Hw, L3, k === show.length - 1);
        grow(contentBounds(f)); maxY = Math.max(maxY, k * slab + wallH());
      });
      gardens.forEach(i => { const f = floors[i]; buildFloor(f, i, -1, 110, L3, false); if (curIsGarden && i === curIdx) grow(contentBounds(f)); else if (!show.length) grow(contentBounds(f)); });
      const roofMode = o.roof || S().roof3 || 'none';
      if (roofMode !== 'none' && show.length) {
        const ti = show[show.length - 1], tf = floors[ti], slabIdx = show.length - 1;
        let rx0 = 1e9, rx1 = -1e9, rz0 = 1e9, rz1 = -1e9;
        (tf.walls || []).forEach(w2 => { rx0 = Math.min(rx0, w2.x1, w2.x2); rx1 = Math.max(rx1, w2.x1, w2.x2); rz0 = Math.min(rz0, w2.y1, w2.y2); rz1 = Math.max(rz1, w2.y1, w2.y2); });
        if (rx0 <= rx1) { const tt = Math.max(...(tf.walls || []).map(w2 => w2.t || S().wallThickness || 15)) / 2; rx0 -= tt; rx1 += tt; rz0 -= tt; rz1 += tt; }
        if (rx0 > rx1) { const b2 = contentBounds(tf); rx0 = b2.x; rx1 = b2.x + b2.w; rz0 = b2.y; rz1 = b2.y + b2.h; }
        const ov = Math.max(0, Number(S().roofOver3 != null ? S().roofOver3 : 40)), pitch = Math.min(60, Math.max(5, Number(S().roofPitch3) || 30)) * Math.PI / 180;
        const W = rx1 - rx0 + 2 * ov, D = rz1 - rz0 + 2 * ov, cx2 = (rx0 + rx1) / 2, cz2 = (rz0 + rz1) / 2, by = slabIdx * slab + wallH();
        const tiles = S().roofType3 === 'tiles' && roofMode !== 'flat';
        const rmat = new T.MeshStandardMaterial({ color: tiles ? 0xffffff : colorOf(S().roofColor3 || '#8a4b3a'), roughness: 0.85, metalness: 0.02, side: T.DoubleSide });
        if (tiles) rmat.map = roofTileTex(S().roofColor3 || '#8a4b3a');
        const alongX = W >= D, across = alongX ? D : W, len = alongX ? W : D;
        let rm = null, rh = 12;
        if (roofMode === 'flat') {
          rm = new T.Mesh(new T.BoxGeometry(W, 14, D), rmat); rm.position.set(cx2, by + 7, cz2);
        } else {
          rh = roofMode === 'shed' ? across * Math.tan(Math.min(pitch, 0.3)) : (across / 2) * Math.tan(pitch);
          rm = new T.Mesh(roofGeo(roofMode, across, len, rh), rmat); rm.position.set(cx2, by, cz2); rm.rotation.y = alongX ? Math.PI / 2 : 0;
        }
        rm.castShadow = true; rm.receiveShadow = true; world.add(rm);
        if (roofMode !== 'flat') { /* Gesims */ const gm2 = new T.Mesh(new T.BoxGeometry(W, 4, D), new T.MeshStandardMaterial({ color: colorOf(o.wallColor || S().wallColor3 || L3.wall), roughness: 0.9 })); gm2.position.set(cx2, by + 2, cz2); gm2.castShadow = true; world.add(gm2); }
        if (S().solar3) buildSolar({ roofMode, W, D, cx2, cz2, by, rh, across, len, alongX, pitch });
        maxY = Math.max(maxY, by + rh);
      }
      if (minX > maxX) { minX = -200; maxX = 200; minZ = -200; maxZ = 200; }
      const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2, R = Math.max(maxX - minX, maxZ - minZ, 300) / 2;
      radius = Math.hypot(maxX - minX, maxZ - minZ, maxY) / 2;
      // Boden/Umgebung
      const gm = new T.Mesh(new T.PlaneGeometry(R * 40, R * 40), new T.MeshStandardMaterial({ color: colorOf(o.ground || S().ground3 || L3.ground), roughness: 1 }));
      gm.rotation.x = -Math.PI / 2; gm.position.set(cx, -16, cz); gm.receiveShadow = true; world.add(gm);
      const bg = colorOf(L3.bg);
      if (L3.sky) { const sk = 'sky|' + lookKey(); let tx = texCache.get(sk); if (!tx) { tx = canvasTex(8, 256, (g, w2, h2) => { const gr = g.createLinearGradient(0, 0, 0, h2); gr.addColorStop(0, L3.sky[0]); gr.addColorStop(0.55, L3.sky[1]); gr.addColorStop(1, L3.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, w2, h2); }); texCache.set(sk, tx); } scene.background = tx; } else scene.background = bg;
      scene.fog = new T.Fog(bg, radius * 5, radius * 16);
      hemi.color.set(L3.hs); hemi.groundColor.set(L3.hg); sun.color.set(L3.sunc);
      amb.intensity = L3.amb; hemi.intensity = L3.hemi; sun.intensity = L3.sun;
      sun.position.set(cx + R * 1.2, maxY + R * 2, cz + R * 0.8); sun.target.position.set(cx, 0, cz);
      const sc = sun.shadow.camera; sc.left = -R * 1.6; sc.right = R * 1.6; sc.top = R * 1.6; sc.bottom = -R * 1.6; sc.near = 10; sc.far = R * 8; sc.updateProjectionMatrix();
      sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.6;
      if (L3.live) buildEnv(cx, cz, R, maxY, gm); else { envO = null; renderer.toneMappingExposure = 1.12; }
      const key = floors.map(f => f.id).join(',') + '|' + o.getFloor() + '|' + o.allFloors;
      if (!fitted || fitKey !== key) { cam.tx = cx; cam.ty = Math.min(maxY, 300) * 0.3; cam.tz = cz; cam.dist = radius / Math.sin(cam.fov ? cam.fov : 0.36) * 0.95; fitted = true; fitKey = key; }
      applyLive(true);
    }

    // ---------- Live-Zustände ----------
    function stateSig() {
      let s = '';
      plan.floors.forEach(f => f.items.forEach(it => { [it.entity, it.entity2].forEach(en => { if (en) { const st = states[en]; if (st) s += en + st.state + (st.attributes && st.attributes.brightness != null ? st.attributes.brightness : '') + (st.attributes && st.attributes.current_position != null ? 'p' + st.attributes.current_position : '') + (st.attributes && st.attributes.rgb_color ? st.attributes.rgb_color.join('') : '') + '|'; } }); }));
      return s + (typeof heatSig === 'function' ? heatSig() : '');
    }
    function applyLive(force) {
      let lights = 0;
      heatRooms.forEach(h => { const hc = heatFill(h.area); if (hc) h.mat.color.set(hc); else h.mat.color.copy(h.base); }); if (heatRooms.length) dirty = true;
      items.forEach(r => {
        const it = r.it, s = it.entity ? states[it.entity] : null, act = isActive(s), na = s && (s.state === 'unavailable' || s.state === 'unknown');
        const lightLike = it.glow;
        // Farbe / Leuchten
        if (act) {
          const c = colorOf(it.onColor || (domainOf(it.entity) === 'light' ? glowColor(it, s) : (C && C.accent) || '#03a9f4'));
          r.mat.color.copy(r.baseColor).lerp(c, lightLike ? 0.55 : 0.8);
          r.mat.emissive.copy(c); r.mat.emissiveIntensity = lightLike ? 0.9 : 0.35;
        } else { r.mat.color.copy(r.baseColor); r.mat.emissive.setRGB(0, 0, 0); r.mat.emissiveIntensity = 0; }
        r.mat.opacity = na ? 0.5 : 1; r.mat.transparent = !!na;
        if (r.live && r.live.length) r.live.forEach(m => {
          if (act) { const base = m.userData.base, onc = m.userData.on ? new T.Color(m.userData.on) : colorOf(it.onColor || (domainOf(it.entity) === 'light' ? glowColor(it, s) : (C && C.accent) || '#03a9f4')); const lc = domainOf(it.entity) === 'light' || it.glow ? colorOf(it.onColor || glowColor(it, s)) : onc; m.color.copy(base).lerp(lc, 0.55); m.emissive.copy(lc); m.emissiveIntensity = m.userData.ei; }
          else { m.color.copy(m.userData.base); m.emissive.setRGB(0, 0, 0); m.emissiveIntensity = 0; }
        });
        // Lichtkegel + Lichtpunkt
        const want = act && it.glow;
        if (want) {
          const gc = colorOf(glowColor(it, s)), br = s.attributes && s.attributes.brightness != null ? Math.min(1, Math.max(0.35, s.attributes.brightness / 255)) : 1, str = it.glowStr > 0 ? it.glowStr : 1;
          const R = it.glowR > 0 ? it.glowR : Math.max(it.w, it.h) * 2.2 + 90;
          if (!r.pool) {
            const pm = new T.MeshBasicMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending });
            r.pool = new T.Mesh(new T.PlaneGeometry(2, 2), pm); r.pool.rotation.x = -Math.PI / 2; r.pool.renderOrder = 3;
            r.group.parent.add(r.pool);
          }
          r.pool.position.set(it.x, 1.5, it.y); r.pool.scale.set(R, R, 1); r.pool.material.color.copy(gc); r.pool.material.opacity = Math.min(1, br * 0.9 * str); r.pool.visible = true;
          if (lights < 10) {
            if (!r.light) { r.light = new T.PointLight(0xffffff, 1, 1, 1); r.group.parent.add(r.light); }
            r.light.color.copy(gc); r.light.intensity = (look.pl || 600) * br * str; r.light.distance = R * 1.5; r.light.position.set(it.x, r.z0 + Math.max(r.h, 20) + 12, it.y); r.light.visible = true; lights++;
          } else if (r.light) r.light.visible = false;
        } else { if (r.pool) r.pool.visible = false; if (r.light) r.light.visible = false; }
        // Beschriftungen
        const txt = it.shape !== 'text' && it.showLabel ? labelText(it) : '';
        const val = it.entity && it.showValue ? valueText(it.entity) : '';
        const lblKey = txt + '|' + (look.neon || o.dark() ? 'd' : 'l');
        if (r.lblKey !== lblKey) {
          if (r.labelName) { r.group.remove(r.labelName); r.labelName.material.dispose(); r.labelName = null; }
          if (txt) { r.labelName = textSprite(txt, S().labelSize * 1.15, { dark: !!look.neon || o.dark() }); r.group.add(r.labelName); }
          r.lblKey = lblKey;
        }
        if (r.labelName) r.labelName.material.rotation = -(Number(it.labelRot) || 0) * Math.PI / 180;
        if (r.labelVal) r.labelVal.material.rotation = -(Number(it.valueRot) || 0) * Math.PI / 180;
        if (r.labelName) r.labelName.position.set(0, r.h + S().labelSize * 1.1 + 6, 0);
        if (r.valTxt !== val) {
          if (r.labelVal) { r.group.remove(r.labelVal); r.labelVal.material.dispose(); r.labelVal = null; }
          if (val) { r.labelVal = textSprite(val, S().labelSize * 1.0, { bg: act ? ((C && C.accent) || '#03a9f4') : '#6b7385', fg: '#fff' }); r.group.add(r.labelVal); }
          r.valTxt = val;
        }
        if (r.labelVal) r.labelVal.position.set(0, r.h + S().labelSize * (r.labelName ? 2.6 : 1.3) + 6, 0);
      });
      dirty = true; void force;
    }

    // ---------- Kamera / Steuerung ----------
    const FOV = 42 * Math.PI / 180; cam.fov = FOV / 2;
    function placeCamera() {
      const sp = Math.sin(cam.pol), cp = Math.cos(cam.pol);
      camera.position.set(cam.tx + cam.dist * sp * Math.sin(cam.az), cam.ty + cam.dist * cp, cam.tz + cam.dist * sp * Math.cos(cam.az));
      camera.lookAt(cam.tx, cam.ty, cam.tz);
    }
    const pct = document.createElement('div');
    pct.style.cssText = 'position:absolute;display:none;pointer-events:none;z-index:5;padding:3px 9px;border-radius:12px;background:rgba(20,20,20,.82);color:#fff;font:600 14px system-ui,sans-serif;white-space:nowrap';
    root.appendChild(pct);
    function showPct(e, v) { const r = cv.getBoundingClientRect(), rr = root.getBoundingClientRect(); pct.textContent = Math.round(v * 100) + ' %'; pct.style.display = 'block'; pct.style.left = Math.min(rr.width - 60, e.clientX - rr.left + 22) + 'px'; pct.style.top = Math.max(0, e.clientY - rr.top - 34) + 'px'; }
    const ptrs = new Map(); let gesture = null, tap = null, tapTimer = 0;
    const ray = new T.Raycaster(), v2 = new T.Vector2();
    // ---------- Rollladen/Garagentore per Ziehen öffnen und schließen ----------
    function coverRec(id) {
      const a = items.find(r => r.it.id === id && r.anim && r.anim.type === 'cover'), b = opens.find(r => r.cover && r.it.id === id);
      const rec = a || b; if (!rec || !/^cover\./.test(rec.it.entity || '')) return null;
      return rec;
    }
    function coverVal(rec) { return rec.anim ? (rec.cv != null ? rec.cv : (coverCache.has(rec.it.id) ? coverCache.get(rec.it.id) : 0)) : rec.o; }
    const _p0 = new T.Vector3(), _p1 = new T.Vector3();
    function coverPx(rec) {
      let x, z, yb, yt;
      if (rec.anim) { rec.group.getWorldPosition(_p0); x = _p0.x; z = _p0.z; yb = _p0.y; yt = yb + (rec.h || 100); }
      else { rec.anchor.getWorldPosition(_p0); x = _p0.x; z = _p0.z; yt = _p0.y; yb = yt - rec.hh; }
      _p0.set(x, yb, z).project(camera); _p1.set(x, yt, z).project(camera);
      const r = cv.getBoundingClientRect();
      return Math.max(30, Math.abs(_p1.y - _p0.y) * r.height / 2);
    }
    function coverSet(rec, v) {
      v = Math.max(0, Math.min(1, v));
      if (rec.anim) { rec.cv = v; coverCache.set(rec.it.id, v); rec.anim.set(v); rec.hold = { v, until: performance.now() + 4500 }; }
      else { rec.o = v; rec.t = 0; rec.set(v, 0); rec.hold = { v, until: performance.now() + 4500 }; openCache.set(rec.it.id, { o: v, t: 0 }); }
      dirty = true; return v;
    }
    function pick(e) {
      const r = cv.getBoundingClientRect();
      v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const vis = ob => { for (let n = ob; n; n = n.parent) if (n.visible === false) return false; return true; };
      const hit = ray.intersectObjects(pickables, false).find(h => vis(h.object));
      return hit ? hit.object.userData.itemId : null;
    }
    function groundPoint(e, gy) {
      const r = cv.getBoundingClientRect();
      v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const ro = ray.ray.origin, rd = ray.ray.direction; if (Math.abs(rd.y) < 1e-6) return null;
      const t = (gy - ro.y) / rd.y; if (t < 0) return null;
      return { x: ro.x + rd.x * t, z: ro.z + rd.z * t };
    }
    function panBy(dx, dy) {
      const k = cam.dist * 0.0012, r = [Math.cos(cam.az), -Math.sin(cam.az)], u = [-Math.sin(cam.az), -Math.cos(cam.az)];
      cam.tx += -r[0] * dx * k + u[0] * dy * k; cam.tz += -r[1] * dx * k + u[1] * dy * k;
    }
    const limit = () => { cam.pol = Math.min(1.53, Math.max(0.02, cam.pol)); cam.dist = Math.min(radius * 8, Math.max(80, cam.dist)); };
    cv.addEventListener('pointerdown', e => {
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        const mousePan = e.pointerType === 'mouse' && (e.button === 1 || e.button === 2 || e.shiftKey);
        gesture = { t: mousePan ? 'pan' : 'orbit' };
        gesture.base = true;
        const placing = !!(o.placing && o.placing());
        tap = { x: e.clientX, y: e.clientY, id: !placing && (e.button === 0 || e.pointerType !== 'mouse') ? pick(e) : null, moved: false, long: false, time: Date.now() };
        if (tap.id && o.canDrag && o.canDrag(tap.id)) { const rec = items.find(r => r.it.id === tap.id), gp = rec && groundPoint(e, rec.floorY); if (rec && gp) gesture = { t: 'drag', rec, off: { x: gp.x - rec.group.position.x, z: gp.z - rec.group.position.z }, dragging: false }; }
        else if (tap.id && o.canCover && o.canCover()) { const cr = coverRec(tap.id); if (cr) gesture = { t: 'cover', rec: cr, y0: e.clientY, v0: coverVal(cr), px: coverPx(cr), v: null }; }
        clearTimeout(tapTimer);
        if (tap.id) tapTimer = setTimeout(() => { if (tap && !tap.moved) { tap.long = true; o.onTap && o.onTap(tap.id, true); } }, 550);
      } else if (ptrs.size === 2) {
        if (tap) tap.moved = true; clearTimeout(tapTimer);
        const [a, b] = [...ptrs.values()];
        gesture = { t: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      }
      cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (tap && !tap.moved && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8) { tap.moved = true; clearTimeout(tapTimer); }
      if (!gesture) return;
      if (gesture.t === 'cover') {
        if (ptrs.size === 1 && tap && tap.moved) { gesture.v = coverSet(gesture.rec, gesture.v0 - (e.clientY - gesture.y0) / gesture.px); gesture.rec.dragging = true; showPct(e, gesture.v); }
        return;
      }
      if (gesture.t === 'drag') {
        if (ptrs.size === 1 && tap && tap.moved) {
          const gp = groundPoint(e, gesture.rec.floorY);
          if (gp) { let nx = gp.x - gesture.off.x, nz = gp.z - gesture.off.z; if (o.snap) { nx = o.snap(nx); nz = o.snap(nz); } const rc = gesture.rec; rc.group.position.x = nx; rc.group.position.z = nz; rc.nx = nx; rc.nz = nz; rc.dragging = true; gesture.dragging = true; if (rc.robot) { rc.robot.x = nx; rc.robot.z = nz; } dirty = true; }
        }
        return;
      }
      if (gesture.t === 'orbit' && ptrs.size === 1) { if (!tap || tap.moved) { cam.az -= dx * 0.008; if (!(o.touchScroll && e.pointerType === 'touch' && !(o.touchTilt && o.touchTilt()))) cam.pol -= dy * (e.pointerType === 'touch' ? 0.009 : 0.0075); limit(); dirty = true; } }
      else if (gesture.t === 'pan' && ptrs.size === 1) { panBy(dx, dy); dirty = true; }
      else if (gesture.t === 'pinch' && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        cam.dist *= gesture.d / d; let da = ang - gesture.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); cam.az -= da;
        panBy(mx - gesture.mx, my - gesture.my);
        gesture.d = d; gesture.ang = ang; gesture.mx = mx; gesture.my = my; limit(); dirty = true;
      }
    });
    const up = e => {
      ptrs.delete(e.pointerId); cv.style.cursor = 'grab'; pct.style.display = 'none';
      if (ptrs.size === 0) {
        clearTimeout(tapTimer);
        if (gesture && gesture.t === 'cover') { const g2 = gesture; g2.rec.dragging = false; if (g2.v != null) { tap = null; gesture = null; if (o.onCover) o.onCover(g2.rec.it, g2.v); return; } }
        if (gesture && gesture.t === 'drag' && gesture.dragging) { const rc = gesture.rec; rc.dragging = false; tap = null; gesture = null; if (o.onDragEnd) o.onDragEnd(rc.it.id, rc.nx, rc.nz); return; }
        if (tap && !tap.moved && !tap.long && e.type === 'pointerup' && Date.now() - tap.time < 700) { if (tap.id && o.onTap) o.onTap(tap.id, false); else if (o.onEmptyTap) o.onEmptyTap(groundPoint(e, groundY)); }
        tap = null; gesture = null;
      } else if (ptrs.size === 1) { gesture = { t: 'orbit' }; if (tap) tap.moved = true; }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => {
      if (o.wheel === 'ctrl' && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      if (e.shiftKey) cam.az -= dy * 0.003; else cam.dist *= Math.exp(dy * (e.ctrlKey ? 0.01 : 0.0012));
      limit(); dirty = true;
    }, { passive: false });
    cv.addEventListener('dblclick', () => { fitted = false; build(true); });

    function resize() {
      const r = root.getBoundingClientRect(), w = Math.max(50, Math.round(r.width)), h = Math.max(50, Math.round(r.height));
      const sig = w + 'x' + h; if (sig === sizeSig) return; sizeSig = sig;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null; if (ro) ro.observe(root);

    let raf = 0, visible = true;
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(es => { const v = es[es.length - 1].isIntersecting; if (v && !visible) dirty = true; visible = v; }) : null; if (io) io.observe(root);
    function animateWalls() {
      if (o.walls !== 'auto' || !wallGroups.length) return false;
      const dx = Math.sin(cam.az), dz = Math.cos(cam.az); let busy = false;
      wallGroups.forEach(wg => {
        const n = wg.userData.n, tgt = (n[0] * dx + n[1] * dz) > 0.2 ? 0.12 : 1, d = tgt - wg.scale.y;
        if (Math.abs(d) > 0.005) { wg.scale.y += d * 0.3; busy = true; } else wg.scale.y = tgt;
      });
      return busy;
    }
    function frame() {
      raf = 0; if (destroyed) return;
      if (!visible || document.hidden) { raf = requestAnimationFrame(frame); return; }
      if (animateWalls()) dirty = true;
      const othersA = solar || opens.length || items.some(r => r.robot || r.anim);
      if (othersA || envO) { const nowT = performance.now(), dtA = (nowT - (lastAnim || nowT)) / 1000, minDt = othersA ? 0.028 : (envO && (wx.rain || wx.snow || wx.light) ? (o.lowPower ? 0.05 : 0.03) : 0.1); if (!lastAnim || dtA > minDt) { lastAnim = nowT; if (animateAll(Math.min(dtA, 0.1), nowT)) dirty = true; } }
      if (dirty) { dirty = false; limit(); placeCamera(); renderer.render(scene, camera); }
      raf = requestAnimationFrame(frame);
    }

    function structSig() {
      return JSON.stringify([plan.floors, S().wallColor, S().wallColor3, S().roof3, S().roofColor3, S().roofPitch3, S().roofOver3, S().solar3, S().solarFill3, S().solarCount3, S().roofType3, S().solarSide3, S().ground3, o.roof, o.wallColor, o.ground, S().wallH3, S().symStyle, S().labelSize, S().wallThickness, o.look, o.walls, o.allFloors, o.getFloor(), o.dark() ? 1 : 0, o.lowPower ? 1 : 0, typeof heatMetric === 'function' ? heatMetric() : '']);
    }
    function build(force) {
      look = LOOKS[lookKey()] || LOOKS.day;
      if (look.live) look = Object.assign({}, look);
      const sg = structSig();
      if (!force && sg === built) return false;
      built = sg;
      buildAll(); liveSig = stateSig(); dirty = true;
      return true;
    }
    function update() {
      if (destroyed) return;
      resize();
      if (!build(false)) { const ls = stateSig(); if (ls !== liveSig) { liveSig = ls; applyLive(); } }
      applySel();
    }
    function resetView() { fitted = false; cam.az = 0.55; cam.pol = 0.95; build(true); }
    function set(k, v) { o[k] = v; if (k === 'touchTilt') { applyTouch(); return; } build(true); }
    function destroy() { destroyed = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); clearWorld(); renderer.dispose(); root.remove(); }

    resize(); build(true); frame();
    return { setSim: (sm) => { o.sim = sm; if (envO) applyEnv(true); }, hasEnv: () => !!envO, _env: () => envO, _wx: wx, screenOf: id => { const r = items.find(x => x.it.id === id) || opens.find(x => x.it.id === id); if (!r) return null; const v = new T.Vector3(); if (r.group) r.group.getWorldPosition(v), v.y += (r.h || 50) / 2; else { r.anchor.getWorldPosition(v); v.y -= (r.hh || 100) / 2; } v.project(camera); const b = cv.getBoundingClientRect(); return [b.left + (v.x + 1) / 2 * b.width, b.top + (1 - v.y) / 2 * b.height]; }, robotPos: () => items.filter(r => r.robot).map(r => [r.it.type, r.robot.x, r.robot.z]), update, resetView, applyTouch, set, destroy, resize, el: root, rotate: (da) => { cam.az += da; dirty = true; }, zoom: (f) => { cam.dist *= f; limit(); dirty = true; }, cam, get opts() { return o; } };
  }

  return { load, create, dims3, ROBOTS };
})();

/* ---- card.src.js ---- */
// ---------- Dashboard-Karte (Teil des Bündels; teilt Code mit dem Editor) ----------
let mode = 'live', tool = 'select', drawing = null, hover = null;
let ACTIVE = null;
const HOST = {
  demo: false,
  info: () => ({ ha: true, allowControl: true, admin: false }),
  states: () => (ACTIVE && ACTIVE._hass ? ACTIVE._hass.states : {}),
  areas: () => (ACTIVE && ACTIVE._hass ? Object.values(ACTIVE._hass.areas || {}).map(a => ({ id: a.area_id, name: a.name })) : []),
  entities: () => {
    const h = ACTIVE && ACTIVE._hass; if (!h) return [];
    const areas = h.areas || {}, devs = h.devices || {}, ents = h.entities || {};
    return Object.keys(h.states).map(id => {
      const reg = ents[id]; let areaId = '';
      if (reg) { const aid = reg.area_id || (reg.device_id && devs[reg.device_id] && devs[reg.device_id].area_id); if (aid && areas[aid]) areaId = aid; }
      return { id, areaId };
    });
  },
  callService: (d, s, data) => ACTIVE._hass.callService(d, s, data),
  moreInfo: entityId => ACTIVE && ACTIVE.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true })),
};
function toast(msg) { console.warn('[floorplan-studio-card]', msg); }

const CARD_CSS = `
:host { display: block; }
ha-card { overflow: hidden; position: relative; }
.fsb { position: absolute; top: 6px; right: 6px; z-index: 6; width: 36px; height: 36px; border-radius: 18px; border: 1px solid var(--divider-color); background: var(--card-background-color, #fff); color: var(--primary-text-color); font-size: 18px; cursor: pointer; opacity: .85; }
ha-card.kiosk .rail button, ha-card.kiosk .tabs button { min-height: 44px; font-size: 15px; }
.hd { padding: 12px 16px 0; font-size: 18px; font-weight: 500; color: var(--primary-text-color); }
.tabs { display: flex; gap: 6px; flex-wrap: wrap; padding: 8px 12px 0; }
.tabs button { border: 1px solid var(--divider-color); background: transparent; color: var(--primary-text-color); border-radius: 16px; padding: 4px 12px; font: inherit; font-size: 13px; cursor: pointer; }
.tabs button.on { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: var(--primary-color); }
svg { width: 100%; height: auto; display: block; touch-action: manipulation; user-select: none; -webkit-user-select: none; }
svg.gest { touch-action: pan-y; cursor: grab; }
svg.gest.grabbing { cursor: grabbing; }
.wrap { position: relative; }
.ctl { position: absolute; right: 8px; bottom: 8px; display: flex; gap: 4px; opacity: .85; }
.ctl button { width: 30px; height: 30px; border-radius: 15px; border: 1px solid var(--divider-color); background: var(--card-background-color, #fff); color: var(--primary-text-color); font: inherit; font-size: 15px; line-height: 1; padding: 0; cursor: pointer; }
.item.act, [data-k="room"].act { cursor: pointer; }
.stage3 { width: 100%; aspect-ratio: 16 / 11; min-height: 250px; max-height: 72vh; position: relative; touch-action: pan-y; }
.stage3.fixed { aspect-ratio: auto; max-height: none; }
svg { max-height: 80vh; }
.tabs { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.tabs::-webkit-scrollbar { display: none; }
.tabs button { flex: 0 0 auto; white-space: nowrap; }
@media (pointer: coarse) { .tabs button { padding: 8px 16px; font-size: 14px; } .ctl button { min-width: 44px; height: 44px; font-size: 16px; border-radius: 22px; } }
@media (max-width: 520px) { .stage3 { aspect-ratio: 1 / 1; } .hd { font-size: 16px; padding: 10px 12px 0; } .tabs { padding: 6px 8px 0; } .ctl { right: 6px; bottom: 6px; } }
ha-card { display: block; container-type: inline-size; }
.body { display: flex; flex-direction: column; }
.main { flex: 1; min-width: 0; }
.rail { display: flex; gap: 6px; padding: 8px 12px 0; overflow-x: auto; scrollbar-width: none; }
.rail::-webkit-scrollbar { display: none; }
.rail button { flex: 0 0 auto; white-space: nowrap; border: 1px solid var(--divider-color); background: transparent; color: var(--primary-text-color); border-radius: 16px; padding: 4px 12px; font: inherit; font-size: 13px; cursor: pointer; }
.rail button.on { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: var(--primary-color); }
.rail .sep { flex: 0 0 1px; background: var(--divider-color); margin: 2px 4px; }
@media (pointer: coarse) { .rail button { padding: 8px 16px; font-size: 14px; } }
@container (min-width: 640px) {
  .body.lay-auto, .body.lay-side { flex-direction: row; }
  .lay-auto .rail, .lay-side .rail { flex-direction: column; overflow-y: auto; overflow-x: hidden; padding: 12px 8px 12px 12px; width: 140px; flex: 0 0 140px; box-sizing: border-box; max-height: 80vh; }
  .lay-auto .rail button, .lay-side .rail button { border-radius: 12px; padding: 10px 8px; text-align: center; white-space: normal; overflow-wrap: anywhere; }
  .lay-auto .rail .sep, .lay-side .rail .sep { flex: 0 0 1px; height: 1px; margin: 4px 6px; }
  .lay-auto .stage3:not(.fixed), .lay-side .stage3:not(.fixed) { aspect-ratio: 16 / 10; max-height: 80vh; }
}
${BP_CSS}
.msg { padding: 24px 16px; color: var(--secondary-text-color); text-align: center; }
${OVL_CSS}`;

class FloorplanStudioCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._cfg = {}; this._plan = null; this._floor = null; this._sig = ''; this._unsub = null; this._err = '';
    this._hass = null; this._loading = false; this._rev = null; this._drag = null; this._v = null; this._pts = new Map(); this._g = null; this._v3 = null; this._k3 = ''; this._m3 = null;
  }
  static getStubConfig() { return {}; }
  getCardSize() { return this._m3 ? 6 : 5; }
  getGridOptions() { return { columns: 12, rows: "auto", min_columns: 6, min_rows: 3 }; }
  getLayoutOptions() { return { grid_columns: 12, grid_rows: 'auto' }; }
  setConfig(c) { this._cfg = c || {}; if (this._cfg.weather3d) window.FP_WEATHER = this._cfg.weather3d; this._sig = ''; this._m3 = this._cfg.mode3d === true; this._w3 = null; this._a3 = null; this._bp = null; this._kill3(); this._pickFloor(); this._draw(); try { this._lang().catch(() => { }); } catch (_) { /* egal */ } }
  _kill3() { if (this._v3) { try { this._v3.destroy(); } catch (_) { /* egal */ } } this._v3 = null; this._k3 = ''; }

  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (first) this._start();
    else this._maybeDraw();
  }
  connectedCallback() { if (this._hass && !this._unsub) this._start(); }
  disconnectedCallback() { if (this._unsub) { try { this._unsub(); } catch (_) { /* egal */ } this._unsub = null; } clearTimeout(this._drag && this._drag.timer); this._kill3(); }

  async _start() {
    await this._load();
    if (this._unsub || !this._hass) return;
    this._unsub = () => { };
    this._hass.connection.subscribeMessage(ev => {
      if (ev && ev.rev !== this._rev) this._load();
    }, { type: 'floorplan_studio/subscribe' }).then(u => { this._unsub = u; }).catch(() => { this._unsub = null; });
  }
  _lang() {
    FPI.observe(this.shadowRoot);
    const s = (this._plan && this._plan.settings) || {}, h = this._hass || {};
    const l = this._cfg.language || (s.lang && s.lang !== 'auto' ? s.lang : '') || (h.locale && h.locale.language) || h.language || '';
    return FPI.setLang(l, this._base3().replace(/vendor\/$/, '')).then(n => { if (this._shownLang !== n) { const first = this._shownLang === undefined; this._shownLang = n; if (!first && this._plan) { this._sig = ''; this._kill3(); this._draw(); } } return n; });
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
    try { await this._lang(); } catch (_) { /* egal */ }
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
  _kio() {
    const c = this._cfg, root = this.shadowRoot, hc = root.querySelector('ha-card'); if (!c.kiosk || !hc) return;
    if (!hc.querySelector('.fsb')) {
      const b = document.createElement('button'); b.className = 'fsb'; b.textContent = '⛶'; b.title = 'Vollbild';
      b.onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else if (this.requestFullscreen) this.requestFullscreen().catch(() => { }); };
      hc.append(b); hc.classList.add('kiosk');
    }
    if (!this._kioB) {
      this._kioB = true;
      const bump = () => { clearTimeout(this._kt); this._kt = setTimeout(() => this._kioReset(), Math.max(10, Number(this._cfg.kiosk_idle) || 90) * 1000); };
      ['pointerdown', 'wheel', 'keydown'].forEach(ev => this.addEventListener(ev, bump, { passive: true })); this._kioBump = bump;
    }
  }
  _kioReset() { if (!this._plan || !this._cfg.kiosk) return; this._floor = null; this._m3 = this._cfg.mode3d === true; this._pickFloor(); this._v = null; this._ov = null; if (this._v3) { try { this._v3.resetView(); } catch (_) { /* egal */ } } this._sig = ''; this._draw(); }
  _ovl() { this._kio(); try { ovlMount(this.shadowRoot.querySelector('.wrap'), { show: true, v3: this._v3 }); } catch (e) { /* egal */ } }
  _ctx() {
    ACTIVE = this; window.FP_CARDCFG = this._cfg;
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
    if (this._m3 && this._draw3(head)) return;
    this._kill3();
    const f = curFloor(), b = contentBounds(f), pad = 60;
    const rotDeg = Number(this._cfg.rotate != null ? this._cfg.rotate : (plan.settings.viewRot || 0)) || 0;
    const rr = rotDeg * Math.PI / 180, rc = Math.abs(Math.cos(rr)), rs = Math.abs(Math.sin(rr));
    const ccx = b.x + b.w / 2, ccy = b.y + b.h / 2;
    const w = (b.w + pad * 2) * rc + (b.h + pad * 2) * rs, h = (b.w + pad * 2) * rs + (b.h + pad * 2) * rc;
    const x0 = ccx - w / 2, y0 = ccy - h / 2;
    const ctx = { glows: new Map(), glowOut: [] };
    const rooms = gardenBaseMarkup(f) + f.rooms.map(r => {
      let m = roomMarkup(r);
      if (r.entity || r.area) m = m.replace('<g data-k="room"', '<g class="act" data-k="room"');
      return m;
    }).join('');
    const walls = f.walls.map(wl => wallMarkup(wl, true, { k: 1 })).join('');
    const items = f.items.map(i => itemMarkup(i, ctx)).join('') + ctx.glowOut.join('');
    const defs = glowDefsMarkup(ctx.glows);
    const gest = this._cfg.gestures !== false;
    this._C = { x: ccx, y: ccy };
    const empty = !f.walls.length && !f.rooms.length && !f.items.length && !(f.bg && f.bg.url);
    const rail = this._rail(false);
    const body = empty
      ? '<div class="msg">Der Grundriss ist noch leer. Öffne das Panel „Grundriss“ in der Seitenleiste, um ihn zu zeichnen.</div>'
      : `<div class="wrap"><svg class="${gest ? 'gest' : ''}" viewBox="${x0} ${y0} ${w} ${h}" font-family="var(--paper-font-body1_-_font-family, system-ui, sans-serif)"><defs><filter id="fpShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".3"/></filter>${defs}</defs><g id="vw" transform="${this._vt(ccx, ccy)}"><g transform="rotate(${rotDeg} ${ccx} ${ccy})">${f.bg && f.bg.url ? bgMarkup({ bg: { ...f.bg, locked: true } }) : ''}${rooms}${walls}${items}</g></g></svg></div>`;
    root.innerHTML = `<style>${CARD_CSS}</style><ha-card>${head}<div class="body ${this._lay()}">${rail}<div class="main${this._bpOn() ? ' bp' : ''}">${body}</div></div></ha-card>`;
    this._bindRail(false);
    const svg = root.querySelector('svg');
    if (svg) this._bind(svg);
    this._ovl();
  }

  _bpOn() { if (this._bp == null) { const c = this._cfg, s = (this._plan && this._plan.settings) || {}; this._bp = c.blueprint != null ? !!c.blueprint : !!(s.blueprint || (c.look3d || s.look3d) === 'blueprint'); } return this._bp; }
  _look3() { const c = this._cfg, s = (this._plan && this._plan.settings) || {}; return this._bpOn() ? 'blueprint' : (c.look3d || (s.look3d === 'blueprint' ? 'auto' : s.look3d) || 'auto'); }
  _lay() { const l = this._cfg.layout; return 'lay-' + (l === 'side' || l === 'top' ? l : 'auto'); }
  _rail(is3) {
    const fl = this._plan.floors, c = this._cfg;
    const fb = !c.floor && fl.length > 1 ? fl.map(f => `<button data-floor="${esc(f.id)}" class="${f.id === this._floor ? 'on' : ''}">${esc(f.name)}</button>`).join('') : '';
    let vb = '';
    if (is3) {
      const w = this._w3 || 'auto', wl = { auto: 'Wände: auto', full: 'Wände: voll', half: 'Wände: halb', flat: 'Wände: aus' }[w];
      vb = '<button data-v="2d" title="2D-Ansicht">2D</button><button data-w="1" title="Wandansicht umschalten">' + wl + '</button>' + (fl.length > 1 ? `<button data-a="1" class="${this._a3 ? 'on' : ''}" title="Alle Etagen anzeigen">Alle Etagen</button>` : '');
    } else if (c.view3d !== false && c.gestures !== false) vb = '<button data-v="3d" title="3D-Ansicht">3D</button>';
    if (vb || fb) vb += `<button data-bp="1" class="${this._bpOn() ? 'on' : ''}" title="Blueprint-Ansicht (Bauplan-Stil)">Blueprint</button>`;
    if (!fb && !vb) return '';
    return `<div class="rail">${fb}${fb && vb ? '<span class="sep"></span>' : ''}${vb}</div>`;
  }
  _bindRail(is3) {
    const root = this.shadowRoot;
    root.querySelectorAll('.rail button').forEach(b => {
      b.onclick = () => {
        if (b.dataset.floor) { this._floor = b.dataset.floor; this._v = null; this._sig = ''; this._draw(); return; }
        const k = b.dataset.v;
        if (k === '3d') { this._m3 = true; this._sig = ''; this._draw(); return; }
        if (k === '2d') { this._m3 = false; this._kill3(); this._sig = ''; this._draw(); return; }
        if (b.dataset.bp) { this._bp = !this._bpOn(); b.classList.toggle('on', this._bp); const mn = root.querySelector('.main'); if (mn) mn.classList.toggle('bp', this._bp); if (this._v3) this._v3.set('look', this._look3()); return; }
        if (!this._v3) return;
        if (b.dataset.w) {
          const o = ['auto', 'full', 'half', 'flat']; this._w3 = o[(o.indexOf(this._w3 || 'auto') + 1) % 4];
          this._v3.set('walls', this._w3); b.textContent = FPI.tr ? FPI.tr('Wände: ' + ({ auto: 'auto', full: 'voll', half: 'halb', flat: 'aus' }[this._w3])) : b.textContent;
        } else if (b.dataset.a) { this._a3 = !this._a3; this._v3.set('allFloors', this._a3); b.classList.toggle('on', this._a3); }
      };
    });
  }

  _base3() {
    const sc = [...document.querySelectorAll('script[src]')].map(x => x.src).find(u => /floorplan-card\.js/.test(u));
    return sc ? sc.replace(/[^/]*$/, '') + 'vendor/' : '/floorplan_studio_static/vendor/';
  }

  // 3D-Ansicht. true = übernommen (auch wenn noch geladen wird)
  _draw3(head) {
    const root = this.shadowRoot, key = '3|' + this._floor + '|' + (this._plan.floors.length > 1 && !this._cfg.floor ? 't' : '');
    if (this._v3 && this._k3 === key && root.querySelector('.stage3')) { this._v3.update(); this._ovl(); return true; }
    this._kill3(); this._k3 = key;
    const c0 = this._cfg, s0 = this._plan.settings || {};
    if (this._w3 == null) this._w3 = c0.walls3d || s0.walls3d || 'auto';
    if (this._a3 == null) this._a3 = c0.all3d != null ? !!c0.all3d : !!s0.all3d;
    const rail = this._rail(true);
    const hgt = Number(this._cfg.height3d) || 0;
    root.innerHTML = `<style>${CARD_CSS}</style><ha-card>${head}<div class="body ${this._lay()}">${rail}<div class="main${this._bpOn() ? ' bp' : ''}"><div class="wrap"><div class="stage3${hgt ? ' fixed' : ''}"${hgt ? ` style="height:${hgt}px"` : ''}></div></div></div></div></ha-card>`;
    this._bindRail(true);
    const st = root.querySelector('.stage3'), myKey = key;
    FP3D.load(this._base3()).then(() => {
      if (this._k3 !== myKey || !this._m3 || !st.isConnected) return;
      this._ctx();
      const c = this._cfg, s = plan.settings;
      this._v3 = FP3D.create(st, {
        getFloor: () => this._floor,
        look: this._look3(), walls: this._w3 || 'auto', allFloors: !!this._a3,
        roof: c.roof3d || '', sim: c.sim3 || null, wallColor: c.wall_color3d || '', dark: () => !!(this._hass && this._hass.themes && this._hass.themes.darkMode), wheel: 'ctrl', touchScroll: true, touchTilt: () => c.tilt3d !== false, canCover: () => true, onCover: (it, v) => { this._ctx(); coverCommand(it, v); }, lowPower: window.matchMedia && matchMedia('(pointer: coarse)').matches, shadows: !(window.matchMedia && matchMedia('(max-width: 520px)').matches),
        onTap: (id, long) => { this._ctx(); const it = findItem(id) || plan.floors.flatMap(f => f.items).find(i => i.id === id); if (it && (it.entity || it.tap === 'service')) onItemTap(it, long); },
      });
      this._v3.update(); this._ovl();
    }).catch(e => { st.innerHTML = `<div class="msg">3D nicht möglich: ${esc(e.message)}</div>`; });
    return true;
  }

  // ----- Ansicht (Drehen/Zoomen/Verschieben): Bild = T + C + k·R(a)·(p − C) -----
  _vt(cx, cy) {
    const v = this._v || { a: 0, k: 1, tx: 0, ty: 0 };
    return `translate(${v.tx} ${v.ty}) translate(${cx} ${cy}) rotate(${v.a}) scale(${v.k}) translate(${-cx} ${-cy})`;
  }
  _apply() {
    const g = this.shadowRoot.getElementById('vw');
    if (g && this._C) g.setAttribute('transform', this._vt(this._C.x, this._C.y));
  }
  _view() { return this._v || (this._v = { a: 0, k: 1, tx: 0, ty: 0 }); }
  _toV(svg, e) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: e.clientX, y: e.clientY };
  }
  // Inhaltspunkt unter Bildpunkt P
  _inv(P) {
    const v = this._view(), C = this._C, r = -v.a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const dx = P.x - v.tx - C.x, dy = P.y - v.ty - C.y;
    return { x: (c * dx - s * dy) / v.k + C.x, y: (s * dx + c * dy) / v.k + C.y };
  }
  // setzt T so, dass Inhaltspunkt p auf Bildpunkt P liegt
  _anchor(p, P) {
    const v = this._view(), C = this._C, r = v.a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const dx = p.x - C.x, dy = p.y - C.y;
    v.tx = P.x - C.x - v.k * (c * dx - s * dy);
    v.ty = P.y - C.y - v.k * (s * dx + c * dy);
  }
  _snapA(a) { a = ((a % 360) + 540) % 360 - 180; const n = Math.round(a / 90) * 90; return Math.abs(a - n) < 3.5 ? n : a; }
  _zoomBy(f, P) {
    const v = this._view(), svg = this.shadowRoot.querySelector('svg'), vb = svg.viewBox.baseVal;
    P = P || { x: vb.x + vb.width / 2, y: vb.y + vb.height / 2 };
    const p = this._inv(P); v.k = Math.min(8, Math.max(0.4, v.k * f)); this._anchor(p, P); this._apply();
  }
  _rotBy(da, P) {
    const v = this._view(), svg = this.shadowRoot.querySelector('svg'), vb = svg.viewBox.baseVal;
    P = P || { x: vb.x + vb.width / 2, y: vb.y + vb.height / 2 };
    const p = this._inv(P); v.a = this._snapA(v.a + da); this._anchor(p, P); this._apply();
  }

  _bind(svg) {
    const gest = this._cfg.gestures !== false;
    const root = this.shadowRoot;
    root.querySelectorAll('.ctl button').forEach(b => {
      b.addEventListener('pointerdown', e => e.stopPropagation());
      b.onclick = () => {
        const k = b.dataset.v;
        if (k === '3d') { this._m3 = true; this._sig = ''; this._draw(); return; }
        if (k === 'ccw') this._rotBy(-90); else if (k === 'cw') this._rotBy(90);
        else if (k === 'in') this._zoomBy(1.3); else if (k === 'out') this._zoomBy(1 / 1.3);
        else { this._v = null; this._apply(); }
      };
    });
    const tapStart = e => {
      this._ctx();
      const itg = e.target.closest('[data-k="item"]'), rg = e.target.closest('[data-k="room"]');
      const it = itg && findItem(itg.dataset.id);
      clearTimeout(this._drag && this._drag.timer);
      if (it && (it.entity || it.tap === 'service')) {
        const d = this._drag = { t: 'item', id: it.id, sx: e.clientX, sy: e.clientY, moved: false, long: false };
        d.timer = setTimeout(() => { if (this._drag === d && !d.moved) { d.long = true; this._ctx(); const cur = findItem(d.id); if (cur) onItemTap(cur, true); } }, 550);
      } else if (rg && findRoom(rg.dataset.id) && (findRoom(rg.dataset.id).entity || findRoom(rg.dataset.id).area)) {
        this._drag = { t: 'room', id: rg.dataset.id, sx: e.clientX, sy: e.clientY, moved: false };
      } else this._drag = null;
    };
    const pinchStart = () => {
      const [a, b] = [...this._pts.values()], v = this._view();
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      this._g = { t: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, ang0: Math.atan2(b.y - a.y, b.x - a.x), a0: v.a, k0: v.k, p: this._inv(mid), rot: false };
    };
    svg.addEventListener('pointerdown', e => {
      if (gest) {
        try { svg.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
        this._pts.set(e.pointerId, this._toV(svg, e));
        if (this._pts.size === 2) {
          if (this._drag) { clearTimeout(this._drag.timer); this._drag.moved = true; }
          pinchStart(); return;
        }
        if (this._pts.size > 2) return;
        const pan = e.pointerType === 'mouse' && (e.button === 1 || e.button === 2 || e.shiftKey);
        const P = this._toV(svg, e), v = this._view();
        const cen = { x: this._C.x + v.tx, y: this._C.y + v.ty };
        this._g = { t: pan ? 'pan' : 'orbit', sx: e.clientX, sy: e.clientY, started: false, a0: v.a, ang0: Math.atan2(P.y - cen.y, P.x - cen.x), cen, p: this._inv(P), P0: P };
      }
      if (e.button === 0 || e.pointerType !== 'mouse') tapStart(e); else this._drag = null;
    });
    svg.addEventListener('pointermove', e => {
      const d = this._drag;
      if (d && !d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 8) { d.moved = true; clearTimeout(d.timer); }
      if (!gest || !this._pts.has(e.pointerId)) return;
      const P = this._toV(svg, e);
      this._pts.set(e.pointerId, P);
      const g = this._g, v = this._view();
      if (!g) return;
      if (g.t === 'pinch' && this._pts.size === 2) {
        const [a, b] = [...this._pts.values()];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        let da = (Math.atan2(b.y - a.y, b.x - a.x) - g.ang0) * 180 / Math.PI;
        da = ((da + 540) % 360) - 180;
        if (Math.abs(da) > 6) g.rot = true;
        v.k = Math.min(8, Math.max(0.4, g.k0 * (Math.hypot(a.x - b.x, a.y - b.y) || 1) / g.d0));
        v.a = g.rot ? this._snapA(g.a0 + da) : g.a0;
        this._anchor(g.p, mid); this._apply(); return;
      }
      if (this._pts.size !== 1 || (g.t !== 'orbit' && g.t !== 'pan')) return;
      if (!g.started) {
        if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 8) return;
        g.started = true; svg.classList.add('grabbing');
        if (this._drag) { this._drag.moved = true; clearTimeout(this._drag.timer); }
      }
      if (g.t === 'orbit') {
        const da = (Math.atan2(P.y - g.cen.y, P.x - g.cen.x) - g.ang0) * 180 / Math.PI;
        v.a = this._snapA(g.a0 + da);
        this._anchor(this._inv(g.cen), g.cen); // Mittelpunkt bleibt stehen
        this._apply();
      } else { this._anchor(g.p, P); this._apply(); }
    });
    const end = e => {
      this._pts.delete(e.pointerId);
      svg.classList.remove('grabbing');
      if (this._pts.size === 1 && this._g && this._g.t === 'pinch') {
        const [id, P] = [...this._pts.entries()][0], v = this._view();
        const cen = { x: this._C.x + v.tx, y: this._C.y + v.ty };
        this._g = { t: 'pan', sx: 0, sy: 0, started: true, p: this._inv(P), a0: v.a, id };
        return;
      }
      if (this._pts.size === 0) this._g = null;
      const d = this._drag; this._drag = null;
      if (!d) return;
      clearTimeout(d.timer);
      if (e.type === 'pointercancel' || d.moved || d.long) return;
      this._ctx();
      if (d.t === 'item') { const it = findItem(d.id); if (it) onItemTap(it, false); }
      else { const r = findRoom(d.id); if (r) onRoomTap(r, false); }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    if (gest) {
      svg.addEventListener('wheel', e => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) return; // normales Scrollen der Seite nicht blockieren
        e.preventDefault();
        const P = this._toV(svg, e), dy = (e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 16 : 1);
        if (e.shiftKey) this._rotBy(-dy * 0.12, P); else this._zoomBy(Math.exp(-dy * 0.0025), P);
      }, { passive: false });
      svg.addEventListener('dblclick', () => { this._v = null; this._apply(); });
      svg.addEventListener('contextmenu', e => e.preventDefault());
    } else {
      svg.addEventListener('contextmenu', e => { if (e.target.closest('[data-k="item"]')) e.preventDefault(); });
    }
  }
}

function normalizeSafe(p) { try { return normalize(p); } catch (_) { return null; } }

if (!customElements.get('floorplan-studio-card')) customElements.define('floorplan-studio-card', FloorplanStudioCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'floorplan-studio-card')) {
  window.customCards.push({ type: 'floorplan-studio-card', name: 'Floorplan Studio', description: 'Zeigt deinen gezeichneten Grundriss live mit allen Komponenten.', preview: false });
}

})();