# llm-server

Flask-based LLM gateway for WIRA.

- Primary: SEA-LION (OpenAI-compatible endpoint)
- Fallback: Google Gemini

## Environment variables

- `SEA_LION_API_KEY`: API key for `SEA_LION_BASE_URL`
- `SEA_LION_BASE_URL`: defaults to `https://api.sea-lion.ai/v1`
- `SEA_LION_MODEL`: defaults to `aisingapore/Gemma-SEA-LION-v4-27B-IT`
- `SEA_LION_RPM_LIMIT`: defaults to `10`
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `WIRA_API_BASE_URL`: defaults to `http://localhost:3333`
- `WIRA_INTERNAL_SECRET`: shared secret for internal demographics tool callback

