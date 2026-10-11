'use strict';
// ---------- 3D-Ansicht im Editor ----------
let v3 = null, v3On = false, v3Busy = false;
const v3Base = () => new URL('../vendor/', location.href).href;
function v3Dark() {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
}
function v3Hook() { if (!v3On || !v3) return false; v3.update(); v3Overlay(); return true; }

// ---------- Wände / Räume in 3D zeichnen und bearbeiten ----------
let v3rectA = null, v3h = null, v3raf = 0, v3pend = null;
const v3DrawTool = () => tool === 'wall' || tool === 'rect' || tool === 'room';
function v3Overlay() {
  if (!v3On || !v3 || !v3.setEdit) return;
  if (mode !== 'edit') { v3.setEdit(null); return; }
  const spec = { handles: [], draft: null, hl: null };
  if (drawing) { const pts = drawing.pts.map(p => [p.x, p.y]); if (hover) pts.push([hover.x, hover.y]); spec.draft = { pts, closed: false }; }
  else if (v3rectA && hover) { const a = v3rectA, b = hover; spec.draft = { pts: [[a.x, a.y], [b.x, a.y], [b.x, b.y], [a.x, b.y]], closed: true }; }
  const o = tool === 'select' && sel ? selObj() : null;
  if (o && sel.k === 'wall') {
    spec.hl = { pts: [[o.x1, o.y1], [o.x2, o.y2]], closed: false };
    if (!isLocked('wall', o)) spec.handles.push({ key: 'wa', x: o.x1, z: o.y1 }, { key: 'wb', x: o.x2, z: o.y2 }, { key: 'wm', x: (o.x1 + o.x2) / 2, z: (o.y1 + o.y2) / 2, mid: true });
  } else if (o && sel.k === 'room') {
    spec.hl = { pts: o.pts, closed: true };
    if (!isLocked('room', o)) { o.pts.forEach((p, i) => spec.handles.push({ key: 'rv' + i, x: p[0], z: p[1] })); const c = polyCentroid(o.pts); spec.handles.push({ key: 'rm', x: c[0], z: c[1], mid: true }); }
  }
  v3.setEdit(spec);
}
function v3Draw(gp) {
  if (!gp) return;
  const p = { x: gp.x, y: gp.z }, e = { shiftKey: false };
  if (tool === 'wall') downWall(e, p);
  else if (tool === 'room') downRoom(e, p);
  else if (tool === 'rect') {
    const q = snapPt(p, {});
    if (!v3rectA) { v3rectA = q; hover = q; v3Overlay(); }
    else { const a = v3rectA; v3rectA = null; if (Math.abs(a.x - q.x) > 20 && Math.abs(q.y - a.y) > 20) createRectRoom(a, q); else { hover = null; render(); } }
  }
}
function v3Handle(key, ph, x, z) {
  const f = curFloor();
  if (ph === 'start') {
    const o = selObj(); if (!o) return;
    v3h = { key, snap: JSON.stringify(plan), start: null, moved: false, id: o.id, orig: deepClone(o) };
    if (key === 'wa' || key === 'wb') {
      const px = key === 'wa' ? o.x1 : o.x2, py = key === 'wa' ? o.y1 : o.y2, linked = [];
      f.walls.forEach(w => { if (w.id === o.id) return; if (Math.hypot(w.x1 - px, w.y1 - py) < 1) linked.push([w, 'a']); if (Math.hypot(w.x2 - px, w.y2 - py) < 1) linked.push([w, 'b']); });
      v3h.linked = linked; v3h.skip = new Set([o.id, ...linked.map(l => l[0].id)]);
    }
    if (key === 'wm') v3h.start = { x: (o.x1 + o.x2) / 2, z: (o.y1 + o.y2) / 2 };
    if (key === 'rm') { const c = polyCentroid(o.pts); v3h.start = { x: c[0], z: c[1] }; }
    return;
  }
  if (!v3h) return;
  if (ph === 'end') {
    if (v3raf) { cancelAnimationFrame(v3raf); v3raf = 0; if (v3pend) v3Apply(v3pend[0], v3pend[1]); v3pend = null; }
    const h = v3h; v3h = null;
    if (h.moved) { commit(); renderInspector(); } render();
    return;
  }
  v3pend = [x, z];
  if (!v3raf) v3raf = requestAnimationFrame(() => { v3raf = 0; const q = v3pend; v3pend = null; if (q && v3h) v3Apply(q[0], q[1]); });
}
function v3Apply(x, z) {
  const h = v3h, f = curFloor(), key = h.key; if (!h.start) h.start = { x, z };
  const g = S().snap ? S().grid : 0, sn = v => (g ? Math.round(v / g) * g : r1(v));
  if (key === 'wa' || key === 'wb') {
    const w = findWall(h.id), q = snapPt({ x, y: z }, { skip: h.skip });
    if (key === 'wa') { w.x1 = q.x; w.y1 = q.y; } else { w.x2 = q.x; w.y2 = q.y; }
    h.linked.forEach(([o, wh]) => { if (wh === 'a') { o.x1 = q.x; o.y1 = q.y; } else { o.x2 = q.x; o.y2 = q.y; } });
    hover = q;
  } else if (key === 'wm') {
    const w = findWall(h.id), dx = sn(x - h.start.x), dy = sn(z - h.start.z), o = h.orig;
    w.x1 = r1(o.x1 + dx); w.y1 = r1(o.y1 + dy); w.x2 = r1(o.x2 + dx); w.y2 = r1(o.y2 + dy);
  } else if (key === 'rm') {
    const r = findRoom(h.id), dx = sn(x - h.start.x), dy = sn(z - h.start.z);
    r.pts = h.orig.pts.map(q => [r1(q[0] + dx), r1(q[1] + dy)]);
  } else if (key.startsWith('rv')) {
    const r = findRoom(h.id), q = snapPt({ x, y: z }, { skipRoom: r.id });
    r.pts[parseInt(key.slice(2), 10)] = [q.x, q.y]; hover = q;
  }
  h.moved = true; render(); refreshInspectorValues();
}
function v3Cancel() { v3rectA = null; }

