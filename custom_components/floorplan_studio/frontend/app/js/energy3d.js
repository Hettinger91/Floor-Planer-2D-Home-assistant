'use strict';
// Energiefluss in 3D: Schnitt-/Geisteransicht, nur die Flüsse (PV, Netz, Batterie, Verbraucher) bleiben sichtbar.
// Aussehen per CSS-Variablen (an der Karte/einem übergeordneten Element) oder Karten-Optionen:
//   --fp-flow-style: dots | dashes | arrows | line | glow     --fp-flow-speed: 1 (Faktor)      --fp-flow-width: 1 (Faktor)
//   --fp-flow-pv / -grid / -export / -bat / -load: Farben     --fp-flow-ghost: 0.1 (Deckkraft der Geisteransicht)
const FPENERGY = (() => {
  const DEF = { pv: '#ffc107', grid: '#ef5350', export: '#66bb6a', bat: '#26c6da', load: '#42a5f5' };
  const STYLES = ['dots', 'dashes', 'arrows', 'line', 'glow'];
  const wattsOf = (id, unitless) => {
    const st = id && states[id]; if (!st) return null;
    const v = parseFloat(st.state); if (!isFinite(v)) return null;
    const u = String((st.attributes || {}).unit_of_measurement || (unitless || 'W'));
    return /^kW/i.test(u) ? v * 1000 : /^MW/i.test(u) ? v * 1e6 : v;
  };
  const pwrOf = it => {
    if (it.pwr) return wattsOf(it.pwr);
    if (it.entity && domainOf(it.entity) === 'sensor') { const a = (states[it.entity] || {}).attributes || {}; if (a.device_class === 'power') return wattsOf(it.entity); }
    return null;
  };
  // Konfiguration: CSS-Variablen schlagen Karten-Optionen
  function readCfg(host, base) {
    const b = base || {};
    let cs = null; try { cs = host && getComputedStyle(host); } catch (_) { /* egal */ }
    const v = n => { const x = cs && cs.getPropertyValue(n); return x && x.trim() ? x.trim() : ''; };
    const num = (a, d) => { const x = parseFloat(a); return isFinite(x) ? x : d; };
    const style = (v('--fp-flow-style') || b.style || 'dots').toLowerCase();
    return {
      style: STYLES.includes(style) ? style : 'dots',
      speed: Math.max(0.05, num(v('--fp-flow-speed'), num(b.speed, 1))),
      width: Math.max(0.2, num(v('--fp-flow-width'), num(b.width, 1))),
      ghost: Math.min(0.5, Math.max(0.02, num(v('--fp-flow-ghost'), 0.1))),
      min: Math.max(0, num(b.min, 15)),
      col: {
        pv: v('--fp-flow-pv') || b.c_pv || DEF.pv, grid: v('--fp-flow-grid') || b.c_grid || DEF.grid, export: v('--fp-flow-export') || b.c_export || DEF.export,
        bat: v('--fp-flow-bat') || b.c_bat || DEF.bat, load: v('--fp-flow-load') || b.c_load || DEF.load,
      },
    };
  }
  const fmtW = w => Math.abs(w) >= 1000 ? (Math.round(Math.abs(w) / 10) / 100) + ' kW' : Math.round(Math.abs(w)) + ' W';

  // Flüsse berechnen. env: { items: [{it, pos(Vector3), floorY}], hub: Vector3, top: Vector3, grid: Vector3, bat: Vector3, wallH }
  function plan3(T, env, m, cfg) {
    const V = (x, y, z) => new T.Vector3(x, y, z);
    const flows = [], nodes = [];
    const route = (a, b, yMid) => {
      const p = [a.clone()];
      const y = yMid != null ? yMid : Math.max(a.y, b.y) + 40;
      p.push(V(a.x, y, a.z));
      if (Math.abs(a.x - b.x) > 1 && Math.abs(a.z - b.z) > 1) p.push(V(b.x, y, a.z));
      p.push(V(b.x, y, b.z), b.clone());
      return p;
    };
    const e = m && m.energy;
    const hub = env.hub;
    nodes.push({ pos: hub.clone().add(V(0, 30, 0)), text: '⚡', kind: 'load' });
    if (e) {
      if (e.pv != null && e.pv > cfg.min) { flows.push({ pts: route(env.top, hub, env.top.y + 30).reverse().reverse(), w: e.pv, kind: 'pv' }); nodes.push({ pos: env.top.clone().add(V(0, 40, 0)), text: '☀ ' + fmtW(e.pv), kind: 'pv' }); }
      else if (e.pv != null) nodes.push({ pos: env.top.clone().add(V(0, 40, 0)), text: '☀ 0 W', kind: 'pv' });
      if (e.g != null) {
        const imp = e.g > 0;
        if (Math.abs(e.g) > cfg.min) flows.push({ pts: imp ? route(env.grid, hub, 40) : route(hub, env.grid, 40), w: Math.abs(e.g), kind: imp ? 'grid' : 'export' });
        nodes.push({ pos: env.grid.clone().add(V(0, 60, 0)), text: (imp ? '🔌 ' : '↗ ') + fmtW(e.g), kind: imp ? 'grid' : 'export' });
      }
      if (e.b != null) {
        const chg = e.b > 0;
        if (Math.abs(e.b) > cfg.min) flows.push({ pts: chg ? route(hub, env.bat, hub.y) : route(env.bat, hub, hub.y), w: Math.abs(e.b), kind: 'bat' });
        nodes.push({ pos: env.bat.clone().add(V(0, 60, 0)), text: '🔋 ' + fmtW(e.b), kind: 'bat' });
      }
    }
    env.items.forEach(r => {
      const w = pwrOf(r.it); if (w == null) return;
      const ceil = r.floorY + env.wallH - 18;
      const to = V(r.pos.x, r.pos.y + Math.max(10, (r.h || 40) * 0.5), r.pos.z);
      if (w > cfg.min) flows.push({ pts: route(hub, to, Math.max(hub.y, ceil)), w, kind: 'load', id: r.it.id });
      if (w > 0 || r.it.pwr) nodes.push({ pos: to.clone().add(V(0, 50, 0)), text: fmtW(w), kind: 'load', small: true });
    });
    return { flows, nodes };
  }

  function build(T, parent, textSprite, spec, cfg) {
    const g = new T.Group(); g.userData.energy = true; parent.add(g);
    const parts = [];
    const geoDot = new T.SphereGeometry(1, 10, 8);
    const geoDash = new T.CapsuleGeometry(1, 3, 3, 8); geoDash.rotateX(Math.PI / 2);
    const geoArrow = new T.CylinderGeometry(0, 1, 2.6, 10); geoArrow.rotateX(Math.PI / 2);
    spec.flows.forEach(fl => {
      const col = new T.Color(cfg.col[fl.kind] || cfg.col.load);
      const curve = new T.CatmullRomCurve3(fl.pts, false, 'catmullrom', 0.04);
      const L = curve.getLength(); if (L < 5) return;
      const K = spec.K || 1, lw = Math.log10(1 + fl.w / 100), wid = K * cfg.width * (1.1 + 0.75 * lw), speed = K * cfg.speed * (50 + 80 * lw);
      const pts = curve.getSpacedPoints(Math.max(12, Math.round(L / 6)));
      const tube = new T.Mesh(new T.TubeGeometry(curve, Math.max(12, Math.round(L / 10)), wid * (cfg.style === 'line' ? 0.9 : 0.35), 6, false), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: cfg.style === 'line' ? 0.85 : 0.32, depthWrite: false, depthTest: false }));
      tube.renderOrder = 35; g.add(tube);
      const spacing = (cfg.style === 'dashes' ? 26 : cfg.style === 'arrows' ? 30 : 34) * (spec.K || 1) / Math.min(1.6, Math.max(0.7, cfg.width));
      const n = cfg.style === 'line' ? Math.min(6, Math.max(2, Math.round(L / 150))) : Math.min(200, Math.max(2, Math.round(L / spacing)));
      const geo = cfg.style === 'dashes' ? geoDash : cfg.style === 'arrows' ? geoArrow : geoDot;
      const sc = cfg.style === 'dashes' ? wid * 0.9 : cfg.style === 'arrows' ? wid * 1.7 : cfg.style === 'glow' ? wid * 2.6 : wid * (cfg.style === 'line' ? 1.5 : 1.25);
      const mat = cfg.style === 'glow' ? new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false, depthTest: false }) : new T.MeshBasicMaterial({ color: col.clone().lerp(new T.Color(0xffffff), 0.25), depthTest: false, transparent: true, opacity: 0.95 });
      const ms = [];
      for (let i = 0; i < n; i++) { const m = new T.Mesh(geo, mat); m.scale.setScalar(sc); m.renderOrder = 36; g.add(m); ms.push(m); }
      parts.push({ pts, L, n, ms, speed, style: cfg.style, ph: Math.random(), kind: fl.kind, id: fl.id });
    });
    spec.nodes.forEach(nd => {
      const sp = textSprite(nd.text, (nd.small ? 15 : nd.text === '⚡' ? 16 : 22) * (spec.K || 1), { bg: nd.small ? '#1b2433' : cfg.col[nd.kind] || '#333', fg: nd.small ? '#fff' : '#111' });
      sp.position.copy(nd.pos); sp.renderOrder = 50; g.add(sp);
    });
    const tmp = new T.Vector3();
    function anim(dt) {
      let any = false;
      parts.forEach(p => {
        p.ph = (p.ph + dt * p.speed / p.L) % 1; any = true;
        for (let i = 0; i < p.n; i++) {
          const t = ((i / p.n) + p.ph) % 1, f = t * (p.pts.length - 1), k = Math.min(p.pts.length - 2, Math.floor(f)), a = p.pts[k], b = p.pts[k + 1], u = f - k;
          const m = p.ms[i];
          m.position.set(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
          if (p.style === 'dashes' || p.style === 'arrows') { tmp.set(b.x, b.y, b.z); m.lookAt(tmp); }
          if (p.style === 'glow') m.scale.setScalar(m.scale.x * 0 + (m.userData.s || (m.userData.s = m.scale.x)) * (0.75 + 0.25 * Math.sin((t + p.ph) * 18)));
        }
      });
      return any;
    }
    return { group: g, anim, hot: new Set(parts.map(p => p.id).filter(Boolean)) };
  }
  return { readCfg, plan3, build, pwrOf, STYLES };
})();
