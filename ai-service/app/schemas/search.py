from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import SourceChunk, WebSource


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    mode: Literal["documents", "web", "hybrid"] = "documents"
    document_ids: List[str] = Field(default_factory=list)
    top_k: int = Field(default=5, ge=1, le=20)

    @field_validator("query")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class SearchResponseData(BaseModel):
    query: str
    mode: str
    document_results: List[SourceChunk] = Field(default_factory=list)
    web_results: List[WebSource] = Field(default_factory=list)
    total_results: int
