'use strict';
// Realistisch-Modus (3D): prozedurale PBR-Details (Putz, Ziegel, Rasen, Holz, Stein …), die per Shader
// weltbezogen projiziert werden, sowie Himmel/Umgebungslicht, Nachbearbeitung (AO, Bloom). Benötigt vendor/three-real.js.
const FPREAL = (() => {
  // ---- tilebares Rauschen ----
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const sm = t => t * t * (3 - 2 * t);
  function vn(x, y, p, s) { // Wertrauschen mit Periode p (tilebar)
    const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
    const m = v => ((v % p) + p) % p, x0 = m(xi), x1 = m(xi + 1), y0 = m(yi), y1 = m(yi + 1);
    const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(u, v, per, oct, s) { // u,v in 0..1
    let a = 0, amp = 0.5, tot = 0, p = per;
    for (let i = 0; i < oct; i++) { a += amp * vn(u * p, v * p, p, s + i * 7); tot += amp; amp *= 0.5; p *= 2; }
    return a / tot;
  }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  // Muster: liefert [Höhe, Albedo-Variation, Rauheits-Variation] je 0..1
  const PAT = {
    plaster: (u, v) => { const g = fbm(u, v, 24, 4, 1); return [0.45 + g * 0.5, 0.5 + (fbm(u, v, 4, 3, 9) - 0.5) * 0.7, 0.5 + (fbm(u, v, 16, 2, 5) - 0.5) * 0.8]; },
    stone: (u, v) => { const g = fbm(u, v, 16, 5, 2), pit = hash((u * 256) | 0, (v * 256) | 0, 8) > 0.93 ? -0.25 : 0; return [clamp(g + pit), 0.5 + (fbm(u, v, 6, 3, 4) - 0.5) * 0.9, 0.5 + (fbm(u, v, 24, 2, 6) - 0.5)]; },
    fine: (u, v) => [fbm(u, v, 48, 3, 11), 0.5 + (fbm(u, v, 8, 3, 12) - 0.5) * 0.4, 0.5 + (fbm(u, v, 32, 2, 13) - 0.5) * 0.6],
    woodfine: (u, v) => { const gr = fbm(u * 0.25, v * 8, 8, 3, 21) * 0.7 + fbm(u, v * 2, 16, 3, 22) * 0.3; return [gr, 0.5 + (gr - 0.5) * 0.9, 0.5 + (fbm(u, v * 4, 16, 2, 23) - 0.5) * 0.6]; },
    grass: (u, v) => { const bl = fbm(u * 2, v * 2, 48, 3, 31), st = vn(u * 96, v * 48, 96, 33); return [clamp(bl * 0.6 + st * 0.5), 0.5 + (fbm(u, v, 3, 3, 34) - 0.5) * 0.9 + (st - 0.5) * 0.5, 0.5 + (fbm(u, v, 24, 2, 35) - 0.5) * 0.6]; },
    roofTiles: (u, v) => { // Biberschwanz-ähnliche Ziegel: 12 Spalten × 8 Reihen, versetzte Reihen
      const rows = 8, cols = 12, ry = v * rows, row = Math.floor(ry), fy = ry - row, cx = u * cols + (row % 2 ? 0.5 : 0), col = Math.floor(cx), fx = cx - col;
      const prof = Math.sin(Math.PI * clamp(fx)) ** 0.6, lip = Math.pow(fy, 1.6), seam = Math.min(fx, 1 - fx) < 0.06 ? 0.55 : 1;
      const tone = hash(col % cols, row, 41), ev = hash(col % cols, row, 42) > 0.9 ? 0.25 : 0;
      return [clamp((0.25 + 0.75 * prof * seam) * (0.55 + 0.45 * lip)), 0.5 + (tone - 0.5) * 0.55 - ev + (fbm(u, v, 8, 3, 43) - 0.5) * 0.3, 0.5 + (hash(col % cols, row, 44) - 0.5) * 0.5];
    },
    roofSeam: (u, v) => { const fx = (u * 6) % 1, tri = 1 - Math.abs(fx * 2 - 1), rib = fx < 0.07 || fx > 0.93 ? 1 : 0.35 + 0.1 * tri; return [rib, 0.5 + (fbm(u, v, 6, 3, 51) - 0.5) * 0.3, 0.35 + (fbm(u, v, 12, 2, 52) - 0.5) * 0.5]; },
  };
  function detailTex(T, kind) {
    const N = 512, c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'), im = g.createImageData(N, N), f = PAT[kind] || PAT.fine;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const p = f(x / N, y / N), i = (y * N + x) * 4;
      im.data[i] = clamp(p[0]) * 255; im.data[i + 1] = clamp(p[1]) * 255; im.data[i + 2] = clamp(p[2]) * 255; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.colorSpace = ''; t.needsUpdate = true;
    return t;
  }
  // Material-Parameter je Art: tex, cm pro Kachel, Bump, Albedo-Streuung, Rauheits-Streuung, Grundrauheit, Metall, planar(XZ)
  const KIND = {
    plaster: { p: 'plaster', cm: 90, bump: 1.4, alb: 0.45, rgh: 0.35, r0: 0.92, m0: 0 },
    stone: { p: 'stone', cm: 140, bump: 2.0, alb: 0.5, rgh: 0.5, r0: 0.88, m0: 0 },
    fine: { p: 'fine', cm: 60, bump: 1.0, alb: 0.18, rgh: 0.3, r0: 0.8, m0: 0 },
    wood: { p: 'woodfine', cm: 120, bump: 1.2, alb: 0.35, rgh: 0.4, r0: 0.55, m0: 0 },
    paint: { p: 'fine', cm: 80, bump: 0.3, alb: 0.06, rgh: 0.15, r0: 0.38, m0: 0 },
    grass: { p: 'grass', cm: 160, bump: 2.5, alb: 0.6, rgh: 0.3, r0: 0.95, m0: 0, macro: 3200 },
    roofTiles: { p: 'roofTiles', cm: 256, bump: 5.0, alb: 0.8, rgh: 0.35, r0: 0.6, m0: 0, planar: 1 },
    roofSeam: { p: 'roofSeam', cm: 240, bump: 2.5, alb: 0.3, rgh: 0.3, r0: 0.42, m0: 0.5, planar: 1 },
  };
  // Shader-Patch: weltbezogene (Tri-)Planar-Projektion, Bump-Mapping aus Ableitungen, Albedo-/Rauheits-Variation
  function patch(T, mat, kind, cache, opt) {
    const K = KIND[kind]; if (!K) return mat; opt = opt || {};
    let tex = cache.get('d|' + K.p); if (!tex) { tex = detailTex(T, K.p); cache.set('d|' + K.p, tex); }
    mat.roughness = K.r0; mat.metalness = K.m0; mat.envMapIntensity = opt.env != null ? opt.env : 1;
    const U = { dMap: { value: tex }, dScale: { value: 1 / K.cm }, dBump: { value: K.bump * (opt.bump || 1) }, dAlb: { value: K.alb }, dRgh: { value: K.rgh }, dPlanar: { value: K.planar || 0 }, dSwap: { value: opt.swap ? 1 : 0 }, dMacro: { value: K.macro ? 1 / K.macro : 0 } };
    mat.userData.fpU = U;
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNor;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWNor = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWPos; varying vec3 vWNor;
uniform sampler2D dMap; uniform float dScale, dBump, dAlb, dRgh, dPlanar, dSwap, dMacro;
vec3 fpPerturb(vec3 sp, vec3 sn, vec2 dh, float fd) {
  vec3 sx = normalize(dFdx(sp)), sy = normalize(dFdy(sp));
  vec3 r1 = cross(sy, sn), r2 = cross(sn, sx);
  float det = dot(sx, r1) * fd;
  vec3 gr = sign(det) * (dh.x * r1 + dh.y * r2);
  return normalize(abs(det) * sn - gr);
}`)
        .replace('#include <map_fragment>', `#include <map_fragment>
vec3 fpW = normalize(vWNor); vec3 fpB = pow(abs(fpW), vec3(4.0)); fpB /= (fpB.x + fpB.y + fpB.z);
vec2 fpY = dSwap > 0.5 ? vWPos.zx : vWPos.xz;
vec4 fpD = dPlanar > 0.5 ? texture2D(dMap, fpY * dScale)
  : texture2D(dMap, vWPos.zy * dScale) * fpB.x + texture2D(dMap, fpY * dScale) * fpB.y + texture2D(dMap, vWPos.xy * dScale) * fpB.z;
float fpMac = dMacro > 0.0 ? texture2D(dMap, vWPos.xz * dMacro).g : 0.5;
float fpFade = 1.0 - smoothstep(500.0, 3200.0, length(vViewPosition));
diffuseColor.rgb *= clamp(1.0 + ((fpD.g - 0.5) * mix(0.3, 1.0, fpFade) + (fpMac - 0.5) * 0.9) * dAlb, 0.25, 2.0);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (fpD.b - 0.5) * dRgh, 0.04, 1.0);')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = fpPerturb(-vViewPosition, normal, vec2(dFdx(fpD.r), dFdy(fpD.r)) * dBump * 1.4 * fpFade, faceDirection);');
    };
    mat.customProgramCacheKey = () => 'fpd';
    return mat;
  }
  // Himmel (Sky-Shader) + Boden-Bounce für die Umgebungsbeleuchtung
  function makeSky(T, scale) { const s = new T.Sky(); s.scale.setScalar(scale); s.material.depthWrite = false; return s; }
  function skyParams(sky, e, d, dir) {
    const U = sky.material.uniforms;
    U.sunPosition.value.set(dir[0], dir[1], dir[2]);
    U.turbidity.value = 1.6 + e.cl * 13 + e.fog * 18 + e.rain * 6;
    U.rayleigh.value = 0.9 + (1 - e.cl) * 1.3 + (1 - d) * 0.3;
    U.mieCoefficient.value = 0.004 + e.cl * 0.03 + e.fog * 0.06;
    U.mieDirectionalG.value = 0.8 - e.cl * 0.15;
  }
  return { KIND, patch, makeSky, skyParams };
})();
