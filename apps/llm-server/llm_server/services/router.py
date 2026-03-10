"""Hybrid LLM router — SEA-LION primary, Gemini overflow/fallback.

Routing logic:
  1. If SEA-LION is under its RPM limit → try SEA-LION.
     • On SEA-LION failure → try Gemini.
  2. If SEA-LION is at/over limit → go straight to Gemini.
  3. If Gemini also fails → raise so the caller can return an error.
"""

import logging
from typing import Optional

from llm_server.providers.base import LLMProvider
 
logger = logging.getLogger(__name__)

# Kept for backwards-compatibility with existing tests; no longer used for
# truncation so that callers receive the full model output.
MAX_RESPONSE_CHARS = 2000


class LLMRouter:
    """Picks the best available provider and returns the response."""

    def __init__(self, primary: LLMProvider, fallback: LLMProvider):
        self._primary = primary
        self._fallback = fallback

    def generate(
        self, 
        prompt: str, 
        system_instruction: Optional[str] = None, 
        demographics: Optional[dict] = None,
        user_id: Optional[str] = None,
    ) -> tuple[str, str]:
        """Return ``(answer_text, provider_name)``.

        Raises ``RuntimeError`` only when *every* provider fails.
        """
        kwargs = {}
        if system_instruction is not None:
            kwargs["system_instruction"] = system_instruction
        if demographics is not None:
            kwargs["demographics"] = demographics
        if user_id is not None:
            kwargs["user_id"] = user_id

        if self._primary.is_available():
            try:
                text = self._primary.generate(prompt, **kwargs)
                return self._clean_json(text), self._primary.name
            except Exception as exc:
                logger.warning(
                    "Primary provider (%s) failed, falling back: %s",
                    self._primary.name,
                    exc,
                )

        # Overflow / fallback
        try:
            text = self._fallback.generate(prompt, **kwargs)
            return self._clean_json(text), self._fallback.name
        except Exception as exc:
            logger.error("Fallback provider (%s) also failed: %s", self._fallback.name, exc)
            raise RuntimeError("All LLM providers are unavailable.") from exc

    @staticmethod
    def _clean_json(text: str) -> str:
        """Strip markdown code block wrappers (e.g. ```json ... ```)."""
        text = text.strip()
        if text.startswith("```"):
            # Find the end of the first line (e.g. ```json)
            first_newline = text.find("\n")
            if first_newline != -1:
                text = text[first_newline + 1:]
            # Remove trailing ```
            if text.endswith("```"):
                text = text[:-3]
        return text.strip()

