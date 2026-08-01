"""
Embedding provider factory.

Kept as its own module (separate from llm_provider.py) because embeddings and
chat completions are frequently swapped independently of one another in
production (e.g. cheaper/faster embedding model, same chat model).
"""
from functools import lru_cache
from typing import List

from langchain_core.embeddings import Embeddings

from app.core.config import get_settings
from app.core.exceptions import LLMProviderError
from app.core.logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()


@lru_cache
def get_embedding_model() -> Embeddings:
    provider = settings.EMBEDDING_PROVIDER
    try:
        if provider == "mistral":
            from langchain_mistralai import MistralAIEmbeddings

            if not settings.MISTRAL_API_KEY:
                raise LLMProviderError("MISTRAL_API_KEY is not set but EMBEDDING_PROVIDER=mistral.")
            return MistralAIEmbeddings(model=settings.MISTRAL_EMBED_MODEL, mistral_api_key=settings.MISTRAL_API_KEY)

        if provider == "openai":
            from langchain_openai import OpenAIEmbeddings

            if not settings.OPENAI_API_KEY:
                raise LLMProviderError("OPENAI_API_KEY is not set but EMBEDDING_PROVIDER=openai.")
            return OpenAIEmbeddings(model=settings.OPENAI_EMBED_MODEL, api_key=settings.OPENAI_API_KEY)

        raise LLMProviderError(f"Unknown EMBEDDING_PROVIDER: {provider}")
    except LLMProviderError:
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Failed to initialize embedding provider", extra={"context": {"provider": provider}})
        raise LLMProviderError(f"Failed to initialize embedding provider '{provider}': {exc}") from exc


async def embed_texts(texts: List[str]) -> List[List[float]]:
    model = get_embedding_model()
    try:
        return await model.aembed_documents(texts)
    except Exception as exc:
        logger.error("Embedding batch failed", extra={"context": {"count": len(texts), "error": str(exc)}})
        raise LLMProviderError(f"Failed to generate embeddings: {exc}") from exc


async def embed_query(text: str) -> List[float]:
    model = get_embedding_model()
    try:
        return await model.aembed_query(text)
    except Exception as exc:
        logger.error("Query embedding failed", extra={"context": {"error": str(exc)}})
        raise LLMProviderError(f"Failed to embed query: {exc}") from exc
