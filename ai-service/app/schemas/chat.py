from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import SourceChunk, WebSource


class ChatTurn(BaseModel):
    """One prior turn, sent by Node so this stateless service has conversational context."""

    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    message: str = Field(..., min_length=1, max_length=4000)
    history: List[ChatTurn] = Field(
        default_factory=list, description="Prior turns for this session, most-recent-last (Node is the source of truth)"
    )
    document_ids: List[str] = Field(default_factory=list, description="Scope retrieval to these documents; empty = all")
    allow_web_search: bool = Field(default=True)

    @field_validator("message")
    @classmethod
    def _strip_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message cannot be blank")
        return v


class ChatResponseData(BaseModel):
    session_id: str
    reply: str
    sources: List[SourceChunk] = Field(default_factory=list)
    web_sources: List[WebSource] = Field(default_factory=list)
    tools_used: List[str] = Field(default_factory=list)
