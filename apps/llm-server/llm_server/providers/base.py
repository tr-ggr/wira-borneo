"""Abstract base for LLM providers."""

from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """Interface that every LLM backend must implement."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name returned in API responses."""
        ...

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Send *prompt* and return the model's text response.

        Raises on network / provider errors so the router can fall back.
        """
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Return ``True`` when the provider can accept another request."""
        ...
