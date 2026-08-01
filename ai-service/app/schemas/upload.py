from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UploadResponseData(BaseModel):
    document_id: str
    filename: str
    original_name: str
    size_bytes: int
    mime_type: str
    chunk_count: int
    status: str = Field(..., description="'indexed' | 'failed'")
    indexed_at: datetime
    vector_db_provider: str
    uploaded_by: Optional[str] = Field(
        default=None, description="Opaque user id passed through from Node for auditability"
    )
