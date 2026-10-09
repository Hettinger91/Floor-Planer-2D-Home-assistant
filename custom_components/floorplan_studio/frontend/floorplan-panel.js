/* Floorplan Studio – Seitenleisten-Panel. Hostet den Editor in einem same-origin iframe
   und stellt ihm über window.fpHost den Zugriff auf hass bereit. */
const FP_BASE = new URL('./app/', import.meta.url).href;

class FloorplanStudioPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._listeners = new Set();
    this._lastRev = null;
    this._unsub = null;
    this._lastDark = null;
  }

  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (first) this._init();
    this._listeners.forEach(fn => { try { fn('states'); } catch (_) { /* egal */ } });
    const dark = !!(h.themes && h.themes.darkMode);
    if (dark !== this._lastDark) {
      this._lastDark = dark;
      this._listeners.forEach(fn => { try { fn('states'); } catch (_) { /* egal */ } });
      this._frameWin() && this._frameWin().applyTheme && this._frameWin().applyTheme();
    }
  }
  set narrow(v) { this._narrow = v; }
  set panel(v) { this._panel = v; }
  set route(v) { this._route = v; }

  _frameWin() { return this._frame && this._frame.contentWindow; }

  _init() {
    this.style.cssText = 'display:block;height:100%;width:100%;';
    this.innerHTML = '';
    const f = document.createElement('iframe');
    f.style.cssText = 'border:0;width:100%;height:100%;display:block;background:transparent;';
    f.setAttribute('allow', 'clipboard-write');
    this._frame = f;
    window.fpHost = this._makeHost();
    f.src = FP_BASE + 'index.html';
    this.append(f);
  }

  _isAdmin() { return !!(this._hass && this._hass.user && this._hass.user.is_admin); }

  _makeHost() {
    const self = this;
    const ws = msg => self._hass.callWS(msg);
    const wrapErr = e => { const x = new Error((e && e.message) || 'Fehler'); x.code = e && e.code; return x; };
    return {
      demo: false,
      info: () => ({ ha: true, allowControl: true, admin: self._isAdmin(), dark: !!(self._hass.themes && self._hass.themes.darkMode) }),
      getPlan: async () => { const r = await ws({ type: 'floorplan_studio/get' }); self._lastRev = r.rev; return r; },
      savePlan: async (rev, plan, force) => {
        try { const r = await ws({ type: 'floorplan_studio/save', rev, plan, force: !!force }); self._lastRev = r.rev; return r; }
        catch (e) { throw wrapErr(e); }
      },
      states: () => self._hass.states,
      callService: (d, s, data) => self._hass.callService(d, s, data),
      moreInfo: entityId => self.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true })),
      upload: async file => {
        const r = await self._hass.fetchWithAuth('/api/floorplan_studio/upload', { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
        if (!r.ok) {
          let m = ''; try { m = (await r.json()).error || ''; } catch (_) { /* egal */ }
          throw new Error(m || ('HTTP ' + r.status));
        }
        return r.json();
      },
      backups: () => ws({ type: 'floorplan_studio/backups' }).then(r => r.backups),
      restore: async id => { const r = await ws({ type: 'floorplan_studio/restore', id }); self._lastRev = r.rev; return r; },
      publishDashboard: opts => self._publish(opts),
      onChange: fn => {
        self._listeners.add(fn);
        if (!self._unsub) {
          self._hass.connection.subscribeMessage(ev => {
            if (ev && ev.rev !== self._lastRev) { self._lastRev = ev.rev; self._listeners.forEach(f => { try { f('plan'); } catch (_) { /* egal */ } }); }
          }, { type: 'floorplan_studio/subscribe' }).then(u => { self._unsub = u; }).catch(() => { });
          self._unsub = self._unsub || (() => { });
        }
      },
    };
  }

  async _publish({ title, path, sidebar }) {
    if (!/^[a-z0-9_]+-[a-z0-9_-]+$/.test(path || '')) throw new Error('Pfad: nur a–z, 0–9, _ und mindestens ein Bindestrich (z. B. grundriss-plan)');
    const ws = m => this._hass.callWS(m);
    const MARK = 'floorplan_studio';
    const list = await ws({ type: 'lovelace/dashboards/list' });
    let dash = list.find(d => d.url_path === path);
    let created = false;
    if (dash) {
      const cfg = await ws({ type: 'lovelace/config', url_path: path, force: true }).catch(() => null);
      if (!cfg || cfg[MARK] !== true) throw new Error('Das Dashboard „' + path + '“ existiert bereits und stammt nicht von Floorplan Studio.');
      await ws({ type: 'lovelace/dashboards/update', dashboard_id: dash.id, title, show_in_sidebar: !!sidebar, icon: 'mdi:floor-plan' });
    } else {
      await ws({ type: 'lovelace/dashboards/create', url_path: path, mode: 'storage', title, icon: 'mdi:floor-plan', show_in_sidebar: !!sidebar, require_admin: false });
      created = true;
    }
    await ws({
      type: 'lovelace/config/save', url_path: path,
      config: { [MARK]: true, title, views: [{ title, path: 'plan', panel: true, cards: [{ type: 'custom:floorplan-studio-card' }] }] },
    });
    return { created, path };
  }

  disconnectedCallback() {
    if (this._unsub) { try { this._unsub(); } catch (_) { /* egal */ } this._unsub = null; }
    if (window.fpHost) delete window.fpHost;
  }
}
if (!customElements.get('floorplan-studio-panel')) customElements.define('floorplan-studio-panel', FloorplanStudioPanel);
