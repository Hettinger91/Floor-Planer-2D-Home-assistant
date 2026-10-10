'use strict';
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
    b.add(new T.ConeGeometry(r * 1.12, h * 0.24, 8), mat('#8a4b3a', 0.85), 0, h * 0.78 + 8 + h * 0.12, 0);
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
