// ---------- Dashboard-Karte (Teil des Bündels; teilt Code mit dem Editor) ----------
let mode = 'live', tool = 'select', drawing = null, hover = null;
let ACTIVE = null;
const HOST = {
  demo: false,
  info: () => ({ ha: true, allowControl: true, admin: false }),
  states: () => (ACTIVE && ACTIVE._hass ? ACTIVE._hass.states : {}),
  user: () => (ACTIVE && ACTIVE._hass ? ACTIVE._hass.user : null),
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
  history: async (ids, hours) => {
    const h = ACTIVE && ACTIVE._hass; if (!h) return {};
    const end = new Date(), start = new Date(end - hours * 3600e3);
    return (await h.callWS({ type: 'history/history_during_period', start_time: start.toISOString(), end_time: end.toISOString(), entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false })) || {};
  },
  popupRoot: () => (ACTIVE && ACTIVE.shadowRoot && ACTIVE.shadowRoot.querySelector('ha-card')) || null,
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
.rail.rc > :not([data-rtog]) { display: none; }
.rail.rc { flex: 0 0 auto !important; width: auto !important; }
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
  static getConfigElement() { return document.createElement('floorplan-studio-card-editor'); }
  getCardSize() { return this._m3 ? 6 : 5; }
  getGridOptions() { return { columns: 12, rows: "auto", min_columns: 6, min_rows: 3 }; }
  getLayoutOptions() { return { grid_columns: 12, grid_rows: 'auto' }; }
  setConfig(c) { this._cfg = c || {}; if (this._cfg.weather3d) window.FP_WEATHER = this._cfg.weather3d; this._sig = ''; this._m3 = this._cfg.mode3d === true; this._iso = this._cfg.view === 'iso' && !this._m3; this._w3 = null; this._a3 = null; this._en3 = null; this._bp = null; this._kill3(); this._pickFloor(); this._draw(); try { this._lang().catch(() => { }); } catch (_) { /* egal */ } }
  _enCfg() {
    const c = this._cfg || {}; if (this._en3 == null) this._en3 = !!c.energy_flow_start;
    const ps = (this._plan && this._plan.settings) || {};
    return this._en3 ? { style: c.energy_flow_style || ps.energyStyle || '', speed: Number(c.energy_flow_speed) || Number(ps.energySpeed) || 1, width: Number(c.energy_flow_width) || Number(ps.energyWidth) || 1, min: c.energy_flow_min != null && c.energy_flow_min !== '' ? Number(c.energy_flow_min) : 15 } : null;
  }
  _enAvail() { const c = this._cfg || {}; return c.energy_flow === true || (c.energy_flow !== false && !!(c.energy_pv || c.energy_grid || c.energy_battery || c.energy_home || (this._plan && (this._plan.settings.energyPv || this._plan.settings.energyGrid)))); }
  _q3() { const q = this._cfg && this._cfg.quality3d; return ['low', 'medium', 'high'].includes(q) ? q : ''; }
  _real3() { if (this._r3 != null) return !!this._r3; const q = this._q3(); if (q) return q !== 'low'; return !!(this._cfg && this._cfg.realistic); }
  _css() {
    const c = this._cfg || {}; let x = CARD_CSS;
    if (/^#[0-9a-f]{3,8}$/i.test(c.accent_color || '')) x += `\nha-card { --primary-color: ${c.accent_color}; }`;
    if (c.custom_css) x += '\n' + String(c.custom_css).replace(/<\/?style[^>]*>/gi, '').replace(/@import[^;]*;?/gi, '');
    return x;
  }
  _fname(f) {
    const m = String((this._cfg && this._cfg.floor_labels) || '').split(/[,;\n]/).map(x => x.split('=')).find(x => x.length > 1 && (x[0].trim() === f.name || x[0].trim() === f.id));
    return m ? m.slice(1).join('=').trim() : f.name;
  }
  _tapDbl(key, single, dbl) {
    const c = this._cfg, dt = c.double_tap; if (!dt || dt === 'default') { single(); return; }
    const now = Date.now(), l = this._lastTap;
    if (l && l.key === key && now - l.t < 320) { clearTimeout(this._tapT); this._lastTap = null; this._ctx(); dbl(); return; }
    this._lastTap = { key, t: now }; clearTimeout(this._tapT); this._tapT = setTimeout(() => { this._lastTap = null; this._ctx(); single(); }, 320);
  }
  _tapItem(it) {
    this._tapDbl('i' + it.id, () => onItemTap(it, false), () => { const a = ccAct('double_tap', it); if (a === 'toggle') onItemTap(it, false, true); else if (a === false) onItemTap(it, false); });
  }
  _tapRoom(r) {
    this._tapDbl('r' + r.id, () => onRoomTap(r, false), () => { const a = ccAct('double_tap', null, r); if (a === 'toggle') onRoomTap(r, false); else if (a === false) onRoomTap(r, false); });
  }
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
  _visFloors() {
    const b = this._cfg.building; let f = this._plan.floors;
    if (b) { const v = f.filter(x => x.bld === b || x.kind === 'garden'); if (v.length) f = v; }
    const sel = this._cfg.floors;
    if (Array.isArray(sel) && sel.length) { const v = sel.map(id => f.find(x => x.id === id)).filter(Boolean); if (v.length) f = v; }
    return f;
  }
  _pickFloor() {
    if (!this._plan) return;
    const want = this._cfg.floor != null && this._cfg.floor !== '' ? this._cfg.floor : (this._floor == null ? this._cfg.start_floor : null);
    const fl = this._visFloors();
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
    haInfo = { ha: true, allowControl: !ccLocked() };
    const dark = !!(this._hass && this._hass.themes && this._hass.themes.darkMode);
    const p = this._plan;
    const settings = ccSettings(p.settings, this._cfg);
    if (dark && (!settings.wallColor || settings.wallColor.toLowerCase() === '#2b3240')) settings.wallColor = '#cfd6e4';
    plan = ccFilterPlan({ ...p, settings }, this._cfg);
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
      root.innerHTML = `<style>${this._css()}</style><ha-card>${head}<div class="msg">${esc(this._err || 'Lade Grundriss …')}</div></ha-card>`;
      return;
    }
    this._ctx();
    if (this._m3 && this._draw3(head)) return;
    this._kill3();
    if (this._iso) return this._drawIso(head);
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
      : `<div class="wrap"${this._wrapStyle()}><svg class="${gest ? 'gest' : ''}" viewBox="${x0} ${y0} ${w} ${h}" font-family="var(--paper-font-body1_-_font-family, system-ui, sans-serif)"><defs><filter id="fpShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".3"/></filter>${defs}</defs><g id="vw" transform="${this._vt(ccx, ccy)}"><g transform="rotate(${rotDeg} ${ccx} ${ccy})">${f.bg && f.bg.url ? bgMarkup({ bg: { ...f.bg, locked: true } }) : ''}${rooms}${walls}${items}</g></g></svg></div>`;
    root.innerHTML = `<style>${this._css()}</style><ha-card>${head}<div class="body ${this._lay()}">${rail}<div class="main${this._bpOn() ? ' bp' : ''}">${body}</div></div></ha-card>`;
    this._bindRail(false);
    const svg = root.querySelector('svg');
    if (svg) this._bind(svg);
    this._ovl();
  }

  _drawIso(head) {
    const root = this.shadowRoot, f = curFloor(), ctx = { glows: new Map(), glowOut: [] };
    const iso = isoMarkup(f, this._isoA || 0, ctx), defs = glowDefsMarkup(ctx.glows), rail = this._rail(false);
    const empty = !f.walls.length && !f.rooms.length && !f.items.length;
    const body = empty ? '<div class="msg">Der Grundriss ist noch leer. Öffne das Panel „Grundriss“ in der Seitenleiste, um ihn zu zeichnen.</div>'
      : `<div class="wrap"${this._wrapStyle()}><svg viewBox="${iso.vb.map(n => n.toFixed(1)).join(' ')}" font-family="var(--paper-font-body1_-_font-family, system-ui, sans-serif)"><defs>${defs}</defs>${iso.inner}</svg></div>`;
    root.innerHTML = `<style>${this._css()}</style><ha-card>${head}<div class="body ${this._lay()}">${rail}<div class="main${this._bpOn() ? ' bp' : ''}">${body}</div></div></ha-card>`;
    this._bindRail(false);
    const svg = root.querySelector('svg');
    if (svg) this._bind(svg);
    this._ovl();
  }

  _wrapStyle() {
    const c = this._cfg, h = Number(c.height) || 0, ar = /^\d+(\.\d+)?[:/]\d+(\.\d+)?$/.test(c.aspect_ratio || '') ? String(c.aspect_ratio).replace(':', ' / ') : '';
    const st = (h ? `height:${h}px;` : '') + (ar && !h ? `aspect-ratio:${ar};` : '') + (h || ar ? 'display:flex;align-items:center;justify-content:center;' : '');
    return st ? ` style="${st}"` : '';
  }
  _bpOn() { if (this._bp == null) { const c = this._cfg, s = (this._plan && this._plan.settings) || {}; this._bp = c.blueprint != null ? !!c.blueprint : !!(s.blueprint || (c.look3d || s.look3d) === 'blueprint'); } return this._bp; }
  _look3() { const c = this._cfg, s = (this._plan && this._plan.settings) || {}; return this._bpOn() ? 'blueprint' : (c.look3d || (s.look3d === 'blueprint' ? 'auto' : s.look3d) || 'auto'); }
  _lay() { const l = this._cfg.layout; return 'lay-' + (l === 'side' || l === 'top' ? l : 'auto'); }
  _rail(is3) {
    const fl = this._visFloors(), c = this._cfg, mb = !c.building && fl.some(x => x.bld);
    const fb = !c.floor && fl.length > 1 ? fl.map(f => `<button data-floor="${esc(f.id)}" class="${f.id === this._floor ? 'on' : ''}">${mb && f.bld ? esc(f.bld) + ' · ' : ''}${esc(this._fname(f))}</button>`).join('') : '';
    let vb = '';
    if (this._iso && !is3) {
      vb = '<button data-v="2d" title="2D-Ansicht">2D</button><button data-isor="1" title="Ansicht um 90° drehen">↻ Drehen</button><button data-v="3d" title="3D-Ansicht">3D</button>';
    } else if (is3) {
      const w = this._w3 || 'auto', wl = { auto: 'Wände: auto', full: 'Wände: voll', half: 'Wände: halb', flat: 'Wände: aus' }[w];
      vb = '<button data-v="2d" title="2D-Ansicht">2D</button><button data-w="1" title="Wandansicht umschalten">' + wl + '</button><button data-walk="1" title="Durchs Haus gehen: WASD/Pfeile oder Joystick, Ziehen = umsehen">🚶 Begehen</button><button data-real="1" title="Realistische Grafik (für Geräte mit mehr Rechenleistung)" class="' + (this._real3() ? 'on' : '') + '">✨ Realistisch</button><button data-xr="vr" hidden title="Virtual Reality: Haus im Maßstab 1:1 begehen">🥽 VR</button><button data-xr="ar" hidden title="Augmented Reality: Modell auf dem Tisch">📱 AR</button>' + (fl.length > 1 ? `<button data-a="1" class="${this._a3 ? 'on' : ''}" title="Alle Etagen anzeigen">Alle Etagen</button>` : '') + (this._enAvail() ? `<button data-en="1" class="${this._enCfg() ? 'on' : ''}" title="Energiefluss: Schnittansicht, nur die Energieflüsse bleiben sichtbar">⚡ Energiefluss</button>` : '');
    } else if (c.view3d !== false && c.gestures !== false) vb = '<button data-v="3d" title="3D-Ansicht">3D</button><button data-v="iso" title="Isometrische Ansicht (2,5D)">Iso</button>';
    const rm = c.rail || 'full';
    if (rm === 'none') return '';
    if (rm === 'floors') vb = '';
    if ((vb || fb) && rm !== 'floors') vb += `<button data-bp="1" class="${this._bpOn() ? 'on' : ''}" title="Blueprint-Ansicht (Bauplan-Stil)">Blueprint</button>`;
    if (!fb && !vb) return '';
    const tog = rm === 'collapsible' ? `<button data-rtog="1" title="Leiste ein-/ausklappen">${this._rc ? '☰' : '✕'}</button>` : '';
    return `<div class="rail${rm === 'collapsible' && this._rc ? ' rc' : ''}">${tog}${fb}${fb && vb ? '<span class="sep"></span>' : ''}${vb}</div>`;
  }
  _bindRail(is3) {
    const root = this.shadowRoot;
    root.querySelectorAll('.rail button').forEach(b => {
      b.onclick = () => {
        if (b.dataset.rtog) { this._rc = !this._rc; const rl = root.querySelector('.rail'); if (rl) rl.classList.toggle('rc', this._rc); b.textContent = this._rc ? '☰' : '✕'; return; }
        if (b.dataset.floor) { this._floor = b.dataset.floor; this._v = null; this._sig = ''; this._draw(); return; }
        const k = b.dataset.v;
        if (b.dataset.isor) { this._isoA = ((this._isoA || 0) + 90) % 360; this._sig = ''; this._draw(); return; }
        if (k === 'iso') { this._iso = true; this._m3 = false; this._kill3(); this._sig = ''; this._draw(); return; }
        if (k === '3d') { this._m3 = true; this._iso = false; this._sig = ''; this._draw(); return; }
        if (k === '2d') { this._m3 = false; this._iso = false; this._kill3(); this._sig = ''; this._draw(); return; }
        if (b.dataset.bp) { this._bp = !this._bpOn(); b.classList.toggle('on', this._bp); const mn = root.querySelector('.main'); if (mn) mn.classList.toggle('bp', this._bp); if (this._v3) this._v3.set('look', this._look3()); return; }
        if (!this._v3) return;
        if (b.dataset.real) { this._r3 = !this._real3(); this._kill3(); this._sig = ''; this._draw(); return; }
        if (b.dataset.en) { this._en3 = !this._enCfg(); b.classList.toggle('on', !!this._en3); this._v3.set('energy', this._enCfg()); return; }
        if (b.dataset.xr) { if (this._v3.inXR()) this._v3.stopXR(); else this._v3.startXR(b.dataset.xr); return; }
        if (b.dataset.walk) { const w = !this._v3.isWalking(); this._v3.setWalk(w); b.classList.toggle('on', w); b.textContent = w ? '🚶 Beenden' : '🚶 Begehen'; return; }
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
    const hgt = Number(this._cfg.height3d) || Number(this._cfg.height) || 0, arx = /^\d+(\.\d+)?[:/]\d+(\.\d+)?$/.test(this._cfg.aspect_ratio || '') ? String(this._cfg.aspect_ratio).replace(':', ' / ') : '';
    root.innerHTML = `<style>${this._css()}</style><ha-card>${head}<div class="body ${this._lay()}">${rail}<div class="main${this._bpOn() ? ' bp' : ''}"><div class="wrap"><div class="stage3${hgt ? ' fixed' : ''}"${hgt ? ` style="height:${hgt}px"` : arx ? ` style="aspect-ratio:${arx};max-height:none"` : ''}></div></div></div></div></ha-card>`;
    this._bindRail(true);
    const st = root.querySelector('.stage3'), myKey = key;
    FP3D.load(this._base3(), this._real3()).then(() => {
      if (this._k3 !== myKey || !this._m3 || !st.isConnected) return;
      this._ctx();
      const c = this._cfg, s = plan.settings;
      this._v3 = FP3D.create(st, {
        real: this._real3(), energy: this._enCfg(), camera: c.start_camera || '', fps: Number(c.max_fps) || 0, pixelRatio: Number(c.pixel_ratio) || 0,
        getFloor: () => this._floor,
        look: this._look3(), building: this._cfg.building || '', walls: this._w3 || 'auto', allFloors: !!this._a3,
        roof: c.roof3d || '', sim: c.sim3 || ((c.hour3d != null && c.hour3d !== '') || c.weather_sim3d ? { hour: c.hour3d != null && c.hour3d !== '' ? Number(c.hour3d) : undefined, cond: c.weather_sim3d || undefined } : null), wallColor: c.wall_color3d || '', dark: () => !!(this._hass && this._hass.themes && this._hass.themes.darkMode), wheel: 'ctrl', touchScroll: true, touchTilt: () => c.tilt3d !== false, canCover: () => true, onCover: (it, v) => { this._ctx(); coverCommand(it, v); }, lowPower: this._q3() ? this._q3() !== 'high' : (window.matchMedia && matchMedia('(pointer: coarse)').matches), shadows: !(window.matchMedia && matchMedia('(max-width: 520px)').matches),
        onTap: (id, long) => { this._ctx(); const it = findItem(id) || plan.floors.flatMap(f => f.items).find(i => i.id === id); if (it && (it.entity || it.tap === 'service')) { if (long) onItemTap(it, true); else this._tapItem(it); } },
      });
      this._v3.update(); this._ovl();
      const v3x = this._v3; [['vr', 'immersive-vr'], ['ar', 'immersive-ar']].forEach(([k, m]) => v3x.xrSupported(m).then(ok => { const xb = this.shadowRoot.querySelector('[data-xr="' + k + '"]'); if (xb) xb.hidden = !ok; }));
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
    const gest = this._cfg.gestures !== false && !this._iso;
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
        const d = this._drag = { t: 'room', id: rg.dataset.id, sx: e.clientX, sy: e.clientY, moved: false, long: false };
        if (this._cfg.long_press && this._cfg.long_press !== 'default') d.timer = setTimeout(() => { if (this._drag === d && !d.moved) { d.long = true; this._ctx(); const cr = findRoom(d.id); if (cr) onRoomTap(cr, false, true); } }, 550);
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
        const pan = !this._cfg.rotate_gesture || (e.pointerType === 'mouse' && (e.button === 1 || e.button === 2 || e.shiftKey));
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
        if (this._cfg.rotate_gesture && Math.abs(da) > 6) g.rot = true;
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
      if (d.t === 'item') { const it = findItem(d.id); if (it) this._tapItem(it); }
      else { const r = findRoom(d.id); if (r) this._tapRoom(r); }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    if (gest) {
      svg.addEventListener('wheel', e => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) return; // normales Scrollen der Seite nicht blockieren
        e.preventDefault();
        const P = this._toV(svg, e), dy = (e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 16 : 1);
        if (e.shiftKey && this._cfg.rotate_gesture) this._rotBy(-dy * 0.12, P); else this._zoomBy(Math.exp(-dy * 0.0025), P);
      }, { passive: false });
      svg.addEventListener('dblclick', () => { this._v = null; this._apply(); });
      svg.addEventListener('contextmenu', e => e.preventDefault());
    } else {
      svg.addEventListener('contextmenu', e => { if (e.target.closest('[data-k="item"]')) e.preventDefault(); });
    }
  }
}

function normalizeSafe(p) { try { return normalize(p); } catch (_) { return null; } }


// ---------- Grafischer Karten-Editor ----------
const ED_DEF = { overlay: true, tilt3d: true, gestures: true, view3d: true };
const ED_LABELS = {
  height: 'Kartenhöhe (px, 0 = automatisch)', aspect_ratio: 'Seitenverhältnis', start_floor: 'Startetage', start_camera: 'Startkamera (3D)', roof_type3d: 'Dachart (3D)', roof_color3d: 'Dachfarbe (3D, z. B. #8a4b3a)', wall_color3d: 'Wandfarbe (3D, z. B. #f3f0ea)', ground_color3d: 'Bodenfarbe (3D)', wall_height3d: 'Wandhöhe (3D, cm)',
  hour3d: 'Feste Tageszeit (3D, Stunde 0–24; leer = live)', weather_sim3d: 'Feste Wetter-Simulation (3D)', quality3d: 'Grafikqualität (3D)', max_fps: 'Maximale Bildrate (3D)', pixel_ratio: 'Maximale Pixeldichte (3D)', label_size: 'Schriftgröße im Plan', show_names: 'Raumnamen anzeigen', show_areas: 'Raumflächen anzeigen', show_dims: 'Wandmaße anzeigen',
  readonly: 'Nur Anzeige (Schalten sperren)', admin_only: 'Schalten nur für Administratoren', confirm_critical: 'Bestätigen bei Schlössern, Alarmanlage, Garagentor', confirm_entities: 'Zusätzlich bestätigen (Entitäten, kommagetrennt; light.* erlaubt)', double_tap: 'Doppeltipp-Aktion', long_press: 'Langdruck-Aktion', rail: 'Seitenleiste',
  floors: 'Sichtbare Etagen', floor_labels: 'Etagen-Namen (z. B. Erdgeschoss=EG, Keller=UG)', only_areas: 'Nur Geräte dieser Bereiche', only_domains: 'Nur diese Geräte-Arten', heat_min: 'Heatmap: Minimalwert', heat_max: 'Heatmap: Maximalwert', heat_palette: 'Heatmap: Farbskala',
  th_co2: 'Alarm: CO₂ über (ppm)', th_hum_hi: 'Alarm: Luftfeuchte über (%)', th_hum_lo: 'Alarm: Luftfeuchte unter (%)', th_temp_hi: 'Alarm: Temperatur über (°C)', th_temp_lo: 'Alarm: Temperatur unter (°C)', temp_unit: 'Temperatur-Einheit', decimals: 'Nachkommastellen (leer = automatisch)',
  energy_flow: 'Energiefluss-Schalter anzeigen', energy_flow_start: 'Energiefluss direkt anzeigen', energy_flow_style: 'Flusslinien-Stil', energy_flow_speed: 'Flussgeschwindigkeit (Faktor)', energy_flow_width: 'Flusslinien-Breite (Faktor)', energy_flow_min: 'Mindestleistung für Fluss (W)',
  energy_pv: 'Energie: PV-Leistung (Sensor)', energy_grid: 'Energie: Netz (Sensor)', energy_battery: 'Energie: Batterie (Sensor)', energy_home: 'Energie: Hausverbrauch (Sensor)', accent_color: 'Akzentfarbe (z. B. #03a9f4)', custom_css: 'Eigenes CSS',
  title: 'Titel', floor: 'Etage (leer = alle mit Reitern)', layout: 'Layout', mode3d: 'Direkt in 3D starten', view3d: '3D-Umschalter anzeigen', look3d: 'Look (3D)', walls3d: 'Wände (3D)',
  all3d: 'Alle Etagen (3D)', roof3d: 'Dach (3D)', heat: 'Raum-Heatmap', blueprint: 'Blueprint-Look', tilt3d: 'Kippen per Touch (3D)', realistic: 'Realistische Grafik (3D, rechenintensiv)', overlay: 'Live-Übersicht (Alarme, Energie, Szenen)',
  kiosk: 'Kiosk-Modus', kiosk_idle: 'Kiosk: Rückkehr nach (Sekunden)', height3d: 'Höhe 3D (px, 0 = automatisch)', weather3d: 'Wetter-Entität', language: 'Sprache (z. B. de, en; leer = automatisch)', rotate: 'Drehung (°)', gestures: 'Gesten (Zoomen/Verschieben)', rotate_gesture: 'Drehen per Geste (2D)', building: 'Gebäude',
};
class FloorplanStudioCardEditor extends HTMLElement {
  setConfig(c) { this._c = Object.assign({}, c); this._render(); }
  set hass(h) { this._hass = h; if (this._f) this._f.hass = h; if (!this._fl && h) this._loadFloors(); }
  async _loadFloors() {
    this._fl = []; this._bl = [];
    try { const r = await this._hass.callWS({ type: 'floorplan_studio/get' }); this._fl = r.plan.floors.map(f => ({ value: f.id, label: f.name })); this._bl = [...new Set(r.plan.floors.map(f => f.bld).filter(Boolean))].map(b => ({ value: b, label: b })); } catch (_) { /* egal */ }
    this._render();
  }
  _schema() {
    const sel = (name, opts, multi) => ({ name, selector: { select: { mode: multi ? 'list' : 'dropdown', multiple: !!multi, options: opts.map(([value, label]) => ({ value, label: FPI.tr(label) })) } } });
    const bool = name => ({ name, selector: { boolean: {} } });
    const num = (name, min, max, step) => ({ name, selector: { number: { min, max, step: step || 1, mode: 'box' } } });
    const txt = (name, multiline) => ({ name, selector: { text: multiline ? { multiline: true } : {} } });
    const ent = (name, dom) => ({ name, selector: { entity: { domain: dom } } });
    const grp = (title, schema, expanded) => ({ type: 'expandable', title: FPI.tr(title), expanded: !!expanded, schema });
    const tri = name => sel(name, [['', 'Wie im Plan'], ['yes', 'Ja'], ['no', 'Nein']]);
    const act = name => sel(name, [['', 'Standard'], ['none', 'Nichts'], ['details', 'Details'], ['history', 'Verlauf'], ['toggle', 'Schalten']]);
    const flo = (this._fl || []).map(f => [f.value, f.label]);
    const sc = [
      { name: 'title', selector: { text: {} } },
      sel('floor', [['', 'Alle Etagen (Reiter)'], ...flo]),
    ];
    if ((this._bl || []).length) sc.push(sel('building', [['', 'Alle Gebäude'], ...this._bl.map(b => [b.value, b.label])]));
    sc.push(
      sel('layout', [['auto', 'Automatisch'], ['side', 'Seitenleiste'], ['top', 'Leiste oben']]),
      bool('mode3d'), bool('view3d'),
      sel('look3d', [['auto', 'Automatisch'], ['day', 'Realistisch Tag'], ['dark', 'Realistisch Nacht'], ['live', 'Live (Zeit & Wetter)'], ['neon', 'Neon'], ['blueprint', 'Blueprint']]),
      sel('walls3d', [['auto', 'Automatisch (Kamera-Ausschnitt)'], ['full', 'Voll'], ['half', 'Halb'], ['flat', 'Flach']]),
      bool('all3d'),
      sel('roof3d', [['', 'Automatisch'], ['none', 'Kein Dach'], ['flat', 'Flachdach'], ['gable', 'Satteldach'], ['hip', 'Walmdach'], ['shed', 'Pultdach']]),
      sel('heat', [['none', 'Aus'], ['temp', 'Temperatur'], ['hum', 'Luftfeuchte'], ['co2', 'CO₂']]),
      bool('blueprint'), bool('realistic'), bool('tilt3d'), bool('overlay'), bool('gestures'), bool('rotate_gesture'), bool('kiosk'),
      { name: 'kiosk_idle', selector: { number: { min: 10, max: 3600, mode: 'box' } } },
      { name: 'height3d', selector: { number: { min: 0, max: 2000, mode: 'box' } } },
      { name: 'weather3d', selector: { entity: { domain: 'weather' } } },
      { name: 'rotate', selector: { number: { min: -180, max: 180, mode: 'box' } } },
      { name: 'language', selector: { text: {} } },
      grp('Darstellung', [
        num('height', 0, 2000), sel('aspect_ratio', [['', 'Automatisch'], ['1:1', '1:1'], ['4:3', '4:3'], ['16:10', '16:10'], ['16:9', '16:9'], ['21:9', '21:9']]),
        sel('start_floor', [['', 'Erste Etage'], ...flo]),
        sel('start_camera', [['', 'Isometrisch'], ['iso', 'Isometrisch'], ['top', 'Von oben'], ['front', 'Vorne'], ['back', 'Hinten'], ['left', 'Links'], ['right', 'Rechts']]),
        sel('roof_type3d', [['', 'Wie im Plan'], ['plain', 'Glatt'], ['tiles', 'Ziegel']]), txt('roof_color3d'), txt('wall_color3d'), txt('ground_color3d'), num('wall_height3d', 180, 400, 5),
        num('hour3d', 0, 24, 0.5), sel('weather_sim3d', [['', 'Live-Wetter'], ['sunny', 'Sonnig'], ['clear-night', 'Klare Nacht'], ['partlycloudy', 'Teils bewölkt'], ['cloudy', 'Bewölkt'], ['rainy', 'Regen'], ['pouring', 'Starkregen'], ['snowy', 'Schnee'], ['fog', 'Nebel'], ['lightning-rainy', 'Gewitter']]),
        sel('quality3d', [['', 'Automatisch'], ['low', 'Niedrig'], ['medium', 'Mittel'], ['high', 'Hoch (Realistisch)']]),
        sel('max_fps', [['', 'Unbegrenzt'], ['15', '15'], ['30', '30'], ['60', '60']]), sel('pixel_ratio', [['', 'Automatisch'], ['1', '1'], ['1.5', '1,5'], ['2', '2']]),
        num('label_size', 8, 40), tri('show_names'), tri('show_areas'), tri('show_dims'),
      ]),
      grp('Bedienung & Sicherheit', [
        bool('readonly'), bool('admin_only'), bool('confirm_critical'), txt('confirm_entities'),
        act('double_tap'), act('long_press'),
        sel('rail', [['', 'Vollständig'], ['floors', 'Nur Etagen'], ['collapsible', 'Einklappbar'], ['none', 'Ausgeblendet']]),
      ]),
      grp('Inhalte', [
        sel('floors', flo, true), txt('floor_labels'),
        { name: 'only_areas', selector: { area: { multiple: true } } },
        sel('only_domains', [['light', 'Licht'], ['switch', 'Schalter'], ['sensor', 'Sensor'], ['binary_sensor', 'Binärsensor'], ['cover', 'Rollladen/Tor'], ['climate', 'Klima'], ['media_player', 'Medien'], ['camera', 'Kamera'], ['lock', 'Schloss'], ['fan', 'Ventilator'], ['vacuum', 'Staubsauger']], true),
        num('heat_min', -50, 5000, 0.5), num('heat_max', -50, 5000, 0.5), sel('heat_palette', [['', 'Standard'], ['viridis', 'Viridis'], ['bluered', 'Blau–Rot'], ['greenred', 'Grün–Rot']]),
        num('th_co2', 400, 5000, 50), num('th_hum_hi', 30, 100), num('th_hum_lo', 0, 70), num('th_temp_hi', 15, 40, 0.5), num('th_temp_lo', 0, 25, 0.5),
        sel('temp_unit', [['', 'Automatisch'], ['C', '°C'], ['F', '°F']]), num('decimals', 0, 3),
        ent('energy_pv', 'sensor'), ent('energy_grid', 'sensor'), ent('energy_battery', 'sensor'), ent('energy_home', 'sensor'),
      ]),
      grp('Energiefluss (3D)', [
        bool('energy_flow'), bool('energy_flow_start'),
        sel('energy_flow_style', [['', 'Punkte'], ['dots', 'Punkte'], ['dashes', 'Striche'], ['arrows', 'Pfeile'], ['line', 'Linie'], ['glow', 'Leuchtend']]),
        num('energy_flow_speed', 0.1, 5, 0.1), num('energy_flow_width', 0.3, 4, 0.1), num('energy_flow_min', 0, 500, 5),
      ]),
      grp('Technik', [txt('accent_color'), txt('custom_css', true)]),
    );
    return sc;
  }
  _render() {
    if (!this._c) return;
    if (!this._f) {
      this._f = document.createElement('ha-form');
      this._f.computeLabel = s => FPI.tr(ED_LABELS[s.name] || s.name);
      this._f.addEventListener('value-changed', e => {
        e.stopPropagation();
        const v = Object.assign({}, e.detail.value);
        Object.keys(v).forEach(k => { if (v[k] === '' || v[k] == null || (k in ED_DEF && v[k] === ED_DEF[k]) || (k === 'heat' && v[k] === 'none') || (Array.isArray(v[k]) && !v[k].length) || (v[k] === false && !(k in ED_DEF))) delete v[k]; });
        v.type = this._c.type || 'custom:floorplan-studio-card'; this._c = v;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: v }, bubbles: true, composed: true }));
      });
      this.append(this._f);
    }
    this._f.hass = this._hass; this._f.schema = this._schema(); this._f.data = Object.assign({}, ED_DEF, this._c);
  }
}
if (!customElements.get('floorplan-studio-card-editor')) customElements.define('floorplan-studio-card-editor', FloorplanStudioCardEditor);
if (!customElements.get('floorplan-studio-card')) customElements.define('floorplan-studio-card', FloorplanStudioCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'floorplan-studio-card')) {
  window.customCards.push({ type: 'floorplan-studio-card', name: 'Floorplan Studio', description: 'Zeigt deinen gezeichneten Grundriss live mit allen Komponenten.', preview: false });
}
