"""Gemini provider via Google GenAI SDK.

Acts as the overflow / fallback when SEA-LION is rate-limited or
unavailable.
"""

import logging
import time

from google import genai
from google.genai import types

from .base import LLMProvider

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """Overflow LLM — Google Gemini."""

    def __init__(self, api_key: str, model: str, timeout: int):
        self._client = genai.Client(api_key=api_key)
        self._model_name = model
        self._timeout = timeout

    @property
    def name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        # Gemini has generous limits — always available.
        return True

    def generate(self, prompt: str) -> str:
        logger.info("Gemini: sending request to %s", self._model_name)
        start = time.monotonic()

        response = self._client.models.generate_content(
            model=self._model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1024,
                http_options=types.HttpOptions(timeout=self._timeout * 1000),
            ),
        )

        elapsed_ms = (time.monotonic() - start) * 1000
        logger.info("Gemini: response received in %.0f ms", elapsed_ms)
        return response.text
