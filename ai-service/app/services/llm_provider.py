"""
LLM provider factory.

The original prototype hard-wired `ChatMistralAI` directly inside agents.py.
We keep Mistral as the default (it's what the existing API key / prototype was
built around) but wrap provider selection behind one factory function so
swapping to OpenAI or Anthropic later is a one-line config change, not a
code change - required by the "production-ready / scalable" brief.
"""
from functools import lru_cache
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import get_settings
from app.core.exceptions import LLMProviderError
from app.core.logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()


@lru_cache
def get_chat_model() -> BaseChatModel:
    """Returns a singleton LangChain chat model for the configured provider."""
    provider = settings.LLM_PROVIDER
    try:
        if provider == "mistral":
            from langchain_mistralai import ChatMistralAI

            if not settings.MISTRAL_API_KEY:
                raise LLMProviderError("MISTRAL_API_KEY is not set but LLM_PROVIDER=mistral.")
            return ChatMistralAI(
                model=settings.MISTRAL_CHAT_MODEL,
                mistral_api_key=settings.MISTRAL_API_KEY,
                temperature=settings.LLM_TEMPERATURE,
            )

        if provider == "openai":
            from langchain_openai import ChatOpenAI

            if not settings.OPENAI_API_KEY:
                raise LLMProviderError("OPENAI_API_KEY is not set but LLM_PROVIDER=openai.")
            return ChatOpenAI(
                model=settings.OPENAI_CHAT_MODEL,
                api_key=settings.OPENAI_API_KEY,
                temperature=settings.LLM_TEMPERATURE,
            )

        if provider == "anthropic":
            from langchain_anthropic import ChatAnthropic

            if not settings.ANTHROPIC_API_KEY:
                raise LLMProviderError("ANTHROPIC_API_KEY is not set but LLM_PROVIDER=anthropic.")
            return ChatAnthropic(
                model=settings.ANTHROPIC_CHAT_MODEL,
                api_key=settings.ANTHROPIC_API_KEY,
                temperature=settings.LLM_TEMPERATURE,
            )

        raise LLMProviderError(f"Unknown LLM_PROVIDER: {provider}")

    except LLMProviderError:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Failed to initialize LLM provider", extra={"context": {"provider": provider, "error": str(exc)}})
        raise LLMProviderError(f"Failed to initialize LLM provider '{provider}': {exc}") from exc


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type(Exception),
)
async def _invoke_with_retry(model: BaseChatModel, prompt_or_messages: Any):
    return await model.ainvoke(prompt_or_messages)


async def safe_ainvoke(prompt_or_messages: Any) -> str:
    """Invoke the chat model asynchronously, retrying transient failures, and normalize
    non-recoverable failures into LLMProviderError."""
    model = get_chat_model()
    try:
        result = await _invoke_with_retry(model, prompt_or_messages)
        return result.content if hasattr(result, "content") else str(result)
    except LLMProviderError:
        raise
    except Exception as exc:
        logger.error("LLM invocation failed after retries", extra={"context": {"error": str(exc)}})
        raise LLMProviderError(f"The language model provider failed to respond: {exc}") from exc
