'use strict';
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
