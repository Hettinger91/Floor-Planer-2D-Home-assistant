'use strict';
const ROOM_COLORS = ['#90caf9', '#a5d6a7', '#ffcc80', '#ce93d8', '#80cbc4', '#ef9a9a', '#fff59d', '#b0bec5'];

const DEFAULT_SETTINGS = {
  grid: 25, snap: true, showGrid: true, showDims: true, showArea: true, showRoomNames: true,
  labelSize: 20, wallThickness: 15, wallColor: '', roomOpacity: 0.28, itemShadow: true, symStyle: 'b', viewRot: 0, unit: 'm', theme: 'auto',
  pollSec: 4, rectWalls: true, liveTap: 'toggle',
};

// Farben je Kategorie
const CF = '#d7ccc8', CA = '#cfd8dc', CW = '#b3e5fc', CH = '#ffccbc', CS = '#c5e1a5', CB = '#eceff1';

function T(cat, id, name, icon, w, h, color, o = {}) {
  return { cat, id, name, icon, w, h, color, shape: o.shape || 'rect', glow: !!o.glow, hint: o.hint || '', wall: !!o.wall };
}

// Maße in cm
const LIB = [
  T('Licht', 'lamp_ceiling', 'Deckenlampe', '💡', 34, 34, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_floor', 'Stehlampe', '🪔', 30, 30, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_wall', 'Wandlampe', '🔆', 24, 12, CB, { glow: true, hint: 'light' }),
  T('Licht', 'lamp_spot', 'Spot', '🔦', 16, 16, CB, { shape: 'ellipse', glow: true, hint: 'light' }),
  T('Licht', 'lamp_strip', 'LED-Streifen', '✨', 150, 8, CB, { glow: true, hint: 'light' }),

  T('Möbel', 'bed_double', 'Doppelbett', '🛏️', 180, 200, CF),
  T('Möbel', 'bed_single', 'Einzelbett', '🛏️', 90, 200, CF),
  T('Möbel', 'bed_kid', 'Kinderbett', '🛏️', 70, 140, CF),
  T('Möbel', 'sofa', 'Sofa', '🛋️', 200, 90, CF),
  T('Möbel', 'armchair', 'Sessel', '🛋️', 80, 80, CF),
  T('Möbel', 'table_coffee', 'Couchtisch', '', 100, 60, CF),
  T('Möbel', 'table_dining', 'Esstisch', '🍽️', 160, 90, CF),
  T('Möbel', 'chair', 'Stuhl', '🪑', 45, 45, CF),
  T('Möbel', 'desk', 'Schreibtisch', '🖥️', 140, 70, CF),
  T('Möbel', 'wardrobe', 'Kleiderschrank', '👔', 200, 60, CF),
  T('Möbel', 'shelf', 'Regal', '📚', 100, 35, CF),
  T('Möbel', 'dresser', 'Kommode', '🗄️', 100, 45, CF),
  T('Möbel', 'tv_board', 'TV-Board', '📺', 160, 40, CF),

  T('Küche & Bad', 'fridge', 'Kühlschrank', '🧊', 60, 65, CA),
  T('Küche & Bad', 'stove', 'Herd', '🍳', 60, 60, CA),
  T('Küche & Bad', 'sink_kitchen', 'Spüle', '🚰', 120, 60, CA),
  T('Küche & Bad', 'dishwasher', 'Spülmaschine', '🫧', 60, 60, CA),
  T('Küche & Bad', 'washer', 'Waschmaschine', '🧺', 60, 60, CA),
  T('Küche & Bad', 'bathtub', 'Badewanne', '🛁', 170, 75, CW),
  T('Küche & Bad', 'shower', 'Dusche', '🚿', 90, 90, CW),
  T('Küche & Bad', 'toilet', 'WC', '🚽', 40, 65, CW),
  T('Küche & Bad', 'basin', 'Waschbecken', '🚰', 60, 45, CW),

  T('Heizung & Klima', 'radiator', 'Heizkörper', '♨️', 100, 12, CH, { hint: 'climate' }),
  T('Heizung & Klima', 'thermostat', 'Thermostat', '🌡️', 22, 22, CH, { shape: 'ellipse', hint: 'climate' }),
  T('Heizung & Klima', 'ac', 'Klimagerät', '❄️', 90, 25, CH, { hint: 'climate' }),
  T('Heizung & Klima', 'fan', 'Ventilator', '🌀', 40, 40, CH, { shape: 'ellipse', hint: 'fan' }),
  T('Heizung & Klima', 'fireplace', 'Kamin / Ofen', '🔥', 80, 40, CH),
  T('Heizung & Klima', 'boiler', 'Heizkessel', '🔥', 60, 60, CH),

  T('Smart Home', 'outlet', 'Steckdose', '🔌', 16, 16, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'switch', 'Schalter', '🎚️', 16, 16, CS, { shape: 'ellipse', hint: 'switch' }),
  T('Smart Home', 'sensor_temp', 'Temperatursensor', '🌡️', 18, 18, CS, { shape: 'ellipse', hint: 'sensor' }),
  T('Smart Home', 'sensor_hum', 'Feuchtesensor', '💧', 18, 18, CS, { shape: 'ellipse', hint: 'sensor' }),
  T('Smart Home', 'sensor_motion', 'Bewegungsmelder', '👁️', 18, 18, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'sensor_contact', 'Tür-/Fensterkontakt', '🧲', 16, 16, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'smoke', 'Rauchmelder', '🚨', 18, 18, CS, { shape: 'ellipse', hint: 'binary_sensor' }),
  T('Smart Home', 'camera', 'Kamera', '📷', 20, 20, CS, { shape: 'ellipse', hint: 'camera' }),
  T('Smart Home', 'speaker', 'Lautsprecher', '🔊', 24, 24, CS, { hint: 'media_player' }),
  T('Smart Home', 'blind', 'Rollladen / Jalousie', '🪟', 100, 10, CS, { hint: 'cover' }),
  T('Smart Home', 'router', 'Router', '📶', 24, 18, CS),
  T('Smart Home', 'dongle', 'Zigbee-/Matter-Stick', '📡', 20, 20, CS, { shape: 'ellipse' }),
  T('Smart Home', 'vacuum', 'Saugroboter', '🤖', 35, 35, CS, { shape: 'ellipse', hint: 'vacuum' }),
  T('Smart Home', 'bell', 'Klingel', '🔔', 16, 16, CS, { shape: 'ellipse' }),
  T('Smart Home', 'lock', 'Türschloss', '🔒', 16, 16, CS, { shape: 'ellipse', hint: 'lock' }),
  T('Smart Home', 'wallbox', 'Wallbox', '⚡', 30, 20, CS),
  T('Smart Home', 'meter_power', 'Stromzähler', '⚡', 40, 25, CS, { hint: 'sensor' }),
  T('Smart Home', 'meter_gas', 'Gaszähler', '🔥', 30, 25, CS, { hint: 'sensor' }),

  T('Bau & Deko', 'door', 'Tür', '', 90, 15, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'door_double', 'Doppeltür', '', 160, 15, CB, { shape: 'door', wall: true }),
  T('Bau & Deko', 'window', 'Fenster', '', 100, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'window_big', 'Fenster groß', '', 200, 15, CB, { shape: 'window', wall: true }),
  T('Bau & Deko', 'stairs', 'Treppe', '🪜', 100, 260, CB),
  T('Bau & Deko', 'plant', 'Pflanze', '🪴', 40, 40, '#c8e6c9', { shape: 'ellipse' }),
  T('Bau & Deko', 'rug', 'Teppich', '', 200, 140, '#e1bee7'),
  T('Bau & Deko', 'pillar', 'Säule', '', 30, 30, '#b0bec5'),
  T('Bau & Deko', 'text', 'Beschriftung', 'Aa', 200, 40, '', { shape: 'text' }),
];

