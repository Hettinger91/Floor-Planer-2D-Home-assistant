"""Konstanten für Floorplan Studio."""

DOMAIN = "floorplan_studio"
VERSION = "1.0.8"

STATIC_URL = "/floorplan_studio_static"
MEDIA_URL = "/floorplan_studio_media"
PANEL_PATH = "floorplan-studio"
PANEL_ELEMENT = "floorplan-studio-panel"

STORAGE_KEY = "floorplan_studio.plan"
STORAGE_VERSION = 1

MAX_PLAN_BYTES = 8 * 1024 * 1024
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
BACKUP_INTERVAL = 300  # Sekunden zwischen automatischen Sicherungen
MAX_BACKUPS = 20
