"""HTTP-Endpunkt zum Hochladen von Hintergrund- und Icon-Bildern."""

from __future__ import annotations

import secrets
from http import HTTPStatus
from pathlib import Path

from aiohttp import web

from homeassistant.components.http import KEY_HASS, HomeAssistantView

import json

from .const import MAX_MODEL_BYTES, MAX_UPLOAD_BYTES, MEDIA_URL


def detect_image(head: bytes) -> str | None:
    """Erkennt das Bildformat anhand der Magic Bytes (kein SVG: Skript-Risiko)."""
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if head.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


def detect_model(data: bytes) -> str | None:
    """Erkennt 3D-Modelle: glb (binär), gltf (JSON) und obj (Text)."""
    if data[:4] == b"glTF":
        return "glb"
    head = data[:4096].lstrip()
    if head[:1] == b"{":
        try:
            doc = json.loads(data.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            return None
        return "gltf" if isinstance(doc, dict) and isinstance(doc.get("asset"), dict) else None
    try:
        text = data[:200000].decode("utf-8", "ignore")
    except Exception:  # pragma: no cover
        return None
    lines = [ln for ln in text.splitlines()[:5000] if ln and not ln.startswith("#")]
    if lines and sum(1 for ln in lines if ln.split(" ", 1)[0] in ("v", "vt", "vn", "f", "o", "g", "s", "usemtl", "mtllib")) >= max(3, len(lines) * 0.8):
        return "obj" if any(ln.startswith("v ") for ln in lines) else None
    return None


def _write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


class FloorplanUploadView(HomeAssistantView):
    """POST /api/floorplan_studio/upload (nur Administratoren)."""

    url = "/api/floorplan_studio/upload"
    name = "api:floorplan_studio:upload"
    requires_auth = True

    def __init__(self, media_dir: Path) -> None:
        self._media_dir = media_dir

    async def post(self, request: web.Request) -> web.Response:
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            return self.json_message("Administrator erforderlich", HTTPStatus.FORBIDDEN)
        if (request.content_length or 0) > MAX_MODEL_BYTES:
            return self.json_message("Datei zu groß", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        data = await request.read()
        if len(data) > MAX_MODEL_BYTES:
            return self.json_message("Datei zu groß", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        ext = detect_image(data[:16])
        if ext is not None and len(data) > MAX_UPLOAD_BYTES:
            return self.json_message("Datei zu groß", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        if ext is None:
            ext = detect_model(data)
        if ext is None:
            return self.json_message(
                "Nur PNG, JPG, GIF, WebP oder 3D-Modelle (GLB, GLTF, OBJ) erlaubt", HTTPStatus.UNSUPPORTED_MEDIA_TYPE
            )
        name = f"{secrets.token_hex(8)}.{ext}"
        hass = request.app[KEY_HASS]
        await hass.async_add_executor_job(_write, self._media_dir / name, data)
        return self.json({"url": f"{MEDIA_URL}/{name}", "ext": ext})
