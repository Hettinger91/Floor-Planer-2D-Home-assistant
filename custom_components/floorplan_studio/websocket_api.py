"""WebSocket-Befehle für Floorplan Studio."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .store import FloorplanStore, PlanConflict, PlanInvalid


def _store(hass: HomeAssistant) -> FloorplanStore:
    return hass.data[DOMAIN]["store"]


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/get"})
@callback
def ws_get(hass: HomeAssistant, connection: Any, msg: dict[str, Any]) -> None:
    """Plan und Revision lesen (alle angemeldeten Benutzer)."""
    store = _store(hass)
    connection.send_result(msg["id"], {"rev": store.rev, "plan": store.plan})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: Any, msg: dict[str, Any]) -> None:
    """Änderungen des Plans abonnieren (z. B. für Dashboard-Karten)."""
    store = _store(hass)

    @callback
    def forward(rev: int) -> None:
        connection.send_message(websocket_api.event_message(msg["id"], {"rev": rev}))

    connection.subscriptions[msg["id"]] = store.add_listener(forward)
    connection.send_result(msg["id"])


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/save",
        vol.Required("rev"): int,
        vol.Required("plan"): dict,
        vol.Optional("force", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection: Any, msg: dict[str, Any]) -> None:
    """Plan speichern (nur Administratoren)."""
    try:
        rev = await _store(hass).async_save_plan(msg["plan"], msg["rev"], msg["force"])
    except PlanConflict as err:
        connection.send_error(
            msg["id"], "conflict", f"Plan wurde zwischenzeitlich geändert (rev {err.rev})"
        )
    except PlanInvalid as err:
        connection.send_error(msg["id"], "invalid_plan", str(err))
    else:
        connection.send_result(msg["id"], {"rev": rev})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/backups"})
@callback
def ws_backups(hass: HomeAssistant, connection: Any, msg: dict[str, Any]) -> None:
    """Vorhandene Sicherungen auflisten."""
    connection.send_result(msg["id"], {"backups": _store(hass).list_backups()})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/restore", vol.Required("id"): str}
)
@websocket_api.async_response
async def ws_restore(hass: HomeAssistant, connection: Any, msg: dict[str, Any]) -> None:
    """Eine Sicherung wiederherstellen."""
    try:
        rev, plan = await _store(hass).async_restore(msg["id"])
    except KeyError:
        connection.send_error(msg["id"], "not_found", "Sicherung nicht gefunden")
    else:
        connection.send_result(msg["id"], {"rev": rev, "plan": plan})


def async_register_commands(hass: HomeAssistant) -> None:
    for command in (ws_get, ws_subscribe, ws_save, ws_backups, ws_restore):
        websocket_api.async_register_command(hass, command)
