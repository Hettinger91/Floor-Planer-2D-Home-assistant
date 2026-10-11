'use strict';
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
