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

    # SEA-LION via Hugging Face Inference
    HF_API_TOKEN: str = _require_env("HF_API_TOKEN")
    HF_MODEL_ID: str = os.getenv("HF_MODEL_ID", "aisingapore/Gemma-SEA-LION-v4-27B-IT")
    HF_RPM_LIMIT: int = int(os.getenv("HF_RPM_LIMIT", "10"))

    # Gemini (overflow / fallback)
    GEMINI_API_KEY: str = _require_env("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # General
    LLM_TIMEOUT_SECONDS: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    FLASK_PORT: int = int(os.getenv("FLASK_PORT", "5000"))
