"""Disaster-context prompt shaping.

Injects hazard type, location, and system role into the raw user
question so the LLM responds with relevant preparedness information.
"""

SYSTEM_ROLE = (
    "You are WIRA, a disaster preparedness and response assistant for "
    "communities in Borneo and Southeast Asia."
)

RESPONSE_RULES = (
    "RESPONSE RULES:\n"
    "1. Do NOT use any markdown formatting — no *, **, #, `, ```, -, or bullet symbols.\n"
    "2. Use plain numbered lists (1. 2. 3.) when listing steps.\n"
    "3. Use blank lines to separate paragraphs.\n"
    "4. Keep your reply concise and actionable — the entire response (summary, steps, and safety_reminder combined) must fit within approximately 1,500 characters.\n"
    "5. Prefer at most 8 steps; if needed, merge or omit lower-priority details so that the most critical actions are fully visible.\n"
    "6. Always remind users to follow official local authority instructions.\n"
    "7. Do not issue warnings or operational commands."
)

JSON_FORMAT_SCHEMA = (
    "REPLY FORMAT — respond as a JSON object with these exact keys:\n"
    '{\n'
    '  "summary": "A one-sentence summary of your advice.",\n'
    '  "steps": ["Step 1 text", "Step 2 text", "..."],\n'
    '  "safety_reminder": "A brief reminder to follow official guidance."\n'
    '}'
)


from typing import Optional

def build_contextual_prompt(
    question: str,
    hazard_type: Optional[str] = None,
    location: Optional[str] = None,
    demographics: Optional[dict] = None,
) -> tuple[str, str]:
    """Build system and user parts for the prompt."""
    # System part
    system_parts = [SYSTEM_ROLE, RESPONSE_RULES]
    
    system_parts.append(
        "PERSONALIZATION:\n"
        "Always retrieve the user's demographics using the tool "
        "get_user_demographics(reason: str) BEFORE answering. Use the returned data to tailor your advice.\n"
        "If the tool indicates profileComplete is false, clearly tell the user their profile is incomplete "
        "and ask them to update their profile for better guidance."
    )
    
    system_parts.append(
        "ONLY when you are ready to answer the user, provide your final response in this EXACT JSON format:\n"
        + JSON_FORMAT_SCHEMA
    )
    system_text = "\n\n".join(system_parts)

    # User part
    user_parts = []
    context_lines: list[str] = []
    if hazard_type:
        context_lines.append(f"Hazard type: {hazard_type}")
    if location:
        context_lines.append(f"Location: {location}")
    
    if context_lines:
        user_parts.append(f"Context: {', '.join(context_lines)}")

    user_parts.append(f"User: {question}")
    user_text = "\n\n".join(user_parts)
    
    return system_text, user_text


def build_prompt(
    question: str,
    hazard_type: Optional[str] = None,
    location: Optional[str] = None,
    demographics: Optional[dict] = None,
) -> str:
    """Legacy single-string prompt builder."""
    system, user = build_contextual_prompt(question, hazard_type, location, demographics)
    return f"System: {system}\n\n{user}"
