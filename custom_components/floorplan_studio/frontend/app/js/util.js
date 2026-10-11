'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v, d = 0) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : d; };
const r1 = v => Math.round(v * 10) / 10;
const fmtN = (v, d = 2) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: d });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const deepClone = o => JSON.parse(JSON.stringify(o));
function toast(msg, ms = 2800) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}

function modal({ title, body, actions, wide = false, onOpen }) {
  return new Promise(resolve => {
    const d = $('#dlg');
    d.className = wide ? 'wide' : '';
    d.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'dlg-box';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    box.append(h3);
    const b = document.createElement('div');
    b.className = 'dlg-body';
    if (typeof body === 'string') b.innerHTML = body; else if (body) b.append(body);
    box.append(b);
    const bar = document.createElement('div');
    bar.className = 'dlg-actions';
    let result = null;
    (actions || [{ label: 'Schließen', value: 'close' }]).forEach(a => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = a.label;
      btn.className = 'btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : '');
      btn.onclick = async () => {
        if (a.cb) { const keep = await a.cb(d); if (keep === false) return; }
        result = 'value' in a ? a.value : a.label;
        d.close();
      };
      bar.append(btn);
    });
    box.append(bar);
    d.append(box);
    d.onclose = () => resolve(result);
    d.showModal();
    if (onOpen) onOpen(d);
  });
}

async function ask(title, label, value = '', type = 'text') {
  let out = null;
  const wrap = document.createElement('label');
  wrap.className = 'fld';
  const sp = document.createElement('span');
  sp.textContent = label;
  const inp = document.createElement('input');
  inp.type = type;
  inp.value = value;
  if (type === 'number') inp.step = 'any';
  wrap.append(sp, inp);
  const r = await modal({
    title, body: wrap,
    actions: [{ label: 'Abbrechen', value: null }, { label: 'OK', primary: true, value: 'ok', cb: () => { out = inp.value; } }],
    onOpen: d => {
      inp.focus(); inp.select();
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('.primary', d).click(); } };
    },
  });
  return r === 'ok' ? out : null;
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function pickFile(accept) {
  return new Promise(resolve => {
    const inp = $('#fileAny');
    inp.value = '';
    inp.accept = accept || '';
    inp.onchange = () => resolve(inp.files[0] || null);
    inp.click();
  });
}
