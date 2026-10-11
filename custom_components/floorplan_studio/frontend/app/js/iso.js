'use strict';
// Isometrische 2,5D-Ansicht (reines SVG): Wände/Objekte als Quader, Symbole mit Live-Status auf den Oberseiten.
const ISO_CAT = { Fahrzeuge: [150, 0], Garten: [0, 0], Licht: [0, -1], Möbel: [80, 0], 'Küche & Bad': [90, 0], 'Heizung & Klima': [60, 0], 'Smart Home': [0, 110], 'Büro & Medien': [75, 0], 'Außen & Garage': [90, 0], 'Kinder & Haustiere': [45, 0], 'Bau & Deko': [60, 0] };
function isoDims(it, wh) {
  const t = typeById(it.type) || {};
  let [h, z] = ISO_CAT[t.cat] || [60, 0];
  if (it.h3 > 0) h = Number(it.h3);
  if (it.z3 > 0) z = Number(it.z3);
  if (it.mount === 'ceil' || z === -1) z = wh;
  else if (it.mount === 'wall' && z <= 0) z = 150;
  if (it.shape === 'door') { h = 205; z = 0; } else if (it.shape === 'window') { h = 120; z = 90; }
  if (it.shape === 'text' || isStairType(it.type)) h = Math.min(h, 12);
  if (it.shape === 'roof') { h = 0; z = wh + (Number(it.rz) || 0); }
  return [h, z];
}
// ang in Grad (Vielfache von 90). Liefert { inner, defs, vb:[x,y,w,h] }
function isoMarkup(f, ang, ctx) {
  const wh = Math.max(180, Number(S().wallH3) || 250), b = contentBounds(f), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const r = ang * Math.PI / 180, cc = Math.cos(r), ss = Math.sin(r), K = 0.866;
  const P = (x, y, z) => { const dx = x - cx, dy = y - cy, rx = cc * dx - ss * dy, ry = ss * dx + cc * dy; return [(rx - ry) * K, (rx + ry) * 0.5 - (z || 0), rx + ry]; };
  const mat = z => { const a = K * (cc - ss), bb = 0.5 * (cc + ss), c = -K * (ss + cc), d = 0.5 * (cc - ss); return `matrix(${a} ${bb} ${c} ${d} ${-(a * cx + c * cy)} ${-(bb * cx + d * cy) - z})`; };
  const nrm = (nx, ny) => { const rx = cc * nx - ss * ny, ry = ss * nx + cc * ny; return [rx, ry]; };
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const ext = (pt) => { x0 = Math.min(x0, pt[0]); y0 = Math.min(y0, pt[1]); x1 = Math.max(x1, pt[0]); y1 = Math.max(y1, pt[1]); };
  const pol = (pts, fill, extra) => `<polygon points="${pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')}" fill="${fill}" ${extra || ''}/>`;
  const shade = (pts, k) => k > 0 ? pol(pts, '#000', `fill-opacity="${k}" pointer-events="none"`) : pol(pts, '#fff', `fill-opacity="${-k}" pointer-events="none"`);
  // Quader (Footprint-Ecken in Plan-Koordinaten): sichtbare Seiten + Oberseite
  function prism(corners, z0, h, col, extra) {
    const n = corners.length; let out = '';
    const sides = [];
    for (let i = 0; i < n; i++) {
      const a = corners[i], c = corners[(i + 1) % n], ex = c[0] - a[0], ey = c[1] - a[1], L = Math.hypot(ex, ey) || 1;
      const [nx, ny] = nrm(ey / L, -ex / L); // nach außen (Polygon im Uhrzeigersinn y-unten)
      if (nx + ny > 0.0001) sides.push({ a, c, k: 0.1 + 0.22 * (nx > ny ? 1 : 0) + 0.04 * Math.abs(nx - ny), d: P((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, 0)[2] });
    }
    sides.sort((p, q) => p.d - q.d).forEach(s => {
      const q = [P(s.a[0], s.a[1], z0), P(s.c[0], s.c[1], z0), P(s.c[0], s.c[1], z0 + h), P(s.a[0], s.a[1], z0 + h)];
      q.forEach(ext); out += pol(q, col, `${extra || ''} pointer-events="none"`) + shade(q, s.k);
    });
    const top = corners.map(p => P(p[0], p[1], z0 + h)); top.forEach(ext);
    return { out, top, topPoly: pol(top, col, `${extra || ''} pointer-events="none"`) + shade(top, -0.18) };
  }
  const rot = (x, y, w, h, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(p => [x + p[0] * c - p[1] * s, y + p[0] * s + p[1] * c]); };
  const layers = [];
  // Boden/Räume
  let ground = gardenBaseMarkup(f) ? `<g transform="${mat(0)}">${gardenBaseMarkup(f)}</g>` : '';
  let rooms = f.rooms.map(rm => `<g transform="${mat(0)}">${roomMarkup(rm, true)}</g>`).join('');
  f.rooms.forEach(rm => rm.pts.forEach(p => ext(P(p[0], p[1], 0))));
  // Wände
  f.walls.forEach(w => {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, L = Math.hypot(dx, dy); if (L < 1) return;
    const ux = dx / L, uy = dy / L, hx = -uy * w.t / 2, hy = ux * w.t / 2, e = w.t / 2;
    const A = [w.x1 - ux * e + hx, w.y1 - uy * e + hy], B = [w.x2 + ux * e + hx, w.y2 + uy * e + hy], Cc = [w.x2 + ux * e - hx, w.y2 + uy * e - hy], D = [w.x1 - ux * e - hx, w.y1 - uy * e - hy];
    const dm = P((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2, 0)[2], front = dm > 1, col = w.color || S().wallColor3 || '#e8e4dc', pr = prism([D, Cc, B, A], 0, front ? 35 : wh, col, `data-k="wall" data-id="${w.id}"`);
    layers.push({ d: dm, m: pr.out + pr.topPoly });
  });
  // Objekte
  f.items.forEach(it => {
    const [h, z] = isoDims(it, wh), onTop = z + h;
    if ((it.shape === 'door' || it.shape === 'window') && P(it.x, it.y, 0)[2] > 1) return;
    let m = '';
    const fp = rot(it.x, it.y, it.w, it.h, it.rot || 0);
    if (h > 6) {
      const col = it.shape === 'door' ? '#a67c52' : it.shape === 'window' ? '#8fd3f4' : (it.color || (typeById(it.type) || {}).color || '#9aa4b5');
      const pr = prism(fp, z, h, col, it.shape === 'window' ? 'fill-opacity=".55"' : '');
      m += pr.out + pr.topPoly;
    } else fp.forEach(p => ext(P(p[0], p[1], onTop)));
    const a0 = K * (cc - ss), b0 = 0.5 * (cc + ss), c0 = -K * (ss + cc), d0 = 0.5 * (cc - ss), det = a0 * d0 - b0 * c0;
    const sym = itemMarkup(it, ctx).replace(/<text\b([^>]*)>/g, (all, at) => {
      if (/\btransform=/.test(at)) return all;
      const mx = at.match(/\bx="(-?[\d.]+)"/), my = at.match(/\by="(-?[\d.]+)"/);
      if (!mx || !my) return all;
      return `<text${at} transform="translate(${mx[1]} ${my[1]}) matrix(${d0 / det} ${-b0 / det} ${-c0 / det} ${a0 / det} 0 0) translate(${-mx[1]} ${-my[1]})">`;
    });
    m += `<g transform="${mat(onTop)}">${sym}</g>`;
    layers.push({ d: P(it.x, it.y, 0)[2] + 0.5 + (it.shape === 'door' || it.shape === 'window' ? 3 : 0), m });
  });
  layers.sort((p, q) => p.d - q.d);
  // Raumnamen (aufrecht)
  let labels = '';
  if (S().showRoomNames) f.rooms.forEach(rm => { if (!rm.name) return; const [px, py] = polyCentroid(rm.pts), q = P(px, py, 0), fs = S().labelSize * 1.1; labels += `<text x="${q[0].toFixed(1)}" y="${q[1].toFixed(1)}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${C.text}" stroke="${C.canvas}" stroke-width="${fs * 0.25}" paint-order="stroke" pointer-events="none" style="user-select:none">${esc(rm.name)}</text>`; });
  if (x0 > x1) { x0 = -300; x1 = 300; y0 = -200; y1 = 200; }
  const pad = 60;
  return { inner: ground + rooms + layers.map(l => l.m).join('') + (ctx.glowOut || []).map(g => `<g transform="${mat(0)}" pointer-events="none">${g}</g>`).join('') + labels, vb: [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2] };
}
