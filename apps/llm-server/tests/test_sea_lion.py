"""Tests for the SEA-LION provider's rate-limit tracking."""

import time
from unittest.mock import patch

from llm_server.providers.sea_lion import SeaLionProvider


class TestSeaLionRateLimit:
    def _make_provider(self, rpm_limit: int = 3) -> SeaLionProvider:
        """Build a provider with a mocked OpenAI client."""
        with patch("llm_server.providers.sea_lion.OpenAI"):
            provider = SeaLionProvider(
                api_key="fake",
                base_url="https://api.sea-lion.ai/v1",
                model="test-model",
                rpm_limit=rpm_limit,
                timeout=5,
                api_base_url="http://localhost:3333",
                internal_secret="secret",
            )
        return provider

    def test_is_available_when_under_limit(self):
        p = self._make_provider(rpm_limit=3)
        assert p.is_available() is True

    def test_becomes_unavailable_at_limit(self):
        p = self._make_provider(rpm_limit=2)
        # Simulate two recorded requests
        p._request_timestamps.append(time.monotonic())
        p._request_timestamps.append(time.monotonic())
        assert p.is_available() is False

    def test_availability_recovers_after_window(self):
        p = self._make_provider(rpm_limit=1)
        # Insert a timestamp >60s in the past
        p._request_timestamps.append(time.monotonic() - 61)
        assert p.is_available() is True
