'use strict';
// Übersetzung zur Laufzeit: Die Oberfläche ist deutsch geschrieben; Texte (Textknoten, title,
// placeholder, aria-label) werden anhand von i18n/<sprache>.json ersetzt. Schlüssel = deutscher
// Text; „{}“ steht für Platzhalter (Zahlen, Namen).
const FPI = (() => {
  const NAMES = { de: 'Deutsch', en: 'English', 'de-CH': 'Schwiizerdütsch', fr: 'Français', zh: '中文', ja: '日本語', nl: 'Nederlands', da: 'Dansk', fi: 'Suomi', pl: 'Polski', ru: 'Русский', it: 'Italiano', es: 'Español', pt: 'Português', sv: 'Svenska', hi: 'हिन्दी' };
  let lang = 'de', dict = null, pats = [], base = '';
  const roots = new Set(), orig = new WeakMap(), obsList = [], missing = new Set(), listeners = [];
  const DOT = { en: 1, zh: 1, ja: 1, hi: 1, 'de-CH': 1 };
  const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  function norm(l) {
    l = String(l || '').trim().replace('_', '-');
    if (!l || l === 'auto') return '';
    if (/^(gsw|de-ch)/i.test(l)) return 'de-CH';
    const p = l.toLowerCase().split('-')[0];
    return NAMES[p] ? p : 'en';
  }
  function compile(d) {
    pats = [];
    Object.keys(d).forEach(k => {
      if (k.indexOf('{}') < 0) return;
      const re = new RegExp('^' + k.split('{}').map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+?)') + '$', 's');
      pats.push([re, d[k]]);
    });
  }
  function dec(x) { return DOT[lang] ? x.replace(/,/g, '.') : x; }
  function trCap(v) { const r = dict[v]; return r != null ? r : (/^\d[\d,.]*$/.test(v) ? dec(v) : v); }
  function tr(s) {
    if (!dict || typeof s !== 'string') return s;
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/); const t = m[2];
    if (!t) return s;
    let r = dict[t];
    if (r == null) {
      for (const [re, out] of pats) { const mm = t.match(re); if (mm) { let i = 1; r = out.replace(/\{\}/g, () => { const v = mm[i++]; return v == null ? '' : trCap(v); }); break; } }
    }
    if (r == null) { const d = t.match(/^(.+?) \((\d[\d,]*×\d[\d,]*) m\)$/); if (d && dict[d[1]] != null) r = dict[d[1]] + ' (' + dec(d[2]) + ' m)'; }
    if (r == null) { if (/[A-Za-zÄÖÜäöüß]{3,}/.test(t)) missing.add(t); return s; }
    return m[1] + r + m[3];
  }
  function textNode(n) {
    const o = orig.get(n); if (o && n.data === o.tr) { const v = tr(o.src); if (v !== o.tr) { o.tr = v; n.data = v; } return; }
    const v = tr(n.data); if (v !== n.data) { orig.set(n, { src: n.data, tr: v }); n.data = v; } else if (o) orig.delete(n);
  }
  function attrs(el) {
    for (const a of ATTRS) {
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      const key = a + '\u0001', cur = el.getAttribute(a); let o = orig.get(el); o = o && o[key] ? o : null;
      if (o && o[key].tr === cur) { const v = tr(o[key].src); if (v !== cur) { o[key].tr = v; el.setAttribute(a, v); } continue; }
      const v = tr(cur); if (v !== cur) { const m = orig.get(el) || {}; m[key] = { src: cur, tr: v }; orig.set(el, m); el.setAttribute(a, v); }
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (SKIP[root.nodeName]) return; attrs(root); }
    const w = document.createTreeWalker(root, 5, { acceptNode: n => n.nodeType === 1 && SKIP[n.nodeName] ? 2 : 1 });
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) textNode(n); else attrs(n); }
  }
  function apply(root) { if (!dict) return; walk(root); }
  function observe(root) {
    if (!root || roots.has(root)) return; roots.add(root);
    const mo = new MutationObserver(ms => {
      if (!dict) return;
      for (const m of ms) {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') attrs(m.target);
        else m.addedNodes.forEach(walk);
      }
    });
    mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    obsList.push(mo); if (dict) walk(root);
  }
  async function setLang(l, b) {
    if (b != null) base = b;
    const n = norm(l) || 'de';
    if (n === lang && (dict || n === 'de')) return n;
    lang = n;
    try { document.documentElement.lang = n === 'de-CH' ? 'gsw' : n; } catch (_) { /* egal */ }
    if (n === 'de') { dict = null; pats = []; }
    else {
      try { const r = await fetch(base + 'i18n/' + n + '.json'); dict = r.ok ? await r.json() : null; } catch (_) { dict = null; }
      if (dict) compile(dict); else pats = [];
    }
    roots.forEach(r => walk(r)); listeners.forEach(f => { try { f(n); } catch (_) { /* egal */ } });
    return n;
  }
  return { NAMES, norm, tr, apply, observe, setLang, get lang() { return lang; }, get missing() { return [...missing]; }, onChange: f => listeners.push(f), setBase: b => { base = b; } };
})();
try { window.__fpi = FPI; } catch (_) { /* egal */ }
