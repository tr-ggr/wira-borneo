"""Environment-driven configuration for the hazard routing server."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _default_data_path() -> str:
    """Default: wira-resources/AI Simulation/neighborhood_data.json under wira-borneo workspace root."""
    this_dir = Path(__file__).resolve().parent
    # apps/hazard-routing-server -> parent = apps -> parent = wira-borneo root
    workspace_root = this_dir.parent.parent
    return str(workspace_root / "wira-resources" / "AI Simulation" / "neighborhood_data.json")


class Config:
    """Runtime config. NEIGHBORHOOD_DATA_PATH must point at neighborhood_data.json."""

    NEIGHBORHOOD_DATA_PATH: str = os.getenv(
        "NEIGHBORHOOD_DATA_PATH",
        _default_data_path(),
    ).strip()

    FLASK_PORT: int = _env_int("FLASK_PORT", 5001)

    # Walking speed in m/s for duration estimate (default ~5 km/h)
    WALKING_SPEED_MS: float = _env_float("WALKING_SPEED_MS", 5.0 / 3.6)

    # Max distance (meters) to consider a point "on graph" when snapping to nearest node
    MAX_SNAP_DISTANCE_M: float = _env_float("MAX_SNAP_DISTANCE_M", 5000.0)
