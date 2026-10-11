"""Persistenter Speicher für den Grundriss (inkl. Revision und Sicherungen)."""

from __future__ import annotations

import asyncio
import json
import time
from collections.abc import Callable
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import (
    BACKUP_INTERVAL,
    MAX_BACKUPS,
    MAX_PLAN_BYTES,
    STORAGE_KEY,
    STORAGE_VERSION,
)


class PlanConflict(Exception):
    """Der Plan wurde zwischenzeitlich anderswo gespeichert."""

    def __init__(self, rev: int) -> None:
        super().__init__("conflict")
        self.rev = rev


class PlanInvalid(Exception):
    """Der übergebene Plan ist ungültig."""


def validate_plan(plan: Any) -> None:
    """Grobe Strukturprüfung, damit nichts Kaputtes gespeichert wird."""
    if not isinstance(plan, dict) or not isinstance(plan.get("floors"), list):
        raise PlanInvalid("Plan muss ein Objekt mit einer Liste 'floors' sein.")
    if not plan["floors"] or not all(isinstance(f, dict) for f in plan["floors"]):
        raise PlanInvalid("Mindestens eine Etage erforderlich.")
    if len(json.dumps(plan, separators=(",", ":"))) > MAX_PLAN_BYTES:
        raise PlanInvalid("Plan ist zu groß.")


class FloorplanStore:
    """Hält den Plan im Speicher und schreibt ihn nach .storage."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {"rev": 0, "plan": None, "backups": []}
        self._lock = asyncio.Lock()
        self._listeners: list[Callable[[int], None]] = []

    async def async_load(self) -> None:
        loaded = await self._store.async_load()
        if isinstance(loaded, dict):
            self._data.update(loaded)
            self._data.setdefault("backups", [])

    @property
    def rev(self) -> int:
        return int(self._data["rev"])

    @property
    def plan(self) -> dict[str, Any] | None:
        return self._data["plan"]

    @callback
    def add_listener(self, listener: Callable[[int], None]) -> Callable[[], None]:
        """Meldet Änderungen; gibt eine Abmelde-Funktion zurück."""
        self._listeners.append(listener)

        @callback
        def remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return remove

    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener(self.rev)

    def _push_backup(self, force: bool = False) -> None:
        if self._data["plan"] is None:
            return
        backups: list[dict[str, Any]] = self._data["backups"]
        now = time.time()
        if not force and backups and now - backups[-1]["ts"] < BACKUP_INTERVAL:
            return
        backups.append({"ts": now, "plan": self._data["plan"]})
        del backups[:-MAX_BACKUPS]

    async def async_save_plan(
        self, plan: dict[str, Any], rev: int, force: bool = False
    ) -> int:
        validate_plan(plan)
        async with self._lock:
            if not force and rev != self.rev:
                raise PlanConflict(self.rev)
            self._push_backup()
            self._data["rev"] = self.rev + 1
            self._data["plan"] = plan
            await self._store.async_save(self._data)
        self._notify()
        return self.rev

    def list_backups(self) -> list[dict[str, Any]]:
        out = []
        for b in reversed(self._data["backups"]):
            out.append(
                {
                    "id": str(int(b["ts"])),
                    "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(b["ts"])),
                    "size": len(json.dumps(b["plan"])),
                }
            )
        return out

    async def async_restore(self, backup_id: str) -> tuple[int, dict[str, Any]]:
        async with self._lock:
            for b in self._data["backups"]:
                if str(int(b["ts"])) == backup_id:
                    self._push_backup(force=True)
                    self._data["rev"] = self.rev + 1
                    self._data["plan"] = b["plan"]
                    await self._store.async_save(self._data)
                    plan = b["plan"]
                    break
            else:
                raise KeyError(backup_id)
        self._notify()
        return self.rev, plan
