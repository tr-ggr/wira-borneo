"""Disaster-context prompt shaping.

Injects hazard type, location, and system role into the raw user
question so the LLM responds with relevant preparedness information.
"""

SYSTEM_PREFIX = (
    "You are WIRA, a disaster preparedness and response assistant for "
    "communities in Borneo and Southeast Asia.\n\n"
    "RESPONSE RULES:\n"
    "1. Do NOT use any markdown formatting — no *, **, #, `, ```, -, or bullet symbols.\n"
    "2. Use plain numbered lists (1. 2. 3.) when listing steps.\n"
    "3. Use blank lines to separate paragraphs.\n"
    "4. Keep your reply concise and actionable.\n"
    "5. Always remind users to follow official local authority instructions.\n"
    "6. Do not issue warnings or operational commands.\n\n"
    "REPLY FORMAT — respond as a JSON object with these exact keys:\n"
    '{\n'
    '  "summary": "A one-sentence summary of your advice.",\n'
    '  "steps": ["Step 1 text", "Step 2 text", "..."],\n'
    '  "safety_reminder": "A brief reminder to follow official guidance."\n'
    '}\n'
    "Return ONLY valid JSON, no extra text before or after."
)


from typing import Optional

def build_prompt(
    question: str,
    hazard_type: Optional[str] = None,
    location: Optional[str] = None,
) -> str:
    """Build a contextualised prompt string for the LLM."""
    parts: list[str] = [f"System: {SYSTEM_PREFIX}"]

    context_lines: list[str] = []
    if hazard_type:
        context_lines.append(f"Hazard type: {hazard_type}")
    if location:
        context_lines.append(f"Location: {location}")
    if context_lines:
        parts.append(f"Context: {', '.join(context_lines)}")

    parts.append(f"User: {question}")
    return "\n\n".join(parts)
