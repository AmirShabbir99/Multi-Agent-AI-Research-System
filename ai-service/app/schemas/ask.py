from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import SourceChunk, WebSource


class AskRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000)
    session_id: Optional[str] = Field(default=None, description="Groups this ask under a session for /history")
    document_ids: List[str] = Field(
        default_factory=list, description="Restrict retrieval to these document ids. Empty = search all."
    )
    mode: Literal["quick", "research"] = Field(
        default="quick",
        description="'quick' = RAG/tool-calling single answer. 'research' = full 4-agent pipeline producing a report.",
    )
    top_k: int = Field(default=5, ge=1, le=20)
    allow_web_search: bool = Field(
        default=True, description="Whether the agent may fall back to a live web search when documents are insufficient"
    )

    @field_validator("query")
    @classmethod
    def _strip_query(cls, v: str) -> str:
        return v.strip()


class QuickAnswerData(BaseModel):
    mode: Literal["quick"] = "quick"
    answer: str
    sources: List[SourceChunk] = Field(default_factory=list)
    web_sources: List[WebSource] = Field(default_factory=list)
    used_web_search: bool = False
    session_id: Optional[str] = None


class ResearchReportData(BaseModel):
    mode: Literal["research"] = "research"
    topic: str
    search_results: str
    scraped_content: str
    report: str
    critique: str
    web_sources: List[WebSource] = Field(default_factory=list)
    session_id: Optional[str] = None
