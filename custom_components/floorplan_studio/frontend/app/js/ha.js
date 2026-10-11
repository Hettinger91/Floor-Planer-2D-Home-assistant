'use strict';
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
