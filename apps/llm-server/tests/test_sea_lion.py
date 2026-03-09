"""Tests for the SEA-LION provider's rate-limit tracking."""

import time
from unittest.mock import MagicMock, patch

from llm_server.providers.sea_lion import SeaLionProvider


class TestSeaLionRateLimit:
    def _make_provider(self, rpm_limit: int = 3) -> SeaLionProvider:
        """Build a provider with a mocked HF client."""
        with patch("llm_server.providers.sea_lion.InferenceClient"):
            provider = SeaLionProvider(
                api_token="fake",
                model_id="test-model",
                rpm_limit=rpm_limit,
                timeout=5,
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
