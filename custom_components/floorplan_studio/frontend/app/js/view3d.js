'use strict';
// ---------- 3D-Ansicht (three.js wird bei Bedarf nachgeladen; geteilt von Editor und Karte) ----------
// Einheiten: 1 Einheit = 1 cm. Plan-X → X, Plan-Y → Z, Höhe → Y.
const FP3D = (() => {
  let loading = null;
  function load(base) {
    if (window.THREE_LITE) return Promise.resolve(window.THREE_LITE);
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = base + 'three-lite.js';
      s.onload = () => (window.THREE_LITE ? res(window.THREE_LITE) : rej(new Error('three.js fehlt')));
      s.onerror = () => { loading = null; rej(new Error('3D-Bibliothek konnte nicht geladen werden')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  // [Höhe, Höhe über Boden]; Höhe über Boden -1 = an der Decke
  const H3 = {
    bed_double: [55, 0], bed_single: [55, 0], bed_kid: [45, 0], bed_bunk: [160, 0], crib: [80, 0], daybed: [50, 0],
    sofa: [85, 0], sofa_corner: [85, 0], sofa_2: [85, 0], armchair: [85, 0], recliner: [95, 0], ottoman: [40, 0], stool: [45, 0], bench: [45, 0], bar_stool: [75, 0], highchair: [80, 0],
    table_coffee: [42, 0], table_dining: [75, 0], table_side: [50, 0], table_round: [75, 0], table_bar: [105, 0], chair: [45, 0], office_chair: [50, 0], desk: [75, 0], desk_corner: [75, 0],
    wardrobe: [210, 0], wardrobe_sliding: [230, 0], shelf: [180, 0], bookcase: [190, 0], dresser: [85, 0], tv_board: [50, 0], sideboard: [80, 0], wall_unit: [210, 0], nightstand: [50, 0],
    vanity: [75, 0], coat_rack: [190, 0], shoe_rack: [110, 0], cabinet: [120, 0], mirror: [160, 30], piano: [120, 0], changing: [95, 0], tv_stand: [60, 0],
    fridge: [180, 0], freezer: [180, 0], fridge_side: [180, 0], stove: [90, 0], oven: [90, 0], sink_kitchen: [90, 0], dishwasher: [85, 0], dishwasher_tall: [85, 0], washer: [85, 0], dryer: [85, 0],
    microwave: [30, 90], hood: [40, 150], coffee: [35, 90], kettle: [25, 90], counter: [90, 0], cabinet_base: [90, 0], cabinet_wall: [70, 140], kitchen_island: [92, 0], pantry: [210, 0], trash: [60, 0],
    bathtub: [55, 0], shower: [6, 0], shower_tray: [6, 0], shower_walkin: [6, 0], toilet: [42, 0], toilet_wall: [42, 0], bidet: [40, 0], basin: [85, 0], basin_double: [85, 0], washstand: [85, 0],
    mirror_cabinet: [70, 120], towel_radiator: [120, 20], sauna: [210, 0], whirlpool: [70, 0], water_heater: [80, 120], utility_sink: [85, 0],
    radiator: [60, 10], thermostat: [12, 130], ac: [30, 200], fan: [90, 0], fireplace: [110, 0], boiler: [130, 0], fan_ceiling: [25, -1], floor_heating: [3, 0], heat_pump: [130, 0],
    air_purifier: [60, 0], humidifier: [40, 0], dehumidifier: [60, 0], ventilation: [30, 0], pellet: [110, 0], water_tank: [160, 0], heater_elec: [30, 0], heat_valve: [8, 25], heat_dist: [60, 90],
    split_ac: [30, 210], chimney_stove: [110, 0], solar_thermal: [60, 0],
    lamp_ceiling: [8, -1], lamp_floor: [160, 0], lamp_wall: [14, 180], lamp_spot: [8, -1], lamp_strip: [3, -1], lamp_pendant: [30, -2], chandelier: [40, -2], lamp_table: [32, 75], lamp_desk: [40, 75],
    lamp_night: [12, 30], lamp_mirror: [8, 190], light_panel: [4, -1], lamp_bulb: [12, 190], lamp_outdoor: [25, 200], lamp_garden: [50, 0], lamp_arc: [200, 0], light_string: [3, -1],
    outlet: [8, 30], outlet_double: [8, 30], outlet_usb: [8, 30], outlet_outdoor: [8, 40], outlet_floor: [2, 0], outlet_smart: [8, 30], outlet_cee: [8, 100], plug: [10, 30], powerstrip: [5, 5],
    switch: [8, 105], switch_double: [8, 105], dimmer: [8, 105], button: [6, 105], scene_switch: [6, 105], smart_light_sw: [8, 105], lan_socket: [8, 30], tv_socket: [8, 30],
    camera: [14, 230], camera_ptz: [18, 230], doorbell_cam: [18, 130], sensor_motion: [10, 220], smoke: [6, -1], sensor_presence: [8, -1], sensor_temp: [8, 140], sensor_hum: [8, 140],
    speaker: [30, 100], smart_speaker: [22, 90], soundbar: [8, 50], smart_tv: [65, 80], monitor: [45, 75], pc: [45, 0], nas: [30, 0], server_rack: [190, 0], printer: [30, 75], printer3d: [45, 75],
    blind: [10, 190], router: [10, 100], dongle: [10, 100], vacuum: [10, 0], lock: [10, 105], wallbox: [35, 110], meter_power: [30, 120], meter_gas: [30, 120],
    stairs: [260, 0], stairs_wide: [260, 0], stairs_L: [260, 0], stairs_U: [260, 0], stairs_spiral: [260, 0], stairs_spiral_small: [260, 0], stairs_outdoor: [100, 0], stairs_basement: [260, 0],
    plant: [90, 0], plant_big: [130, 0], plant_small: [30, 0], rug: [2, 0], rug_round: [2, 0], pillar: [250, 0], pillar_round: [250, 0], curtain: [240, 0], painting: [60, 140], playmat: [2, 0],
    car: [150, 0], carport: [2, 0], bike: [100, 0], terrace_table: [75, 0], lounger: [40, 0], grill: [95, 0], pool: [4, 0], hot_tub: [80, 0], tree: [350, 0], bush: [90, 0], hedge: [150, 0], fence: [110, 0],
    flowerbed: [20, 0], lawn: [2, 0], mailbox: [120, 0], gate: [150, 0], shed: [220, 0], trash_bin: [105, 0], rain_barrel: [90, 0], sandbox: [25, 0], trampoline: [30, 0], swing: [220, 0], terrace: [3, 0], driveway: [2, 0],
    firepit: [40, 0], parasol: [230, 0], elevator: [250, 0], chimney: [250, 0], safe: [50, 0], fire_ext: [40, 10], electric_panel: [50, 150], niche: [250, 0], cable_duct: [250, 0],
  };
  const CAT3 = { Licht: [14, -1], Möbel: [80, 0], 'Küche & Bad': [90, 0], 'Heizung & Klima': [60, 0], 'Smart Home': [10, 110], 'Büro & Medien': [75, 0], 'Außen & Garage': [90, 0], 'Kinder & Haustiere': [45, 0], 'Bau & Deko': [100, 0] };
  const FLOOR_COL = { wood: '#c9a27a', tile: '#dfe3e6', stone: '#b8b2a7', carpet: '#b9a8c9', grass: '#8fc27a', concrete: '#b7bcc2' };
  const LOOKS = {
    day: { bg: '#cfe3f4', sky: ['#7fb2e0', '#cfe3f4', '#eef3f6'], ground: '#93b07f', wall: '#f3f0ea', edge: null, amb: 0.9, hemi: 1.5, hs: '#e8f2ff', hg: '#9a8a74', sunc: '#fff1d6', sun: 3.6, pl: 520, neon: false, real: true },
    dark: { bg: '#0f1626', sky: ['#070b16', '#121b2f', '#1d2840'], ground: '#1a2433', wall: '#cfc9bd', edge: null, amb: 0.35, hemi: 0.55, hs: '#6f86b8', hg: '#1b2230', sunc: '#8fa6d8', sun: 0.8, pl: 900, neon: false, real: true },
    neon: { bg: '#070a12', ground: '#0c1019', wall: '#141a2b', edge: '#26e6ff', amb: 0.8, hemi: 0.8, hs: '#ffffff', hg: '#8899aa', sunc: '#ffffff', sun: 1.0, pl: 900, neon: true },
  };


  function dims3(it) {
    const t = typeById(it.type) || {};
    let [h, z] = H3[it.type] || CAT3[t.cat] || [60, 0];
    if (it.h3 > 0) h = Number(it.h3);
    if (it.z3 > 0) z = Number(it.z3);
    return [h, z];
  }

  function create(container, opts) {
    const T = window.THREE_LITE;
    const o = Object.assign({ look: 'auto', walls: 'full', allFloors: false, dark: () => false, wheel: 'always', shadows: true }, opts);
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none';
    container.appendChild(root);
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: false }); }
    catch (e) { root.remove(); throw new Error('WebGL ist nicht verfügbar'); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.shadowMap.enabled = !!o.shadows;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    const cv = renderer.domElement;
    cv.style.cssText = 'width:100%;height:100%;display:block;cursor:grab';
    root.appendChild(cv);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(42, 1, 5, 40000);
    const amb = new T.AmbientLight(0xffffff, 1), hemi = new T.HemisphereLight(0xffffff, 0x8899aa, 1), sun = new T.DirectionalLight(0xffffff, 1);
    sun.castShadow = !!o.shadows;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(amb, hemi, sun, sun.target);
    const world = new T.Group(); scene.add(world);

    let look = LOOKS.day, dirty = true, destroyed = false, built = '', liveSig = '', radius = 600, sizeSig = '';
    const cam = { az: 0.55, pol: 0.95, dist: 1200, tx: 0, ty: 60, tz: 0 };
    let items = [], pickables = [], fitted = false, fitKey = '';
    const texCache = new Map();

    function lookKey() { return o.look && LOOKS[o.look] ? o.look : (o.dark() ? 'dark' : 'day'); }
    function wallH() { return Math.max(180, Number(S().wallH3) || 250); }

    function colorOf(v, d) { try { return new T.Color(v || d); } catch (_) { return new T.Color(d); } }

    // ---------- Texturen ----------
    function canvasTex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
      return t;
    }
    function imgTex(src, cb) {
      const key = 'i|' + src;
      if (texCache.has(key)) { cb(texCache.get(key)); return; }
      const im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = () => {
        const t = canvasTex(256, 256, (g, w, h) => { const k = Math.min(w / im.width, h / im.height); g.drawImage(im, (w - im.width * k) / 2, (h - im.height * k) / 2, im.width * k, im.height * k); });
        texCache.set(key, t); cb(t); dirty = true;
      };
      im.onerror = () => { };
      im.src = src;
    }
    function svgTex(svg, w, h, cb) {
      const key = 's|' + svg;
      if (texCache.has(key)) { cb(texCache.get(key)); return; }
      const k = 256 / Math.max(w, h), pw = Math.max(8, Math.round(w * k)), ph = Math.max(8, Math.round(h * k));
      const im = new Image();
      im.onload = () => {
        const t = canvasTex(pw, ph, (g) => { g.drawImage(im, 0, 0, pw, ph); });
        texCache.set(key, t); cb(t); dirty = true;
      };
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2} ${-h / 2} ${w} ${h}" width="${pw}" height="${ph}">${svg}</svg>`);
    }
    function emojiTex(txt) {
      const key = 'e|' + txt;
      if (!texCache.has(key)) texCache.set(key, canvasTex(128, 128, (g, w, h) => { g.font = '96px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 6); }));
      return texCache.get(key);
    }
    function textTex(text, opt = {}) {
      const key = 't|' + text + '|' + (opt.bg || '') + '|' + (opt.fg || '') + '|' + (opt.dark ? 1 : 0);
      let c = texCache.get(key);
      if (!c) {
        const fs = 56, pad = 22, m = document.createElement('canvas').getContext('2d');
        m.font = `600 ${fs}px system-ui, sans-serif`;
        const w = Math.ceil(m.measureText(text).width) + pad * 2, h = fs + pad;
        const t = canvasTex(w, h, (g) => {
          if (opt.bg) { g.fillStyle = opt.bg; g.beginPath(); if (g.roundRect) g.roundRect(2, 2, w - 4, h - 4, h / 2); else g.rect(2, 2, w - 4, h - 4); g.fill(); }
          g.font = `600 ${fs}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
          if (!opt.bg) { g.lineWidth = 9; g.strokeStyle = opt.dark ? 'rgba(10,14,24,.9)' : 'rgba(255,255,255,.95)'; g.lineJoin = 'round'; g.strokeText(text, w / 2, h / 2 + 2); }
          g.fillStyle = opt.fg || (opt.dark ? '#e6ebf5' : '#2b3240'); g.fillText(text, w / 2, h / 2 + 2);
        });
        c = { t, w, h }; texCache.set(key, c);
      }
      return c;
    }
    function textSprite(text, size, opt = {}) {
      const c = textTex(text, opt);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: c.t, transparent: true, depthTest: false, depthWrite: false }));
      sp.scale.set(size * c.w / c.h, size, 1);
      sp.renderOrder = 20;
      return sp;
    }
    function glowTex() {
      if (!texCache.has('glow')) texCache.set('glow', canvasTex(128, 128, (g, w, h) => {
        const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }));
      return texCache.get('glow');
    }

    // ---------- Aufbau ----------
    let wallGroups = [];
    function clearWorld() {
      world.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) { (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => m.dispose()); } });
      while (world.children.length) world.remove(world.children[0]);
      items = []; pickables = []; wallGroups = [];
    }

    function box(w, h, d, mat, x, y, z, ry = 0) {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true;
      return m;
    }

    function openingsFor(wl, f) {
      const dx = wl.x2 - wl.x1, dy = wl.y2 - wl.y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, out = [];
      f.items.forEach(it => {
        if (it.shape !== 'door' && it.shape !== 'window') return;
        const px = it.x - wl.x1, py = it.y - wl.y1, s = px * ux + py * uy, d = Math.abs(-px * uy + py * ux);
        if (d > Math.max(wl.t, it.h || 10) / 2 + 12 || s < -10 || s > L + 10) return;
        const ang = Math.abs((((it.rot || 0) - Math.atan2(dy, dx) * 180 / Math.PI) % 180 + 180) % 180);
        if (Math.min(ang, 180 - ang) > 25) return;
        const a = Math.max(0, s - it.w / 2), b = Math.min(L, s + it.w / 2);
        if (b - a > 4) out.push({ a, b, it });
      });
      return out.sort((p, q) => p.a - q.a);
    }

    function buildFloor(f, idx, y0, Hw, L3, isTop) {
      const g = new T.Group(); g.position.y = y0; world.add(g);
      const wallMat = new T.MeshStandardMaterial({ color: colorOf(S().wallColor3 || L3.wall), roughness: 0.9, metalness: 0 });
      const glassMat = new T.MeshStandardMaterial({ color: 0x9bd5ff, transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.1, depthWrite: false });
      const frameMat = new T.MeshStandardMaterial({ color: look.neon ? 0x26e6ff : 0xf4f4f4, roughness: 0.6, emissive: look.neon ? 0x0a4a55 : 0x000000 });
      const doorMat = new T.MeshStandardMaterial({ color: look.neon ? 0x1c2a44 : 0xb98a5a, roughness: 0.7 });
      const edgeMat = L3.edge ? new T.LineBasicMaterial({ color: L3.edge, transparent: true, opacity: 0.85 }) : null;
      let wg = g; const fc = contentBounds(f); const cxm = fc.x + fc.w / 2, czm = fc.y + fc.h / 2;
      const addWallBox = (len, h, t, cx, cy, cz, ry) => {
        if (len < 0.5 || h < 0.5) return;
        const m = box(len, h, t, wallMat, cx, cy, cz, ry); wg.add(m);
        if (edgeMat) { const e = new T.LineSegments(new T.EdgesGeometry(m.geometry), edgeMat); e.position.copy(m.position); e.rotation.copy(m.rotation); wg.add(e); }
      };

      // Räume (Boden)
      (f.rooms || []).forEach(r => {
        if (!r.pts || r.pts.length < 3) return;
        const sh = new T.Shape(); r.pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
        const col = r.floor && FLOOR_COL[r.floor] ? FLOOR_COL[r.floor] : (r.color || '#90caf9');
        const mat = new T.MeshStandardMaterial({ color: colorOf(col), roughness: 0.95, side: T.DoubleSide });
        if (!(r.floor && FLOOR_COL[r.floor])) mat.color.lerp(new T.Color(look.neon ? 0x0b1020 : 0xffffff), look.neon ? 0.55 : 0.45);
        const geo = new T.ExtrudeGeometry(sh, { depth: 14, bevelEnabled: false });
        const m = new T.Mesh(geo, mat); m.rotation.x = Math.PI / 2; m.position.y = 0; m.receiveShadow = true; g.add(m);
        const fd = typeof FLOORS !== 'undefined' ? FLOORS[r.floor] : null;
        if (fd) {
          const sc = r.floorScale > 0 ? r.floorScale : 1, rc = r.color || '#90caf9', key = 'f|' + r.floor + '|' + sc + '|' + rc + '|' + (look.neon ? 1 : 0);
          const apply = (t) => { t = t.clone(); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1 / (fd[0] * sc), 1 / (fd[1] * sc)); t.rotation = (r.floorRot || 0) * Math.PI / 180; t.needsUpdate = true; mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; dirty = true; };
          const hit = texCache.get(key);
          if (hit) apply(hit);
          else {
            const bx = -fd[0] / 2, by = -fd[1] / 2;
            svgTex(`<defs><pattern id="p" patternUnits="userSpaceOnUse" x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}">${fd[2]}</pattern></defs><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="${look.neon ? '#141b2e' : '#ffffff'}"/><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="${rc}" fill-opacity="${look.neon ? 0.45 : 0.62}"/><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="url(#p)"/>`, fd[0], fd[1], t => { texCache.set(key, t); apply(t); });
          }
        }
      });

      // Wände mit Öffnungen
      (f.walls || []).forEach(wl => {
        const dx = wl.x2 - wl.x1, dy = wl.y2 - wl.y1, L = Math.hypot(dx, dy);
        if (L < 1) return;
        const ux = dx / L, uy = dy / L, t = wl.t || S().wallThickness || 15, ry = -Math.atan2(dy, dx), ext = t / 2;
        wg = new T.Group(); g.add(wg);
        { let nx = -uy, nz = ux; const mx = (wl.x1 + wl.x2) / 2 - cxm, mz = (wl.y1 + wl.y2) / 2 - czm; if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; } wg.userData.n = [nx, nz]; wallGroups.push(wg); }
        const ops = openingsFor(wl, f);
        const seg = (a, b, h, y) => { // Teilstück [a,b] entlang der Wand
          const len = b - a; if (len < 0.5) return;
          const mid = (a + b) / 2;
          addWallBox(len, h, t, wl.x1 + ux * mid, y + h / 2, wl.y1 + uy * mid, ry);
        };
        let cur = -ext;
        const solidH = Hw;
        ops.forEach(op => {
          seg(cur, op.a, solidH, 0);
          const win = op.it.shape === 'window', top = Math.min(Hw, 210), sill = win ? Math.min(90, Hw - 40) : 0;
          if (win) seg(op.a, op.b, sill, 0);
          if (Hw > top) seg(op.a, op.b, Hw - top, top);
          const mid = (op.a + op.b) / 2, cx = wl.x1 + ux * mid, cz = wl.y1 + uy * mid;
          if (win && Hw > sill + 20) {
            const gh = Math.min(top, Hw) - sill;
            const gl = box(op.b - op.a, gh, 2.5, glassMat, cx, sill + gh / 2, cz, ry); gl.castShadow = false; wg.add(gl);
            const fr = (w2, h2, d2, x2, y2) => wg.add(box(w2, h2, d2, frameMat, x2, y2, cz, ry));
            const along = (s2) => [wl.x1 + ux * s2, wl.y1 + uy * s2];
            [[op.a + 2, 0], [op.b - 2, 0]].forEach(([s2]) => { const [px, pz] = along(s2); wg.add(box(4, gh, 6, frameMat, px, sill + gh / 2, pz, ry)); });
            wg.add(box(op.b - op.a, 4, 6, frameMat, cx, sill + 2, cz, ry)); wg.add(box(op.b - op.a, 4, 6, frameMat, cx, sill + gh - 2, cz, ry));
            if (Number(op.it.leaves) === 2) wg.add(box(4, gh, 6, frameMat, cx, sill + gh / 2, cz, ry));
            void fr;
          } else if (!win) {
            // Tür: Blatt halb geöffnet (Scharnier an a oder b)
            const dw = op.b - op.a, dh = Math.min(top, Hw) - 4, hinge = op.it.flipX ? op.b : op.a;
            const pivot = new T.Group(); pivot.position.set(wl.x1 + ux * hinge, 0, wl.y1 + uy * hinge);
            pivot.rotation.y = ry + (op.it.flipX ? Math.PI : 0) + (op.it.flipY ? -1.2 : 1.2);
            const leaf = box(dw, dh, 4, doorMat, dw / 2, dh / 2, 0, 0); pivot.add(leaf); wg.add(pivot);
            wg.add(box(dw, 4, 8, frameMat, cx, Math.min(top, Hw) - 2, cz, ry));
          }
          cur = op.b;
        });
        seg(cur, L + ext, solidH, 0);
      });

      // Objekte
      (f.items || []).forEach(it => {
        if (it.shape === 'door' || it.shape === 'window') {
          // freistehend (nicht an einer Wand): dünne Fläche anzeigen
          const onWall = (f.walls || []).some(w => openingsFor(w, f).some(op => op.it === it));
          if (onWall) return;
          const hh = it.shape === 'door' ? 205 : 120, zz = it.shape === 'door' ? 0 : 90;
          const m = box(it.w, hh, Math.max(4, it.h * 0.4), it.shape === 'door' ? doorMat : glassMat, it.x, zz + hh / 2, it.y, -(it.rot || 0) * Math.PI / 180);
          g.add(m); return;
        }
        if (it.shape === 'text') {
          const c = textTex(String(it.label || '').split('\n').join(' '), { dark: !!look.neon || o.dark() }), sz = it.fs || 28;
          const sp = new T.Mesh(new T.PlaneGeometry(sz * c.w / c.h, sz), new T.MeshBasicMaterial({ map: c.t, transparent: true, depthWrite: false }));
          sp.rotation.set(-Math.PI / 2, 0, -(it.rot || 0) * Math.PI / 180, 'YXZ'); sp.position.set(it.x, 1.2, it.y); g.add(sp); return;
        }
        const [hd, zd] = dims3(it);
        const h = Math.max(1, hd);
        const z0 = zd === -1 ? Hw - h : zd === -2 ? Hw - h - 25 : zd;
        const ig = new T.Group(); ig.position.set(it.x, z0, it.y); ig.rotation.y = -(it.rot || 0) * Math.PI / 180; g.add(ig);
        const col = colorOf(it.color || (typeById(it.type) || {}).color, '#cfd8dc');
        const mat = new T.MeshStandardMaterial({ color: col, roughness: 0.75, metalness: 0.05, emissive: 0x000000 });
        if (look.neon) mat.color.lerp(new T.Color(0x1a2338), 0.55);
        let geo;
        if (it.shape === 'ellipse') { geo = new T.CylinderGeometry(1, 1, h, 28); }
        else geo = new T.BoxGeometry(it.w, h, it.h);
        const body = new T.Mesh(geo, mat);
        let model = null;
        if (!it.image && it.shape !== 'none' && !(it.icon && it.icon.startsWith('img:')) && typeof FPM !== 'undefined' && o.models !== false) model = FPM.build(T, it, it.w, it.h, h, typeof isCustomColor === 'function' && isCustomColor(it) ? it.color : null);
        if (model) { ig.add(model.group); mat.visible = false; }
        if (it.shape === 'ellipse') body.scale.set(it.w / 2, 1, it.h / 2);
        if (it.shape === 'none') { body.visible = false; }
        body.position.y = h / 2; body.castShadow = !model && h > 6; body.receiveShadow = true; body.userData.itemId = it.id;
        ig.add(body); pickables.push(body);
        if (!model && edgeMat && it.shape !== 'ellipse' && it.shape !== 'none') { const e = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: L3.edge, transparent: true, opacity: 0.55 })); e.position.y = h / 2; ig.add(e); }
        // Symbol / Bild auf der Oberseite
        const topY = h + 0.4, isz = Math.min(it.w, it.h) * 0.8 * (it.iconScale || 1);
        const iconPlane = (tex, w2, h2) => {
          const p = new T.Mesh(new T.PlaneGeometry(w2, h2), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
          p.rotation.x = -Math.PI / 2; p.position.y = topY; p.userData.itemId = it.id; ig.add(p); pickables.push(p); return p;
        };
        const sk = model ? '' : symKeyFor(it);
        if (model) { /* Modell statt Symbol */ }
        else if (it.image && it.imgMode !== 'stretch') { imgTex(it.image, tx => { const k = Math.min(it.w / 256, it.h / 256); iconPlane(tx, 256 * k, 256 * k); }); }
        else if (it.image) { imgTex(it.image, tx => iconPlane(tx, it.w, it.h)); }
        else if (sk) { svgTex(symDetail(sk, it.w, it.h), it.w, it.h, tx => iconPlane(tx, it.w, it.h)); }
        else if (it.icon && it.icon.startsWith('img:')) { imgTex(it.icon.slice(4), tx => iconPlane(tx, isz, isz)); }
        else if (it.icon && it.shape !== 'none' && h > 3) iconPlane(emojiTex(it.icon), isz, isz);
        else if (it.icon && it.shape === 'none') { const sp = new T.Sprite(new T.SpriteMaterial({ map: emojiTex(it.icon), transparent: true, depthTest: false })); sp.scale.set(Math.max(20, isz), Math.max(20, isz), 1); sp.position.y = h + 12; sp.renderOrder = 15; ig.add(sp); }
        const rec = { it, group: ig, body, mat, h, z0, live: model ? model.live : null, labelName: null, labelVal: null, valTxt: '', pool: null, light: null, baseColor: mat.color.clone(), floorY: y0 };
        items.push(rec);
      });
      return g;
    }

    function buildAll() {
      clearWorld(); if (typeof FPM !== 'undefined') FPM.reset(T);
      const L3 = look, Hw = o.walls === 'half' ? Math.min(100, wallH()) : o.walls === 'flat' ? 6 : wallH();
      const slab = wallH() + 25, floors = plan.floors, curIdx = Math.max(0, floors.findIndex(f => f.id === o.getFloor()));
      const show = o.allFloors ? floors.map((f, i) => i) : floors.map((f, i) => i).filter(i => i <= curIdx);
      let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9, maxY = 0;
      show.forEach(i => {
        const f = floors[i];
        buildFloor(f, i, i * slab, Hw, L3, i === show[show.length - 1]);
        const b = contentBounds(f);
        minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x + b.w); minZ = Math.min(minZ, b.y); maxZ = Math.max(maxZ, b.y + b.h); maxY = Math.max(maxY, i * slab + wallH());
      });
      if (minX > maxX) { minX = -200; maxX = 200; minZ = -200; maxZ = 200; }
      const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2, R = Math.max(maxX - minX, maxZ - minZ, 300) / 2;
      radius = Math.hypot(maxX - minX, maxZ - minZ, maxY) / 2;
      // Boden/Umgebung
      const gm = new T.Mesh(new T.PlaneGeometry(R * 40, R * 40), new T.MeshStandardMaterial({ color: colorOf(L3.ground), roughness: 1 }));
      gm.rotation.x = -Math.PI / 2; gm.position.set(cx, -16, cz); gm.receiveShadow = true; world.add(gm);
      const bg = colorOf(L3.bg);
      if (L3.sky) { const sk = 'sky|' + lookKey(); let tx = texCache.get(sk); if (!tx) { tx = canvasTex(8, 256, (g, w2, h2) => { const gr = g.createLinearGradient(0, 0, 0, h2); gr.addColorStop(0, L3.sky[0]); gr.addColorStop(0.55, L3.sky[1]); gr.addColorStop(1, L3.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, w2, h2); }); texCache.set(sk, tx); } scene.background = tx; } else scene.background = bg;
      scene.fog = new T.Fog(bg, radius * 5, radius * 16);
      hemi.color.set(L3.hs); hemi.groundColor.set(L3.hg); sun.color.set(L3.sunc);
      amb.intensity = L3.amb; hemi.intensity = L3.hemi; sun.intensity = L3.sun;
      sun.position.set(cx + R * 1.2, maxY + R * 2, cz + R * 0.8); sun.target.position.set(cx, 0, cz);
      const sc = sun.shadow.camera; sc.left = -R * 1.6; sc.right = R * 1.6; sc.top = R * 1.6; sc.bottom = -R * 1.6; sc.near = 10; sc.far = R * 8; sc.updateProjectionMatrix();
      sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.6;
      const key = floors.map(f => f.id).join(',') + '|' + o.getFloor() + '|' + o.allFloors;
      if (!fitted || fitKey !== key) { cam.tx = cx; cam.ty = Math.min(maxY, 300) * 0.3; cam.tz = cz; cam.dist = radius / Math.sin(cam.fov ? cam.fov : 0.36) * 0.95; fitted = true; fitKey = key; }
      applyLive(true);
    }

    // ---------- Live-Zustände ----------
    function stateSig() {
      let s = '';
      plan.floors.forEach(f => f.items.forEach(it => { if (it.entity) { const st = states[it.entity]; if (st) s += it.entity + st.state + (st.attributes && st.attributes.brightness != null ? st.attributes.brightness : '') + (st.attributes && st.attributes.rgb_color ? st.attributes.rgb_color.join('') : '') + '|'; } }));
      return s;
    }
    function applyLive(force) {
      let lights = 0;
      items.forEach(r => {
        const it = r.it, s = it.entity ? states[it.entity] : null, act = isActive(s), na = s && (s.state === 'unavailable' || s.state === 'unknown');
        const lightLike = it.glow;
        // Farbe / Leuchten
        if (act) {
          const c = colorOf(it.onColor || (domainOf(it.entity) === 'light' ? glowColor(it, s) : (C && C.accent) || '#03a9f4'));
          r.mat.color.copy(r.baseColor).lerp(c, lightLike ? 0.55 : 0.8);
          r.mat.emissive.copy(c); r.mat.emissiveIntensity = lightLike ? 0.9 : 0.35;
        } else { r.mat.color.copy(r.baseColor); r.mat.emissive.setRGB(0, 0, 0); r.mat.emissiveIntensity = 0; }
        r.mat.opacity = na ? 0.5 : 1; r.mat.transparent = !!na;
        if (r.live && r.live.length) r.live.forEach(m => {
          if (act) { const base = m.userData.base, onc = m.userData.on ? new T.Color(m.userData.on) : colorOf(it.onColor || (domainOf(it.entity) === 'light' ? glowColor(it, s) : (C && C.accent) || '#03a9f4')); const lc = domainOf(it.entity) === 'light' || it.glow ? colorOf(it.onColor || glowColor(it, s)) : onc; m.color.copy(base).lerp(lc, 0.55); m.emissive.copy(lc); m.emissiveIntensity = m.userData.ei; }
          else { m.color.copy(m.userData.base); m.emissive.setRGB(0, 0, 0); m.emissiveIntensity = 0; }
        });
        // Lichtkegel + Lichtpunkt
        const want = act && it.glow;
        if (want) {
          const gc = colorOf(glowColor(it, s)), br = s.attributes && s.attributes.brightness != null ? Math.min(1, Math.max(0.35, s.attributes.brightness / 255)) : 1, str = it.glowStr > 0 ? it.glowStr : 1;
          const R = it.glowR > 0 ? it.glowR : Math.max(it.w, it.h) * 2.2 + 90;
          if (!r.pool) {
            const pm = new T.MeshBasicMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending });
            r.pool = new T.Mesh(new T.PlaneGeometry(2, 2), pm); r.pool.rotation.x = -Math.PI / 2; r.pool.renderOrder = 3;
            r.group.parent.add(r.pool);
          }
          r.pool.position.set(it.x, 1.5, it.y); r.pool.scale.set(R, R, 1); r.pool.material.color.copy(gc); r.pool.material.opacity = Math.min(1, br * 0.9 * str); r.pool.visible = true;
          if (lights < 10) {
            if (!r.light) { r.light = new T.PointLight(0xffffff, 1, 1, 1); r.group.parent.add(r.light); }
            r.light.color.copy(gc); r.light.intensity = (look.pl || 600) * br * str; r.light.distance = R * 1.5; r.light.position.set(it.x, r.z0 + Math.max(r.h, 20) + 12, it.y); r.light.visible = true; lights++;
          } else if (r.light) r.light.visible = false;
        } else { if (r.pool) r.pool.visible = false; if (r.light) r.light.visible = false; }
        // Beschriftungen
        const txt = it.shape !== 'text' && it.showLabel ? labelText(it) : '';
        const val = it.entity && it.showValue ? valueText(it.entity) : '';
        const lblKey = txt + '|' + (look.neon || o.dark() ? 'd' : 'l');
        if (r.lblKey !== lblKey) {
          if (r.labelName) { r.group.remove(r.labelName); r.labelName.material.dispose(); r.labelName = null; }
          if (txt) { r.labelName = textSprite(txt, S().labelSize * 1.15, { dark: !!look.neon || o.dark() }); r.group.add(r.labelName); }
          r.lblKey = lblKey;
        }
        if (r.labelName) r.labelName.position.set(0, r.h + S().labelSize * 1.1 + 6, 0);
        if (r.valTxt !== val) {
          if (r.labelVal) { r.group.remove(r.labelVal); r.labelVal.material.dispose(); r.labelVal = null; }
          if (val) { r.labelVal = textSprite(val, S().labelSize * 1.0, { bg: act ? ((C && C.accent) || '#03a9f4') : '#6b7385', fg: '#fff' }); r.group.add(r.labelVal); }
          r.valTxt = val;
        }
        if (r.labelVal) r.labelVal.position.set(0, r.h + S().labelSize * (r.labelName ? 2.6 : 1.3) + 6, 0);
      });
      dirty = true; void force;
    }

    // ---------- Kamera / Steuerung ----------
    const FOV = 42 * Math.PI / 180; cam.fov = FOV / 2;
    function placeCamera() {
      const sp = Math.sin(cam.pol), cp = Math.cos(cam.pol);
      camera.position.set(cam.tx + cam.dist * sp * Math.sin(cam.az), cam.ty + cam.dist * cp, cam.tz + cam.dist * sp * Math.cos(cam.az));
      camera.lookAt(cam.tx, cam.ty, cam.tz);
    }
    const ptrs = new Map(); let gesture = null, tap = null, tapTimer = 0;
    const ray = new T.Raycaster(), v2 = new T.Vector2();
    function pick(e) {
      const r = cv.getBoundingClientRect();
      v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      return hit ? hit.object.userData.itemId : null;
    }
    function panBy(dx, dy) {
      const k = cam.dist * 0.0012, r = [Math.cos(cam.az), -Math.sin(cam.az)], u = [-Math.sin(cam.az), -Math.cos(cam.az)];
      cam.tx += -r[0] * dx * k + u[0] * dy * k; cam.tz += -r[1] * dx * k + u[1] * dy * k;
    }
    const limit = () => { cam.pol = Math.min(1.5, Math.max(0.08, cam.pol)); cam.dist = Math.min(radius * 8, Math.max(80, cam.dist)); };
    cv.addEventListener('pointerdown', e => {
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        const mousePan = e.pointerType === 'mouse' && (e.button === 1 || e.button === 2 || e.shiftKey);
        gesture = { t: mousePan ? 'pan' : 'orbit' };
        tap = { x: e.clientX, y: e.clientY, id: e.button === 0 || e.pointerType !== 'mouse' ? pick(e) : null, moved: false, long: false, time: Date.now() };
        clearTimeout(tapTimer);
        if (tap.id) tapTimer = setTimeout(() => { if (tap && !tap.moved) { tap.long = true; o.onTap && o.onTap(tap.id, true); } }, 550);
      } else if (ptrs.size === 2) {
        if (tap) tap.moved = true; clearTimeout(tapTimer);
        const [a, b] = [...ptrs.values()];
        gesture = { t: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      }
      cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', e => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (tap && !tap.moved && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8) { tap.moved = true; clearTimeout(tapTimer); }
      if (!gesture) return;
      if (gesture.t === 'orbit' && ptrs.size === 1) { if (!tap || tap.moved) { cam.az -= dx * 0.008; cam.pol -= dy * 0.006; limit(); dirty = true; } }
      else if (gesture.t === 'pan' && ptrs.size === 1) { panBy(dx, dy); dirty = true; }
      else if (gesture.t === 'pinch' && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        cam.dist *= gesture.d / d; let da = ang - gesture.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); cam.az -= da;
        panBy(mx - gesture.mx, my - gesture.my);
        gesture.d = d; gesture.ang = ang; gesture.mx = mx; gesture.my = my; limit(); dirty = true;
      }
    });
    const up = e => {
      ptrs.delete(e.pointerId); cv.style.cursor = 'grab';
      if (ptrs.size === 0) {
        clearTimeout(tapTimer);
        if (tap && !tap.moved && !tap.long && e.type === 'pointerup' && Date.now() - tap.time < 700) { if (tap.id && o.onTap) o.onTap(tap.id, false); else if (o.onEmptyTap) o.onEmptyTap(); }
        tap = null; gesture = null;
      } else if (ptrs.size === 1) { gesture = { t: 'orbit' }; if (tap) tap.moved = true; }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => {
      if (o.wheel === 'ctrl' && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      if (e.shiftKey) cam.az -= dy * 0.003; else cam.dist *= Math.exp(dy * (e.ctrlKey ? 0.01 : 0.0012));
      limit(); dirty = true;
    }, { passive: false });
    cv.addEventListener('dblclick', () => { fitted = false; build(true); });

    function resize() {
      const r = root.getBoundingClientRect(), w = Math.max(50, Math.round(r.width)), h = Math.max(50, Math.round(r.height));
      const sig = w + 'x' + h; if (sig === sizeSig) return; sizeSig = sig;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null; if (ro) ro.observe(root);

    let raf = 0;
    function animateWalls() {
      if (o.walls !== 'auto' || !wallGroups.length) return false;
      const dx = Math.sin(cam.az), dz = Math.cos(cam.az); let busy = false;
      wallGroups.forEach(wg => {
        const n = wg.userData.n, tgt = (n[0] * dx + n[1] * dz) > 0.2 ? 0.12 : 1, d = tgt - wg.scale.y;
        if (Math.abs(d) > 0.005) { wg.scale.y += d * 0.3; busy = true; } else wg.scale.y = tgt;
      });
      return busy;
    }
    function frame() {
      raf = 0; if (destroyed) return;
      if (animateWalls()) dirty = true;
      if (dirty) { dirty = false; limit(); placeCamera(); renderer.render(scene, camera); }
      raf = requestAnimationFrame(frame);
    }

    function structSig() {
      return JSON.stringify([plan.floors, S().wallColor, S().wallH3, S().symStyle, S().labelSize, S().wallThickness, o.look, o.walls, o.allFloors, o.getFloor(), o.dark() ? 1 : 0]);
    }
    function build(force) {
      look = LOOKS[lookKey()] || LOOKS.day;
      const sg = structSig();
      if (!force && sg === built) return false;
      built = sg;
      buildAll(); liveSig = stateSig(); dirty = true;
      return true;
    }
    function update() {
      if (destroyed) return;
      resize();
      if (!build(false)) { const ls = stateSig(); if (ls !== liveSig) { liveSig = ls; applyLive(); } }
    }
    function resetView() { fitted = false; cam.az = 0.55; cam.pol = 0.95; build(true); }
    function set(k, v) { o[k] = v; build(true); }
    function destroy() { destroyed = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); clearWorld(); renderer.dispose(); root.remove(); }

    resize(); build(true); frame();
    return { update, resetView, set, destroy, resize, el: root, rotate: (da) => { cam.az += da; dirty = true; }, zoom: (f) => { cam.dist *= f; limit(); dirty = true; }, cam, get opts() { return o; } };
  }

  return { load, create, dims3 };
})();
