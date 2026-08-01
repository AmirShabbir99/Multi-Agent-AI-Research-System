"""
Application configuration.

All runtime configuration is sourced from environment variables (see .env.example).
We use pydantic-settings so values are validated and typed at startup instead of
failing deep inside some service at request time.
"""
from functools import lru_cache
from typing import List, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App metadata ─────────────────────────────────────────────
    APP_NAME: str = "ResearchMind AI Service"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ── Security (service-to-service) ───────────────────────────
    # The Node.js server is the only intended caller of this API. Every request
    # must carry this key in the `X-Internal-Api-Key` header (see core/security.py).
    INTERNAL_API_KEY: str = Field(..., description="Shared secret with the Node.js backend")

    # ── CORS ─────────────────────────────────────────────────────
    # In production this should really only contain the Node server's origin,
    # since the frontend never talks to this service directly.
    ALLOWED_ORIGINS: str = "http://localhost:5000,http://localhost:5173"

    # ── LLM Provider ─────────────────────────────────────────────
    LLM_PROVIDER: Literal["mistral", "openai", "anthropic"] = "mistral"
    MISTRAL_API_KEY: str = ""
    MISTRAL_CHAT_MODEL: str = "mistral-small-latest"
    OPENAI_API_KEY: str = ""
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_CHAT_MODEL: str = "claude-sonnet-4-6"
    LLM_TEMPERATURE: float = 0.2

    # ── Embeddings ───────────────────────────────────────────────
    EMBEDDING_PROVIDER: Literal["mistral", "openai"] = "mistral"
    MISTRAL_EMBED_MODEL: str = "mistral-embed"
    OPENAI_EMBED_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1024  # mistral-embed output size

    # ── Web search / scraping tools ─────────────────────────────
    TAVILY_API_KEY: str = ""
    SCRAPE_TIMEOUT_SECONDS: int = 8
    SCRAPE_MAX_CHARS: int = 4000

    # ── Vector store ─────────────────────────────────────────────
    VECTOR_DB_PROVIDER: Literal["faiss", "mongodb"] = "faiss"
    VECTOR_STORE_DIR: str = "app/../data/vector_store"
    MONGODB_URI: str = ""
    MONGODB_DB_NAME: str = "ai_service"
    MONGODB_VECTOR_COLLECTION: str = "document_chunks"
    MONGODB_VECTOR_INDEX_NAME: str = "vector_index"

    # ── Document processing ──────────────────────────────────────
    DOCUMENTS_DIR: str = "app/../data/documents"
    REGISTRY_DB_PATH: str = "app/../data/registry.sqlite3"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_UPLOAD_EXTENSIONS: str = ".pdf,.docx,.txt,.md"

    # ── Retrieval ─────────────────────────────────────────────────
    DEFAULT_TOP_K: int = 5
    MAX_TOP_K: int = 20

    # ── Session / history buffer ─────────────────────────────────
    SESSION_DB_PATH: str = "app/../data/sessions.sqlite3"
    MAX_HISTORY_TURNS_IN_PROMPT: int = 12

    # ── Logging ──────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    LOG_TO_FILE: bool = True

    @field_validator("ALLOWED_UPLOAD_EXTENSIONS")
    @classmethod
    def _normalize_extensions(cls, v: str) -> str:
        return ",".join(part.strip().lower() for part in v.split(",") if part.strip())

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_upload_extensions_list(self) -> List[str]:
        return [e.strip().lower() for e in self.ALLOWED_UPLOAD_EXTENSIONS.split(",") if e.strip()]


@lru_cache
def get_settings() -> "Settings":
    """Cached settings accessor so we parse the environment exactly once."""
    return Settings()
