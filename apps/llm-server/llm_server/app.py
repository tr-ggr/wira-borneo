"""
WIRA LLM Server — Flask application.
Exposes ``/api/chat`` (POST) and ``/health`` (GET).
"""

import json
import logging

from flask import Flask, jsonify, request
from flasgger import Swagger

from config import Config
from providers import SeaLionProvider, GeminiProvider
from services import LLMRouter, build_prompt, build_contextual_prompt

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

DISCLAIMER = (
    "This assistant provides general preparedness guidance only and "
    "cannot issue warnings or operational commands."
)


def create_app() -> Flask:
    """Application factory."""
    app = Flask(__name__)

    app.config["SWAGGER"] = {
        "title": "WIRA LLM Server",
        "description": "Hybrid LLM gateway — SEA-LION primary, Gemini fallback.",
        "version": "1.0.0",
        "uiversion": 3,
    }
    Swagger(app)

    # ------------------------------------------------------------------
    # Initialise providers + router
    # ------------------------------------------------------------------
    sea_lion = SeaLionProvider(
        api_key=Config.SEA_LION_API_KEY,
        base_url=Config.SEA_LION_BASE_URL,
        model=Config.SEA_LION_MODEL,
        rpm_limit=Config.SEA_LION_RPM_LIMIT,
        timeout=Config.LLM_TIMEOUT_SECONDS,
        api_base_url=Config.WIRA_API_BASE_URL,
        internal_secret=Config.WIRA_INTERNAL_SECRET,
    )
    gemini = GeminiProvider(
        api_key=Config.GEMINI_API_KEY,
        model=Config.GEMINI_MODEL,
        timeout=Config.LLM_TIMEOUT_SECONDS,
        api_base_url=Config.WIRA_API_BASE_URL,
        internal_secret=Config.WIRA_INTERNAL_SECRET,
    )
    router = LLMRouter(primary=sea_lion, fallback=gemini)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _markdown_to_schema(text: str) -> dict:
        """
        Best-effort normalization of a free-form / markdown SEA-LION reply into
        the expected {summary, steps, safety_reminder} schema.

        Heuristics:
        - First non-empty line → summary.
        - Lines starting with bullets/numbering (e.g. "-", "*", "•", "1.", "2.") → steps.
        - Last line mentioning "authority" / "authorities" / "official" / "safety"
          is treated as safety_reminder.
        """
        lines = [ln.strip() for ln in (text or "").splitlines()]
        lines = [ln for ln in lines if ln]  # drop empty

        if not lines:
            return {
                "summary": "",
                "steps": [],
                "safety_reminder": "",
            }

        # Initial summary is the first non-empty line (trim later).
        summary = lines[0]
        bullet_prefixes = ("- ", "* ", "• ", "1. ", "2. ", "3. ", "4. ", "5. ")
        steps: list[str] = []
        safety_reminder = ""

        for ln in lines[1:]:
            lower = ln.lower()
            if any(lower.startswith(prefix) for prefix in bullet_prefixes):
                # Strip leading bullet / numbering
                stripped = ln.lstrip("-*• ").lstrip()
                steps.append(stripped)
            elif any(k in lower for k in ("authority", "authorities", "official", "safety", "disaster agency")):
                safety_reminder = ln

        # Final cleanup: strip common markdown markers like '*' that may still
        # be present in inline text.
        def _strip_markdown(s: str) -> str:
            return s.replace("*", "").strip()

        summary = _strip_markdown(summary)
        steps = [_strip_markdown(s) for s in steps]
        safety_reminder = _strip_markdown(safety_reminder)

        return {
            "summary": summary,
            "steps": steps,
            "safety_reminder": safety_reminder,
        }

    # ------------------------------------------------------------------
    # Routes
    # ------------------------------------------------------------------

    @app.post("/api/chat")
    def chat():
        """Send a question to the LLM assistant.
        ---
        tags:
          - Chat
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - question
              properties:
                question:
                  type: string
                  example: "What should I do during a flood?"
                  description: "User question (max 500 chars)"
                context:
                  type: object
                  properties:
                    hazardType:
                      type: string
                      example: "flood"
                    location:
                      type: string
                      example: "Sarawak"
        responses:
          200:
            description: Successful response
            schema:
              type: object
              properties:
                data:
                  type: object
                  properties:
                    summary:
                      type: string
                    steps:
                      type: array
                      items:
                        type: string
                    safety_reminder:
                      type: string
                provider:
                  type: string
                  enum: [sea-lion, gemini]
                disclaimer:
                  type: string
          400:
            description: Invalid request
          503:
            description: All providers unavailable
        """
        body = request.get_json(silent=True) or {}
        question = (body.get("question") or "").strip()

        if not question:
            return jsonify({"error": "question is required"}), 400
        if len(question) > 500:
            return jsonify({"error": "question must be ≤ 500 characters"}), 400

        context = body.get("context") or {}
        system_instruction, prompt_text = build_contextual_prompt(
            question=question,
            hazard_type=context.get("hazardType"),
            location=context.get("location"),
            demographics=context.get("demographics")
        )

        try:
            answer, provider_name = router.generate(
                prompt=prompt_text,
                system_instruction=system_instruction,
                demographics=context.get("demographics"),
                user_id=context.get("userId"),
            )
        except RuntimeError:
            return jsonify({
                "data": {
                    "summary": "All language model providers are currently unavailable. Please try again shortly.",
                    "steps": [],
                    "safety_reminder": "",
                },
                "provider": "none",
                "disclaimer": DISCLAIMER,
            }), 503

        # Parse structured JSON from the LLM reply
        try:
            data = json.loads(answer)
            # Normalize into the expected shape and ensure we never return
            # a completely empty payload (which would render as a blank chat bubble).
            if not isinstance(data, dict):
                data = {
                    "summary": str(data),
                    "steps": [],
                    "safety_reminder": "",
                }
            else:
                summary = str(data.get("summary") or "").strip()
                steps = data.get("steps") or []
                safety_reminder = str(data.get("safety_reminder") or "").strip()

                # If everything is empty, provide a generic fallback message.
                if not summary and not steps and not safety_reminder:
                    summary = (
                        "I couldn’t generate a detailed response this time. "
                        "Please try rephrasing your question or asking again."
                    )

                data = {
                    "summary": summary,
                    "steps": steps,
                    "safety_reminder": safety_reminder,
                }
        except (json.JSONDecodeError, TypeError):
            # Fallback: SEA-LION often returns markdown-like text. Try to
            # normalize it into our schema; if that still looks empty, use a
            # safe generic message.
            safe_text = (answer or "").strip()
            if not safe_text:
                safe_text = (
                    "I couldn’t generate a detailed response this time. "
                    "Please try rephrasing your question or asking again."
                )
            parsed = _markdown_to_schema(safe_text)
            if (
                not parsed.get("summary")
                and not parsed.get("steps")
                and not parsed.get("safety_reminder")
            ):
                parsed = {
                    "summary": safe_text,
                    "steps": [],
                    "safety_reminder": "",
                }
            data = parsed

        return jsonify({
            "data": data,
            "provider": provider_name,
            "disclaimer": DISCLAIMER,
        })

    @app.get("/health")
    def health():
        """Health check — shows provider availability.
        ---
        tags:
          - System
        responses:
          200:
            description: Server status
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: ok
                providers:
                  type: object
                  properties:
                    sea_lion:
                      type: boolean
                    gemini:
                      type: boolean
        """
        return jsonify({
            "status": "ok",
            "providers": {
                "sea_lion": sea_lion.is_available(),
                "gemini": gemini.is_available(),
            },
        })

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=Config.FLASK_PORT, debug=True)
