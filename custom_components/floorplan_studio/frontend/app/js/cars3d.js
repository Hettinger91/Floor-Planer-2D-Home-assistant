'use strict';
// ---------- Fahrzeuge: E-Autos (Tesla, BMW, VW …) + Standard-Autos, prozedural gebaut ----------
// Jede Karosserie entsteht aus einem Seitenprofil (Unterbau + Glaskabine + Dachkappe). Entität am Auto:
// aktiv (z. B. „lädt“) = grüner Ladeleuchtstreifen; Tracker (device_tracker/person) „nicht zuhause“ = Auto verschwindet (Option).
const FPCARS = (() => {
  // Profile: Karosserie-Unterbau und Kabine als Punktlisten [u (hinten 0 → vorn 1), v (Höhe 0..1), Rundung]
  const ARCH = {
    fb: { // Fließheck / Coupé-Limousine
      body: [[0.03, .14, .02], [0, .30, .05], [0, .60, .05], [0.12, .62, .03], [0.78, .60, .02], [0.97, .50, .05], [1, .38, .04], [0.97, .14, .02]],
      cab: [[0.17, .59, .01], [0.30, .86, .12], [0.42, 1, .12], [0.58, 1, .12], [0.71, .83, .08], [0.80, .59, .01]], belt: .6, wr: 33, mir: 0.76,
    },
    suv: {
      body: [[0.03, .14, .02], [0, .30, .05], [0, .64, .05], [0.08, .66, .03], [0.80, .62, .02], [0.97, .53, .05], [1, .40, .04], [0.97, .14, .02]],
      cab: [[0.08, .62, .01], [0.10, .90, .08], [0.20, 1, .1], [0.60, 1, .1], [0.73, .85, .08], [0.82, .62, .01]], belt: .63, wr: 36, mir: 0.78,
    },
    wagon: {
      body: [[0.03, .14, .02], [0, .30, .05], [0, .62, .05], [0.08, .64, .03], [0.80, .60, .02], [0.97, .50, .05], [1, .38, .04], [0.97, .14, .02]],
      cab: [[0.08, .6, .01], [0.10, .92, .06], [0.20, 1, .1], [0.58, 1, .1], [0.72, .83, .08], [0.81, .6, .01]], belt: .61, wr: 34, mir: 0.77,
    },
    hatch: {
      body: [[0.04, .14, .02], [0, .32, .05], [0, .64, .05], [0.10, .66, .03], [0.78, .62, .02], [0.96, .52, .05], [1, .40, .04], [0.96, .14, .02]],
      cab: [[0.10, .63, .01], [0.13, .90, .1], [0.26, 1, .12], [0.58, 1, .12], [0.70, .84, .08], [0.78, .63, .01]], belt: .64, wr: 31, mir: 0.76,
    },
    van: {
      body: [[0.03, .14, .02], [0, .30, .04], [0, .54, .04], [0.9, .54, .02], [0.98, .48, .06], [1, .36, .04], [0.97, .14, .02]],
      cab: [[0.02, .52, .01], [0.03, .98, .05], [0.12, 1, .08], [0.70, 1, .08], [0.88, .70, .08], [0.93, .52, .01]], belt: .54, wr: 36, mir: 0.90, wide: true,
    },
    pickup: {
      body: [[0.03, .14, .02], [0, .30, .04], [0, .64, .02], [0.36, .64, .01], [0.84, .62, .02], [0.97, .54, .05], [1, .42, .04], [0.97, .14, .02]],
      cab: [[0.36, .62, .01], [0.38, .92, .06], [0.47, 1, .08], [0.66, 1, .08], [0.77, .86, .06], [0.84, .62, .01]], belt: .63, wr: 40, mir: 0.80, bed: true,
    },
    wedge: { // kantig (Cybertruck)
      body: [[0.02, .17, 0], [0, .30, 0], [0, .64, 0], [0.14, .66, 0], [0.5, 1, 0], [0.97, .52, 0], [1, .40, 0], [0.98, .17, 0]],
      cab: [[0.44, .70, 0], [0.51, .985, 0], [0.9, .58, 0], [0.44, .58, 0]], belt: .6, wr: 40, mir: 0.62, sharp: true,
    },
  };
  // id: [Name, Breite, Länge, Höhe, Profil, Standardfarbe, Optionen]
  const CARS = {
    tesla_m3: ['Tesla Model 3', 185, 472, 144, 'fb', '#d5d9dd', { gl: 1, tail: 'bar', grille: 'none' }],
    tesla_my: ['Tesla Model Y', 192, 475, 162, 'suv', '#2c3e57', { gl: 1, tail: 'bar', grille: 'none' }],
    tesla_ms: ['Tesla Model S', 196, 514, 143, 'fb', '#a4202b', { gl: 1, tail: 'bar', grille: 'none' }],
    tesla_cyber: ['Tesla Cybertruck', 203, 567, 190, 'wedge', '#aab0b6', { tail: 'bar', grille: 'none', metal: 1 }],
    bmw_i4: ['BMW i4', 185, 479, 145, 'fb', '#1f4b8e', { tail: 'sides', grille: 'kidney' }],
    bmw_ix: ['BMW iX', 192, 495, 169, 'suv', '#e5e7e9', { tail: 'sides', grille: 'kidney' }],
    bmw_i3: ['BMW i3', 177, 400, 158, 'hatch', '#e9ebed', { tail: 'sides', grille: 'kidney' }],
    audi_etrongt: ['Audi e-tron GT', 196, 500, 141, 'fb', '#6f7479', { tail: 'bar', grille: 'wide' }],
    audi_q4: ['Audi Q4 e-tron', 188, 459, 163, 'suv', '#0d2d4f', { tail: 'sides', grille: 'wide' }],
    merc_eqs: ['Mercedes EQS', 192, 522, 151, 'fb', '#2a2d31', { tail: 'bar', grille: 'wide', gl: 1 }],
    merc_eqb: ['Mercedes EQB', 183, 468, 166, 'suv', '#9da4ab', { tail: 'bar', grille: 'wide' }],
    vw_id3: ['VW ID.3', 186, 426, 156, 'hatch', '#c8d3d9', { tail: 'sides', grille: 'none' }],
    vw_id4: ['VW ID.4', 185, 458, 163, 'suv', '#4f6d7a', { tail: 'sides', grille: 'none' }],
    vw_buzz: ['VW ID. Buzz', 198, 471, 194, 'van', '#d9b13a', { tail: 'sides', grille: 'none', two: '#f1f1ee' }],
    porsche_taycan: ['Porsche Taycan', 198, 496, 138, 'fb', '#b01c24', { tail: 'bar', grille: 'lowintake' }],
    hyundai_ioniq5: ['Hyundai Ioniq 5', 189, 463, 160, 'suv', '#9ba3a8', { tail: 'bar', grille: 'none' }],
    kia_ev6: ['Kia EV6', 188, 468, 155, 'suv', '#2d3338', { tail: 'bar', grille: 'lowintake' }],
    polestar_2: ['Polestar 2', 186, 460, 148, 'fb', '#c7c9c8', { tail: 'bar', grille: 'none' }],
    renault_zoe: ['Renault Zoe', 173, 409, 156, 'hatch', '#c43b2e', { tail: 'sides', grille: 'none' }],
    fiat_500e: ['Fiat 500e', 168, 363, 153, 'hatch', '#8ec3b9', { tail: 'sides', grille: 'none', round: 1 }],
    mini_se: ['Mini Cooper SE', 173, 385, 146, 'hatch', '#e8b21c', { tail: 'sides', grille: 'wide', two: '#202328', round: 1 }],
    smart_1: ['smart #1', 182, 427, 163, 'suv', '#5a6f86', { tail: 'bar', grille: 'none' }],
    ford_mache: ['Ford Mustang Mach-E', 188, 471, 162, 'suv', '#e0e3e5', { tail: 'bar', grille: 'none' }],
    ford_f150e: ['Ford F-150 Lightning', 203, 595, 200, 'pickup', '#17325c', { tail: 'sides', grille: 'wide' }],
    car_small: ['Auto Kleinwagen', 168, 385, 150, 'hatch', '#b44a3a', { tail: 'sides', grille: 'wide' }],
    car_suv: ['Auto SUV', 190, 470, 170, 'suv', '#3b4048', { tail: 'sides', grille: 'wide' }],
    car_wagon: ['Auto Kombi', 182, 490, 150, 'wagon', '#7d8791', { tail: 'sides', grille: 'wide' }],
    car_van: ['Transporter', 205, 560, 200, 'van', '#e6e8ea', { tail: 'sides', grille: 'wide' }],
  };
  const H3 = {}; Object.keys(CARS).forEach(k => { H3[k] = [CARS[k][3], 0]; });

  function roundedShape(T, pts, sx, sy) {
    const n = pts.length, sh = new T.Shape(), seg = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i], p0 = pts[(i + n - 1) % n], p2 = pts[(i + 1) % n];
      const v = [p[0] * sx, p[1] * sy], a0 = [p0[0] * sx, p0[1] * sy], b0 = [p2[0] * sx, p2[1] * sy], r = (p[2] || 0) * Math.min(sx, sy) * 2.2;
      const l1 = Math.hypot(a0[0] - v[0], a0[1] - v[1]) || 1, l2 = Math.hypot(b0[0] - v[0], b0[1] - v[1]) || 1;
      const t1 = Math.min(0.5, r / l1), t2 = Math.min(0.5, r / l2);
      seg.push({ v, a: [v[0] + (a0[0] - v[0]) * t1, v[1] + (a0[1] - v[1]) * t1], b: [v[0] + (b0[0] - v[0]) * t2, v[1] + (b0[1] - v[1]) * t2], r });
    }
    sh.moveTo(seg[0].b[0], seg[0].b[1]);
    for (let i = 1; i < n; i++) { sh.lineTo(seg[i].a[0], seg[i].a[1]); if (seg[i].r > 0) sh.quadraticCurveTo(seg[i].v[0], seg[i].v[1], seg[i].b[0], seg[i].b[1]); else sh.lineTo(seg[i].b[0], seg[i].b[1]); }
    sh.lineTo(seg[0].a[0], seg[0].a[1]); if (seg[0].r > 0) sh.quadraticCurveTo(seg[0].v[0], seg[0].v[1], seg[0].b[0], seg[0].b[1]);
    sh.closePath(); return sh;
  }
  // Polygon unterhalb einer Höhe v abschneiden (für die Dachkappe: nur den Teil oberhalb behalten)
  function clipAbove(pts, vt) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], ina = a[1] >= vt, inb = b[1] >= vt;
      if (ina) out.push(a);
      if (ina !== inb) { const t = (vt - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, vt, 0]); }
    }
    return out;
  }
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // Glatte Normalen mit Kantenwinkel (harte Kanten bleiben hart)
  function smoothNormals(geo, deg) {
    const pa = geo.attributes.position, n = pa.count / 3, cosT = Math.cos((deg || 38) * Math.PI / 180), fn = new Float32Array(n * 3), map = new Map();
    const key = i => Math.round(pa.getX(i) * 20) + ',' + Math.round(pa.getY(i) * 20) + ',' + Math.round(pa.getZ(i) * 20);
    for (let t = 0; t < n; t++) {
      const i = t * 3, ax = pa.getX(i), ay = pa.getY(i), az = pa.getZ(i);
      const ux = pa.getX(i + 1) - ax, uy = pa.getY(i + 1) - ay, uz = pa.getZ(i + 1) - az, vx = pa.getX(i + 2) - ax, vy = pa.getY(i + 2) - ay, vz = pa.getZ(i + 2) - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
      fn[t * 3] = nx / l; fn[t * 3 + 1] = ny / l; fn[t * 3 + 2] = nz / l;
      for (let k = 0; k < 3; k++) { const kk = key(i + k); let a = map.get(kk); if (!a) map.set(kk, a = []); a.push(t); }
    }
    const out = new Float32Array(pa.count * 3);
    for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
      const a = map.get(key(t * 3 + k)); let sx = 0, sy = 0, sz = 0;
      const bx = fn[t * 3], by = fn[t * 3 + 1], bz = fn[t * 3 + 2];
      for (let q = 0; q < a.length; q++) { const o = a[q], dx = fn[o * 3], dy = fn[o * 3 + 1], dz = fn[o * 3 + 2]; if (bx * dx + by * dy + bz * dz > cosT) { sx += dx; sy += dy; sz += dz; } }
      const l = Math.hypot(sx, sy, sz) || 1; const o2 = (t * 3 + k) * 3; out[o2] = sx / l; out[o2 + 1] = sy / l; out[o2 + 2] = sz / l;
    }
    geo.setAttribute('normal', new (geo.attributes.position.constructor)(out, 3)); return geo;
  }
  function deform(geo, f) {
    const p = geo.attributes.position, o = [0, 0, 0];
    for (let i = 0; i < p.count; i++) { o[0] = p.getX(i); o[1] = p.getY(i); o[2] = p.getZ(i); f(o); p.setXYZ(i, o[0], o[1], o[2]); }
    p.needsUpdate = true; return geo;
  }
  function extrude(T, pts, d, h, width, bev, steps) {
    const sh = roundedShape(T, pts, d, h), depth = Math.max(1, width - 2 * bev);
    const geo = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 3, curveSegments: 8, steps: steps || 1 });
    geo.translate(0, 0, -depth / 2); geo.rotateY(-Math.PI / 2); geo.translate(0, 0, -d / 2);
    return geo;
  }
  const plateTex = (T, txt, eu) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 54; const g = c.getContext('2d');
    g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, 256, 54); g.fillStyle = '#1c4ea3'; if (eu) g.fillRect(0, 0, 22, 54);
    g.fillStyle = '#111'; g.font = 'bold 34px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 140, 29);
    g.strokeStyle = '#111'; g.lineWidth = 3; g.strokeRect(2, 2, 252, 50);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  };

  function buildCar(b, id) {
    if (typeof FPM === 'undefined') return;
    const lite = !FPM.real; // ohne Realistisch-Modus: vereinfachtes 3D-Modell
    const T = b.T, spec = CARS[id]; if (!spec) return;
    const [, , , , archId, defCol, o] = spec, A = ARCH[archId];
    const { w: W, d, h } = b;
    const PM = lite
      ? (c, p) => new T.MeshStandardMaterial({ color: c, roughness: p.roughness == null ? 0.5 : Math.max(0.35, p.roughness), metalness: Math.min(0.12, p.metalness || 0), transparent: !!p.transparent, opacity: p.opacity == null ? 1 : p.opacity, depthWrite: p.depthWrite !== false, emissive: p.emissive != null ? p.emissive : 0x000000, emissiveIntensity: p.emissiveIntensity || 0 })
      : (c, p) => { const m = new T.MeshPhysicalMaterial(Object.assign({ color: c }, p)); m.userData.carMat = p.envMapIntensity || 1; return m; };
    const colHex = b.col || defCol, metal = !!o.metal;
    const paint = PM(colHex, metal ? { metalness: 0.95, roughness: 0.32, clearcoat: 0.3, clearcoatRoughness: 0.2, envMapIntensity: 0.9 } : { metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.85 });
    const two = o.two ? PM(o.two, { metalness: 0.4, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 }) : paint;
    const glass = PM(lite ? '#34475a' : '#05080c', { metalness: 0.1, roughness: 0.03, transparent: true, opacity: 0.9, clearcoat: 0.6, clearcoatRoughness: 0, envMapIntensity: 1.1, depthWrite: false });
    const black = PM('#141517', { metalness: 0.2, roughness: 0.55, envMapIntensity: 0.6 }), trim = PM('#0e0f11', { metalness: 0.6, roughness: 0.35, envMapIntensity: 1 });
    const chrome = PM('#e3e7ea', { metalness: 1, roughness: 0.08, envMapIntensity: 1.3 });
    const cloth = PM('#2a2d33', { metalness: 0, roughness: 0.9, envMapIntensity: 0.3 }), leather = PM('#1b1c1f', { metalness: 0, roughness: 0.6, envMapIntensity: 0.4 });
    const bev = A.sharp ? 0 : Math.max(1.4, W * 0.014), halfW = W * 0.985 / 2;
    const belt = A.belt * h, top = A.cab.reduce((m, p) => Math.max(m, p[1]), 0), cabTop = top * h;
    const cabW = A.sharp ? W * 1.002 : (A.wide ? W * 0.93 : W * 0.88);
    // --- Karosserie (Verjüngung zur Front/Heck, Schulter) ---
    const bodyDef = p => {
      const zf = Math.abs(p[2]) / (d / 2), u = Math.min(1, Math.abs(p[0]) / halfW), ends = sstep(0.62, 1, zf);
      p[0] *= (1 - 0.035 * sstep(0.1 * h, belt, p[1])) * (1 - 0.13 * ends * ends);
      p[2] -= Math.sign(p[2]) * d * 0.05 * Math.pow(u, 2.2) * ends;
    };
    if (A.sharp) b.add(extrude(T, A.body, d, h, W * 0.985, 0, 1), paint, 0, 0, 0);
    else b.add(smoothNormals(deform(extrude(T, A.body, d, h, W * 0.985, bev, 14), bodyDef), 42), paint, 0, 0, 0);
    // --- Kabine (Glas) mit Einzug nach oben ---
    const cabDef = p => { p[0] *= 1 - 0.17 * sstep(belt, cabTop, p[1]); const zf = Math.abs(p[2]) / (d / 2); p[0] *= 1 - 0.1 * sstep(0.5, 0.9, zf); };
    if (A.sharp) b.add(extrude(T, A.cab, d, h, cabW, 0, 1), glass, 0, 0, 0);
    else b.add(smoothNormals(deform(extrude(T, A.cab, d, h, cabW, 1, 8), cabDef), 40), glass, 0, 0, 0);
    // Dachkappe / Glasdach
    if (!A.sharp) {
      const cap = clipAbove(A.cab, top - (o.gl ? 0.012 : 0.058));
      if (cap.length >= 3) b.add(smoothNormals(deform(extrude(T, cap, d, h, cabW * 1.012, o.gl ? 0.4 : 1.3, 4), cabDef), 40), o.gl ? PM('#080b0f', { metalness: 0.1, roughness: 0.02, clearcoat: 1, envMapIntensity: 1.2 }) : two, 0, 0, 0);
    } else {
      const cap = clipAbove(A.cab, top - 0.03); if (cap.length >= 3) b.add(extrude(T, cap, d, h, cabW * 1.004, 0, 1), paint, 0, 0, 0);
    }
    if (lite) { // vereinfachtes Modell: Karosserie, Kabine, Räder, Lichter
      const R0 = A.wr * (h > 190 ? 1.05 : 1), tw0 = 20, zL = u => (u - 0.5) * d;
      const tireM = new T.MeshStandardMaterial({ color: 0x15171a, roughness: 0.9 }), rimL = new T.MeshStandardMaterial({ color: 0xb8bec4, roughness: 0.45, metalness: 0.25 });
      [0.19, 0.80].forEach(u => [-1, 1].forEach(s => { const x = s * (halfW - 11), z = zL(u); b.add(new T.CylinderGeometry(R0, R0, tw0, 20), tireM, x, R0, z, false).rotation.z = Math.PI / 2; b.add(new T.CylinderGeometry(R0 * 0.6, R0 * 0.6, tw0 + 1, 16), rimL, x, R0, z, false).rotation.z = Math.PI / 2; }));
      b.box(W * 0.9, h * 0.1, d * 0.93, 0, h * 0.05, 0, black);
      const nose0 = A.body[A.body.length - 2][1] * h, tail0 = A.body[2][1] * h, lensL = PM('#f4f8fb', { roughness: 0.3, emissive: 0xdff0ff, emissiveIntensity: 0.5 }), tailM = PM('#a01018', { roughness: 0.4, emissive: 0xff1818, emissiveIntensity: 0.45 });
      [-1, 1].forEach(s => { b.rb(W * 0.2, h * 0.04, 3, 1, s * W * 0.34, nose0 - h * 0.03, d / 2 - 2.5, lensL); b.rb(W * 0.17, h * 0.035, 1.6, 0.8, s * W * 0.35, tail0 - h * 0.085, -d / 2 + d * 0.05 * Math.pow(Math.min(1, W * 0.35 / halfW), 2.2) + 0.3, tailM); });
      const glow0 = b.lv('#20262b', '#38e08c', 2.2);
      b.add(new T.BoxGeometry(W * 0.8, 1.2, d * 0.62), glow0, 0, 2.2, 0, false);
      b.carBody = paint; b.g.userData.car = true;
      return;
    }
    // --- Innenraum (durch das Glas sichtbar) ---
    const cu = A.cab.map(p => p[0]), s0 = Math.min(...cu) + 0.03, s1 = Math.max(...cu) - 0.03, zAt = u => (u - 0.5) * d, sy = belt * 0.58;
    [0.66, 0.3].forEach((k, row) => { const z = zAt(s0 + (s1 - s0) * k); [-1, 1].forEach(s => { if (A.van && row === 1 && false) return;
      b.rb(W * 0.2, 9, d * 0.1, 3, s * W * 0.2, sy, z, cloth); const bk = b.rb(W * 0.2, h * 0.2, 8, 3, s * W * 0.2, sy + 6, z - d * 0.04, cloth); bk.rotation.x = -0.18; b.rb(W * 0.12, 9, 8, 3, s * W * 0.2, sy + h * 0.2, z - d * 0.05, cloth); }); });
    b.rb(W * 0.8, h * 0.11, d * 0.07, 4, 0, belt - h * 0.1, zAt(s1 - 0.01), leather);
    b.rb(W * 0.1, h * 0.12, d * 0.2, 3, 0, belt - h * 0.18, zAt(s0 + (s1 - s0) * 0.62), leather);
    const sw = b.add(new T.TorusGeometry(h * 0.11, 1.4, 8, 20), leather, W * 0.17, belt + h * 0.0, zAt(s1 - (s1 - s0) * 0.2), false); sw.rotation.x = -1.1;
    b.rb(W * 0.34, h * 0.06, 2.5, 1, 0, belt - h * 0.01, zAt(s1 - 0.02), PM('#0a1a2c', { emissive: 0x143a66, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.2 }));
    // --- Rahmen: Säulen, Fensterleisten, Griffe, Spiegel ---
    [-1, 1].forEach(s => {
      const xs = s * (cabW / 2 + 0.3), zB = zAt(A.cab[2][0] > 0.35 ? 0.45 : 0.4);
      b.box(0.9, cabTop - belt - 3, 4.5, xs * 0.97, belt + 1, zB, A.wide ? paint : trim);
      b.box(0.8, 1.6, d * 0.52, s * (halfW * 0.985), belt - 1.2, zAt(0.46), chrome);
      [0.42, 0.62].forEach(u => { b.box(0.5, h * 0.4, 0.5, s * (halfW * 0.985 + 0.2), h * 0.18, zAt(u - 0.12), black); b.rb(1.2, 2.2, 15, 1, s * (halfW * 0.985 + 0.5), belt - h * 0.07, zAt(u - 0.04), chrome); });
      const mz = zAt(A.mir); b.rb(6.5, 7, 13, 2.5, s * (cabW / 2 + 5.5), belt + 3, mz, two === paint ? paint : two); b.rb(0.8, 5, 10, 1, s * (cabW / 2 + 5.5), belt + 3, mz - 1, PM('#aeb8c0', { metalness: 1, roughness: 0.05, envMapIntensity: 2 }));
      if (A.bed !== true && !A.sharp && archId !== 'van' && archId !== 'fb') { b.box(2, 1.4, d * 0.5, s * cabW * 0.4, cabTop + 0.4, zAt((s0 + s1) / 2), trim); } // Dachreling
    });
    // --- Unterboden, Schweller, Stoßfängerunterteile ---
    b.box(W * 0.9, h * 0.1, d * 0.93, 0, h * 0.05, 0, black);
    [-1, 1].forEach(s => b.rb(3, h * 0.05, d * 0.5, 1.2, s * (halfW * 0.96), h * 0.13, 0, black));
    b.rb(W * 0.78, h * 0.07, 6, 2, 0, h * 0.11, d / 2 - 3, black); b.rb(W * 0.7, h * 0.07, 6, 2, 0, h * 0.11, -d / 2 + 3, black);
    // --- Räder ---
    const R = A.wr * (h > 190 ? 1.05 : 1), tw = 22, rimR = R * 0.68;
    const tprof = []; [[rimR * 0.97, -0.86], [R * 0.9, -1], [R * 0.985, -0.82], [R, -0.4], [R, 0.4], [R * 0.985, 0.82], [R * 0.9, 1], [rimR * 0.97, 0.86]].forEach(([r, k]) => tprof.push(new T.Vector2(r, k * tw / 2)));
    const tireG = new T.LatheGeometry(tprof, 36), tire = PM('#111214', { metalness: 0, roughness: 0.85, envMapIntensity: 0.3 });
    const rimM = PM('#c6cbd0', { metalness: 0.85, roughness: 0.3, envMapIntensity: 1.0 }), rimD = PM('#2b2f34', { metalness: 0.8, roughness: 0.35, envMapIntensity: 1 }), disc = PM('#6c7076', { metalness: 1, roughness: 0.45, envMapIntensity: 1.2 }), calip = PM(o.round ? '#222' : '#c1272d', { metalness: 0.3, roughness: 0.4 });
    [0.19, 0.80].forEach(u => [-1, 1].forEach(s => {
      const z = zAt(u), x = s * (halfW - 11);
      const arch = b.add(new T.CylinderGeometry(R * 1.1, R * 1.1, 0.8, 28), black, s * (halfW * 0.985 + 0.1), R, z, false); arch.rotation.z = Math.PI / 2;
      b.add(new T.CylinderGeometry(R * 1.07, R * 1.07, 12, 28), black, s * (halfW - 8), R, z, false).rotation.z = Math.PI / 2;
      const t = b.add(tireG, tire, x, R, z); t.rotation.z = Math.PI / 2;
      const lip = b.add(new T.CylinderGeometry(rimR, rimR, tw * 0.94, 32), rimM, x, R, z, false); lip.rotation.z = Math.PI / 2;
      const face = b.add(new T.CylinderGeometry(rimR * 0.92, rimR * 0.92, 1, 32), rimD, x + s * (tw / 2 - 1.5), R, z, false); face.rotation.z = Math.PI / 2;
      for (let i = 0; i < 10; i++) { const a = i * Math.PI * 2 / 10 + (s > 0 ? 0.15 : 0), sp = b.add(new T.BoxGeometry(1.4, rimR * 0.78, 2.4 + (i % 2) * 0.8), rimM, x + s * (tw / 2 - 0.6), R + Math.cos(a) * rimR * 0.46, z + Math.sin(a) * rimR * 0.46, false); sp.rotation.x = a; }
      b.add(new T.CylinderGeometry(rimR * 0.16, rimR * 0.16, 1.6, 16), chrome, x + s * (tw / 2 - 0.2), R, z, false).rotation.z = Math.PI / 2;
      b.add(new T.CylinderGeometry(rimR * 0.78, rimR * 0.78, 2.4, 32), disc, x - s * 4, R, z, false).rotation.z = Math.PI / 2;
      b.add(new T.BoxGeometry(3.4, rimR * 0.34, rimR * 0.6), calip, x - s * 1.2, R + rimR * 0.6, z + (u < 0.5 ? -1 : 1) * rimR * 0.05, false);
    }));
    // --- Licht ---
    const nose = A.body[A.body.length - 2], noseV = nose[1] * h, tailV = A.body[2][1] * h, rearZ = x => -d / 2 + d * 0.05 * Math.pow(Math.min(1, Math.abs(x) / halfW), 2.2) + 0.3;
    const lens = PM('#e9f2f9', { metalness: 0, roughness: 0.05, emissive: 0xdff0ff, emissiveIntensity: 0.55, transparent: true, opacity: 0.95, clearcoat: 1, envMapIntensity: 2 });
    const tailL = PM('#9a0f17', { metalness: 0, roughness: 0.12, emissive: 0xff1818, emissiveIntensity: 0.45, clearcoat: 1, envMapIntensity: 1.2 });
    [-1, 1].forEach(s => {
      const hx = s * W * (o.round ? 0.3 : 0.34), hw2 = W * (o.round ? 0.15 : 0.2), hy = noseV + h * 0.005, hz = d / 2 - 2.5;
      b.rb(hw2 + 2, h * 0.055, 4, 1.5, hx, hy - h * 0.02, hz + 0.3, black);
      b.rb(hw2, h * 0.04, 3, 1.2, hx, hy - h * 0.012, hz + 1.2, lens);
      b.rb(hw2 * 0.9, 1, 2.2, 0.4, hx, hy + h * 0.03, hz + 1.1, chrome);
      b.rb(W * 0.1, h * 0.03, 3, 1, s * W * 0.34, h * 0.2, hz, lens); // Nebel / Lufteinlass
      if (o.tail === 'sides' || !o.tail) b.rb(W * 0.17, h * 0.035, 1.8, 0.8, s * W * 0.35, tailV - h * 0.085, rearZ(s * W * 0.35), tailL);
    });
    if (o.tail === 'bar') { for (let k = -2; k <= 2; k++) b.rb(W * 0.18, h * 0.026, 1.8, 0.7, k * W * 0.17, tailV - h * 0.06, rearZ(k * W * 0.17), tailL); [-1, 1].forEach(s => b.rb(W * 0.07, h * 0.045, 1.8, 0.8, s * W * 0.4, tailV - h * 0.065, rearZ(s * W * 0.4), tailL)); }
    if (o.grille === 'kidney') [-1, 1].forEach(s => { b.rb(W * 0.15, h * 0.1, 3.5, 1.5, s * W * 0.095, noseV - h * 0.12, d / 2 - 0.2, chrome); b.rb(W * 0.13, h * 0.082, 4, 1.2, s * W * 0.095, noseV - h * 0.115, d / 2 - 0.1, trim); });
    else if (o.grille === 'wide') { b.rb(W * 0.5, h * 0.085, 3.5, 1.5, 0, noseV - h * 0.1, d / 2 - 0.2, chrome); b.rb(W * 0.47, h * 0.07, 4, 1.2, 0, noseV - h * 0.095, d / 2 - 0.1, trim); }
    else if (o.grille === 'lowintake') b.rb(W * 0.5, h * 0.05, 3.5, 1.5, 0, h * 0.2, d / 2 - 0.3, trim);
    else b.rb(W * 0.3, h * 0.025, 3, 1, 0, h * 0.22, d / 2 - 0.3, trim);
    // --- Kennzeichen (Elektro-E) ---
    const plF = new T.MeshStandardMaterial({ map: plateTex(T, 'E·AB 123E', true), roughness: 0.35 }), plR = new T.MeshStandardMaterial({ map: plateTex(T, 'E·XY 456E', true), roughness: 0.35 });
    b.add(new T.PlaneGeometry(52, 11), plF, 0, h * 0.2, d / 2 + 0.9, false);
    const pr = b.add(new T.PlaneGeometry(52, 11), plR, 0, h * 0.27, -d / 2 - 0.9, false); pr.rotation.y = Math.PI;
    // Scheibenwischer, Haifischflosse, Ladeklappe
    [-1, 1].forEach(s => b.box(d * 0.12, 0.8, 0.8, 0, 0, 0, trim).position.set(s * W * 0.13, belt + 0.8, zAt(A.cab[A.cab.length - 1][0] - 0.07)));
    // --- Pickup-Ladefläche ---
    if (A.bed) {
      [-1, 1].forEach(s => b.rb(3.5, h * 0.14, d * 0.36, 1.2, s * (W / 2 - 3), A.belt * h, -d * 0.33, paint));
      b.rb(W * 0.96, h * 0.14, 3.5, 1.2, 0, A.belt * h, -d / 2 + 2, paint);
      b.add(new T.BoxGeometry(W * 0.9, 1, d * 0.34), PM('#1d1f22', { roughness: 0.9, metalness: 0.1 }), 0, A.belt * h + 0.5, -d * 0.33, false);
    }
    // --- Ladeanzeige (Entität aktiv) ---
    const glow = b.lv('#20262b', '#38e08c', 2.2);
    b.add(new T.BoxGeometry(W * 0.8, 1.2, d * 0.62), glow, 0, 2.2, 0, false);
    [-1, 1].forEach(s => b.add(new T.BoxGeometry(1.2, 2.2, d * 0.5), glow, s * (halfW + 0.6), h * 0.17, -d * 0.05, false));
    b.carBody = paint; b.g.userData.car = true;
    b.g.traverse(n => { if (n.isMesh && n.material && n.material.userData && n.material.userData.carMat != null) { n.userData.carMat = true; } });
  }

  // Draufsicht für den 2D-Plan (Front = unten; Maße w = Breite, h = Länge)
  function sym2d(w, h) {
    const cw = w * 0.78, y0 = -h * 0.26, y1 = h * 0.2, wx = w / 2;
    return `<path d="M${-cw / 2 + 2} ${y0}H${cw / 2 - 2}L${cw / 2} ${y1}H${-cw / 2}Z" stroke-opacity=".9"/>` +
      `<path d="M${-cw / 2 + 3} ${y1 + 2}L${-cw / 2 + 6} ${y1 + h * 0.1}H${cw / 2 - 6}L${cw / 2 - 3} ${y1 + 2}" />` +
      `<path d="M${-cw / 2 + 4} ${y0 - 2}L${-cw / 2 + 7} ${y0 - h * 0.07}H${cw / 2 - 7}L${cw / 2 - 4} ${y0 - 2}" />` +
      [-1, 1].map(s => [-0.31, 0.30].map(u => `<rect x="${s * wx - (s > 0 ? 7 : -1)}" y="${u * h - 15}" width="6" height="30" rx="2"/>`).join('') + `<path d="M${s * (wx - 4)} ${h * 0.31}l${s * -6} ${h * 0.045}" />`).join('') +
      [-1, 1].map(s => `<path d="M${s * (w * 0.34)} ${h / 2 - 6}h${-s * w * 0.18}"/><path d="M${s * (w * 0.34)} ${-h / 2 + 6}h${-s * w * 0.18}"/>`).join('');
  }

  function register() {
    if (typeof FPM === 'undefined' || !FPM.reg) return;
    Object.keys(CARS).forEach(id => FPM.reg(id, b => buildCar(b, id)));
    if (typeof LIB !== 'undefined' && !LIB.some(t => t.id === 'tesla_m3')) {
      Object.keys(CARS).forEach(id => { const c = CARS[id]; LIB.push(T('Fahrzeuge', id, c[0], /^car_/.test(id) ? '🚗' : '🔋', c[1], c[2], c[5])); });
    }
    if (typeof SYM !== 'undefined') SYM.car = sym2d;
    if (typeof SYMMAP !== 'undefined') Object.keys(CARS).forEach(id => { SYMMAP[id] = 'car'; });
  }
  register();
  return { CARS, H3, register, isCar: id => !!CARS[id] };
})();
