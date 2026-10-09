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