function v3Hud() {
  const st = $('#stage3d');
  const hud = document.createElement('div');
  hud.className = 'hud3';
  const opt = (arr, cur) => arr.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('');
  hud.innerHTML =
    `<select id="v3look" title="Look">${opt([['auto', 'Look: Auto'], ['day', 'Realistisch Tag'], ['dark', 'Realistisch Nacht'], ['live', 'Live (Zeit & Wetter)'], ['neon', 'Neon'], ['blueprint', 'Blueprint']], S().look3d || 'auto')}</select>` +
    `<select id="v3walls" title="Wände">${opt([['auto', 'Wände: automatisch'], ['full', 'Wände: voll'], ['half', 'Wände: halb'], ['flat', 'Wände: flach']], S().walls3d || 'auto')}</select>` +
    `<select id="v3roof" title="Dach">${opt([['none', 'Dach: aus'], ['flat', 'Flachdach'], ['gable', 'Satteldach'], ['hip', 'Walmdach'], ['shed', 'Pultdach']], S().roof3 || 'none')}</select>` +
    `<select id="v3tile" title="Dacheindeckung">${opt([['plain', 'Dach: glatt'], ['tiles', 'Dach: Ziegel']], S().roofType3 || 'plain')}</select>` +
    `<label class="chk" title="Wandfarbe">Wand <input type="color" id="v3wc" value="${S().wallColor3 || '#f3f0ea'}"></label>` +
    `<label class="chk" title="Solaranlage auf dem Dach"><input type="checkbox" id="v3solar"${S().solar3 ? ' checked' : ''}> ☀ Solar</label>` +
    `<label class="chk" title="Anzahl Solarmodule (0 = automatisch)"><input type="number" id="v3solarN" min="0" step="1" style="width:56px" value="${Number(S().solarCount3) || 0}"> Module</label>` +
    `<label class="chk" title="Realistische Grafik (PBR-Materialien, Himmel, weiche Schatten, Umgebungsverdeckung) – für Geräte mit mehr Rechenleistung"><input type="checkbox" id="v3real"${S().real3 ? ' checked' : ''}> ✨ Realistisch</label>` +
    `<label class="chk" title="Energiefluss: Schnittansicht, nur die Energieflüsse bleiben sichtbar"><input type="checkbox" id="v3en"${S().energy3 ? ' checked' : ''}> ⚡ Energiefluss</label>` +
    `<label class="chk"><input type="checkbox" id="v3all"${S().all3d ? ' checked' : ''}> alle Etagen</label>` +
    `<button class="ibtn" id="v3rl" title="Drehen">⟲</button><button class="ibtn" id="v3rr" title="Drehen">⟳</button>` +
    `<button class="ibtn" id="v3reset" title="Ansicht zurücksetzen">⤢</button>` +
    `<button class="ibtn txt" id="v3walk" title="Durchs Haus gehen: WASD/Pfeile oder Joystick, Ziehen = umsehen">🚶 Begehen</button>` +
    `<button class="ibtn txt" id="v3vr" hidden title="Virtual Reality: Haus im Maßstab 1:1 begehen">🥽 VR</button><button class="ibtn txt" id="v3ar" hidden title="Augmented Reality: Modell auf dem Tisch">📱 AR</button>`;
  st.appendChild(hud);
  [['vr', 'immersive-vr'], ['ar', 'immersive-ar']].forEach(([k, m]) => v3.xrSupported(m).then(ok => { const b = $('#v3' + k); if (!b) return; b.hidden = !ok; b.onclick = () => { if (v3.inXR()) v3.stopXR(); else v3.startXR(k); }; }));
  const setOpt = (k, v) => { S()[k] = v; if (k === 'look3d') S().blueprint = v === 'blueprint';  v3.set(k === 'look3d' ? 'look' : k === 'walls3d' ? 'walls' : 'allFloors', v); commit(); };
  $('#v3look').onchange = e => setOpt('look3d', e.target.value);
  $('#v3walls').onchange = e => setOpt('walls3d', e.target.value);
  $('#v3roof').onchange = e => { S().roof3 = e.target.value; commit(); render(); };
  $('#v3tile').onchange = e => { S().roofType3 = e.target.value; commit(); render(); };
  $('#v3solarN').onchange = e => { S().solarCount3 = Math.max(0, Math.round(Number(e.target.value) || 0)); if (S().solarCount3 > 0 && !S().solar3) { S().solar3 = true; $('#v3solar').checked = true; if (!S().roof3 || S().roof3 === 'none') { S().roof3 = 'gable'; $('#v3roof').value = 'gable'; } } commit(); render(); };
  $('#v3wc').oninput = e => { S().wallColor3 = e.target.value; commit(); render(); };
  $('#v3solar').onchange = e => { S().solar3 = e.target.checked; if (e.target.checked && (!S().roof3 || S().roof3 === 'none')) { S().roof3 = 'gable'; $('#v3roof').value = 'gable'; } commit(); render(); };
  $('#v3all').onchange = e => setOpt('all3d', e.target.checked);
  $('#v3en').onchange = e => { S().energy3 = e.target.checked; v3.set('energy', e.target.checked ? { style: S().energyStyle || '', speed: Number(S().energySpeed) || 1, width: Number(S().energyWidth) || 1 } : null); commit(); };
  $('#v3real').onchange = async e => { S().real3 = e.target.checked ? true : false; commit(); await set3D(false); await set3D(true); };
  $('#v3rl').onclick = () => v3.rotate(-0.5);
  $('#v3rr').onclick = () => v3.rotate(0.5);
  $('#v3reset').onclick = () => v3.resetView();
  $('#v3walk').onclick = () => { const w = !v3.isWalking(); v3.setWalk(w); $('#v3walk').classList.toggle('on', w); $('#v3walk').textContent = w ? '🚶 Beenden' : '🚶 Begehen'; };
}