function typeList() {
  const m = new Map();
  LIB.forEach(t => m.set(t.id, { ...t }));
  ((typeof plan !== 'undefined' && plan && plan.customTypes) || []).forEach(t =>
    m.set(t.id, { ...t, custom: true, builtin: LIB.some(b => b.id === t.id) }));
  return [...m.values()];
}
function typeById(id) { return typeList().find(t => t.id === id); }

function newItemFromType(t, x, y) {
  const it = {
    id: uid(), type: t.id, x, y, w: t.w, h: t.h, rot: 0, shape: t.shape || 'rect',
    icon: t.icon || '', color: t.color || '', label: '', showLabel: true, entity: '',
    showValue: false, glow: !!t.glow, onColor: '', tap: 'auto', svc: '', svcData: '',
    flipX: false, flipY: false, iconScale: 1, hint: t.hint || '',
  };
  if (it.shape === 'text') { it.label = 'Text'; it.fs = 28; it.color = ''; fitText(it); }
  return it;
}

function fitText(it) {
  const lines = String(it.label || ' ').split('\n');
  const fs = it.fs || 28;
  it.w = Math.max(20, Math.max(...lines.map(l => l.length)) * fs * 0.6 + fs * 0.6);
  it.h = Math.max(fs, lines.length * fs * 1.2 + fs * 0.2);
}
