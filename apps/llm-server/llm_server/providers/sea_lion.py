"""SEA-LION provider via OpenAI-compatible API.

Uses the OpenAI Python SDK pointing to SEA-LION base_url:
  https://api.sea-lion.ai/v1

Tracks a per-minute sliding window to stay within an RPM limit.
"""

import logging
import time
from collections import deque

from typing import Optional
import json
from openai import OpenAI

from .base import LLMProvider
from llm_server.services.demographics_client import fetch_user_demographics

logger = logging.getLogger(__name__)


class SeaLionProvider(LLMProvider):
    """Primary LLM — AI Singapore SEA-LION via OpenAI-compatible endpoint."""

    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        rpm_limit: int,
        timeout: int,
        api_base_url: str,
        internal_secret: str,
    ):
        self._client = OpenAI(api_key=api_key, base_url=base_url)
        self._model = model
        self._rpm_limit = rpm_limit
        self._timeout = timeout
        self._api_base_url = api_base_url
        self._internal_secret = internal_secret
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

    def generate(
        self, 
        prompt: str, 
        system_instruction: Optional[str] = None, 
        demographics: Optional[dict] = None,
        user_id: Optional[str] = None,
    ) -> str:
        # #region agent log
        logger.info(
            "SEA-LION: request start model=%s hasSystem=%s promptChars=%s",
            self._model,
            bool(system_instruction),
            len(prompt or ""),
        )
        # #endregion agent log
        start = time.monotonic()

        tool_name = "get_user_demographics"
        tools = [
            {
                "type": "function",
                "function": {
                    "name": tool_name,
                    "description": "Retrieve the logged-in user's demographics/profile from the database.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reason": {"type": "string"},
                        },
                        "required": ["reason"],
                    },
                },
            }
        ]

        is_admin = user_id == "system-admin"

        if is_admin:
            effective_system_instruction = system_instruction or ""
        else:
            effective_system_instruction = (
                (system_instruction or "")
                + "\n\nTOOL: You MUST call get_user_demographics(reason: str) BEFORE answering."
                + "\nUse the returned demographics to tailor advice."
                + "\nIf profileComplete is false, clearly tell the user their profile is incomplete and ask them to update it."
                + "\nCall the tool at most once."
                + "\nNever mention or reveal any user IDs, account IDs, or internal identifiers in your response."
            ).strip()

        messages: list[dict] = []
        # The SEA-LION OpenAI-compatible gateway (LiteLLM) can be strict about
        # role alternation. To avoid `system` breaking alternation rules, we fold
        # system instructions into the first user message.
        first_user = prompt
        if effective_system_instruction:
            first_user = f"{effective_system_instruction}\n\n{prompt}"
        messages.append({"role": "user", "content": first_user})

        # #region agent log
        logger.info("SEA-LION: calling OpenAI chat.completions.create")
        # #endregion agent log

        if is_admin or not user_id:
            # No user context available or admin bypass: answer strictly based on the system prompt.
            result = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=1024,
                timeout=self._timeout,
            )
            content = (result.choices[0].message.content or "").strip()
            
            # Ask users to complete profiles if it wasn't an admin bypass
            if not is_admin:
                if content:
                    content += "\n\nNote: I couldn’t access your profile. Please complete/update your profile for personalized guidance."
                else:
                    content = "I couldn’t access your profile. Please complete/update your profile for personalized guidance."
            
            self._record_request()
            elapsed_ms = (time.monotonic() - start) * 1000
            logger.info("SEA-LION: response received in %.0f ms", elapsed_ms)
            return content

        # Force a tool call first (always).
        result = self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            tools=tools,
            tool_choice={"type": "function", "function": {"name": tool_name}},
            max_tokens=256,
            timeout=self._timeout,
        )

        msg = result.choices[0].message
        tool_calls = getattr(msg, "tool_calls", None) or []
        if tool_calls:
            call = tool_calls[0]
            tool_result = fetch_user_demographics(
                api_base_url=self._api_base_url,
                internal_secret=self._internal_secret,
                user_id=user_id,
                timeout_seconds=self._timeout,
            )

            # Do not expose raw userId to the model; it should reason only over
            # demographics / profile fields, not internal identifiers.
            if isinstance(tool_result, dict):
                tool_result = {k: v for k, v in tool_result.items() if k != "userId"}

            # The SEA-LION gateway is strict about role alternation and may not
            # support the `tool` role. We therefore perform tool lookup server-side
            # and then ask the model to answer in a fresh call with a single `user`
            # message containing the tool result.
            final_user = (
                "USER DEMOGRAPHICS TOOL RESULT (JSON):\n"
                + json.dumps(tool_result, ensure_ascii=False)
                + "\n\nNow answer the original question using this profile. "
                + "If profileComplete is false, clearly say the profile is incomplete and ask the user to update it."
                + "\n\nORIGINAL QUESTION:\n"
                + prompt
            )
            result2 = self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": final_user}],
                max_tokens=1024,
                timeout=self._timeout,
            )
            content = (result2.choices[0].message.content or "").strip()
        else:
            # Unexpected: model didn't return a tool call even though we forced it.
            # Proceed with best-effort: fetch demographics and answer.
            tool_result = fetch_user_demographics(
                api_base_url=self._api_base_url,
                internal_secret=self._internal_secret,
                user_id=user_id,
                timeout_seconds=self._timeout,
            )
            if isinstance(tool_result, dict):
                tool_result = {k: v for k, v in tool_result.items() if k != "userId"}
            messages.append(
                {
                    "role": "system",
                    "content": "USER DEMOGRAPHICS (system):\n" + json.dumps(tool_result, ensure_ascii=False),
                }
            )
            result2 = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=1024,
                timeout=self._timeout,
            )
            content = (result2.choices[0].message.content or "").strip()

        self._record_request()
        elapsed_ms = (time.monotonic() - start) * 1000
        logger.info("SEA-LION: response received in %.0f ms", elapsed_ms)
        return content
