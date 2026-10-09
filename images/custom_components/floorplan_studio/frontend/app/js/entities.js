'use strict';
// Entitäten-Auswahl: Dialog, Seitenleiste (ziehen oder platzieren) und Zuordnung zu Objekttypen.
const ENT_DOMAIN_DE = {
  light: 'Licht', switch: 'Schalter', sensor: 'Sensor', binary_sensor: 'Binärsensor', climate: 'Klima', cover: 'Rollo/Tor', lock: 'Schloss',
  camera: 'Kamera', media_player: 'Medien', vacuum: 'Staubsauger', fan: 'Ventilator', scene: 'Szene', script: 'Skript', button: 'Taste',
  input_boolean: 'Schalter (Helfer)', automation: 'Automation', number: 'Zahl', input_number: 'Zahl (Helfer)', water_heater: 'Warmwasser', alarm_control_panel: 'Alarm',
};
function entityTypeFor(e) {
  const d = domainOf(e.e || e.id), dc = e.dc || '';
  if (d === 'light') return 'lamp_ceiling';
  if (d === 'switch' || d === 'input_boolean') return 'outlet';
  if (d === 'climate') return 'radiator';
  if (d === 'cover') return 'blind';
  if (d === 'lock') return 'lock';
  if (d === 'camera') return 'camera';
  if (d === 'media_player') return 'speaker';
  if (d === 'vacuum') return 'vacuum';
  if (d === 'fan') return 'fan';
  if (d === 'binary_sensor') {
    if (dc === 'motion' || dc === 'occupancy' || dc === 'presence') return 'sensor_motion';
    if (dc === 'smoke' || dc === 'gas' || dc === 'co') return 'smoke';
    return 'sensor_contact';
  }
  if (d === 'sensor') {
    if (dc === 'temperature') return 'sensor_temp';
    if (dc === 'humidity') return 'sensor_hum';
    if (dc === 'power' || dc === 'energy') return 'meter_power';
    if (dc === 'gas') return 'meter_gas';
    return 'sensor_temp';
  }
  return 'switch';
}
function placedEntities() { return new Set(linkedEntities()); }

