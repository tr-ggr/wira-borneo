"""Tests for the hybrid LLM router."""

from unittest.mock import MagicMock
from llm_server.services.router import LLMRouter, MAX_RESPONSE_CHARS


def _make_provider(name: str, available: bool = True, response: str = "ok"):
    """Create a mock LLMProvider."""
    p = MagicMock()
    p.name = name
    p.is_available.return_value = available
    p.generate.return_value = response
    return p


class TestLLMRouter:
    def test_uses_primary_when_available(self):
        primary = _make_provider("primary", available=True, response="primary answer")
        fallback = _make_provider("fallback")
        router = LLMRouter(primary=primary, fallback=fallback)

        answer, provider = router.generate("hello")

        assert answer == "primary answer"
        assert provider == "primary"
        primary.generate.assert_called_once_with("hello")
        fallback.generate.assert_not_called()

    def test_falls_back_when_primary_unavailable(self):
        primary = _make_provider("primary", available=False)
        fallback = _make_provider("fallback", response="fallback answer")
        router = LLMRouter(primary=primary, fallback=fallback)

        answer, provider = router.generate("hello")

        assert answer == "fallback answer"
        assert provider == "fallback"
        primary.generate.assert_not_called()

    def test_falls_back_when_primary_raises(self):
        primary = _make_provider("primary", available=True)
        primary.generate.side_effect = Exception("boom")
        fallback = _make_provider("fallback", response="fallback answer")
        router = LLMRouter(primary=primary, fallback=fallback)

        answer, provider = router.generate("hello")

        assert answer == "fallback answer"
        assert provider == "fallback"

    def test_raises_when_all_fail(self):
        primary = _make_provider("primary", available=True)
        primary.generate.side_effect = Exception("boom")
        fallback = _make_provider("fallback")
        fallback.generate.side_effect = Exception("boom2")
        router = LLMRouter(primary=primary, fallback=fallback)

        try:
            router.generate("hello")
            assert False, "Should have raised"
        except RuntimeError as e:
            assert "unavailable" in str(e).lower()

    def test_truncates_long_responses(self):
        long_text = "x" * (MAX_RESPONSE_CHARS + 500)
        primary = _make_provider("primary", response=long_text)
        fallback = _make_provider("fallback")
        router = LLMRouter(primary=primary, fallback=fallback)

        answer, _ = router.generate("hello")

        assert len(answer) == MAX_RESPONSE_CHARS + 1  # +1 for the "…"
        assert answer.endswith("…")

    def test_does_not_truncate_short_responses(self):
        primary = _make_provider("primary", response="short")
        fallback = _make_provider("fallback")
        router = LLMRouter(primary=primary, fallback=fallback)

        answer, _ = router.generate("hello")

        assert answer == "short"
