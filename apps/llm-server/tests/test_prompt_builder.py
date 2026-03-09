"""Tests for the prompt builder."""

from llm_server.services.prompt_builder import build_prompt


class TestBuildPrompt:
    def test_basic_question(self):
        prompt = build_prompt("How to prepare for floods?")
        assert "User: How to prepare for floods?" in prompt
        assert "System:" in prompt

    def test_with_hazard_type(self):
        prompt = build_prompt("What should I do?", hazard_type="FLOOD")
        assert "Hazard type: FLOOD" in prompt

    def test_with_location(self):
        prompt = build_prompt("Is it safe?", location="Kuching")
        assert "Location: Kuching" in prompt

    def test_with_full_context(self):
        prompt = build_prompt(
            "Evacuation routes?",
            hazard_type="TYPHOON",
            location="Sibu, Sarawak",
        )
        assert "Hazard type: TYPHOON" in prompt
        assert "Location: Sibu, Sarawak" in prompt
        assert "User: Evacuation routes?" in prompt

    def test_no_context_omits_context_line(self):
        prompt = build_prompt("General question")
        assert "Context:" not in prompt
