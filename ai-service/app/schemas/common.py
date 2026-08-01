"""Shared Pydantic models reused across multiple endpoint schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class SourceChunk(BaseModel):
    """A single retrieved chunk, returned alongside generated answers for citation."""

    document_id: str
    document_name: str
    chunk_id: str
    content: str
    score: float = Field(..., description="Similarity score, higher is more relevant")


class WebSource(BaseModel):
    """A single web result returned by the search tool."""

    title: str
    url: str
    snippet: Optional[str] = None


class APIResponse(BaseModel, Generic[T]):
    """Uniform envelope returned by every endpoint in this service."""

    success: bool = True
    message: str = "OK"
    data: Optional[T] = None
    request_id: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: str
    details: Optional[object] = None
    request_id: Optional[str] = None


class TimestampedModel(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