// Baut Suche + Filter + Liste. opts: { onPick(e), drag, multi }
function buildEntityBrowser(opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'entbrowse';
  const list = (() => { try { return (HOST.entities ? HOST.entities() : []).slice().sort((a, b) => a.id.localeCompare(b.id)); } catch (_) { return []; } })();
  const E = list.map(x => ({ e: x.id, n: x.name || '', s: x.state, a: x.area || '', dc: x.dc || '' }));
  const doms = [...new Set(E.map(x => domainOf(x.e)))].sort(), areas = [...new Set(E.map(x => x.a).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
  wrap.innerHTML = `<input type="search" class="eb-q" placeholder="Name oder ID suchen …" autocomplete="off">
<div class="eb-f"><select class="eb-d"><option value="">Alle Typen</option>${doms.map(d => `<option value="${esc(d)}">${esc(ENT_DOMAIN_DE[d] || d)}</option>`).join('')}</select>
<select class="eb-a"><option value="">Alle Bereiche</option>${areas.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('')}</select></div>
<label class="chk small"><input type="checkbox" class="eb-u"> nur noch nicht im Plan</label>
<div class="eb-list"></div><div class="hint eb-c"></div>`;
  const q = $('.eb-q', wrap), sd = $('.eb-d', wrap), sa = $('.eb-a', wrap), su = $('.eb-u', wrap), box = $('.eb-list', wrap), cnt = $('.eb-c', wrap);
  const picked = new Set();
  wrap.picked = picked;
  const draw = () => {
    const t = q.value.trim().toLowerCase(), placed = placedEntities();
    const rows = E.filter(x => (!sd.value || domainOf(x.e) === sd.value) && (!sa.value || x.a === sa.value) && (!su.checked || !placed.has(x.e)) &&
      (!t || x.e.toLowerCase().includes(t) || x.n.toLowerCase().includes(t) || x.a.toLowerCase().includes(t)));
    const shown = rows.slice(0, 200);
    box.innerHTML = shown.map(x => `<div class="eb-row${placed.has(x.e) ? ' used' : ''}" data-e="${esc(x.e)}"${opts.drag ? ' draggable="true"' : ''}>` +
      (opts.multi ? `<input type="checkbox" ${picked.has(x.e) ? 'checked' : ''}>` : '') +
      `<span class="eb-t"><b>${esc(x.n || x.e)}</b><i>${esc(x.e)}${x.a ? ' · ' + esc(x.a) : ''}</i></span><span class="eb-s">${placed.has(x.e) ? '✓ ' : ''}${esc(valueTextFor(x))}</span></div>`).join('') || '<p class="hint">Keine Entitäten gefunden.</p>';
    cnt.textContent = rows.length > shown.length ? `${shown.length} von ${rows.length} angezeigt – Suche eingrenzen` : `${rows.length} Entitäten`;
    $$('.eb-row', box).forEach(r => {
      const x = E.find(y => y.e === r.dataset.e);
      r.onclick = ev => {
        if (opts.multi) {
          const cb = $('input', r);
          if (ev.target !== cb) cb.checked = !cb.checked;
          if (cb.checked) picked.add(x.e); else picked.delete(x.e);
          wrap.dispatchEvent(new Event('pickchange'));
        } else if (opts.onPick) opts.onPick(x);
      };
      if (opts.drag) r.ondragstart = ev => { ev.dataTransfer.setData('text/plain', 'fp-ent:' + x.e); };
    });
  };
  [q, sd, sa, su].forEach(el => el.addEventListener('input', draw));
  wrap.redraw = draw;
  draw();
  return wrap;
}
function valueTextFor(x) {
  const st = x.s;
  if (st === 'unavailable') return 'n/v';
  const n = parseFloat(st);
  return Number.isFinite(n) && String(st).length < 9 ? fmtN(n, 1) : (STATE_DE[st] || String(st).slice(0, 12));
}

async function openEntityPicker() {
  let chosen = null;
  const b = buildEntityBrowser({ onPick: x => { chosen = x.e; $('#dlg').close(); } });
  await modal({ title: 'Entität auswählen', body: b, actions: [{ label: 'Abbrechen', value: null }] });
  return chosen;
}
function bindPick(box) {
  $$('[data-pick]', box).forEach(btn => {
    btn.onclick = async () => {
      const id = await openEntityPicker();
      const inp = $('[data-f="' + btn.dataset.pick + '"]', box);
      if (!id || !inp) return;
      inp.value = id;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    };
  });
}

// ---------- Platzieren ----------
function placeEntities(ids, at) {
  if (!ids.length) return;
  loadEntities();
  const f = curFloor(), { w, h } = stageSize(), c = at || s2w(V(), w / 2, h / 2), cols = Math.ceil(Math.sqrt(ids.length)), gap = 70;
  let last = null;
  const all = (() => { try { return HOST.entities ? HOST.entities() : []; } catch (_) { return []; } })();
  ids.forEach((id, i) => {
    const info = all.find(x => x.id === id) || { id };
    const t = typeById(entityTypeFor({ e: id, dc: info.dc })) || typeById('outlet');
    const col = i % cols, row = Math.floor(i / cols);
    const it = newItemFromType(t, r1(c.x + (col - (cols - 1) / 2) * gap), r1(c.y + (row - (Math.ceil(ids.length / cols) - 1) / 2) * gap));
    it.entity = id;
    autofillFromEntity(it, true);
    f.items.push(it);
    last = it;
  });
  commit();
  setSel('item', last.id);
  toast(ids.length === 1 ? 'Objekt angelegt und verknüpft' : ids.length + ' Objekte angelegt und verknüpft');
}

// ---------- Seitenleiste ----------
let entTab = false;
function setLeftTab(ent) {
  entTab = ent;
  $('#tabObj').classList.toggle('on', !ent); $('#tabEnt').classList.toggle('on', ent);
  $('#objPane').hidden = ent; $('#entPane').hidden = !ent;
  if (ent) renderEntPane();
}
function renderEntPane() {
  const pane = $('#entPane');
  pane.innerHTML = '<p class="hint">Zeile auf den Plan ziehen, oder mehrere ankreuzen und auf „Platzieren“ tippen.</p>';
  const b = buildEntityBrowser({ drag: true, multi: true });
  const btn = document.createElement('button');
  btn.className = 'btn primary'; btn.textContent = 'Ausgewählte platzieren'; btn.disabled = true;
  b.addEventListener('pickchange', () => { btn.disabled = !b.picked.size; btn.textContent = b.picked.size ? `${b.picked.size} platzieren` : 'Ausgewählte platzieren'; });
  btn.onclick = () => { placeEntities([...b.picked]); document.body.classList.remove('show-left'); renderEntPane(); };
  pane.append(b, btn);
}
