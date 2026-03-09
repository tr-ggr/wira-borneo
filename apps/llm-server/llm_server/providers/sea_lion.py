"""SEA-LION provider via Hugging Face Inference API.

Tracks a per-minute sliding window to stay within the HF rate limit.
"""

import logging
import time
from collections import deque

from huggingface_hub import InferenceClient

from .base import LLMProvider

logger = logging.getLogger(__name__)


class SeaLionProvider(LLMProvider):
    """Primary LLM — AI Singapore SEA-LION via HF Inference."""

    def __init__(self, api_token: str, model_id: str, rpm_limit: int, timeout: int):
        self._client = InferenceClient(token=api_token, timeout=timeout)
        self._model_id = model_id
        self._rpm_limit = rpm_limit
        self._request_timestamps: deque[float] = deque()

    @property
    def name(self) -> str:
        return "sea-lion"

    # Rate-limit tracking

    def _prune_window(self) -> None:
        """Remove timestamps older than 60 s."""
        cutoff = time.monotonic() - 60
        while self._request_timestamps and self._request_timestamps[0] < cutoff:
            self._request_timestamps.popleft()

    def is_available(self) -> bool:
        self._prune_window()
        return len(self._request_timestamps) < self._rpm_limit

    def _record_request(self) -> None:
        self._request_timestamps.append(time.monotonic())

    # Generation

    def generate(self, prompt: str) -> str:
        logger.info("SEA-LION: sending request to %s", self._model_id)
        start = time.monotonic()

        response = self._client.text_generation(
            prompt,
            model=self._model_id,
            max_new_tokens=1024,
        )

        self._record_request()
        elapsed_ms = (time.monotonic() - start) * 1000
        logger.info("SEA-LION: response received in %.0f ms", elapsed_ms)
        return response
