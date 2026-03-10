"""Environment-driven configuration with startup validation."""

import os
from dotenv import load_dotenv

load_dotenv()


def _require_env(name: str) -> str:
    """Return env var value or raise with a clear message."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(
            f"Missing required environment variable {name}. "
            "Copy .env.example → .env and provide a valid value."
        )
    return value


class Config:
    """Validated runtime config — read once at import time."""

    # SEA-LION via OpenAI-compatible API
    SEA_LION_API_KEY: str = _require_env("SEA_LION_API_KEY")
    SEA_LION_BASE_URL: str = os.getenv("SEA_LION_BASE_URL", "https://api.sea-lion.ai/v1")
    SEA_LION_MODEL: str = os.getenv(
        "SEA_LION_MODEL", "aisingapore/Gemma-SEA-LION-v4-27B-IT"
    )
    SEA_LION_RPM_LIMIT: int = int(os.getenv("SEA_LION_RPM_LIMIT", "10"))

    # Gemini (overflow / fallback)
    GEMINI_API_KEY: str = _require_env("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # Internal API callback for tool calling
    WIRA_API_BASE_URL: str = os.getenv("WIRA_API_BASE_URL", "http://localhost:3333")
    WIRA_INTERNAL_SECRET: str = _require_env("WIRA_INTERNAL_SECRET")

    # General
    LLM_TIMEOUT_SECONDS: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    FLASK_PORT: int = int(os.getenv("FLASK_PORT", "5000"))
