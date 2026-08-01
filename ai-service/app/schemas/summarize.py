from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class SummarizeRequest(BaseModel):
    document_id: Optional[str] = Field(default=None, description="Summarize a previously uploaded document")
    text: Optional[str] = Field(default=None, description="Summarize raw text instead of a stored document")
    length: Literal["short", "medium", "detailed"] = "medium"

    @field_validator("text")
    @classmethod
    def _strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v

    @model_validator(mode="after")
    def _one_source_required(self) -> "SummarizeRequest":
        if not self.document_id and not self.text:
            raise ValueError("Provide either 'document_id' or 'text' to summarize.")
        if self.document_id and self.text:
            raise ValueError("Provide only one of 'document_id' or 'text', not both.")
        if self.text is not None and len(self.text) < 40:
            raise ValueError("'text' must be at least 40 characters long.")
        return self


class SummarizeResponseData(BaseModel):
    source: Literal["document", "text"]
    document_id: Optional[str] = None
    summary: str
    original_length_chars: int
    summary_length_chars: int
    chunks_processed: int
