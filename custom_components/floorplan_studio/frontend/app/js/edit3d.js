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
    `<select id="v3look" title="Look">${opt([['auto', 'Look: Auto'], ['day', 'Realistisch Tag'], ['dark', 'Realistisch Nacht'], ['neon', 'Neon']], S().look3d || 'auto')}</select>` +
    `<select id="v3walls" title="Wände">${opt([['auto', 'Wände: automatisch'], ['full', 'Wände: voll'], ['half', 'Wände: halb'], ['flat', 'Wände: flach']], S().walls3d || 'auto')}</select>` +
    `<label class="chk"><input type="checkbox" id="v3all"${S().all3d ? ' checked' : ''}> alle Etagen</label>` +
    `<button class="ibtn" id="v3rl" title="Drehen">⟲</button><button class="ibtn" id="v3rr" title="Drehen">⟳</button>` +
    `<button class="ibtn" id="v3reset" title="Ansicht zurücksetzen">⤢</button>`;
  st.appendChild(hud);
  const setOpt = (k, v) => { S()[k] = v; v3.set(k === 'look3d' ? 'look' : k === 'walls3d' ? 'walls' : 'allFloors', v); commit(); };
  $('#v3look').onchange = e => setOpt('look3d', e.target.value);
  $('#v3walls').onchange = e => setOpt('walls3d', e.target.value);
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
        look: S().look3d || 'auto', walls: S().walls3d || 'auto', allFloors: !!S().all3d, dark: v3Dark, wheel: 'always',
        onTap: (id, long) => { const it = findItem(id) || plan.floors.flatMap(f => f.items).find(i => i.id === id); if (!it) return; if (mode === 'live') onItemTap(it, long); else setSel('item', id); },
        onEmptyTap: () => { if (sel) setSel(null); },
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
