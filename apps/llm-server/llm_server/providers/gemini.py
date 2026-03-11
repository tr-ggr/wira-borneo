"""Gemini provider via Google GenAI SDK.

Acts as the overflow / fallback when SEA-LION is rate-limited or
unavailable.
"""

import logging
import time
from typing import Optional

from google import genai
from google.genai import types

from .base import LLMProvider

import json
from pydantic import BaseModel, Field
from llm_server.services.demographics_client import fetch_user_demographics

class WiraResponseSchema(BaseModel):
    summary: str = Field(description="A one-sentence summary of your advice.")
    steps: list[str] = Field(description="Actionable steps.")
    safety_reminder: str = Field(description="A brief reminder to follow official guidance.")

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """Overflow LLM — Google Gemini."""

    def __init__(self, api_key: str, model: str, timeout: int, api_base_url: str, internal_secret: str):
        self._client = genai.Client(api_key=api_key)
        self._model_name = model
        self._timeout = timeout
        self._api_base_url = api_base_url
        self._internal_secret = internal_secret
        self._current_demographics = None

    def _get_user_profile(self) -> dict:
        """Retrieve the user's personal profile data."""
        logger.info("Gemini: tool '_get_user_profile' was actually called!")
        return self._current_demographics or {}

    @property
    def name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        # Gemini has generous limits — always available.
        return True

    def generate(
        self, 
        prompt: str, 
        system_instruction: Optional[str] = None, 
        demographics: Optional[dict] = None,
        user_id: Optional[str] = None,
    ) -> str:
        logger.info("Gemini: generating content (system_instruction=%s, AFC active)", bool(system_instruction))
        start = time.monotonic()

        try:
            cache: dict | None = None
            tool_calls = 0

            def get_user_demographics(reason: str) -> dict:
                nonlocal cache
                nonlocal tool_calls
                tool_calls += 1
                if cache is not None:
                    # Gemini AFC sometimes retries the same tool call. Return a sentinel
                    # to make it explicit that the tool has already been executed and
                    # the model must answer now.
                    return {
                        **cache,
                        "alreadyFetched": True,
                        "note": "Demographics already fetched in this turn. Do NOT call again; answer now.",
                    }
                if not user_id:
                    cache = {
                        # Do not expose userId to the model.
                        "demographics": None,
                        "profileComplete": False,
                        "missingFields": [],
                        "alreadyFetched": False,
                    }
                    return cache
                raw = fetch_user_demographics(
                    api_base_url=self._api_base_url,
                    internal_secret=self._internal_secret,
                    user_id=user_id,
                    timeout_seconds=self._timeout,
                )
                # Strip userId before passing to the model.
                if isinstance(raw, dict):
                    raw = {k: v for k, v in raw.items() if k != "userId"}
                cache = raw
                cache["alreadyFetched"] = False
                return cache

            afc_enabled = user_id != "system-admin"
            
            if user_id == "system-admin":
                effective_system_instruction = system_instruction or ""
            else:
                effective_system_instruction = (
                    (system_instruction or "")
                    + "\n\nTOOL: You can call get_user_demographics(reason: str) to retrieve the logged-in user's profile."
                    + "\nYou MUST call get_user_demographics(reason: str) ONCE BEFORE answering."
                    + "\nUse the returned demographics to tailor advice."
                    + "\nIf profileComplete is false, clearly tell the user their profile is incomplete and ask them to update it."
                    + "\nIf the tool response contains alreadyFetched=true, you MUST NOT call any tools again and MUST answer immediately."
                    + "\nDo not call the tool more than once."
                    + "\nNever mention or reveal any user IDs, account IDs, or internal identifiers in your response."
                ).strip()

            config_kwargs = {
                "system_instruction": effective_system_instruction,
                "max_output_tokens": 2048,
                "http_options": types.HttpOptions(timeout=self._timeout * 1000),
            }
            
            if afc_enabled:
                config_kwargs.update({
                    "tools": [get_user_demographics],
                    "automatic_function_calling": types.AutomaticFunctionCallingConfig(
                        disable=False,
                        maximum_remote_calls=4,
                    ),
                    "response_mime_type": "application/json",
                    "response_schema": WiraResponseSchema,
                })
            else:
                config_kwargs.update({
                    "response_mime_type": "text/plain",
                })

            config = types.GenerateContentConfig(**config_kwargs)

            chat = self._client.chats.create(model=self._model_name, config=config)
            response = chat.send_message(prompt)
            
            elapsed_ms = (time.monotonic() - start) * 1000
            logger.info("Gemini: final response received in %.0f ms", elapsed_ms)

            if not response.text:
                return "I have retrieved your profile but could not generate a response. Please try again."

            return response.text

        except Exception as e:
            logger.error("Gemini provider error: %s", e)
            raise
