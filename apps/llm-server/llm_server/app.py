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
from services import LLMRouter, build_prompt

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
        api_token=Config.HF_API_TOKEN,
        model_id=Config.HF_MODEL_ID,
        rpm_limit=Config.HF_RPM_LIMIT,
        timeout=Config.LLM_TIMEOUT_SECONDS,
    )
    gemini = GeminiProvider(
        api_key=Config.GEMINI_API_KEY,
        model=Config.GEMINI_MODEL,
        timeout=Config.LLM_TIMEOUT_SECONDS,
    )
    router = LLMRouter(primary=sea_lion, fallback=gemini)

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
        prompt = build_prompt(
            question=question,
            hazard_type=context.get("hazardType"),
            location=context.get("location"),
        )

        try:
            answer, provider_name = router.generate(prompt)
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
        except (json.JSONDecodeError, TypeError):
            # Fallback: wrap raw text if LLM didn't return valid JSON
            data = {
                "summary": answer,
                "steps": [],
                "safety_reminder": "",
            }

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
