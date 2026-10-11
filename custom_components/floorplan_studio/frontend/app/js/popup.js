'use strict';
// Popups: Sensor-Verlauf (History) und Kamera. Läuft im Editor und in der Karte.
const FPPOP_CSS = `.fpp{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);font-family:inherit}
.fpp-b{background:var(--card-background-color,#fff);color:var(--primary-text-color,#222);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.4);width:min(520px,94%);max-height:92%;overflow:auto;padding:12px 14px;box-sizing:border-box}
.fpp-h{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600;margin-bottom:6px}.fpp-h span{flex:1}
.fpp button{border:1px solid var(--divider-color,#bbb);background:transparent;color:inherit;border-radius:14px;padding:3px 10px;font:inherit;font-size:13px;cursor:pointer}
.fpp button.on{background:var(--primary-color,#03a9f4);color:#fff;border-color:transparent}
.fpp-r{display:flex;gap:6px;margin:4px 0 8px;flex-wrap:wrap}
.fpp-c{margin:6px 0 10px}.fpp-c h4{margin:0 0 2px;font-size:13px;font-weight:500;display:flex;justify-content:space-between}
.fpp-c svg{width:100%;height:96px;display:block;background:rgba(127,127,127,.08);border-radius:6px}
.fpp-n{font-size:12px;opacity:.7;padding:8px 0}.fpp img{width:100%;border-radius:8px;display:block;background:#000;min-height:120px}`;
const FPPOP_HOURS = [[6, '6 h'], [24, '24 h'], [168, '7 T']];
let _fpp = null;
function fppClose() { if (_fpp) { try { _fpp.timer && clearInterval(_fpp.timer); _fpp.el.remove(); } catch (_) { /* egal */ } _fpp = null; } }
function fppOpen(title, build) {
  fppClose();
  const root = (HOST.popupRoot && HOST.popupRoot()) || document.body;
  const el = document.createElement('div'); el.className = 'fpp';
  el.innerHTML = '<style>' + FPPOP_CSS + '</style><div class="fpp-b"><div class="fpp-h"><span></span><button data-x>✕</button></div><div data-c></div></div>';
  el.querySelector('.fpp-h span').textContent = title;
  el.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.target === el) fppClose(); });
  el.addEventListener('wheel', e => e.stopPropagation());
  el.querySelector('[data-x]').onclick = fppClose;
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.appendChild(el); _fpp = { el, timer: null };
  build(el.querySelector('[data-c]'), el.querySelector('.fpp-h'));
  return _fpp;
}
function fppSeries(raw) {
  const out = [];
  (raw || []).forEach(e => {
    const v = parseFloat(e.s != null ? e.s : e.state); if (!isFinite(v)) return;
    let t = e.lu != null ? e.lu : (e.last_updated != null ? e.last_updated : e.lc);
    t = typeof t === 'number' ? t * 1000 : Date.parse(t); if (isFinite(t)) out.push([t, v]);
  });
  return out.sort((a, b) => a[0] - b[0]);
}
function fppChart(label, unit, pts, t0, t1, color) {
  const W = 400, H = 96, P = 4;
  if (pts.length < 2) return '<div class="fpp-c"><h4><span>' + label + '</span></h4><div class="fpp-n">Keine Verlaufsdaten</div></div>';
  let mn = Infinity, mx = -Infinity; pts.forEach(p => { mn = Math.min(mn, p[1]); mx = Math.max(mx, p[1]); });
  if (mx - mn < 0.2) { mx += 0.1; mn -= 0.1; }
  const X = t => P + (t - t0) / (t1 - t0) * (W - 2 * P), Y = v => H - P - (v - mn) / (mx - mn) * (H - 2 * P);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + X(Math.max(t0, p[0])).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('') + 'L' + X(t1).toFixed(1) + ' ' + Y(pts[pts.length - 1][1]).toFixed(1);
  const last = pts[pts.length - 1][1], f = v => fmtN(v, Math.abs(mx - mn) < 5 ? 1 : 0);
  return '<div class="fpp-c"><h4><span>' + label + '</span><span>' + f(last) + unit + ' · min ' + f(mn) + ' · max ' + f(mx) + '</span></h4><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div>';
}
// ids: [{id,label,unit,color}]
function historyPopup(title, list, hours) {
  hours = hours || 24;
  fppOpen(title, (body, head) => {
    const draw = async (hrs) => {
      hours = hrs;
      body.innerHTML = '<div class="fpp-r">' + FPPOP_HOURS.map(h => '<button data-h="' + h[0] + '"' + (h[0] === hrs ? ' class="on"' : '') + '>' + h[1] + '</button>').join('') + '</div><div data-g><div class="fpp-n">Lade …</div></div>';
      body.querySelectorAll('[data-h]').forEach(b => b.onclick = () => draw(+b.dataset.h));
      let res = {}; const t1 = Date.now(), t0 = t1 - hrs * 3600e3;
      try { res = (HOST.history ? await HOST.history(list.map(l => l.id), hrs) : {}) || {}; } catch (_) { res = {}; }
      const g = body.querySelector('[data-g]'); if (!g || !g.isConnected) return;
      g.innerHTML = list.map(l => fppChart(l.label, l.unit || '', fppSeries(res[l.id]), t0, t1, l.color || '#03a9f4')).join('');
    };
    draw(hours);
    if (list.length === 1 && HOST.moreInfo) { const b = document.createElement('button'); b.textContent = 'Details'; b.onclick = () => { fppClose(); HOST.moreInfo(list[0].id); }; head.insertBefore(b, head.lastElementChild); }
  });
}
function camUrl(id, stream) {
  const s = states[id], pic = s && s.attributes && s.attributes.entity_picture; if (!pic) return '';
  const u = stream ? pic.replace('/api/camera_proxy/', '/api/camera_proxy_stream/') : pic;
  return u + (stream ? '' : (u.includes('?') ? '&' : '?') + '_=' + Date.now());
}
function cameraPopup(id) {
  const s = states[id], name = (s && s.attributes && s.attributes.friendly_name) || id;
  fppOpen('📹 ' + name, (body, head) => {
    let live = false;
    const draw = () => {
      body.innerHTML = '<div class="fpp-r"><button data-m="s"' + (live ? '' : ' class="on"') + '>Foto</button><button data-m="l"' + (live ? ' class="on"' : '') + '>Live</button></div>' + (camUrl(id, live) ? '<img alt="">' : '<div class="fpp-n">Kein Bild verfügbar</div>');
      body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { live = b.dataset.m === 'l'; draw(); });
      const im = body.querySelector('img'); if (im) im.src = camUrl(id, live);
      if (_fpp) { _fpp.timer && clearInterval(_fpp.timer); _fpp.timer = live ? null : setInterval(() => { const i2 = body.querySelector('img'); if (i2 && i2.isConnected) i2.src = camUrl(id, false); }, 8000); }
    };
    draw();
    if (HOST.moreInfo) { const b = document.createElement('button'); b.textContent = 'Details'; b.onclick = () => { fppClose(); HOST.moreInfo(id); }; head.insertBefore(b, head.lastElementChild); }
  });
}
const FPP_KINDS = { temperature: ['Temperatur', '°', '#ef5350'], humidity: ['Luftfeuchte', '%', '#42a5f5'], carbon_dioxide: ['CO₂', ' ppm', '#9ccc65'], power: ['Leistung', ' W', '#ffa726'] };
function histEntry(id) {
  const s = states[id]; if (!s) return null; const a = s.attributes || {}, k = FPP_KINDS[a.device_class];
  return { id, label: a.friendly_name || id, unit: a.unit_of_measurement ? (/^[°%]/.test(a.unit_of_measurement) ? '' : ' ') + a.unit_of_measurement : (k ? k[1] : ''), color: k ? k[2] : '#03a9f4' };
}
function roomHistory(room) {
  const ids = (room.area ? areaMembers().get(room.area) || [] : []).filter(id => domainOf(id) === 'sensor' && FPP_KINDS[(states[id] && states[id].attributes || {}).device_class] && isFinite(parseFloat(states[id].state)));
  const seen = {}, list = [];
  ids.forEach(id => { const dc = states[id].attributes.device_class; if (!seen[dc]) { seen[dc] = 1; list.push(histEntry(id)); } });
  if (!list.length) return false;
  historyPopup(room.name || 'Raum', list); return true;
}
