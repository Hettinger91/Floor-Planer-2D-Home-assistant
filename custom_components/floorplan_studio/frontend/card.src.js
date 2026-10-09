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
svg.gest { touch-action: none; cursor: grab; }
svg.gest.grabbing { cursor: grabbing; }
.wrap { position: relative; }
.ctl { position: absolute; right: 8px; bottom: 8px; display: flex; gap: 4px; opacity: .85; }
.ctl button { width: 30px; height: 30px; border-radius: 15px; border: 1px solid var(--divider-color); background: var(--card-background-color, #fff); color: var(--primary-text-color); font: inherit; font-size: 15px; line-height: 1; padding: 0; cursor: pointer; }
.item.act, [data-k="room"].act { cursor: pointer; }
.stage3 { width: 100%; height: 420px; position: relative; touch-action: none; }
.msg { padding: 24px 16px; color: var(--secondary-text-color); text-align: center; }
`;

class FloorplanStudioCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._cfg = {}; this._plan = null; this._floor = null; this._sig = ''; this._unsub = null; this._err = '';
    this._hass = null; this._loading = false; this._rev = null; this._drag = null; this._v = null; this._pts = new Map(); this._g = null; this._v3 = null; this._k3 = ''; this._m3 = null;
  }
  static getStubConfig() { return {}; }
  getCardSize() { return 6; }
  setConfig(c) { this._cfg = c || {}; this._sig = ''; this._m3 = this._cfg.mode3d === true; this._kill3(); this._pickFloor(); this._draw(); }
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
      if (r.entity) m = m.replace('<g data-k="room"', '<g class="act" data-k="room"');
      return m;
    }).join('');
    const walls = f.walls.map(wl => wallMarkup(wl, true, { k: 1 })).join('');
    const items = f.items.map(i => itemMarkup(i, ctx)).join('') + ctx.glowOut.join('');
    const defs = glowDefsMarkup(ctx.glows);
    const gest = this._cfg.gestures !== false;
    this._C = { x: ccx, y: ccy };
    const empty = !f.walls.length && !f.rooms.length && !f.items.length && !(f.bg && f.bg.url);
    const tabs = !this._cfg.floor && this._plan.floors.length > 1
      ? `<div class="tabs">${this._plan.floors.map(fl => `<button data-floor="${esc(fl.id)}" class="${fl.id === this._floor ? 'on' : ''}">${esc(fl.name)}</button>`).join('')}</div>` : '';
    const body = empty
      ? '<div class="msg">Der Grundriss ist noch leer. Öffne das Panel „Grundriss“ in der Seitenleiste, um ihn zu zeichnen.</div>'
      : `<div class="wrap"><svg class="${gest ? 'gest' : ''}" viewBox="${x0} ${y0} ${w} ${h}" font-family="var(--paper-font-body1_-_font-family, system-ui, sans-serif)"><defs><filter id="fpShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".3"/></filter>${defs}</defs><g id="vw" transform="${this._vt(ccx, ccy)}"><g transform="rotate(${rotDeg} ${ccx} ${ccy})">${f.bg && f.bg.url ? bgMarkup({ bg: { ...f.bg, locked: true } }) : ''}${rooms}${walls}${items}</g></g></svg>${gest ? '<div class="ctl"><button data-v="ccw" title="Drehen">⟲</button><button data-v="cw" title="Drehen">⟳</button><button data-v="out" title="Verkleinern">−</button><button data-v="in" title="Vergrößern">+</button><button data-v="reset" title="Zurücksetzen">⤢</button>' + (this._cfg.view3d !== false ? '<button data-v="3d" title="3D-Ansicht">3D</button>' : '') + '</div>' : ''}</div>`;
    root.innerHTML = `<style>${CARD_CSS}</style><ha-card>${head}${tabs}${body}</ha-card>`;
    root.querySelectorAll('.tabs button').forEach(bt => { bt.onclick = () => { this._floor = bt.dataset.floor; this._v = null; this._sig = ''; this._draw(); }; });
    const svg = root.querySelector('svg');
    if (svg) this._bind(svg);
  }

  _base3() {
    const sc = [...document.querySelectorAll('script[src]')].map(x => x.src).find(u => /floorplan-card\.js/.test(u));
    return sc ? sc.replace(/[^/]*$/, '') + 'vendor/' : '/floorplan_studio_static/vendor/';
  }

  // 3D-Ansicht. true = übernommen (auch wenn noch geladen wird)
  _draw3(head) {
    const root = this.shadowRoot, key = '3|' + this._floor + '|' + (this._plan.floors.length > 1 && !this._cfg.floor ? 't' : '');
    if (this._v3 && this._k3 === key && root.querySelector('.stage3')) { this._v3.update(); return true; }
    this._kill3(); this._k3 = key;
    const tabs = !this._cfg.floor && this._plan.floors.length > 1
      ? `<div class="tabs">${this._plan.floors.map(fl => `<button data-floor="${esc(fl.id)}" class="${fl.id === this._floor ? 'on' : ''}">${esc(fl.name)}</button>`).join('')}</div>` : '';
    const hgt = Number(this._cfg.height3d) || 420;
    const ctl = '<button data-v="2d" title="2D-Ansicht">2D</button><button data-v="ccw" title="Drehen">⟲</button><button data-v="cw" title="Drehen">⟳</button><button data-v="reset" title="Zurücksetzen">⤢</button>';
    root.innerHTML = `<style>${CARD_CSS}</style><ha-card>${head}${tabs}<div class="wrap"><div class="stage3" style="height:${hgt}px"></div><div class="ctl">${ctl}</div></div></ha-card>`;
    root.querySelectorAll('.tabs button').forEach(bt => { bt.onclick = () => { this._floor = bt.dataset.floor; this._sig = ''; this._draw(); }; });
    const st = root.querySelector('.stage3'), myKey = key;
    FP3D.load(this._base3()).then(() => {
      if (this._k3 !== myKey || !this._m3 || !st.isConnected) return;
      this._ctx();
      const c = this._cfg, s = plan.settings;
      this._v3 = FP3D.create(st, {
        getFloor: () => this._floor,
        look: c.look3d || s.look3d || 'auto', walls: c.walls3d || s.walls3d || 'auto', allFloors: c.all3d != null ? !!c.all3d : !!s.all3d,
        roof: c.roof3d || '', wallColor: c.wall_color3d || '', dark: () => !!(this._hass && this._hass.themes && this._hass.themes.darkMode), wheel: 'ctrl',
        onTap: (id, long) => { this._ctx(); const it = findItem(id) || plan.floors.flatMap(f => f.items).find(i => i.id === id); if (it && (it.entity || it.tap === 'service')) onItemTap(it, long); },
      });
      this._v3.update();
    }).catch(e => { st.innerHTML = `<div class="msg">3D nicht möglich: ${esc(e.message)}</div>`; });
    root.querySelectorAll('.ctl button').forEach(b => {
      b.onclick = () => {
        const k = b.dataset.v;
        if (k === '2d') { this._m3 = false; this._kill3(); this._sig = ''; this._draw(); }
        else if (!this._v3) return;
        else if (k === 'ccw') this._v3.rotate(-0.5); else if (k === 'cw') this._v3.rotate(0.5); else this._v3.resetView();
      };
    });
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
      } else if (rg && findRoom(rg.dataset.id) && findRoom(rg.dataset.id).entity) {
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
      else { const r = findRoom(d.id); if (r && r.entity) openDetails(r.entity); }
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
