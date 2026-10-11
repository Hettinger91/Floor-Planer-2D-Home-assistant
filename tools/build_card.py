#!/usr/bin/env python3
"""Baut frontend/floorplan-card.js aus den geteilten Editor-Quellen + card.src.js."""
from pathlib import Path

FE = Path(__file__).resolve().parent.parent / "custom_components" / "floorplan_studio" / "frontend"
PARTS = [FE / "app/js" / n for n in ("i18n.js", "util.js", "library.js", "symbols.js", "model.js", "ha.js", "render.js", "overlay.js", "real3d.js", "popup.js", "models3d.js", "view3d.js")] + [FE / "card.src.js"]

out = ["/* Floorplan Studio Karte – GENERIERT von tools/build_card.py, nicht von Hand ändern. */", "(function () {", "'use strict';"]
for p in PARTS:
    out.append(f"/* ---- {p.name} ---- */")
    out.append(p.read_text(encoding="utf-8").replace("'use strict';\n", "", 1))
out.append("})();")
(FE / "floorplan-card.js").write_text("\n".join(out), encoding="utf-8")
print("floorplan-card.js:", (FE / "floorplan-card.js").stat().st_size, "Bytes")
