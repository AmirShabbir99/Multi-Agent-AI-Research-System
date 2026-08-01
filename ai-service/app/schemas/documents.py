from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DocumentRecord(BaseModel):
    document_id: str
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    chunk_count: int
    status: str
    vector_db_provider: str
    indexed_at: datetime
    uploaded_by: Optional[str] = None


class DocumentListData(BaseModel):
    documents: List[DocumentRecord]
    total: int


class DeleteDocumentData(BaseModel):
    document_id: str
    chunks_removed: int
    deleted: bool = True


class RebuildVectorDbData(BaseModel):
    documents_processed: int
    total_chunks: int
    provider: str
    duration_seconds: float
    failed_documents: List[str] = []
