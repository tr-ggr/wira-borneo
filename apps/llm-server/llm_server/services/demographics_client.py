import json
import urllib.error
import urllib.request
from typing import Any, Optional


def fetch_user_demographics(
    *,
    api_base_url: str,
    internal_secret: str,
    user_id: str,
    timeout_seconds: int,
) -> dict[str, Any]:
    url = f"{api_base_url.rstrip('/')}/api/assistant/internal/demographics/{user_id}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "x-llm-internal-secret": internal_secret,
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        return {
            "userId": user_id,
            "demographics": None,
            "profileComplete": False,
            "missingFields": [],
        }

