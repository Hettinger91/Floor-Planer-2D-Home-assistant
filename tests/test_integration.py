import copy
import struct
import zlib

import pytest
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.floorplan_studio.const import DOMAIN

PLAN = {"version": 1, "settings": {}, "customTypes": [],
        "floors": [{"id": "f1", "name": "EG", "bg": None, "walls": [], "rooms": [], "items": []}]}


def png_bytes():
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    raw = zlib.compress(b"\x00\xff\x00\x00")
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")


@pytest.fixture
async def setup(hass):
    hass.config.config_dir = hass.config.config_dir  # tmp dir der Test-Harness
    assert await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_panel_and_card_registered(hass, setup):
    assert "floorplan-studio" in hass.data["frontend_panels"]
    panel = hass.data["frontend_panels"]["floorplan-studio"]
    assert panel.config["_panel_custom"]["name"] == "floorplan-studio-panel"
    assert panel.require_admin is False


async def test_ws_flow(hass, hass_ws_client, setup):
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "floorplan_studio/get"})
    r = await ws.receive_json()
    assert r["success"] and r["result"]["rev"] == 0 and not r["result"]["plan"]

    await ws.send_json({"id": 2, "type": "floorplan_studio/save", "rev": 0, "plan": PLAN})
    r = await ws.receive_json()
    assert r["success"] and r["result"]["rev"] == 1

    await ws.send_json({"id": 3, "type": "floorplan_studio/save", "rev": 0, "plan": PLAN})
    r = await ws.receive_json()
    assert not r["success"] and r["error"]["code"] == "conflict"

    p2 = copy.deepcopy(PLAN); p2["floors"][0]["name"] = "OG"
    await ws.send_json({"id": 4, "type": "floorplan_studio/save", "rev": 0, "plan": p2, "force": True})
    r = await ws.receive_json()
    assert r["success"] and r["result"]["rev"] == 2

    await ws.send_json({"id": 5, "type": "floorplan_studio/save", "rev": 2, "plan": {"nope": 1}})
    r = await ws.receive_json()
    assert not r["success"] and r["error"]["code"] == "invalid_plan"

    await ws.send_json({"id": 6, "type": "floorplan_studio/get"})
    r = await ws.receive_json()
    assert r["result"]["plan"]["floors"][0]["name"] == "OG"

    await ws.send_json({"id": 7, "type": "floorplan_studio/backups"})
    r = await ws.receive_json()
    assert r["success"] and isinstance(r["result"]["backups"], list)


async def test_subscribe_event(hass, hass_ws_client, setup):
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "floorplan_studio/subscribe"})
    assert (await ws.receive_json())["success"]
    await ws.send_json({"id": 2, "type": "floorplan_studio/save", "rev": 0, "plan": PLAN})
    msgs = [await ws.receive_json(), await ws.receive_json()]
    assert any(m["type"] == "event" and m["event"]["rev"] == 1 for m in msgs)


async def test_non_admin_cannot_write(hass, hass_ws_client, hass_read_only_access_token, setup):
    ws = await hass_ws_client(hass, hass_read_only_access_token)
    await ws.send_json({"id": 1, "type": "floorplan_studio/get"})
    assert (await ws.receive_json())["success"]
    await ws.send_json({"id": 2, "type": "floorplan_studio/save", "rev": 0, "plan": PLAN})
    r = await ws.receive_json()
    assert not r["success"] and r["error"]["code"] == "unauthorized"


async def test_upload_and_serve(hass, hass_client, setup):
    client = await hass_client()
    r = await client.post("/api/floorplan_studio/upload", data=png_bytes(), headers={"Content-Type": "image/png"})
    assert r.status == 200
    url = (await r.json())["url"]
    assert url.startswith("/floorplan_studio_media/") and url.endswith(".png")
    g = await client.get(url)
    assert g.status == 200 and (await g.read()) == png_bytes()
    bad = await client.post("/api/floorplan_studio/upload", data=b"<html>x</html>", headers={"Content-Type": "text/html"})
    assert bad.status == 415


async def test_upload_requires_admin(hass, hass_client, hass_read_only_access_token, setup):
    client = await hass_client(hass_read_only_access_token)
    r = await client.post("/api/floorplan_studio/upload", data=png_bytes(), headers={"Content-Type": "image/png"})
    assert r.status == 403


async def test_static_frontend(hass, hass_client, setup):
    client = await hass_client()
    for path in ("floorplan-panel.js", "floorplan-card.js", "app/index.html"):
        r = await client.get(f"/floorplan_studio_static/{path}")
        assert r.status == 200, path


async def test_config_flow_single(hass, setup):
    r = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert r["type"] == "abort" and r["reason"] == "single_instance_allowed"


async def test_unload(hass, setup):
    assert await hass.config_entries.async_unload(setup.entry_id)
    await hass.async_block_till_done()
    assert "floorplan-studio" not in hass.data["frontend_panels"]



async def test_card_registered_as_extra_module(hass, setup):
    from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL
    assert any("floorplan-card.js" in u for u in hass.data[DATA_EXTRA_MODULE_URL].urls)
