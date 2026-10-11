"""Floorplan Studio: Grundriss zeichnen und als Live-Dashboard nutzen."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    MEDIA_URL,
    PANEL_ELEMENT,
    PANEL_PATH,
    STATIC_URL,
    VERSION,
)
from .store import FloorplanStore
from .views import FloorplanUploadView
from .websocket_api import async_register_commands

_LOGGER = logging.getLogger(__name__)

CARD_URL = f"{STATIC_URL}/floorplan-card.js?v={VERSION}"
PANEL_MODULE_URL = f"{STATIC_URL}/floorplan-panel.js?v={VERSION}"


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Registriert Speicher, Endpunkte, Seitenleisten-Panel und Dashboard-Karte."""
    data = hass.data.setdefault(DOMAIN, {})

    if "store" not in data:
        store = FloorplanStore(hass)
        await store.async_load()
        data["store"] = store

        media_dir = Path(hass.config.path("floorplan_studio", "media"))
        await hass.async_add_executor_job(_ensure_dir, media_dir)
        frontend_dir = Path(__file__).parent / "frontend"

        # Statische Pfade/Views/Befehle dürfen pro Laufzeit nur einmal registriert werden.
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(STATIC_URL, str(frontend_dir), cache_headers=False),
                StaticPathConfig(MEDIA_URL, str(media_dir), cache_headers=True),
            ]
        )
        hass.http.register_view(FloorplanUploadView(media_dir))
        async_register_commands(hass)

    title = "Grundriss" if hass.config.language.startswith("de") else "Floorplan"
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_ELEMENT,
        frontend_url_path=PANEL_PATH,
        module_url=PANEL_MODULE_URL,
        sidebar_title=title,
        sidebar_icon="mdi:floor-plan",
        require_admin=False,
        config={},
        embed_iframe=False,
    )
    # Die Karte steht damit in jedem Dashboard zur Verfügung, ohne manuelle Ressource.
    frontend.add_extra_js_url(hass, CARD_URL)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Entfernt Panel und Karte wieder (Daten bleiben erhalten)."""
    frontend.async_remove_panel(hass, PANEL_PATH)
    frontend.remove_extra_js_url(hass, CARD_URL)
    return True
