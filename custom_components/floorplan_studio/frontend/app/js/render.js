'use strict';
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
  requestAnimationFrame(() => { rq = false; if (typeof v3Hook === 'function' && v3Hook()) return; renderNow(); });
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
