'use strict';
// ---------- 3D-Ansicht im Editor ----------
let v3 = null, v3On = false, v3Busy = false;
const v3Base = () => new URL('../vendor/', location.href).href;
function v3Dark() {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
}
function v3Hook() { if (!v3On || !v3) return false; v3.update(); return true; }

function v3Hud() {
  const st = $('#stage3d');
  const hud = document.createElement('div');
  hud.className = 'hud3';
  const opt = (arr, cur) => arr.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('');
  hud.innerHTML =
    `<select id="v3look" title="Look">${opt([['auto', 'Look: Auto'], ['day', 'Realistisch Tag'], ['dark', 'Realistisch Nacht'], ['live', 'Live (Zeit & Wetter)'], ['neon', 'Neon'], ['blueprint', 'Blueprint']], S().look3d || 'auto')}</select>` +
    `<select id="v3walls" title="Wände">${opt([['auto', 'Wände: automatisch'], ['full', 'Wände: voll'], ['half', 'Wände: halb'], ['flat', 'Wände: flach']], S().walls3d || 'auto')}</select>` +
    `<select id="v3roof" title="Dach">${opt([['none', 'Dach: aus'], ['flat', 'Flachdach'], ['gable', 'Satteldach'], ['hip', 'Walmdach']], S().roof3 || 'none')}</select>` +
    `<select id="v3tile" title="Dacheindeckung">${opt([['plain', 'Dach: glatt'], ['tiles', 'Dach: Ziegel']], S().roofType3 || 'plain')}</select>` +
    `<label class="chk" title="Wandfarbe">Wand <input type="color" id="v3wc" value="${S().wallColor3 || '#f3f0ea'}"></label>` +
    `<label class="chk" title="Solaranlage auf dem Dach"><input type="checkbox" id="v3solar"${S().solar3 ? ' checked' : ''}> ☀ Solar</label>` +
    `<label class="chk" title="Anzahl Solarmodule (0 = automatisch)"><input type="number" id="v3solarN" min="0" step="1" style="width:56px" value="${Number(S().solarCount3) || 0}"> Module</label>` +
    `<label class="chk"><input type="checkbox" id="v3all"${S().all3d ? ' checked' : ''}> alle Etagen</label>` +
    `<button class="ibtn" id="v3rl" title="Drehen">⟲</button><button class="ibtn" id="v3rr" title="Drehen">⟳</button>` +
    `<button class="ibtn" id="v3reset" title="Ansicht zurücksetzen">⤢</button>`;
  st.appendChild(hud);
  const setOpt = (k, v) => { S()[k] = v; if (k === 'look3d') S().blueprint = v === 'blueprint';  v3.set(k === 'look3d' ? 'look' : k === 'walls3d' ? 'walls' : 'allFloors', v); commit(); };
  $('#v3look').onchange = e => setOpt('look3d', e.target.value);
  $('#v3walls').onchange = e => setOpt('walls3d', e.target.value);
  $('#v3roof').onchange = e => { S().roof3 = e.target.value; commit(); render(); };
  $('#v3tile').onchange = e => { S().roofType3 = e.target.value; commit(); render(); };
  $('#v3solarN').onchange = e => { S().solarCount3 = Math.max(0, Math.round(Number(e.target.value) || 0)); if (S().solarCount3 > 0 && !S().solar3) { S().solar3 = true; $('#v3solar').checked = true; if (!S().roof3 || S().roof3 === 'none') { S().roof3 = 'gable'; $('#v3roof').value = 'gable'; } } commit(); render(); };
  $('#v3wc').oninput = e => { S().wallColor3 = e.target.value; commit(); render(); };
  $('#v3solar').onchange = e => { S().solar3 = e.target.checked; if (e.target.checked && (!S().roof3 || S().roof3 === 'none')) { S().roof3 = 'gable'; $('#v3roof').value = 'gable'; } commit(); render(); };
  $('#v3all').onchange = e => setOpt('all3d', e.target.checked);
  $('#v3rl').onclick = () => v3.rotate(-0.5);
  $('#v3rr').onclick = () => v3.rotate(0.5);
  $('#v3reset').onclick = () => v3.resetView();
}

async function set3D(on) {
  if (on === v3On || v3Busy) return;
  const app = $('#app'), st = $('#stage3d');
  if (on) {
    v3Busy = true;
    try { await FP3D.load(v3Base()); } catch (e) { v3Busy = false; toast(e.message); return; }
    try {
      setTool('select');
      st.hidden = false;
      v3 = FP3D.create(st, {
        getFloor: () => curFloor().id,
        look: S().blueprint ? 'blueprint' : (S().look3d || 'auto'), walls: S().walls3d || 'auto', allFloors: !!S().all3d, dark: v3Dark, wheel: 'always',
        onTap: (id, long) => { const it = findItem(id) || plan.floors.flatMap(f => f.items).find(i => i.id === id); if (!it) return; if (mode === 'live') onItemTap(it, long); else setSel('item', id); },
        getSel: () => (sel && sel.k === 'item' ? sel.id : null),
        canCover: () => mode === 'live' && haInfo.allowControl !== false,
        onCover: (it, v) => coverCommand(it, v),
        canDrag: id => mode === 'edit' && tool === 'select' && !!sel && sel.k === 'item' && sel.id === id,
        snap: v => (S().snap ? Math.round(v / S().grid) * S().grid : v),
        placing: () => mode === 'edit' && tool === 'place' && !!placeType,
        onEmptyTap: gp => {
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
