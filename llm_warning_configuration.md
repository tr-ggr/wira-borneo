# LLM Warning Message Configuration

This document outlines how the WIRA system generates localized emergency notification drafts using LLMs (SEA-LION and Gemini).

## 1. Request Flow

1.  **Frontend**: An administrator clicks "Suggest Prompt" on the Manual Warning page.
2.  **API Client**: Sends a POST request to `/api/admin/warnings/prompt-suggestion` with context (hazard, area, radius, severity, title).
3.  **Backend (NestJS)**: `AdminOperationsService.getWarningPromptSuggestion` constructs a high-level "question" for the LLM.
4.  **LLM Server (Python)**: Processes the request using the `AssistantService` pipeline.

## 2. Prompt Construction (Backend)

The backend builds the following natural language query:

> "Generate a localized emergency notification message for a {hazardType} warning {severity} targeting {areaOrRegion} {radius}. {messageContext}. Write the notification in the local language or dialect appropriate for this region. Include nearest evacuation guidance, expected impact, and immediate safety actions. Return only the notification text, no JSON wrapping."

## 3. System Instructions (LLM Server)

When the LLM server detects a request from `system-admin`, it applies a specialized system role defined in `prompt_builder.py`:

- **Role**: "Expert crisis communications writer for a disaster preparedness and response system."
- **Formatting**: Plain text only. No JSON. No Markdown.
- **Bypass**: Skips the citizen-facing chatbot logic (no demographic tool calls, no profile completion requests).

## 4. Provider-Level Constraints (Gemini & SEA-LION)

To ensure messages are suitable for SMS and push notifications, the following constraints are enforced at the provider level (`gemini.py` and `sea_lion.py`):

- **Character Limit**: Maximum 300 characters.
- **No Markdown**: No bolding (`**`), headers (`#`), or list symbols that might break basic text displays.
- **No Apologies**: Strictly forbidden from apologizing for "missing user profiles" or mentioning that the information is generalized.
- **Content Focus**: Must be concise and include immediate safety instructions.

## 5. Fallback Mechanism

If the LLM services are unavailable or fail to produce a valid response:
- The system defaults to a static template: 
  > "Issue a {hazardType} warning for {areaOrRegion}. Include nearest evacuation areas, expected impact window, and immediate safety actions."
- Adds a reminder to the admin: "Review and send manually to avoid false alarms."
