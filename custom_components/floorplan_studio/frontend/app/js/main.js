'use strict';
function renderAll() {
  renderFloorTabs();
  renderLibrary();
  renderInspector();
  render();
}

function applyBp() {
  const on = !!(plan && plan.settings && (plan.settings.blueprint || plan.settings.look3d === 'blueprint'));
  $('#stage').classList.toggle('bp', on); $('#btnBp').classList.toggle('on', on);
  if (typeof v3 !== 'undefined' && v3) { v3.set('look', on ? 'blueprint' : (S().look3d || 'auto')); const sel = $('#v3look'); if (sel) sel.value = on ? 'blueprint' : (S().look3d || 'auto'); }
}
function bindUi() {
  if (!document.getElementById('bpcss')) { const st = document.createElement('style'); st.id = 'bpcss'; st.textContent = BP_CSS; document.head.appendChild(st); }
  $('#btnBp').onclick = () => { S().blueprint = !S().blueprint; commit(); applyBp(); };
  $('#btnUndo').onclick = undo;
  $('#btnRedo').onclick = redo;
  $('#v2Btn').onclick = () => set3D(false);
  $('#v3Btn').onclick = () => set3D(true);
  $('#modeEdit').onclick = () => setMode('edit');
  $('#modeLive').onclick = () => setMode('live');
  $('#btnMenu').onclick = showMenu;
  $('#btnLib').onclick = () => { document.body.classList.toggle('show-left'); document.body.classList.remove('show-right'); };
  $('#btnInsp').onclick = () => { document.body.classList.toggle('show-right'); document.body.classList.remove('show-left'); };
  $('#scrim').onclick = () => document.body.classList.remove('show-left', 'show-right');
  $('#libSearch').oninput = renderLibrary;
  $('#tabObj').onclick = () => setLeftTab(false);
  $('#tabEnt').onclick = () => setLeftTab(true);
  $('#btnNewType').onclick = () => editType(null);
  $('#optRectWalls').onchange = e => { S().rectWalls = e.target.checked; commit(); };
  $('#emptyRect').onclick = () => setTool('rect');
  $('#emptyWall').onclick = () => setTool('wall');
  $('#emptyBg').onclick = () => { setSel(null); document.body.classList.add('show-right'); $('[data-act="bgup"]')?.click(); };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pollStates();
    else if (dirty) save();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', render);
}

// Der Plan wurde von außen geändert (anderer Tab/Gerät): nur übernehmen, wenn hier nichts Offenes liegt.
async function onRemotePlan() {
  if (dirty || saving || conflictOpen || (typeof drawing !== 'undefined' && drawing)) return;
  try {
    const d = await HOST.getPlan();
    if (!d || !d.plan || (d.rev || 0) === rev) return;
    plan = normalize(d.plan); rev = d.rev || 0;
    if (!plan.floors.some(f => f.id === floorId)) floorId = plan.floors[0].id;
    sel = null; histReset(); syncStates(); renderAll();
    setSaveState('Gespeichert', 'ok');
  } catch (_) { /* egal */ }
}

function onHostEvent(kind) {
  if (kind === 'plan') onRemotePlan();
  else if (syncStates()) { render(); }
}

function applyLang() { const l = S().lang; return FPI.setLang(l && l !== 'auto' ? l : (haInfo.lang || navigator.language || 'de'), '../'); }

async function boot() {
  FPI.observe(document.body);
  FPI.onChange(() => { try { if (typeof renderAll === 'function' && plan) renderAll(); } catch (_) { /* egal */ } });
  bindStage();
  bindUi();
  loadInfo();
  let data = null;
  try { data = await HOST.getPlan(); } catch (_) { toast('Plan konnte nicht geladen werden – lokale Kopie wird verwendet.'); }
  let fromLocal = false;
  if (data && data.plan && Array.isArray(data.plan.floors)) { plan = normalize(data.plan); rev = data.rev || 0; }
  else {
    const local = loadLocal();
    fromLocal = !!local;
    plan = normalize(local || defaultPlan());
    rev = (data && data.rev) || 0;
  }
  let saved = null;
  try { saved = localStorage.getItem('fp.floor'); } catch (_) { /* egal */ }
  floorId = plan.floors.some(f => f.id === saved) ? saved : plan.floors[0].id;
  histReset();
  $('#optRectWalls').checked = !!S().rectWalls;
  applyTheme(); applyBp();
  await applyLang();
  syncStates();
  renderAll();
  fitView();
  setSaveState(data ? 'Gespeichert' : 'Offline', data ? 'ok' : 'err');
  if (fromLocal && haInfo.admin !== false) scheduleSave();
  loadEntities();
  if (haInfo.admin === false) { document.body.classList.add('readonly'); setMode('live'); }
  if (HOST.toggleSidebar && haInfo.narrow) { const b = $('#btnSide'); b.hidden = false; b.onclick = () => HOST.toggleSidebar(); }
  HOST.onChange(onHostEvent);
}

boot();
