'use strict';
// Schnittstelle zum Wirt. In Home Assistant stellt floorplan-panel.js das Objekt
// `window.fpHost` bereit (Zugriff auf hass); ohne Wirt läuft der Editor im Demo-Modus.
function makeDemoHost() {
  let rev = 0;
  const key = 'fp.demo.plan';
  const dark = () => !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  return {
    demo: true,
    info: () => ({ ha: false, allowControl: false, admin: true, dark: dark() }),
    getPlan: async () => { const s = localStorage.getItem(key); return { rev, plan: s ? JSON.parse(s) : null }; },
    savePlan: async (r, p) => { localStorage.setItem(key, JSON.stringify(p)); rev += 1; return { rev }; },
    states: () => ({}),
    entities: () => [],
    callService: async () => { },
    moreInfo: () => { },
    history: async () => ({}),
    upload: file => new Promise(res => { const fr = new FileReader(); fr.onload = () => res({ url: fr.result }); fr.readAsDataURL(file); }),
    backups: async () => [],
    restore: async () => { throw new Error('Nur in Home Assistant verfügbar'); },
    publishDashboard: async () => { throw new Error('Nur in Home Assistant verfügbar'); },
    onChange: () => { },
  };
}

function findHost() {
  try { if (window.fpHost) return window.fpHost; } catch (_) { /* egal */ }
  try { if (window.parent && window.parent !== window && window.parent.fpHost) return window.parent.fpHost; } catch (_) { /* anderer Ursprung */ }
  return null;
}
const HOST = findHost() || makeDemoHost();
