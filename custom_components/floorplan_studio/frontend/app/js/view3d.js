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
    blind: [130, 80], shutter_outdoor: [130, 80], curtain_motor: [230, 0], awning: [25, 220], router: [10, 100], dongle: [10, 100], vacuum: [10, 0], lock: [10, 105], wallbox: [35, 110], meter_power: [30, 120], meter_gas: [30, 120],
    tree_fruit: [300, 0], tree_conifer: [450, 0], palm: [400, 0], bush_flower: [90, 0], planter: [60, 0], raised_bed: [80, 0], veggie_patch: [25, 0], meadow: [25, 0], rocks: [50, 0], hedge_corner: [150, 0], trellis: [200, 0], vineyard: [160, 0],
    pond: [4, 0], fountain: [110, 0], birdbath: [80, 0], water_tap: [60, 0], hose_reel: [45, 0], cistern: [150, 0], well: [100, 0], stream: [4, 0], greenhouse: [240, 0], pergola: [250, 0], gazebo: [270, 0], woodshed: [200, 0], compost: [90, 0], bin_shelter: [140, 0],
    playhouse: [190, 0], chicken_coop: [120, 0], rabbit_hutch: [90, 0], doghouse: [80, 0], hammock: [150, 0], bench_garden: [85, 0], chair_garden: [90, 0], swing_seat: [210, 0], slide: [200, 0], birdhouse: [30, 150], bee_hotel: [60, 120], statue: [80, 0], outdoor_kitchen: [95, 0], pizza_oven: [200, 0],
    wood_pile: [120, 0], wheelbarrow: [60, 0], solar_panel: [80, 0], privacy_screen: [180, 0], garden_gate: [130, 0], stone_wall: [90, 0], edging: [12, 0], path_stone: [3, 0], path_gravel: [3, 0], stepping_stones: [4, 0], gravel_area: [3, 0], patio: [3, 0], deck: [12, 0],
    lamp_solar: [40, 0], lamp_post: [350, 0], lamp_spike: [30, 0], lamp_flood: [20, 250], mower_robot: [25, 0], mower_station: [25, 0], sensor_soil: [25, 0], sprinkler: [12, 0], valve_box: [20, 0], pool_robot: [20, 0], pool_heater: [60, 0], gate_motor: [90, 0], cam_garden: [200, 0], garden_speaker: [30, 0], sensor_garden_motion: [16, 250],
    stairs: [260, 0], stairs_wide: [260, 0], stairs_L: [260, 0], stairs_U: [260, 0], stairs_spiral: [260, 0], stairs_spiral_small: [260, 0], stairs_outdoor: [100, 0], stairs_basement: [260, 0],
    plant: [90, 0], plant_big: [130, 0], plant_small: [30, 0], rug: [2, 0], rug_round: [2, 0], pillar: [250, 0], pillar_round: [250, 0], curtain: [240, 0], painting: [60, 140], playmat: [2, 0],
    car: [150, 0], carport: [2, 0], bike: [100, 0], terrace_table: [75, 0], lounger: [40, 0], grill: [95, 0], pool: [4, 0], hot_tub: [80, 0], tree: [350, 0], bush: [90, 0], hedge: [150, 0], fence: [110, 0],
    flowerbed: [20, 0], lawn: [2, 0], mailbox: [120, 0], gate: [150, 0], shed: [220, 0], trash_bin: [105, 0], rain_barrel: [90, 0], sandbox: [25, 0], trampoline: [30, 0], swing: [220, 0], terrace: [4, 0], terrace_slabs: [4, 0], terrace_stone: [4, 0], gazebo_round: [300, 0], gazebo_wood: [300, 0], fountain_tiered: [160, 0], wall_fountain: [140, 0], bbq: [110, 0], jetty: [42, 0], bridge_garden: [100, 0], strandkorb: [160, 0], driveway: [2, 0],
    firepit: [40, 0], parasol: [230, 0], elevator: [250, 0], chimney: [250, 0], safe: [50, 0], fire_ext: [40, 10], electric_panel: [50, 150], niche: [250, 0], cable_duct: [250, 0],
  };
  const CAT3 = { Garten: [60, 0],  Licht: [14, -1], Möbel: [80, 0], 'Küche & Bad': [90, 0], 'Heizung & Klima': [60, 0], 'Smart Home': [10, 110], 'Büro & Medien': [75, 0], 'Außen & Garage': [90, 0], 'Kinder & Haustiere': [45, 0], 'Bau & Deko': [100, 0] };
  const FLOOR_COL = { wood: '#c9a27a', tile: '#dfe3e6', stone: '#b8b2a7', carpet: '#b9a8c9', grass: '#8fc27a', concrete: '#b7bcc2', gravel: '#cfcac0', pavers: '#b9b2a8', deck: '#b8895a', sand: '#e6d6a8', soil: '#6b4f3a', water: '#3f9fd1' };
  const LOOKS = {
    day: { bg: '#cfe3f4', sky: ['#7fb2e0', '#cfe3f4', '#eef3f6'], ground: '#93b07f', wall: '#f3f0ea', edge: null, amb: 0.9, hemi: 1.5, hs: '#e8f2ff', hg: '#9a8a74', sunc: '#fff1d6', sun: 3.6, pl: 520, neon: false, real: true },
    dark: { bg: '#0f1626', sky: ['#070b16', '#121b2f', '#1d2840'], ground: '#1a2433', wall: '#cfc9bd', edge: null, amb: 0.35, hemi: 0.55, hs: '#6f86b8', hg: '#1b2230', sunc: '#8fa6d8', sun: 0.8, pl: 900, neon: false, real: true },
    live: { bg: '#cfe3f4', sky: ['#7fb2e0', '#cfe3f4', '#eef3f6'], ground: '#93b07f', wall: '#f3f0ea', edge: null, amb: 0.9, hemi: 1.5, hs: '#e8f2ff', hg: '#9a8a74', sunc: '#fff1d6', sun: 3.6, pl: 520, neon: false, real: true, live: true },
    blueprint: { bg: '#0b3b75', ground: '#0d4a94', wall: '#1456a8', edge: '#e6f3ff', amb: 0.9, hemi: 0.9, hs: '#ffffff', hg: '#9dc4f0', sunc: '#ffffff', sun: 1.0, pl: 900, neon: true, bp: true },
    neon: { bg: '#070a12', ground: '#0c1019', wall: '#141a2b', edge: '#26e6ff', amb: 0.8, hemi: 0.8, hs: '#ffffff', hg: '#8899aa', sunc: '#ffffff', sun: 1.0, pl: 900, neon: true },
  };


  const ROBOTS = new Set(['vacuum', 'mower_robot', 'pool_robot']);
  const ROBOT_SPEED = { vacuum: 20, mower_robot: 26, pool_robot: 14 };
  const ROBOT_ON = new Set(['cleaning', 'mowing', 'returning', 'washing', 'spot_cleaning', 'segment_cleaning', 'zone_cleaning', 'running', 'active', 'mowing_lawn']);
  const inPoly = (px, pz, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], zi = pts[i][1], xj = pts[j][0], zj = pts[j][1]; if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) c = !c; } return c; };

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
    root.style.cssText = 'position:absolute;inset:0;overflow:hidden;user-select:none;-webkit-user-select:none';
    const applyTouch = () => { root.style.touchAction = o.touchScroll && !(o.touchTilt && o.touchTilt()) ? 'pan-y' : 'none'; };
    applyTouch();
    container.appendChild(root);
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: false }); }
    catch (e) { root.remove(); throw new Error('WebGL ist nicht verfügbar'); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.lowPower ? 1.5 : 2));
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
      text = FPI.tr(String(text));
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
    let heatRooms = [], wallGroups = [], robots = [], solar = null, groundY = 0, selBox = null, lastAnim = 0;
    function clearWorld() {
      world.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) { (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => m.dispose()); } });
      while (world.children.length) world.remove(world.children[0]);
      items = []; pickables = []; wallGroups = []; robots = []; opens = []; solar = null; selBox = null; envO = null; heatRooms = [];
    }

    function box(w, h, d, mat, x, y, z, ry = 0) {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true;
      return m;
    }

    // ---------- Öffnungen (Fenster/Türen/Tore) mit Zustand: offen, gekippt, geschlossen ----------
    let opens = [];
    const openCache = new Map();
    function sectionTex() {
      if (!texCache.has('sect')) texCache.set('sect', canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#e8ebee'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(70,80,95,.55)'; g.lineWidth = 3; for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(0, i * h / 5); g.lineTo(w, i * h / 5); g.stroke(); } g.strokeStyle = 'rgba(70,80,95,.25)'; g.lineWidth = 1; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, i * h / 5 + h / 10); g.lineTo(w, i * h / 5 + h / 10); g.stroke(); } }));
      return texCache.get('sect');
    }
    function buildOpening(op, c) {
      const { wl, ux, uy, ry, cx, cz, sill, top, win, wg, Hw, frameMat, doorMat, glassMat } = c, it = op.it, dw = op.b - op.a, inz = wg.userData.inz || 1;
      const pick3 = m => { m.userData.itemId = it.id; pickables.push(m); return m; };
      const at = s2 => [wl.x1 + ux * s2, wl.y1 + uy * s2];
      const rec = { it, o: 0, t: 0, def: 0, speed: 0.6, set: null, cover: false };
      if (win) {
        const gh = Math.min(top, Hw) - sill, flip = !!it.flipX, two = Number(it.leaves) === 2;
        [[op.a + 2], [op.b - 2]].forEach(([s2]) => { const [px, pz] = at(s2); wg.add(box(4, gh, 6, frameMat, px, sill + gh / 2, pz, ry)); });
        wg.add(box(dw, 4, 6, frameMat, cx, sill + 2, cz, ry)); wg.add(box(dw, 4, 6, frameMat, cx, sill + gh - 2, cz, ry));
        const leaves = two ? [{ hinge: op.a + 2, dir: 1, lw: dw / 2 - 2 }, { hinge: op.b - 2, dir: -1, lw: dw / 2 - 2 }] : [{ hinge: flip ? op.b - 2 : op.a + 2, dir: flip ? -1 : 1, lw: dw - 4 }];
        const sashes = leaves.map(L => {
          const hg = new T.Group(), sg = new T.Group(), [hx, hz] = at(L.hinge);
          hg.position.set(hx, sill + 3, hz); hg.add(sg); sg.position.set(L.lw / 2, 0, 0);
          const sh = gh - 6;
          const gl = box(L.lw - 5, sh - 5, 1.6, glassMat, 0, sh / 2, 0, 0); gl.castShadow = false; sg.add(gl); pick3(gl);
          [[L.lw, 2.6, 0, sh - 1.3], [L.lw, 2.6, 0, 1.3]].forEach(([w2, h2, x2, y2]) => sg.add(box(w2, h2, 3.5, frameMat, x2, y2, 0, 0)));
          [-L.lw / 2 + 1.3, L.lw / 2 - 1.3].forEach(x2 => sg.add(box(2.6, sh, 3.5, frameMat, x2, sh / 2, 0, 0)));
          wg.add(hg); return { hg, sg, dir: L.dir };
        });
        rec.kind = 'window'; rec.speed = 0.55;
        rec.set = (o, t) => sashes.forEach(S => {
          S.hg.rotation.y = ry + (S.dir < 0 ? Math.PI : 0) + (S.dir > 0 ? -inz : inz) * o * 1.35;
          S.sg.rotation.x = (S.dir > 0 ? inz : -inz) * t * 0.2;
        });
      } else {
        const dh = Math.min(top, Hw) - 4, typ = it.type;
        wg.add(box(dw, 4, 8, frameMat, cx, Math.min(top, Hw) - 2, cz, ry));
        if (typ === 'garage_door') {
          const g = new T.Group(); const [gx, gz] = at((op.a + op.b) / 2); g.position.set(gx, dh, gz); g.rotation.y = ry; wg.add(g);
          const m = new T.Mesh(new T.BoxGeometry(dw - 4, dh, 6), new T.MeshStandardMaterial({ map: sectionTex(), roughness: 0.6, metalness: 0.2 })); m.position.y = -dh / 2; m.castShadow = true; g.add(m); pick3(m);
          rec.kind = 'garage'; rec.speed = 0.22; rec.cover = true; rec.anchor = g; rec.hh = dh;
          rec.set = o => { g.scale.y = Math.max(0.02, 1 - o); };
        } else if (typ === 'door_sliding' || typ === 'door_terrace' && false) {
          const g = new T.Group(); g.rotation.y = ry; const [gx, gz] = at((op.a + op.b) / 2); g.position.set(gx, 0, gz); wg.add(g);
          const gl = box(dw * 0.52, dh, 2.2, glassMat, 0, dh / 2, 3, 0); gl.castShadow = false; g.add(gl); pick3(gl);
          [[dw * 0.52, 3, 0, dh - 1.5], [dw * 0.52, 3, 0, 1.5]].forEach(([w2, h2, x2, y2]) => g.add(box(w2, h2, 4, frameMat, x2, y2, 3, 0)));
          [-dw * 0.26 + 1.5, dw * 0.26 - 1.5].forEach(x2 => g.add(box(3, dh, 4, frameMat, x2, dh / 2, 3, 0)));
          const sgn = it.flipX ? -1 : 1, base = -sgn * dw * 0.24;
          rec.kind = 'slide'; rec.speed = 0.4;
          rec.set = o => { g.position.set(gx + ux * (base + sgn * o * dw * 0.46) - ux * 0, 0, gz + uy * (base + sgn * o * dw * 0.46)); };
          rec.base = [gx, gz];
          rec.set = o => { const k = base + sgn * o * dw * 0.46; g.position.set(gx + ux * k, 0, gz + uy * k); };
        } else {
          const two = typ === 'door_double' || Number(it.leaves) === 2, flip = !!it.flipX, sw = it.flipY ? -1 : 1;
          const leaves = two ? [{ hinge: op.a, dir: 0, lw: dw / 2 }, { hinge: op.b, dir: 1, lw: dw / 2 }] : [{ hinge: flip ? op.b : op.a, dir: flip ? 1 : 0, lw: dw }];
          const ps = leaves.map(L => {
            const pv = new T.Group(), [hx, hz] = at(L.hinge); pv.position.set(hx, 0, hz);
            const leaf = box(L.lw - 1, dh, 4, doorMat, L.lw / 2, dh / 2, 0, 0); pv.add(leaf); pick3(leaf);
            wg.add(pv); return { pv, dir: L.dir };
          });
          rec.kind = 'door'; rec.def = 0.8; rec.speed = 0.7;
          rec.set = o => ps.forEach(S => { S.pv.rotation.y = ry + (S.dir ? Math.PI : 0) + (S.dir ? -1 : 1) * sw * o * 1.5; });
        }
      }
      // Startwert: zuletzt gezeigter Zustand, sonst Ziel
      const tg = openTarget(rec), cc = openCache.get(it.id);
      rec.o = cc ? cc.o : tg.o; rec.t = cc ? cc.t : tg.t; rec.set(rec.o, rec.t); opens.push(rec);
    }
    function openTarget(rec) {
      if (rec.hold && performance.now() < rec.hold.until) return { o: rec.hold.v, t: 0 };
      const oi = openInfo(rec.it);
      return oi ? { o: oi.o, t: oi.tilt ? 1 : 0 } : { o: rec.def, t: 0 };
    }
    function animateOpens(dt) {
      let busy = false;
      opens.forEach(r => {
        const tg = openTarget(r), step = r.speed * dt, so = r.o, st = r.t;
        const mv = (v, g, k) => Math.abs(g - v) <= k ? g : v + Math.sign(g - v) * k;
        if (!r.dragging) { r.o = mv(r.o, tg.o, step); r.t = mv(r.t, tg.t, step * 1.2); }
        if (r.o !== so || r.t !== st) { r.set(r.o, r.t); busy = true; }
        openCache.set(r.it.id, { o: r.o, t: r.t });
      });
      return busy;
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
      const garden = f.kind === 'garden';
      const wallMat = new T.MeshStandardMaterial({ color: colorOf(garden ? '#a97c50' : (o.wallColor || S().wallColor3 || L3.wall)), roughness: 0.9, metalness: 0 });
      const glassMat = new T.MeshStandardMaterial({ color: 0x9bd5ff, transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.1, depthWrite: false });
      const frameMat = new T.MeshStandardMaterial({ color: look.bp ? 0xe6f3ff : look.neon ? 0x26e6ff : 0xf4f4f4, roughness: 0.6, emissive: look.bp ? 0x1a4a80 : look.neon ? 0x0a4a55 : 0x000000 });
      const doorMat = new T.MeshStandardMaterial({ color: look.bp ? 0x1d5fae : look.neon ? 0x1c2a44 : 0xb98a5a, roughness: 0.7 });
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
        if (!(r.floor && FLOOR_COL[r.floor])) mat.color.lerp(new T.Color(look.bp ? 0x0b3b75 : look.neon ? 0x0b1020 : 0xffffff), look.bp ? 0.7 : look.neon ? 0.55 : 0.45);
        if (r.area && !(r.floor && FLOOR_COL[r.floor])) heatRooms.push({ mat, area: r.area, base: mat.color.clone() });
        const geo = new T.ExtrudeGeometry(sh, { depth: 14, bevelEnabled: false });
        const m = new T.Mesh(geo, mat); m.rotation.x = Math.PI / 2; m.position.y = 0; m.receiveShadow = true; g.add(m);
        const fd = typeof FLOORS !== 'undefined' ? FLOORS[r.floor] : null;
        if (fd) {
          const sc = r.floorScale > 0 ? r.floorScale : 1, rc = r.color || '#90caf9', key = 'f|' + r.floor + '|' + sc + '|' + rc + '|' + (look.bp ? 2 : look.neon ? 1 : 0);
          const apply = (t) => { t = t.clone(); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1 / (fd[0] * sc), 1 / (fd[1] * sc)); t.rotation = (r.floorRot || 0) * Math.PI / 180; t.needsUpdate = true; mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; dirty = true; };
          const hit = texCache.get(key);
          if (hit) apply(hit);
          else {
            const bx = -fd[0] / 2, by = -fd[1] / 2;
            svgTex(`<defs><pattern id="p" patternUnits="userSpaceOnUse" x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}">${fd[2]}</pattern></defs><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="${look.bp ? '#0e4a93' : look.neon ? '#141b2e' : '#ffffff'}"/><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="${rc}" fill-opacity="${look.neon ? 0.45 : 0.62}"/><rect x="${bx}" y="${by}" width="${fd[0]}" height="${fd[1]}" fill="url(#p)"/>`, fd[0], fd[1], t => { texCache.set(key, t); apply(t); });
          }
        }
      });

      // Wände mit Öffnungen
      (f.walls || []).forEach(wl => {
        const dx = wl.x2 - wl.x1, dy = wl.y2 - wl.y1, L = Math.hypot(dx, dy);
        if (L < 1) return;
        const ux = dx / L, uy = dy / L, t = wl.t || S().wallThickness || 15, ry = -Math.atan2(dy, dx), ext = t / 2;
        wg = new T.Group(); g.add(wg);
        if (!garden) { let nx = -uy, nz = ux; const mx = (wl.x1 + wl.x2) / 2 - cxm, mz = (wl.y1 + wl.y2) / 2 - czm; if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; } wg.userData.n = [nx, nz]; wg.userData.inz = Math.abs(nx + uy) < 1e-6 && Math.abs(nz - ux) < 1e-6 ? -1 : 1; wallGroups.push(wg); }
        const ops = garden ? [] : openingsFor(wl, f);
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
          buildOpening(op, { wl, ux, uy, ry, cx, cz, sill, top, win, wg, Hw, frameMat, doorMat, glassMat });
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
        if (look.neon) mat.color.lerp(new T.Color(look.bp ? 0x1f6fc2 : 0x1a2338), look.bp ? 0.65 : 0.55);
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
        const rec = { it, group: ig, body, mat, h, z0, live: model ? model.live : null, anim: model ? model.anim : null, labelName: null, labelVal: null, valTxt: '', pool: null, light: null, baseColor: mat.color.clone(), floorY: y0 };
        items.push(rec);
        if (ROBOTS.has(it.type) && it.roam !== 'off') setupRobot(rec, f);
      });
      return g;
    }

    // ---------- Roboter (Saug-/Mäh-/Poolroboter fahren umher) ----------
    function setupRobot(rec, f) {
      const it = rec.it; let area = null, excl = [];
      const mower = it.type === 'mower_robot';
      if (it.type === 'pool_robot') { const pl = f.items.find(x => x.type === 'pool' && Math.abs(it.x - x.x) <= x.w / 2 && Math.abs(it.y - x.y) <= x.h / 2); if (pl) area = { rect: [pl.x - pl.w / 2 + 25, pl.y - pl.h / 2 + 25, pl.x + pl.w / 2 - 25, pl.y + pl.h / 2 - 25] }; }
      if (mower) {
        // nur Rasenflächen im Garten, nie auf Terrasse/Kies/Wasser und nicht ins Haus
        const rs = (f.rooms || []).filter(r => r.pts && r.pts.length > 2);
        const grass = rs.filter(r => (r.floor || 'grass') === 'grass' && r.floor === 'grass');
        const g0 = grass.filter(r => inPoly(it.x, it.y, r.pts)); const use = g0.length ? g0 : grass;
        if (use.length) area = { polys: use.map(r => r.pts) };
        rs.filter(r => r.floor && r.floor !== 'grass').forEach(r => excl.push(r.pts));
        (plan.floors || []).filter(x => x.kind !== 'garden').forEach(x => (x.rooms || []).forEach(r => { if (r.pts && r.pts.length > 2) excl.push(r.pts); }));
        (plan.floors || []).filter(x => x.kind !== 'garden').forEach(x => (x.walls || []).forEach(w => { const t = (w.t || 10) / 2 + 2, dx = w.x2 - w.x1, dy = w.y2 - w.y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l * t, ny = dx / l * t; excl.push([[w.x1 + nx, w.y1 + ny], [w.x2 + nx, w.y2 + ny], [w.x2 - nx, w.y2 - ny], [w.x1 - nx, w.y1 - ny]]); }));
      }
      if (!area) { const rs = (f.rooms || []).filter(r => r.pts && r.pts.length > 2 && inPoly(it.x, it.y, r.pts)); if (rs.length) area = { poly: rs[rs.length - 1].pts }; }
      if (!area) { const b = contentBounds(f); area = { rect: [b.x, b.y, b.x + b.w, b.y + b.h] }; }
      const obst = f.items.filter(x => x !== it && !ROBOTS.has(x.type) && !['door', 'window', 'text', 'none'].includes(x.shape)).map(x => { const [hh, zz] = dims3(x); return { x, hh, zz }; }).filter(a => mower ? true : (a.hh > 14 && a.zz >= 0 && a.zz < 40)).map(a => a.x);
      rec.robot = { x: it.x, z: it.y, hd: [0, Math.PI / 2, Math.PI, -Math.PI / 2][Math.floor(Math.random() * 4)], vh: 0, area, excl, obst, mower, rad: Math.max(8, Math.min(it.w, it.h) / 2), speed: ROBOT_SPEED[it.type] || 18, wait: 0, mode: 'go', side: 1, run: 0, fails: 0 };
      rec.robot.vh = rec.robot.hd;
    }
    function robotFree(r, px, pz) {
      const a = r.area, m = r.rad * 0.8 + (r.mower ? 12 : 0);
      const pts = [[px, pz], [px + m, pz], [px - m, pz], [px, pz + m], [px, pz - m], [px + m * .7, pz + m * .7], [px - m * .7, pz + m * .7], [px + m * .7, pz - m * .7], [px - m * .7, pz - m * .7]];
      for (const [qx, qz] of pts) {
        if (a.polys ? !a.polys.some(p => inPoly(qx, qz, p)) : a.poly ? !inPoly(qx, qz, a.poly) : (qx < a.rect[0] || qx > a.rect[2] || qz < a.rect[1] || qz > a.rect[3])) return false;
        if (r.excl) for (const p of r.excl) if (inPoly(qx, qz, p)) return false;
      }
      for (const o2 of r.obst) {
        const dx = px - o2.x, dz = pz - o2.y, rr = -(o2.rot || 0) * Math.PI / 180, c = Math.cos(rr), sn = Math.sin(rr), lx = dx * c - dz * sn, lz = dx * sn + dz * c;
        if (Math.abs(lx) < o2.w / 2 + m && Math.abs(lz) < o2.h / 2 + m) return false;
      }
      return true;
    }
    function robotActive(it) {
      if (it.roam === 'always') return true;
      if (!it.entity) return false;
      const st = states[it.entity]; if (!st) return false;
      return isActive(st) || ROBOT_ON.has(st.state);
    }
    function animateRobots(dt) {
      let busy = false;
      items.forEach(rec => {
        const r = rec.robot; if (!r || rec.dragging) return;
        if (!robotActive(rec.it)) return;
        busy = true;
        const step = r.speed * dt;
        if (r.wait > 0) r.wait -= dt;
        else {
          const nx = r.x + Math.cos(r.hd) * step, nz = r.z + Math.sin(r.hd) * step;
          if (robotFree(r, nx, nz)) {
            r.x = nx; r.z = nz; r.run += step;
            if (r.mode === 'shift') { r.left -= step; if (r.left <= 0) { r.mode = 'go'; r.hd = r.base + Math.PI; r.wait = 0.2; r.run = 0; r.fails = 0; } }
          } else if (r.mode === 'go') {
            // Bahnende: seitlich versetzen, dann in Gegenrichtung zurück (Bahnen hin und her)
            if (r.run < r.rad && r.fails < 2) { r.side = -r.side; r.fails++; }
            r.base = r.hd; r.mode = 'shift'; r.left = r.rad * 2.2; r.hd = r.base + r.side * Math.PI / 2; r.wait = 0.2;
            if (r.fails >= 2) { r.mode = 'go'; r.hd = r.base + Math.PI; r.fails = 0; r.run = 0; }
          } else {
            // Versatz blockiert -> zurück in Gegenrichtung, nächste Bahn auf der anderen Seite
            r.mode = 'go'; r.hd = r.base + Math.PI; r.side = -r.side; r.wait = 0.2; r.run = 0;
          }
        }
        let d = r.hd - r.vh; d = Math.atan2(Math.sin(d), Math.cos(d)); r.vh += d * Math.min(1, dt * 12);
        rec.group.position.x = r.x; rec.group.position.z = r.z; rec.group.rotation.y = Math.PI / 2 - r.vh;
      });
      return busy;
    }

    // ---------- Dachgeometrie mit UV (Ziegel) ----------
    function roofGeo(mode, across, len, rh) {
      const a = across / 2, l = len / 2, faces = [];
      if (mode === 'shed') {
        faces.push([[-a, 0, -l], [-a, 0, l], [a, rh, l], [a, rh, -l]], [[a, 0, l], [a, 0, -l], [a, rh, -l], [a, rh, l]], [[-a, 0, l], [a, 0, l], [a, rh, l]], [[a, 0, -l], [-a, 0, -l], [a, rh, -l]]);
      } else if (mode === 'gable') {
        faces.push([[-a, 0, -l], [-a, 0, l], [0, rh, l], [0, rh, -l]], [[a, 0, l], [a, 0, -l], [0, rh, -l], [0, rh, l]], [[-a, 0, l], [a, 0, l], [0, rh, l]], [[a, 0, -l], [-a, 0, -l], [0, rh, -l]]);
      } else {
        const rl = Math.max(0, l - a), A = [-a, 0, -l], B = [a, 0, -l], C = [a, 0, l], D = [-a, 0, l], R1 = [0, rh, -rl], R2 = [0, rh, rl];
        faces.push([A, B, R1], [C, D, R2], [B, C, R2, R1], [D, A, R1, R2]);
      }
      const pos = [], uv = [], TW = 120, TH = 152;
      faces.forEach(f => {
        const p0 = f[0], e1 = new T.Vector3(f[1][0] - p0[0], f[1][1] - p0[1], f[1][2] - p0[2]), e2 = new T.Vector3(f[f.length - 1][0] - p0[0], f[f.length - 1][1] - p0[1], f[f.length - 1][2] - p0[2]);
        const n = new T.Vector3().crossVectors(e1, e2).normalize(); let hz = new T.Vector3().crossVectors(n, new T.Vector3(0, 1, 0));
        if (hz.lengthSq() < 1e-6) hz = new T.Vector3(1, 0, 0); hz.normalize();
        let up = new T.Vector3().crossVectors(n, hz).normalize(); if (up.y < 0) up.negate();
        const put = q => { pos.push(q[0], q[1], q[2]); const dv = new T.Vector3(q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]); uv.push(dv.dot(hz) / TW, dv.dot(up) / TH); };
        for (let i = 1; i < f.length - 1; i++) { put(f[0]); put(f[i]); put(f[i + 1]); }
      });
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
      return geo;
    }
    function roofTileTex(col) {
      const key = 'tile|' + col; let t = texCache.get(key); if (t) return t;
      const c0 = new T.Color(col);
      t = canvasTex(256, 256, (g, w2, h2) => {
        g.fillStyle = '#' + c0.clone().multiplyScalar(0.45).getHexString(); g.fillRect(0, 0, w2, h2);
        let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const cw = w2 / 4, ch = h2 / 4;
        for (let r = -1; r < 5; r++) for (let c = -1; c < 5; c++) {
          const x = c * cw + (((r % 2) + 2) % 2) * cw / 2, y = r * ch, k = 0.82 + rnd() * 0.32, cc = c0.clone().multiplyScalar(k);
          const gr = g.createLinearGradient(0, y, 0, y + ch * 1.35); gr.addColorStop(0, '#' + cc.clone().multiplyScalar(0.8).getHexString()); gr.addColorStop(0.6, '#' + cc.getHexString()); gr.addColorStop(1, '#' + cc.clone().multiplyScalar(1.12).getHexString());
          g.fillStyle = gr; g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + cw - 2, y); g.lineTo(x + cw - 2, y + ch * 1.05); g.quadraticCurveTo(x + cw / 2, y + ch * 1.45, x + 2, y + ch * 1.05); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.stroke();
        }
      });
      t.wrapS = t.wrapT = T.RepeatWrapping; texCache.set(key, t); return t;
    }

    // ---------- Solaranlage auf dem Dach ----------
    function buildSolar(P) {
      const { roofMode, W, D, cx2, cz2, by, rh, across, len, alongX, pitch } = P;
      const fill = Math.min(100, Math.max(10, Number(S().solarFill3) || 70)) / 100, side = (S().solarSide3 === 'B' ? -1 : 1) * (roofMode !== 'flat' && alongX ? -1 : 1), reqN = Math.max(0, Math.round(Number(S().solarCount3) || 0));
      const PW = 100, PH = 170, GAP = 3;
      const tex = canvasTex(128, 256, (g, w2, h2) => { g.fillStyle = '#12213d'; g.fillRect(0, 0, w2, h2); const gr = g.createLinearGradient(0, 0, w2, h2); gr.addColorStop(0, 'rgba(90,140,220,.35)'); gr.addColorStop(1, 'rgba(10,20,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, w2, h2); g.strokeStyle = 'rgba(190,210,240,.55)'; g.lineWidth = 2; for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(i * w2 / 6, 0); g.lineTo(i * w2 / 6, h2); g.stroke(); } for (let j = 0; j <= 10; j++) { g.beginPath(); g.moveTo(0, j * h2 / 10); g.lineTo(w2, j * h2 / 10); g.stroke(); } });
      const topM = new T.MeshStandardMaterial({ map: tex, roughness: 0.2, metalness: 0.5, emissive: 0x2a5fb0, emissiveIntensity: 0.1 });
      const frameM = new T.MeshStandardMaterial({ color: 0xcfd4d9, roughness: 0.4, metalness: 0.8 });
      const pivot = new T.Group(); pivot.position.set(cx2, by, cz2); if (roofMode !== 'flat') pivot.rotation.y = alongX ? Math.PI / 2 : 0; world.add(pivot);
      const mkPanel = (dx, dz) => { const g = new T.Group(); const f2 = new T.Mesh(new T.BoxGeometry(dx, 3.2, dz), frameM); f2.castShadow = true; const tp = new T.Mesh(new T.PlaneGeometry(dx - 4, dz - 4), topM); tp.rotation.x = -Math.PI / 2; tp.position.y = 1.7; g.add(f2, tp); return g; };
      // gleichmäßig zentriertes Raster für n Module
      const gridPos = (n, colsMax, rowsMax) => {
        const rows = Math.min(rowsMax, Math.max(1, Math.ceil(n / colsMax))), cols = Math.min(colsMax, Math.ceil(n / rows)), out = []; let k = 0;
        for (let r = 0; r < rows && k < n; r++) { const cnt = Math.min(cols, n - k); for (let c = 0; c < cnt; c++) { out.push({ c: c - (cnt - 1) / 2, r }); k++; } }
        return { list: out, rows };
      };
      const spots = []; // [group-position, rotation]
      if (roofMode === 'flat') {
        const aw = W - 2 * Math.max(0, Number(S().roofOver3) || 0) - 60, ad = D - 2 * Math.max(0, Number(S().roofOver3) || 0) - 60, tilt = 0.4, pitchD = PH * Math.cos(tilt) + 55;
        const cols = Math.max(1, Math.floor((aw + GAP) / (PW + GAP))), rows = Math.max(1, Math.floor((ad + 40) / pitchD)), max = cols * rows, n = Math.min(max, reqN > 0 ? reqN : Math.max(1, Math.round(max * fill)));
        const gp = gridPos(n, cols, rows);
        gp.list.forEach(q => spots.push({ x: q.c * (PW + GAP), y: 7 + PH * Math.sin(tilt) / 2 + 8, z: (q.r - (gp.rows - 1) / 2) * pitchD, rx: side * tilt, rz: 0, flat: true }));
      } else if (roofMode === 'shed') {
        const Ls = Math.hypot(across, rh), alpha = Math.atan2(rh, across), s0 = Math.max(35, (Number(S().roofOver3) || 40) / Math.cos(alpha) + 12), rowsMax = Math.max(1, Math.floor((Ls - s0 - 25 + GAP) / (PH + GAP)));
        const cols = Math.max(1, Math.floor((Math.max(PW, len - 50) + GAP) / (PW + GAP))), max = rowsMax * cols, n = Math.min(max, reqN > 0 ? reqN : Math.max(1, Math.round(max * fill))), gp = gridPos(n, cols, rowsMax);
        gp.list.forEach(q => { const sc = s0 + PH / 2 + q.r * (PH + GAP); spots.push({ x: -across / 2 + Math.cos(alpha) * sc - Math.sin(alpha) * 2.4, y: Math.sin(alpha) * sc + Math.cos(alpha) * 2.4, z: q.c * (PW + GAP), rz: alpha, rx: 0, flat: false }); });
      } else {
        const Ls = Math.hypot(across / 2, rh), alpha = Math.atan2(rh, across / 2), s0 = Math.max(35, (Number(S().roofOver3) || 40) / Math.cos(alpha) + 12), rowsMax = Math.max(1, Math.floor((Ls - s0 - 25 + GAP) / (PH + GAP)));
        const regionLen = roofMode === 'hip' ? Math.max(PW, len - across - 20) : Math.max(PW, len - 50), cols = Math.max(1, Math.floor((regionLen + GAP) / (PW + GAP))), max = rowsMax * cols;
        const nAll = reqN > 0 ? reqN : Math.max(1, Math.round(max * fill)), nA = Math.min(nAll, max), nB = Math.min(nAll - nA, max);
        [[side, nA], [-side, nB]].forEach(([sd, cnt]) => {
          if (cnt <= 0) return;
          const ux = -sd * (across / 2) / Ls, uy = rh / Ls, nx = sd * rh / Ls, ny = (across / 2) / Ls, ex = sd * across / 2, gp = gridPos(cnt, cols, rowsMax);
          gp.list.forEach(q => { const sc = s0 + PH / 2 + q.r * (PH + GAP); spots.push({ x: ex + ux * sc + nx * 2.4, y: uy * sc + ny * 2.4, z: q.c * (PW + GAP), rz: -sd * alpha, rx: 0, flat: false }); });
        });
      }
      const centers = [];
      spots.forEach(sp => { const g = sp.flat ? mkPanel(PW, PH) : mkPanel(PH, PW); g.position.set(sp.x, sp.y, sp.z); g.rotation.set(sp.rx || 0, 0, sp.rz || 0); pivot.add(g); });
      pivot.updateMatrixWorld(true);
      pivot.children.forEach(ch => { const v = new T.Vector3(); ch.getWorldPosition(v); centers.push(v); });
      const dest = new T.Vector3(cx2, by - wallH() * 0.45, cz2);
      const sprMat = () => new T.SpriteMaterial({ map: glowTex(), color: 0xffd54f, blending: T.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false });
      const parts = []; for (let i = 0; i < 18; i++) { const sp2 = new T.Sprite(sprMat()); sp2.renderOrder = 40; sp2.visible = false; world.add(sp2); parts.push({ sp: sp2, t: i / 18, from: centers[Math.floor(Math.random() * centers.length)] }); }
      const hub = new T.Sprite(sprMat()); hub.material.color.set(0xffa000); hub.renderOrder = 41; hub.position.copy(dest); hub.scale.set(60, 60, 1); world.add(hub);
      solar = { centers, dest, parts, hub, topM };
    }
    function animateSolar(dt, now) {
      const sl = solar; if (!sl) return false;
      let pf = 1; const ent = S().solarEntity;
      if (ent) { const st = states[ent]; let v = st ? parseFloat(st.state) : NaN; if (st && st.attributes && /^kW$/i.test(st.attributes.unit_of_measurement || '')) v *= 1000; const mx = Number(S().solarMax3) || 5000; pf = isFinite(v) && v > 0 ? Math.max(0.12, Math.min(1, v / mx)) : 0; }
      sl.topM.emissiveIntensity = 0.06 + 0.7 * pf;
      const n = Math.ceil(pf * sl.parts.length), speed = 0.28 + 0.6 * pf;
      sl.parts.forEach((p, i) => {
        if (i >= n) { p.sp.visible = false; return; }
        p.t += dt * speed; if (p.t >= 1) { p.t -= 1; p.from = sl.centers[Math.floor(Math.random() * sl.centers.length)]; }
        const k = p.t, e = k * k * (3 - 2 * k);
        p.sp.visible = true; p.sp.position.set(p.from.x + (sl.dest.x - p.from.x) * e, p.from.y + (sl.dest.y - p.from.y) * e + Math.sin(Math.PI * k) * 25, p.from.z + (sl.dest.z - p.from.z) * e);
        const sc = 26 * (1 - 0.5 * k); p.sp.scale.set(sc, sc, 1); p.sp.material.opacity = Math.min(1, k * 6) * Math.min(1, (1 - k) * 5);
      });
      sl.hub.visible = pf > 0; sl.hub.scale.setScalar(50 + 14 * Math.sin(now * 0.006)); sl.hub.material.opacity = 0.35 + 0.4 * pf;
      return pf > 0;
    }
    const coverCache = new Map();
    function coverTarget(s) {
      if (!s) return null; const a = s.attributes || {};
      if (a.current_position != null && isFinite(a.current_position)) return Math.max(0, Math.min(1, a.current_position / 100));
      if (s.state === 'open' || s.state === 'opening') return 1; if (s.state === 'closed' || s.state === 'closing') return 0; return null;
    }
    function animateRecs(dt) {
      let busy = false;
      items.forEach(rec => {
        const a = rec.anim; if (!a) return; const it = rec.it, s = it.entity ? states[it.entity] : null;
        if (a.type === 'cover') {
          let tg = coverTarget(s); if (rec.hold && performance.now() < rec.hold.until) tg = rec.hold.v; if (tg == null) return;
          let cv = rec.cv != null ? rec.cv : (coverCache.has(it.id) ? coverCache.get(it.id) : tg);
          const d = tg - cv; if (Math.abs(d) > 0.002) { cv += Math.sign(d) * Math.min(Math.abs(d), dt * 0.3); busy = true; } else cv = tg;
          rec.cv = cv; coverCache.set(it.id, cv); a.set(cv);
        } else {
          const act = !!s && isActive(s), r = a.step(dt, act); if (act || r || a.wasOn) busy = true; a.wasOn = act;
        }
      });
      return busy;
    }
    function animateAll(dt, now) { let b = false; if (animateRecs(dt)) b = true; if (opens.length && animateOpens(dt)) b = true; if (robots.length || items.some(r => r.robot)) b = animateRobots(dt) || b; if (animateSolar(dt, now)) b = true; if (envO && animateEnv(dt, now)) b = true; return b; }

    // ---------- Live-Umgebung: Tageszeit + Wetter (Look „live“) ----------
    let envO = null;
    const wx = { rain: 0, snow: 0, fog: 0, cl: 0, light: 0, wind: 0, elev: 30, az: 180, d: 1 };
    const WCOND = {
      sunny: { cl: 0.04 }, 'clear-night': { cl: 0.03 }, partlycloudy: { cl: 0.45 }, cloudy: { cl: 0.88 },
      rainy: { cl: 0.88, rain: 0.55 }, pouring: { cl: 1, rain: 1 }, snowy: { cl: 0.88, snow: 0.65 }, 'snowy-rainy': { cl: 0.92, rain: 0.3, snow: 0.45 },
      fog: { cl: 0.6, fog: 1 }, hail: { cl: 1, rain: 0.9 }, lightning: { cl: 0.95, light: 1 }, 'lightning-rainy': { cl: 1, rain: 0.8, light: 1 },
      windy: { cl: 0.3, wind: 1 }, 'windy-variant': { cl: 0.6, wind: 1 }, exceptional: { cl: 0.5 },
    };
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    function readEnv() {
      const sim = o.sim || S().sim3 || null, now = new Date();
      let hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
      if (sim && sim.hour != null) hour = sim.hour;
      const ss = states['sun.sun'], wid = typeof weatherId === 'function' ? weatherId() : '', ws = wid && states[wid];
      let elev, az;
      if (!(sim && sim.hour != null) && ss && ss.attributes && ss.attributes.elevation != null) { elev = Number(ss.attributes.elevation); az = Number(ss.attributes.azimuth) || 180; }
      else { elev = 55 * Math.sin((hour - 6) / 12 * Math.PI); az = ((hour - 6) / 24 * 360 + 90) % 360; }
      const cond = sim && sim.cond ? sim.cond : (ws ? String(ws.state) : 'sunny');
      const c = Object.assign({ cl: 0.1, rain: 0, snow: 0, fog: 0, light: 0, wind: 0 }, WCOND[cond] || {});
      const a = (ws && ws.attributes) || {};
      if (a.cloud_coverage != null && !(sim && sim.cond)) c.cl = Math.min(1, Math.max(0, Number(a.cloud_coverage) / 100));
      const wsp = Number(a.wind_speed); if (!isNaN(wsp) && !(sim && sim.cond)) c.wind = Math.max(c.wind, Math.min(1.5, wsp / 40));
      return Object.assign(c, { elev, az, cond, hour });
    }
    function buildEnv(cx, cz, R, maxY, gm) {
      const g = new T.Group(); world.add(g);
      const rTex = (stops, size = 128) => canvasTex(size, size, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); stops.forEach(([p, col]) => gr.addColorStop(p, col)); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
      const sunTex = rTex([[0, 'rgba(255,250,225,1)'], [0.12, 'rgba(255,244,200,1)'], [0.3, 'rgba(255,220,150,.35)'], [1, 'rgba(255,200,120,0)']]);
      const moonTex = rTex([[0, 'rgba(240,244,255,1)'], [0.2, 'rgba(225,232,250,.95)'], [0.3, 'rgba(180,200,240,.25)'], [1, 'rgba(150,170,220,0)']]);
      const cloudTex = canvasTex(256, 128, (c, w, h) => { for (let i = 0; i < 14; i++) { const x = w * (0.18 + 0.64 * Math.random()), y = h * (0.45 + 0.2 * Math.random()), r = h * (0.22 + 0.22 * Math.random()), gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); } });
      const dotTex = rTex([[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']], 32);
      const sp = (tex, sc) => { const m = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); m.scale.set(sc, sc, 1); m.renderOrder = -5; g.add(m); return m; };
      const sunS = sp(sunTex, R * 5), moonS = sp(moonTex, R * 2.4);
      const nCl = o.lowPower ? 9 : 16, cl = [];
      for (let i = 0; i < nCl; i++) { const m = sp(cloudTex, R * (3 + Math.random() * 3.5)); m.scale.y = m.scale.x * 0.45; cl.push({ m, a: Math.random() * 6.283, r: R * (6 + Math.random() * 5), y: R * (0.4 + Math.random() * 1.1), v: 0.6 + Math.random() * 0.8, k: i / nCl }); }
      const nSt = o.lowPower ? 150 : 350, sa = new Float32Array(nSt * 12), ss2 = R * 0.12;
      for (let i = 0; i < nSt; i++) { const u = Math.random() * 6.283, v = 0.08 + Math.random() * 0.9, r2 = R * 20, x = cx + Math.cos(u) * Math.cos(v) * r2, y = Math.sin(v) * r2, z = cz + Math.sin(u) * Math.cos(v) * r2, q = i * 12; sa.set([x - ss2, y, z, x + ss2, y, z, x, y - ss2, z, x, y + ss2, z], q); }
      const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sa, 3));
      const stars = new T.LineSegments(sg, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false })); stars.renderOrder = -6; stars.frustumCulled = false; g.add(stars);
      // Regen
      const nR = o.lowPower ? 450 : 1300, ra = new Float32Array(nR * 6), rp = new Float32Array(nR * 3), W = R * 2.4, H = Math.max(R * 1.6, maxY + 200);
      for (let i = 0; i < nR; i++) { rp[i * 3] = (Math.random() - 0.5) * W; rp[i * 3 + 1] = Math.random() * H; rp[i * 3 + 2] = (Math.random() - 0.5) * W; }
      const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(ra, 3));
      const rain = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0xcfe0f5, transparent: true, opacity: 0.85, fog: false, depthWrite: false })); rain.frustumCulled = false; rain.renderOrder = 20; g.add(rain);
      // Schnee
      const nS = o.lowPower ? 220 : 600, sn = new Float32Array(nS * 12), sq = new Float32Array(nS * 3), fs = Math.max(5, R * 0.014);
      for (let i = 0; i < nS; i++) { sq[i * 3] = (Math.random() - 0.5) * W; sq[i * 3 + 1] = Math.random() * H; sq[i * 3 + 2] = (Math.random() - 0.5) * W; }
      const ng = new T.BufferGeometry(); ng.setAttribute('position', new T.Float32BufferAttribute(sn, 3));
      const snow = new T.LineSegments(ng, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, fog: false })); snow.frustumCulled = false; snow.renderOrder = 20; g.add(snow);
      const gcol = colorOf(o.ground || S().ground3 || look.ground);
      envO = { g, sunS, moonS, cl, stars, rain, snow, rp, ra: rg.attributes.position.array, sq, sn: ng.attributes.position.array, fs, nR, nS, W, H, cx, cz, R, maxY, gm, gcol, snowAcc: 0, flash: 0, nextFlash: 3, sig: '', t0: 0, lastD: -1, skyCv: null, T0: performance.now(), wind: 0 };
      applyEnv(true);
    }
    function applyEnv(force) {
      const E = envO; if (!E) return false;
      const e = readEnv(), sg = [Math.round(e.elev * 2), Math.round(e.az), e.cl.toFixed(2), e.rain, e.snow, e.fog, e.light, e.wind.toFixed(1), o.lowPower].join('|');
      if (!force && sg === E.sig) return false;
      E.sig = sg; Object.assign(wx, e);
      const d = smooth(-6, 9, e.elev); wx.d = d;
      const tw = Math.exp(-Math.pow((e.elev - 3) / 7, 2)) * (1 - e.cl * 0.6);
      const C = (h) => new T.Color(h);
      const mix = (a, b, k) => a.clone().lerp(b, Math.min(1, Math.max(0, k)));
      const stops = [0, 1, 2].map(i => {
        let c = mix(C(['#050810', '#0d1526', '#1a2540'][i]), C(['#6aa6dd', '#cfe3f4', '#eef3f6'][i]), d);
        c = mix(c, C(['#3d5a99', '#f2a56b', '#ffd9a0'][i]), tw * 0.85);
        const grey = C(['#8d96a0', '#b3bac2', '#cfd4d9'][i]).multiplyScalar(0.18 + 0.82 * d);
        return mix(c, grey, e.cl * (0.7 + 0.2 * e.rain));
      });
      const stormy = Math.max(e.rain, e.light) * 0.45; if (stormy) stops.forEach(c => c.multiplyScalar(1 - stormy * 0.5));
      const tex = texCache.get('skylive') || canvasTex(8, 256, () => {}); texCache.set('skylive', tex);
      const cv2 = tex.image, g2 = cv2.getContext('2d'), gr = g2.createLinearGradient(0, 0, 0, cv2.height);
      gr.addColorStop(0, '#' + stops[0].getHexString()); gr.addColorStop(0.55, '#' + stops[1].getHexString()); gr.addColorStop(1, '#' + stops[2].getHexString());
      g2.fillStyle = gr; g2.fillRect(0, 0, cv2.width, cv2.height); tex.needsUpdate = true; scene.background = tex;
      const fogC = stops[1].clone(); const fogK = Math.min(1, e.fog);
      if (fogK) fogC.lerp(mix(C('#9aa3ab'), C('#10151c'), 1 - d), 0.6 * fogK);
      scene.fog = new T.Fog(fogC, radius * Math.max(0.6, 5 - 3.9 * e.fog - 1.5 * e.rain - 1 * e.snow), radius * Math.max(2.8, 16 - 11.5 * e.fog - 5 * e.rain - 3 * e.snow));
      // Licht: Sonne am Tag, Mond in der Nacht
      const useSun = e.elev > -1.5, ex = useSun ? Math.max(e.elev, 5) : Math.min(-e.elev, 45) + 20, eaz = useSun ? e.az : (e.az + 180) % 360;
      const rad = Math.PI / 180, dist = E.R * 3, dirx = Math.sin(eaz * rad) * Math.cos(ex * rad), diry = Math.sin(ex * rad), dirz = -Math.cos(eaz * rad) * Math.cos(ex * rad);
      sun.position.set(E.cx + dirx * dist, diry * dist + 10, E.cz + dirz * dist); sun.target.position.set(E.cx, 0, E.cz);
      const sunI = 3.6 * d * (1 - 0.78 * e.cl) + (useSun ? 0 : 0), moonI = 0.9 * (1 - d) * (1 - 0.6 * e.cl);
      sun.color.copy(useSun ? mix(C('#fff1d6'), C('#ff9a55'), tw * 1.1) : C('#9fb4e6'));
      E.baseSun = useSun ? Math.max(sunI, 0.05) : moonI;
      sun.intensity = E.baseSun;
      E.baseAmb = (0.35 + 0.55 * d) * (1 - 0.1 * e.cl); E.baseHemi = (0.55 + 0.95 * d) * (1 - 0.5 * e.cl);
      amb.intensity = E.baseAmb; hemi.intensity = E.baseHemi;
      hemi.color.copy(mix(C('#6f86b8'), C('#e8f2ff'), d)).lerp(C('#c9cfd6'), e.cl * 0.4 * d);
      hemi.groundColor.copy(mix(C('#1b2230'), C('#9a8a74'), d));
      // Sonne / Mond / Sterne / Wolken
      const sd = E.R * 14;
      const sdir = (el, az2) => [Math.sin(az2 * rad) * Math.cos(el * rad), Math.sin(el * rad), -Math.cos(az2 * rad) * Math.cos(el * rad)];
      const sv = sdir(Math.max(e.elev, -4), e.az); E.sunS.position.set(E.cx + sv[0] * sd, sv[1] * sd, E.cz + sv[2] * sd);
      E.sunS.material.opacity = smooth(-5, 2, e.elev) * (1 - 0.92 * e.cl); E.sunS.material.color.copy(mix(C('#ffffff'), C('#ff9d5c'), tw));
      const mv = sdir(Math.max(-e.elev, -4) + 8, (e.az + 180) % 360); E.moonS.position.set(E.cx + mv[0] * sd, mv[1] * sd, E.cz + mv[2] * sd);
      E.moonS.material.opacity = (1 - d) * (1 - 0.95 * e.cl) * smooth(-4, 3, -e.elev);
      E.stars.material.opacity = Math.pow(1 - d, 2) * (1 - e.cl) * 0.95;
      const ccol = mix(C('#ffffff'), C('#8d96a0'), e.cl * 0.8).multiplyScalar(0.22 + 0.78 * d).lerp(C('#ffb985'), tw * 0.45);
      E.cl.forEach(c => { c.m.visible = c.k < e.cl + 0.05; c.m.material.color.copy(ccol); c.m.material.opacity = Math.min(0.9, 0.3 + 0.55 * e.cl); });
      // Boden: Schnee
      E.snowTarget = Math.min(1, e.snow * 1.5);
      E.rainAmt = e.rain; E.snowAmt = e.snow;
      if (look.pl != null) { const np = Math.round(520 + (900 - 520) * (1 - d)); if (Math.abs(np - look.pl) > 40) { look.pl = np; applyLive(true); } }
      dirty = true; return true;
    }
    function animateEnv(dt, now) {
      const E = envO; if (!E) return false;
      let ch = false;
      if (!E.t0 || now - E.t0 > 1000) { E.t0 = now; if (applyEnv(false)) ch = true; }
      const w = wx.wind, wxs = (w * 260 + (wx.rain ? 60 : 0)) * 1;
      // Wolken ziehen
      E.cl.forEach(c => { if (!c.m.visible) return; c.a += dt * 0.012 * c.v * (1 + w * 2.5); c.m.position.set(E.cx + Math.cos(c.a) * c.r, c.y, E.cz + Math.sin(c.a) * c.r); }); ch = true;
      // Regen
      const rv = E.rainAmt || 0;
      E.rain.visible = rv > 0;
      if (rv > 0) {
        const n = Math.max(1, Math.round(E.nR * (0.25 + 0.75 * rv))), sp = 900 + 500 * rv, L = 40 + E.R * 0.06, lx = wxs / sp * L, ra = E.ra, rp = E.rp, W = E.W, H = E.H;
        for (let i = 0; i < n; i++) {
          let x = rp[i * 3] + wxs * dt, y = rp[i * 3 + 1] - sp * dt, z = rp[i * 3 + 2];
          if (y < 0) { y += H; x = (Math.random() - 0.5) * W; z = (Math.random() - 0.5) * W; }
          if (x > W / 2) x -= W;
          rp[i * 3] = x; rp[i * 3 + 1] = y; rp[i * 3 + 2] = z;
          const o6 = i * 6; ra[o6] = E.cx + x; ra[o6 + 1] = y; ra[o6 + 2] = E.cz + z; ra[o6 + 3] = E.cx + x - lx; ra[o6 + 4] = y + L; ra[o6 + 5] = E.cz + z;
        }
        E.rain.geometry.setDrawRange(0, n * 2); E.rain.geometry.attributes.position.needsUpdate = true;
        E.rain.material.color.set(wx.d > 0.3 ? 0xb4cbe6 : 0x8fa6c8); ch = true;
      }
      // Schnee
      const sv = E.snowAmt || 0;
      E.snow.visible = sv > 0;
      if (sv > 0) {
        const n = Math.max(1, Math.round(E.nS * (0.3 + 0.7 * Math.min(1, sv * 1.4)))), sq = E.sq, sn = E.sn, W = E.W, H = E.H, t = now / 1000;
        for (let i = 0; i < n; i++) {
          let x = sq[i * 3] + (wxs * 0.5 + Math.sin(t * 0.8 + i) * 12) * dt, y = sq[i * 3 + 1] - (70 + (i % 5) * 12) * dt, z = sq[i * 3 + 2] + Math.cos(t * 0.7 + i * 1.3) * 10 * dt;
          if (y < 0) { y += H; x = (Math.random() - 0.5) * W; z = (Math.random() - 0.5) * W; }
          if (x > W / 2) x -= W;
          sq[i * 3] = x; sq[i * 3 + 1] = y; sq[i * 3 + 2] = z; const X = E.cx + x, Z = E.cz + z, f = E.fs, q = i * 12; sn[q] = X - f; sn[q + 1] = y; sn[q + 2] = Z; sn[q + 3] = X + f; sn[q + 4] = y; sn[q + 5] = Z; sn[q + 6] = X; sn[q + 7] = y - f; sn[q + 8] = Z; sn[q + 9] = X; sn[q + 10] = y + f; sn[q + 11] = Z;
        }
        E.snow.geometry.setDrawRange(0, n * 4); E.snow.geometry.attributes.position.needsUpdate = true; ch = true;
      }
      // Schneedecke
      const tgt = E.snowTarget || 0, cur = E.snowAcc;
      if (Math.abs(tgt - cur) > 0.004 || E.snowShown == null) { E.snowAcc = cur + (tgt > cur ? 1 : -1) * Math.min(Math.abs(tgt - cur), dt * 0.05); E.snowShown = 1; if (E.gm && E.gm.material) E.gm.material.color.copy(E.gcol).lerp(new T.Color('#eef3f8'), E.snowAcc * 0.9); ch = true; }
      // Blitz
      if (wx.light) {
        E.nextFlash -= dt;
        if (E.nextFlash <= 0) { E.flash = 1; E.nextFlash = 3 + Math.random() * 6; }
      }
      if (E.flash > 0) { E.flash = Math.max(0, E.flash - dt * 3.2); const f = E.flash * (0.6 + 0.4 * Math.sin(E.flash * 30)); amb.intensity = E.baseAmb + 2.6 * f; hemi.intensity = E.baseHemi + 2.2 * f; sun.intensity = E.baseSun + 3 * f; renderer.toneMappingExposure = 1.12 + 0.6 * f; ch = true; if (E.flash === 0) { amb.intensity = E.baseAmb; hemi.intensity = E.baseHemi; sun.intensity = E.baseSun; renderer.toneMappingExposure = 1.12; } }
      return ch;
    }

    // ---------- Auswahl-Rahmen ----------
    function applySel() {
      const id = o.getSel ? o.getSel() : null;
      if (selBox && selBox.userData.id === id) return;
      if (selBox) { if (selBox.parent) selBox.parent.remove(selBox); selBox.geometry.dispose(); selBox = null; dirty = true; }
      if (!id) return;
      const r = items.find(x => x.it.id === id); if (!r) return;
      const hh = Math.max(r.h, 8) + 4;
      selBox = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(r.it.w + 4, hh, r.it.h + 4)), new T.LineBasicMaterial({ color: 0x03a9f4, depthTest: false, transparent: true }));
      selBox.renderOrder = 30; selBox.position.y = hh / 2 - 2; selBox.userData.id = id; r.group.add(selBox); dirty = true;
    }

    function buildAll() {
      clearWorld(); if (typeof FPM !== 'undefined') FPM.reset(T);
      const L3 = look, Hw = walkMode ? wallH() : o.walls === 'half' ? Math.min(100, wallH()) : o.walls === 'flat' ? 6 : wallH();
      const slab = wallH() + 14, floors = plan.floors, curIdx = Math.max(0, floors.findIndex(f => f.id === o.getFloor()));
      const levels = floors.map((f, i) => i).filter(i => floors[i].kind !== 'garden'), gardens = floors.map((f, i) => i).filter(i => floors[i].kind === 'garden');
      const curIsGarden = floors[curIdx] && floors[curIdx].kind === 'garden', grpKey = i => floors[i].bld || '';
      let groups = [...new Set(levels.map(grpKey))]; if (o.building) groups = groups.filter(g => g === o.building);
      const curG = curIsGarden || !groups.includes(grpKey(curIdx)) ? groups[0] : grpKey(curIdx);
      const showG = groups.map(g => { const L = levels.filter(i => grpKey(i) === g); let sh = L; if (!((o.allFloors && !walkMode) || curIsGarden || g !== curG)) { const lc = L.indexOf(curIdx); sh = L.filter((i, k) => k <= lc); } return { g, sh }; });
      const show = [].concat(...showG.map(x => x.sh)), lvCur = curIsGarden ? -1 : levels.filter(i => grpKey(i) === curG).indexOf(curIdx);
      groundY = curIsGarden ? -1 : Math.max(0, lvCur) * slab;
      let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9, maxY = 0;
      const grow = (b) => { minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x + b.w); minZ = Math.min(minZ, b.y); maxZ = Math.max(maxZ, b.y + b.h); };
      showG.forEach(({ sh }) => sh.forEach((i, k) => {
        const f = floors[i];
        buildFloor(f, i, k * slab, Hw, L3, k === sh.length - 1);
        grow(contentBounds(f)); maxY = Math.max(maxY, k * slab + wallH());
      }));
      gardens.forEach(i => { const f = floors[i]; buildFloor(f, i, -1, 110, L3, false); if (curIsGarden && i === curIdx) grow(contentBounds(f)); else if (!show.length) grow(contentBounds(f)); });
      const roofMode = walkMode ? 'none' : (o.roof || S().roof3 || 'none');
      showG.forEach(({ g: gk, sh }) => {
      if (roofMode !== 'none' && sh.length) {
        const ti = sh[sh.length - 1], tf = floors[ti], slabIdx = sh.length - 1;
        let rx0 = 1e9, rx1 = -1e9, rz0 = 1e9, rz1 = -1e9;
        (tf.walls || []).forEach(w2 => { rx0 = Math.min(rx0, w2.x1, w2.x2); rx1 = Math.max(rx1, w2.x1, w2.x2); rz0 = Math.min(rz0, w2.y1, w2.y2); rz1 = Math.max(rz1, w2.y1, w2.y2); });
        if (rx0 <= rx1) { const tt = Math.max(...(tf.walls || []).map(w2 => w2.t || S().wallThickness || 15)) / 2; rx0 -= tt; rx1 += tt; rz0 -= tt; rz1 += tt; }
        if (rx0 > rx1) { const b2 = contentBounds(tf); rx0 = b2.x; rx1 = b2.x + b2.w; rz0 = b2.y; rz1 = b2.y + b2.h; }
        const ov = Math.max(0, Number(S().roofOver3 != null ? S().roofOver3 : 40)), pitch = Math.min(60, Math.max(5, Number(S().roofPitch3) || 30)) * Math.PI / 180;
        const W = rx1 - rx0 + 2 * ov, D = rz1 - rz0 + 2 * ov, cx2 = (rx0 + rx1) / 2, cz2 = (rz0 + rz1) / 2, by = slabIdx * slab + wallH();
        const tiles = S().roofType3 === 'tiles' && roofMode !== 'flat';
        const rmat = new T.MeshStandardMaterial({ color: tiles ? 0xffffff : colorOf(S().roofColor3 || '#8a4b3a'), roughness: 0.85, metalness: 0.02, side: T.DoubleSide });
        if (tiles) rmat.map = roofTileTex(S().roofColor3 || '#8a4b3a');
        const alongX = W >= D, across = alongX ? D : W, len = alongX ? W : D;
        let rm = null, rh = 12;
        if (roofMode === 'flat') {
          rm = new T.Mesh(new T.BoxGeometry(W, 14, D), rmat); rm.position.set(cx2, by + 7, cz2);
        } else {
          rh = roofMode === 'shed' ? across * Math.tan(Math.min(pitch, 0.3)) : (across / 2) * Math.tan(pitch);
          rm = new T.Mesh(roofGeo(roofMode, across, len, rh), rmat); rm.position.set(cx2, by, cz2); rm.rotation.y = alongX ? Math.PI / 2 : 0;
        }
        rm.castShadow = true; rm.receiveShadow = true; world.add(rm);
        if (roofMode !== 'flat') { /* Gesims */ const gm2 = new T.Mesh(new T.BoxGeometry(W, 4, D), new T.MeshStandardMaterial({ color: colorOf(o.wallColor || S().wallColor3 || L3.wall), roughness: 0.9 })); gm2.position.set(cx2, by + 2, cz2); gm2.castShadow = true; world.add(gm2); }
        if (S().solar3 && gk === curG) buildSolar({ roofMode, W, D, cx2, cz2, by, rh, across, len, alongX, pitch });
        maxY = Math.max(maxY, by + rh);
      }
      });
      if (minX > maxX) { minX = -200; maxX = 200; minZ = -200; maxZ = 200; }
      const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2, R = Math.max(maxX - minX, maxZ - minZ, 300) / 2;
      radius = Math.hypot(maxX - minX, maxZ - minZ, maxY) / 2;
      // Boden/Umgebung
      const gm = new T.Mesh(new T.PlaneGeometry(R * 40, R * 40), new T.MeshStandardMaterial({ color: colorOf(o.ground || S().ground3 || L3.ground), roughness: 1 }));
      gm.rotation.x = -Math.PI / 2; gm.position.set(cx, -16, cz); gm.receiveShadow = true; world.add(gm);
      const bg = colorOf(L3.bg);
      if (L3.sky) { const sk = 'sky|' + lookKey(); let tx = texCache.get(sk); if (!tx) { tx = canvasTex(8, 256, (g, w2, h2) => { const gr = g.createLinearGradient(0, 0, 0, h2); gr.addColorStop(0, L3.sky[0]); gr.addColorStop(0.55, L3.sky[1]); gr.addColorStop(1, L3.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, w2, h2); }); texCache.set(sk, tx); } scene.background = tx; } else scene.background = bg;
      scene.fog = new T.Fog(bg, radius * 5, radius * 16);
      hemi.color.set(L3.hs); hemi.groundColor.set(L3.hg); sun.color.set(L3.sunc);
      amb.intensity = L3.amb; hemi.intensity = L3.hemi; sun.intensity = L3.sun;
      sun.position.set(cx + R * 1.2, maxY + R * 2, cz + R * 0.8); sun.target.position.set(cx, 0, cz);
      const sc = sun.shadow.camera; sc.left = -R * 1.6; sc.right = R * 1.6; sc.top = R * 1.6; sc.bottom = -R * 1.6; sc.near = 10; sc.far = R * 8; sc.updateProjectionMatrix();
      sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.6;
      if (L3.live) buildEnv(cx, cz, R, maxY, gm); else { envO = null; renderer.toneMappingExposure = 1.12; }
      const key = floors.map(f => f.id).join(',') + '|' + o.getFloor() + '|' + o.allFloors;
      if (!fitted || fitKey !== key) { cam.tx = cx; cam.ty = Math.min(maxY, 300) * 0.3; cam.tz = cz; cam.dist = radius / Math.sin(cam.fov ? cam.fov : 0.36) * 0.95; fitted = true; fitKey = key; }
      applyLive(true);
    }

    // ---------- Live-Zustände ----------
    function stateSig() {
      let s = '';
      plan.floors.forEach(f => f.items.forEach(it => { [it.entity, it.entity2].forEach(en => { if (en) { const st = states[en]; if (st) s += en + st.state + (st.attributes && st.attributes.brightness != null ? st.attributes.brightness : '') + (st.attributes && st.attributes.current_position != null ? 'p' + st.attributes.current_position : '') + (st.attributes && st.attributes.rgb_color ? st.attributes.rgb_color.join('') : '') + '|'; } }); }));
      return s + (typeof heatSig === 'function' ? heatSig() : '');
    }
    function applyLive(force) {
      let lights = 0;
      heatRooms.forEach(h => { const hc = heatFill(h.area); if (hc) h.mat.color.set(hc); else h.mat.color.copy(h.base); }); if (heatRooms.length) dirty = true;
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
        if (r.labelName) r.labelName.material.rotation = -(Number(it.labelRot) || 0) * Math.PI / 180;
        if (r.labelVal) r.labelVal.material.rotation = -(Number(it.valueRot) || 0) * Math.PI / 180;
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
    // ---------- Begehen (Ego-Perspektive, ohne Wand-Kollision) ----------
    let walk = null, walkMode = false, lastW = 0; const wkeys = new Set();
    function walkStartPos() {
      const f = plan.floors.find(x => x.id === o.getFloor()) || plan.floors[0];
      let best = null; (f.rooms || []).forEach(r => { if (r.pts && r.pts.length > 2) { const a = polyArea(r.pts); if (!best || a > best.a) best = { a, c: polyCentroid(r.pts) }; } });
      if (best) return { x: best.c[0], z: best.c[1] };
      const b = contentBounds(f); return { x: b.x + b.w / 2, z: b.y + b.h / 2 };
    }
    function setWalk(on) {
      on = !!on; if (on === !!walk) return;
      if (on) {
        walkMode = true; build(true);
        const p = walkStartPos(); walk = { x: p.x, z: p.z, y: groundY + 160, yaw: 0, pitch: 0 };
        camera.fov = 72; camera.updateProjectionMatrix();
        root.tabIndex = 0; try { root.focus({ preventScroll: true }); } catch (_) { /* egal */ }
      } else { walk = null; walkMode = false; camera.fov = 42; camera.updateProjectionMatrix(); fitted = false; wkeys.clear(); build(true); }
      dirty = true; if (o.onWalk) o.onWalk(!!walk);
    }
    function walkBlock(x, z) {
      const f = plan.floors.find(q => q.id === o.getFloor()) || plan.floors[0], R = 22;
      let px = x, pz = z;
      for (let it2 = 0; it2 < 2; it2++) (f.walls || []).forEach(wl => {
        const dx = wl.x2 - wl.x1, dy = wl.y2 - wl.y1, L = Math.hypot(dx, dy); if (L < 1) return;
        const ux = dx / L, uy = dy / L, qx = px - wl.x1, qz = pz - wl.y1, s0 = qx * ux + qz * uy, sc = Math.max(0, Math.min(L, s0));
        const cx = wl.x1 + ux * sc, cz = wl.y1 + uy * sc, ex = px - cx, ez = pz - cz, d = Math.hypot(ex, ez), rr = R + (wl.t || 10) / 2;
        if (d >= rr) return;
        if (openingsFor(wl, f).some(op => op.it.shape === 'door' && s0 > op.a - R * 0.5 && s0 < op.b + R * 0.5)) return;
        const nx = d > 0.01 ? ex / d : -uy, nz = d > 0.01 ? ez / d : ux; px = cx + nx * rr; pz = cz + nz * rr;
      });
      return [px, pz];
    }
    function walkMove(fw, st) { const s2 = Math.sin(walk.yaw), c2 = Math.cos(walk.yaw); const q = walkBlock(walk.x + s2 * fw + c2 * st, walk.z - c2 * fw + s2 * st); walk.x = q[0]; walk.z = q[1]; }
    function walkKeys(dt) {
      if (!walk || !wkeys.size) return false;
      const sp = (wkeys.has('shift') ? 320 : 160) * dt, k = n => wkeys.has(n);
      const fw = (k('w') || k('arrowup') ? 1 : 0) - (k('s') || k('arrowdown') ? 1 : 0), st = (k('d') ? 1 : 0) - (k('a') ? 1 : 0), tr = (k('e') || k('arrowright') ? 1 : 0) - (k('q') || k('arrowleft') ? 1 : 0);
      if (tr) walk.yaw += tr * 1.6 * dt; if (fw || st) walkMove(fw * sp, st * sp);
      return !!(fw || st || tr);
    }
    root.addEventListener('keydown', e => { if (!walk) return; const k = e.key.toLowerCase(); if ('wasdqe'.includes(k) && k.length === 1 || k.startsWith('arrow') || k === 'shift') { wkeys.add(k); if (k !== 'shift') e.preventDefault(); } if (k === 'escape') setWalk(false); });
    root.addEventListener('keyup', e => { wkeys.delete(e.key.toLowerCase()); });
    root.addEventListener('blur', () => wkeys.clear());
    function placeCamera() {
      if (walk) { const cp0 = Math.cos(walk.pitch); camera.position.set(walk.x, walk.y, walk.z); camera.lookAt(walk.x + Math.sin(walk.yaw) * cp0, walk.y + Math.sin(walk.pitch), walk.z - Math.cos(walk.yaw) * cp0); return; }
      const sp = Math.sin(cam.pol), cp = Math.cos(cam.pol);
      camera.position.set(cam.tx + cam.dist * sp * Math.sin(cam.az), cam.ty + cam.dist * cp, cam.tz + cam.dist * sp * Math.cos(cam.az));
      camera.lookAt(cam.tx, cam.ty, cam.tz);
    }
    const pct = document.createElement('div');
    pct.style.cssText = 'position:absolute;display:none;pointer-events:none;z-index:5;padding:3px 9px;border-radius:12px;background:rgba(20,20,20,.82);color:#fff;font:600 14px system-ui,sans-serif;white-space:nowrap';
    root.appendChild(pct);
    function showPct(e, v) { const r = cv.getBoundingClientRect(), rr = root.getBoundingClientRect(); pct.textContent = Math.round(v * 100) + ' %'; pct.style.display = 'block'; pct.style.left = Math.min(rr.width - 60, e.clientX - rr.left + 22) + 'px'; pct.style.top = Math.max(0, e.clientY - rr.top - 34) + 'px'; }
    const ptrs = new Map(); let gesture = null, tap = null, tapTimer = 0;
    const ray = new T.Raycaster(), v2 = new T.Vector2();
    // ---------- Rollladen/Garagentore per Ziehen öffnen und schließen ----------
    function coverRec(id) {
      const a = items.find(r => r.it.id === id && r.anim && r.anim.type === 'cover'), b = opens.find(r => r.cover && r.it.id === id);
      const rec = a || b; if (!rec || !/^cover\./.test(rec.it.entity || '')) return null;
      return rec;
    }
    function coverVal(rec) { return rec.anim ? (rec.cv != null ? rec.cv : (coverCache.has(rec.it.id) ? coverCache.get(rec.it.id) : 0)) : rec.o; }
    const _p0 = new T.Vector3(), _p1 = new T.Vector3();
    function coverPx(rec) {
      let x, z, yb, yt;
      if (rec.anim) { rec.group.getWorldPosition(_p0); x = _p0.x; z = _p0.z; yb = _p0.y; yt = yb + (rec.h || 100); }
      else { rec.anchor.getWorldPosition(_p0); x = _p0.x; z = _p0.z; yt = _p0.y; yb = yt - rec.hh; }
      _p0.set(x, yb, z).project(camera); _p1.set(x, yt, z).project(camera);
      const r = cv.getBoundingClientRect();
      return Math.max(30, Math.abs(_p1.y - _p0.y) * r.height / 2);
    }
    function coverSet(rec, v) {
      v = Math.max(0, Math.min(1, v));
      if (rec.anim) { rec.cv = v; coverCache.set(rec.it.id, v); rec.anim.set(v); rec.hold = { v, until: performance.now() + 4500 }; }
      else { rec.o = v; rec.t = 0; rec.set(v, 0); rec.hold = { v, until: performance.now() + 4500 }; openCache.set(rec.it.id, { o: v, t: 0 }); }
      dirty = true; return v;
    }
    function pick(e) {
      const r = cv.getBoundingClientRect();
      v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const vis = ob => { for (let n = ob; n; n = n.parent) if (n.visible === false) return false; return true; };
      const hit = ray.intersectObjects(pickables, false).find(h => vis(h.object));
      return hit ? hit.object.userData.itemId : null;
    }
    function groundPoint(e, gy) {
      const r = cv.getBoundingClientRect();
      v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
      const ro = ray.ray.origin, rd = ray.ray.direction; if (Math.abs(rd.y) < 1e-6) return null;
      const t = (gy - ro.y) / rd.y; if (t < 0) return null;
      return { x: ro.x + rd.x * t, z: ro.z + rd.z * t };
    }
    function panBy(dx, dy) {
      const k = cam.dist * 0.0012, r = [Math.cos(cam.az), -Math.sin(cam.az)], u = [-Math.sin(cam.az), -Math.cos(cam.az)];
      cam.tx += -r[0] * dx * k + u[0] * dy * k; cam.tz += -r[1] * dx * k + u[1] * dy * k;
    }
    const limit = () => { cam.pol = Math.min(1.53, Math.max(0.02, cam.pol)); cam.dist = Math.min(radius * 8, Math.max(80, cam.dist)); };
    cv.addEventListener('pointerdown', e => {
      try { cv.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        const mousePan = e.pointerType === 'mouse' && (e.button === 1 || e.button === 2 || e.shiftKey);
        gesture = { t: mousePan ? 'pan' : 'orbit' };
        gesture.base = true;
        const placing = !!(o.placing && o.placing());
        tap = { x: e.clientX, y: e.clientY, id: !placing && (e.button === 0 || e.pointerType !== 'mouse') ? pick(e) : null, moved: false, long: false, time: Date.now() };
        if (tap.id && o.canDrag && o.canDrag(tap.id)) { const rec = items.find(r => r.it.id === tap.id), gp = rec && groundPoint(e, rec.floorY); if (rec && gp) gesture = { t: 'drag', rec, off: { x: gp.x - rec.group.position.x, z: gp.z - rec.group.position.z }, dragging: false }; }
        else if (tap.id && o.canCover && o.canCover()) { const cr = coverRec(tap.id); if (cr) gesture = { t: 'cover', rec: cr, y0: e.clientY, v0: coverVal(cr), px: coverPx(cr), v: null }; }
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
      if (gesture.t === 'cover') {
        if (ptrs.size === 1 && tap && tap.moved) { gesture.v = coverSet(gesture.rec, gesture.v0 - (e.clientY - gesture.y0) / gesture.px); gesture.rec.dragging = true; showPct(e, gesture.v); }
        return;
      }
      if (gesture.t === 'drag') {
        if (ptrs.size === 1 && tap && tap.moved) {
          const gp = groundPoint(e, gesture.rec.floorY);
          if (gp) { let nx = gp.x - gesture.off.x, nz = gp.z - gesture.off.z; if (o.snap) { nx = o.snap(nx); nz = o.snap(nz); } const rc = gesture.rec; rc.group.position.x = nx; rc.group.position.z = nz; rc.nx = nx; rc.nz = nz; rc.dragging = true; gesture.dragging = true; if (rc.robot) { rc.robot.x = nx; rc.robot.z = nz; } dirty = true; }
        }
        return;
      }
      if (walk && gesture.t === 'orbit' && ptrs.size === 1) { if (!tap || tap.moved) { walk.yaw -= dx * 0.005; if (e.pointerType === 'touch') walkMove(-dy * 1.6, 0); else walk.pitch = Math.max(-1.2, Math.min(1.2, walk.pitch + dy * 0.004)); dirty = true; } }
      else if (gesture.t === 'orbit' && ptrs.size === 1) { if (!tap || tap.moved) { cam.az -= dx * 0.008; if (!(o.touchScroll && e.pointerType === 'touch' && !(o.touchTilt && o.touchTilt()))) cam.pol -= dy * (e.pointerType === 'touch' ? 0.009 : 0.0075); limit(); dirty = true; } }
      else if (gesture.t === 'pan' && ptrs.size === 1) { panBy(dx, dy); dirty = true; }
      else if (gesture.t === 'pinch' && ptrs.size === 2 && !walk) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        cam.dist *= gesture.d / d; let da = ang - gesture.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); cam.az -= da;
        panBy(mx - gesture.mx, my - gesture.my);
        gesture.d = d; gesture.ang = ang; gesture.mx = mx; gesture.my = my; limit(); dirty = true;
      }
    });
    const up = e => {
      ptrs.delete(e.pointerId); cv.style.cursor = 'grab'; pct.style.display = 'none';
      if (ptrs.size === 0) {
        clearTimeout(tapTimer);
        if (gesture && gesture.t === 'cover') { const g2 = gesture; g2.rec.dragging = false; if (g2.v != null) { tap = null; gesture = null; if (o.onCover) o.onCover(g2.rec.it, g2.v); return; } }
        if (gesture && gesture.t === 'drag' && gesture.dragging) { const rc = gesture.rec; rc.dragging = false; tap = null; gesture = null; if (o.onDragEnd) o.onDragEnd(rc.it.id, rc.nx, rc.nz); return; }
        if (tap && !tap.moved && !tap.long && e.type === 'pointerup' && Date.now() - tap.time < 700) { if (tap.id && o.onTap) o.onTap(tap.id, false); else if (o.onEmptyTap) o.onEmptyTap(groundPoint(e, groundY)); }
        tap = null; gesture = null;
      } else if (ptrs.size === 1) { gesture = { t: 'orbit' }; if (tap) tap.moved = true; }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => {
      if (o.wheel === 'ctrl' && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      if (walk) { walkMove(-dy * 0.6, 0); dirty = true; return; }
      if (e.shiftKey) cam.az -= dy * 0.003; else cam.dist *= Math.exp(dy * (e.ctrlKey ? 0.01 : 0.0012));
      limit(); dirty = true;
    }, { passive: false });
    cv.addEventListener('dblclick', () => { if (walk) return; fitted = false; build(true); });

    function resize() {
      const r = root.getBoundingClientRect(), w = Math.max(50, Math.round(r.width)), h = Math.max(50, Math.round(r.height));
      const sig = w + 'x' + h; if (sig === sizeSig) return; sizeSig = sig;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null; if (ro) ro.observe(root);

    let raf = 0, visible = true;
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(es => { const v = es[es.length - 1].isIntersecting; if (v && !visible) dirty = true; visible = v; }) : null; if (io) io.observe(root);
    function animateWalls() {
      if (walkMode || o.walls !== 'auto' || !wallGroups.length) return false;
      const dx = Math.sin(cam.az), dz = Math.cos(cam.az); let busy = false;
      wallGroups.forEach(wg => {
        const n = wg.userData.n, tgt = (n[0] * dx + n[1] * dz) > 0.2 ? 0.12 : 1, d = tgt - wg.scale.y;
        if (Math.abs(d) > 0.005) { wg.scale.y += d * 0.3; busy = true; } else wg.scale.y = tgt;
      });
      return busy;
    }
    function frame() {
      raf = 0; if (destroyed) return;
      if (!visible || document.hidden) { raf = requestAnimationFrame(frame); return; }
      step();
      if (dirty) { dirty = false; limit(); placeCamera(); renderer.render(scene, camera); }
      raf = requestAnimationFrame(frame);
    }
    function step() {
      if (animateWalls()) dirty = true;
      if (walk) { const nW = performance.now(), dW = Math.min(0.1, (nW - (lastW || nW)) / 1000); lastW = nW; if (walkKeys(dW)) dirty = true; } else lastW = 0;
      const othersA = solar || opens.length || items.some(r => r.robot || r.anim);
      if (othersA || envO) { const nowT = performance.now(), dtA = (nowT - (lastAnim || nowT)) / 1000, minDt = othersA ? 0.028 : (envO && (wx.rain || wx.snow || wx.light) ? (o.lowPower ? 0.05 : 0.03) : 0.1); if (!lastAnim || dtA > minDt) { lastAnim = nowT; if (animateAll(Math.min(dtA, 0.1), nowT)) dirty = true; } }
    }

    // ---------- WebXR (VR: Haus im Maßstab 1:1 begehen, AR: Modell auf dem Tisch) ----------
    let xr = null;
    function xrSupported(mode) { return !!(navigator.xr && navigator.xr.isSessionSupported) ? navigator.xr.isSessionSupported(mode).catch(() => false) : Promise.resolve(false); }
    async function startXR(mode) {
      if (xr || !navigator.xr) return false;
      const ar = mode === 'ar';
      let sess; try { sess = await navigator.xr.requestSession(ar ? 'immersive-ar' : 'immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] }); } catch (e) { return false; }
      const wasWalk = !!walk, bg = scene.background, fog = scene.fog;
      if (!ar && !wasWalk) { walkMode = true; build(true); }
      if (ar) { scene.background = null; scene.fog = null; renderer.setClearColor(0x000000, 0); }
      const f = plan.floors.find(q => q.id === o.getFloor()) || plan.floors[0], bb = contentBounds(f);
      const k = ar ? 1 / 3000 : 0.01, st = walkStartPos(), cx = bb.x + bb.w / 2, cz = bb.y + bb.h / 2;
      const w0 = { p: world.position.clone(), s: world.scale.clone(), r: world.rotation.y };
      world.scale.setScalar(k);
      if (ar) world.position.set(-cx * k, 0.8 - groundY * k, -cz * k - 0.9); else world.position.set(-st.x * k, -groundY * k, -st.z * k);
      renderer.xr.enabled = true;
      try { renderer.xr.setReferenceSpaceType('local-floor'); } catch (_) { /* egal */ }
      xr = { sess, ar, k, last: 0 };
      cancelAnimationFrame(raf); raf = 0;
      const head = new T.Vector3();
      renderer.setAnimationLoop((tm) => {
        const dt = Math.min(0.1, (tm - (xr.last || tm)) / 1000); xr.last = tm;
        if (!ar) { // Stick-Bewegung mit Wandkollision
          sess.inputSources.forEach(src => {
            const ax = src.gamepad && src.gamepad.axes; if (!ax) return;
            const sx = Math.abs(ax[2]) > 0.15 ? ax[2] : (Math.abs(ax[0]) > 0.15 ? ax[0] : 0), sy = Math.abs(ax[3]) > 0.15 ? ax[3] : (Math.abs(ax[1]) > 0.15 ? ax[1] : 0);
            if (!sx && !sy) return;
            const xc = renderer.xr.getCamera(camera); head.setFromMatrixPosition(xc.matrixWorld);
            const q = new T.Vector3(); xc.getWorldDirection(q); const yaw = Math.atan2(q.x, -q.z), sp = 160 * dt;
            const hx = (head.x - world.position.x) / k, hz = (head.z - world.position.z) / k;
            const nx = hx + (Math.sin(yaw) * -sy + Math.cos(yaw) * sx) * sp, nz = hz + (-Math.cos(yaw) * -sy + Math.sin(yaw) * sx) * sp;
            const bl = walkBlock(nx, nz); world.position.x -= (bl[0] - hx) * k; world.position.z -= (bl[1] - hz) * k;
          });
        } else sess.inputSources.forEach(src => { const ax = src.gamepad && src.gamepad.axes; if (ax && Math.abs(ax[2] || ax[0] || 0) > 0.15) world.rotation.y += (ax[2] || ax[0]) * dt; });
        step(); renderer.render(scene, camera);
      });
      sess.addEventListener('end', () => {
        renderer.setAnimationLoop(null); renderer.xr.enabled = false;
        world.position.copy(w0.p); world.scale.copy(w0.s); world.rotation.y = w0.r;
        if (ar) { scene.background = bg; scene.fog = fog; renderer.setClearColor(0x000000, 1); }
        camera.fov = walk ? 72 : 42; camera.updateProjectionMatrix();
        if (!ar && !wasWalk) { walkMode = false; build(true); }
        xr = null; dirty = true; fitted = false; if (!destroyed) raf = requestAnimationFrame(frame);
        if (o.onXR) o.onXR(null);
      });
      try { await renderer.xr.setSession(sess); } catch (e) { try { sess.end(); } catch (_) { /* egal */ } return false; }
      if (o.onXR) o.onXR(mode);
      return true;
    }
    function stopXR() { if (xr) try { xr.sess.end(); } catch (_) { /* egal */ } }


    function structSig() {
      return JSON.stringify([plan.floors, S().wallColor, S().wallColor3, S().roof3, S().roofColor3, S().roofPitch3, S().roofOver3, S().solar3, S().solarFill3, S().solarCount3, S().roofType3, S().solarSide3, S().ground3, o.roof, o.wallColor, o.ground, S().wallH3, S().symStyle, S().labelSize, S().wallThickness, o.look, o.walls, o.allFloors, walkMode ? 1 : 0, o.building || '', o.getFloor(), o.dark() ? 1 : 0, o.lowPower ? 1 : 0, typeof heatMetric === 'function' ? heatMetric() : '']);
    }
    function build(force) {
      look = LOOKS[lookKey()] || LOOKS.day;
      if (look.live) look = Object.assign({}, look);
      const sg = structSig();
      if (!force && sg === built) return false;
      built = sg;
      buildAll(); liveSig = stateSig(); dirty = true;
      if (walk) walk.y = groundY + 160;
      return true;
    }
    function update() {
      if (destroyed) return;
      resize();
      if (!build(false)) { const ls = stateSig(); if (ls !== liveSig) { liveSig = ls; applyLive(); } }
      applySel();
    }
    function resetView() { fitted = false; cam.az = 0.55; cam.pol = 0.95; build(true); }
    function set(k, v) { o[k] = v; if (k === 'touchTilt') { applyTouch(); return; } build(true); }
    function destroy() { destroyed = true; wkeys.clear(); cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); clearWorld(); renderer.dispose(); root.remove(); }

    resize(); build(true); frame();
    return { _walk: () => walk, _world: () => world, startXR, stopXR, xrSupported, inXR: () => !!xr, setWalk, isWalking: () => !!walk, setSim: (sm) => { o.sim = sm; if (envO) applyEnv(true); }, hasEnv: () => !!envO, _env: () => envO, _wx: wx, screenOf: id => { const r = items.find(x => x.it.id === id) || opens.find(x => x.it.id === id); if (!r) return null; const v = new T.Vector3(); if (r.group) r.group.getWorldPosition(v), v.y += (r.h || 50) / 2; else { r.anchor.getWorldPosition(v); v.y -= (r.hh || 100) / 2; } v.project(camera); const b = cv.getBoundingClientRect(); return [b.left + (v.x + 1) / 2 * b.width, b.top + (1 - v.y) / 2 * b.height]; }, robotPos: () => items.filter(r => r.robot).map(r => [r.it.type, r.robot.x, r.robot.z]), update, resetView, applyTouch, set, destroy, resize, el: root, rotate: (da) => { cam.az += da; dirty = true; }, zoom: (f) => { cam.dist *= f; limit(); dirty = true; }, cam, get opts() { return o; } };
  }

  return { load, create, dims3, ROBOTS };
})();