async function set3D(on) {
  if (on === v3On || v3Busy) return;
  const app = $('#app'), st = $('#stage3d');
  if (on) {
    v3Busy = true;
    try { await FP3D.load(v3Base(), !!S().real3); } catch (e) { v3Busy = false; toast(e.message); return; }
    try {
      setTool('select');
      st.hidden = false;
      v3 = FP3D.create(st, {
        real: !!S().real3, lowPower: S().real3 === 'light',
        getFloor: () => curFloor().id,
        look: S().blueprint ? 'blueprint' : (S().look3d || 'auto'), walls: S().walls3d || 'auto', allFloors: !!S().all3d, energy: S().energy3 ? { style: S().energyStyle || '', speed: Number(S().energySpeed) || 1, width: Number(S().energyWidth) || 1 } : null, dark: v3Dark, wheel: 'always',
        onTap: (id, long) => { const it = findItem(id) || plan.floors.flatMap(f => f.items).find(i => i.id === id); if (!it) return; if (mode === 'live') onItemTap(it, long); else setSel('item', id); },
        getSel: () => (sel && sel.k === 'item' ? sel.id : null),
        canCover: () => mode === 'live' && haInfo.allowControl !== false,
        onCover: (it, v) => coverCommand(it, v),
        canDrag: id => mode === 'edit' && tool === 'select' && !!sel && sel.k === 'item' && sel.id === id,
        snap: v => (S().snap ? Math.round(v / S().grid) * S().grid : v),
        placing: () => mode === 'edit' && tool === 'place' && !!placeType,
        editing: () => mode === 'edit',
        drawTool: () => v3DrawTool(),
        onHandle: (k, ph, x, z) => v3Handle(k, ph, x, z),
        onHover: gp => { if (gp && (drawing || v3rectA)) { hover = snapPt({ x: gp.x, y: gp.z }, drawing ? { from: drawing.pts[drawing.pts.length - 1] } : {}); v3Overlay(); } },
        onFinish: () => { if (drawing) finishDrawing(); },
        onEditTap: (hit, gp) => { if (v3DrawTool()) { v3Draw(gp); return; } if (mode === 'edit' && tool === 'select') setSel(hit.k, hit.id); },
        onEmptyTap: gp => {
          if (mode === 'edit' && v3DrawTool()) { v3Draw(gp); return; }
          if (mode === 'edit' && tool === 'place' && placeType && gp) { const sn = v => (S().snap ? Math.round(v / S().grid) * S().grid : r1(v)); placeItem(placeType, { x: sn(gp.x), y: sn(gp.z) }, false); return; }
          if (sel) setSel(null);
        },
        onDragEnd: (id, x, z) => { const it = findItem(id); if (!it || x == null) return; it.x = r1(x); it.y = r1(z); commit(); render(); },
      });
      v3Hud();
    } catch (e) { st.hidden = true; v3Busy = false; toast('3D nicht möglich: ' + e.message); return; }
    v3On = true; v3Busy = false;
    app.classList.add('view-3d'); $('#v3Btn').classList.add('on'); $('#v2Btn').classList.remove('on');
  } else {
    v3On = false;
    if (v3) { v3.destroy(); v3 = null; }
    st.hidden = true; st.querySelectorAll('.hud3').forEach(n => n.remove());
    app.classList.remove('view-3d'); $('#v3Btn').classList.remove('on'); $('#v2Btn').classList.add('on');
    render();
  }
}
