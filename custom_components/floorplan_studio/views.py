"""HTTP-Endpunkt zum Hochladen von Hintergrund- und Icon-Bildern."""

from __future__ import annotations

import secrets
from http import HTTPStatus
from pathlib import Path

from aiohttp import web

from homeassistant.components.http import KEY_HASS, HomeAssistantView

from .const import MAX_UPLOAD_BYTES, MEDIA_URL


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
        if (request.content_length or 0) > MAX_UPLOAD_BYTES:
            return self.json_message("Datei zu groß", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        data = await request.read()
        if len(data) > MAX_UPLOAD_BYTES:
            return self.json_message("Datei zu groß", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        ext = detect_image(data[:16])
        if ext is None:
            return self.json_message(
                "Nur PNG, JPG, GIF oder WebP erlaubt", HTTPStatus.UNSUPPORTED_MEDIA_TYPE
            )
        name = f"{secrets.token_hex(8)}.{ext}"
        hass = request.app[KEY_HASS]
        await hass.async_add_executor_job(_write, self._media_dir / name, data)
        return self.json({"url": f"{MEDIA_URL}/{name}"})
