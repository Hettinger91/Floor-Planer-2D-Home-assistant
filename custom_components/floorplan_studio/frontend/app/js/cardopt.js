'use strict';
// Optionen der Dashboard-Karte (window.FP_CARDCFG): Sperren, Bestätigen, Einheiten, Aktionen, Schwellwerte.
const CC = () => window.FP_CARDCFG || {};
const ccHas = k => { const v = CC()[k]; return v !== undefined && v !== null && v !== ''; };
function ccAdminOk() { try { const u = HOST.user ? HOST.user() : null; return !!(u && u.is_admin); } catch (_) { return false; } }
function ccLocked() { const c = CC(); return !!(c.readonly || (c.admin_only && !ccAdminOk())); }
const CC_CRIT_DOM = ['lock', 'alarm_control_panel'];
function ccCritical(domain, data) {
  const c = CC(), ids = [].concat((data && data.entity_id) || []);
  const list = String(c.confirm_entities || '').split(/[,\s]+/).filter(Boolean);
  if (ids.some(id => list.some(x => x === id || (x.endsWith('.*') && id.startsWith(x.slice(0, -1)))))) return true;
  if (!c.confirm_critical) return false;
  if (CC_CRIT_DOM.includes(domain)) return true;
  return ids.some(id => { const s = states[id], dc = s && s.attributes && s.attributes.device_class; return CC_CRIT_DOM.includes(domainOf(id)) || (domainOf(id) === 'cover' && ['garage', 'gate', 'door'].includes(dc)); });
}
async function ccGate(domain, service, data) {
  if (ccLocked()) { fpToast(CC().readonly ? 'Nur Anzeige – Schalten ist gesperrt' : 'Schalten ist nur für Administratoren erlaubt'); return false; }
  if (ccCritical(domain, data)) {
    const names = [].concat((data && data.entity_id) || []).map(id => (states[id] && states[id].attributes && states[id].attributes.friendly_name) || id).join(', ');
    return fpAsk('Wirklich ausführen? ' + names);
  }
  return true;
}
// Einheiten
function ccDec(d) { const v = CC().decimals; return v === undefined || v === null || v === '' ? d : Math.max(0, Math.min(3, Number(v))); }
function ccTemp(v, unit) { // → [Wert, Einheit]
  const t = CC().temp_unit, u = unit || '°C';
  if (t === 'F' && /^°?C$/.test(u)) return [v * 1.8 + 32, '°F'];
  if (t === 'C' && /^°?F$/.test(u)) return [(v - 32) / 1.8, '°C'];
  return [v, u];
}
function ccTempStr(v, d = 1, bare) { const [x, u] = ccTemp(v, '°C'); return fmtN(x, ccDec(d)) + (bare ? '°' : ' ' + u); }
// Aktionen für Doppeltipp/Langdruck: true = erledigt, 'toggle' = normale Tipp-Aktion ausführen, false = Standard
function ccAct(kind, it, room) {
  const act = CC()[kind]; if (!act || act === 'default') return false;
  if (act === 'none') return true;
  if (act === 'toggle') return 'toggle';
  const id = it && it.entity ? it.entity : room && room.entity;
  if (act === 'details') { if (id) openDetails(id); else if (room) roomHistory(room); return true; }
  if (act === 'history') { const h = id && histEntry(id); if (h && domainOf(id) === 'sensor') historyPopup(h.label, [h]); else if (room && roomHistory(room)) { /* ok */ } else if (id) HOST.moreInfo(id); return true; }
  return false;
}
// Schwellwert-Alarme je Raum (Karte)
function ccThresholdAlarms() {
  const c = CC(), out = [];
  if (!['th_co2', 'th_hum_hi', 'th_hum_lo', 'th_temp_hi', 'th_temp_lo'].some(k => ccHas(k))) return out;
  plan.floors.forEach(f => f.rooms.forEach(r => {
    if (!r.area) return; const s = areaSummary(r.area), n = r.name || 'Raum';
    if (ccHas('th_co2') && s.co2 != null && s.co2 > +c.th_co2) out.push({ n: 'CO₂ hoch · ' + n + ' (' + Math.round(s.co2) + ')', dc: 'co2' });
    if (ccHas('th_hum_hi') && s.hum != null && s.hum > +c.th_hum_hi) out.push({ n: 'Luftfeuchte hoch · ' + n + ' (' + Math.round(s.hum) + ' %)', dc: 'hum' });
    if (ccHas('th_hum_lo') && s.hum != null && s.hum < +c.th_hum_lo) out.push({ n: 'Luftfeuchte niedrig · ' + n + ' (' + Math.round(s.hum) + ' %)', dc: 'hum' });
    if (ccHas('th_temp_hi') && s.temp != null && s.temp > +c.th_temp_hi) out.push({ n: 'Zu warm · ' + n + ' (' + ccTempStr(s.temp, 1) + ')', dc: 'temp' });
    if (ccHas('th_temp_lo') && s.temp != null && s.temp < +c.th_temp_lo) out.push({ n: 'Zu kalt · ' + n + ' (' + ccTempStr(s.temp, 1) + ')', dc: 'temp' });
  }));
  return out;
}
// Einstellungen der Karte, die den Plan überschreiben
const CC_SETTINGS = { roof_color3d: 'roofColor3', roof_type3d: 'roofType3', ground_color3d: 'ground3', label_size: 'labelSize', wall_height3d: 'wallH3', energy_pv: 'energyPv', energy_grid: 'energyGrid', energy_battery: 'energyBat', energy_home: 'energyHome' };
const CC_TRI = { show_names: 'showRoomNames', show_areas: 'showArea', show_dims: 'showDims' };
function ccSettings(base, c) {
  const s = { ...base };
  Object.keys(CC_SETTINGS).forEach(k => { const v = c[k]; if (v !== undefined && v !== null && v !== '') s[CC_SETTINGS[k]] = typeof s[CC_SETTINGS[k]] === 'number' ? Number(v) : v; });
  Object.keys(CC_TRI).forEach(k => { if (c[k] === 'yes') s[CC_TRI[k]] = true; else if (c[k] === 'no') s[CC_TRI[k]] = false; });
  return s;
}
// Filter: nur bestimmte Bereiche/Domains zeigen
function ccFilterPlan(p, c) {
  const da = new Set(c.only_domains || []), ar = new Set(c.only_areas || []);
  if (!da.size && !ar.size) return p;
  const ea = new Map(); try { (HOST.entities ? HOST.entities() : []).forEach(e => ea.set(e.id, e.areaId)); } catch (_) { /* egal */ }
  return { ...p, floors: p.floors.map(f => ({ ...f, items: f.items.filter(i => !i.entity || ((!da.size || da.has(domainOf(i.entity))) && (!ar.size || ar.has(ea.get(i.entity))))) })) };
}
