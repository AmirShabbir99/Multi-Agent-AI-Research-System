"""
Document registry.

This is intentionally *not* MongoDB: Node.js already owns the business-facing
`Document`/`Upload` collections (uploader, permissions, display metadata).
This registry is the AI service's own bookkeeping - which documents are
actually indexed in the vector store right now, and where their extracted
raw text lives on disk so /rebuild-vector-db can re-chunk and re-embed
without asking the client to re-upload every file.

SQLite (via aiosqlite) is used because it's a single-file, zero-ops store
that's more than sufficient for this service's own working state.
"""
from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import aiosqlite

from app.core.config import get_settings
from app.core.exceptions import NotFoundError

settings = get_settings()

_SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    document_id         TEXT PRIMARY KEY,
    filename             TEXT NOT NULL,
    original_name        TEXT NOT NULL,
    mime_type            TEXT NOT NULL,
    size_bytes           INTEGER NOT NULL,
    chunk_count          INTEGER NOT NULL DEFAULT 0,
    status               TEXT NOT NULL DEFAULT 'processing',
    vector_db_provider   TEXT NOT NULL,
    raw_text_path        TEXT NOT NULL,
    uploaded_by          TEXT,
    indexed_at           TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
"""


@dataclass
class DocumentRecord:
    document_id: str
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    chunk_count: int
    status: str
    vector_db_provider: str
    raw_text_path: str
    uploaded_by: Optional[str]
    indexed_at: str


def _row_to_record(row: aiosqlite.Row) -> DocumentRecord:
    return DocumentRecord(**dict(row))


class DocumentRegistry:
    def __init__(self, db_path: str):
        self._db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        Path(settings.DOCUMENTS_DIR).mkdir(parents=True, exist_ok=True)

    @asynccontextmanager
    async def _connect(self):
        conn = await aiosqlite.connect(self._db_path)
        conn.row_factory = aiosqlite.Row
        try:
            await conn.executescript(_SCHEMA)
            yield conn
        finally:
            await conn.close()

    async def create(
        self,
        *,
        original_name: str,
        mime_type: str,
        size_bytes: int,
        raw_text: str,
        vector_db_provider: str,
        chunk_count: int,
        uploaded_by: Optional[str] = None,
    ) -> DocumentRecord:
        document_id = uuid.uuid4().hex
        filename = f"{document_id}{Path(original_name).suffix.lower()}"
        raw_text_path = str(Path(settings.DOCUMENTS_DIR) / f"{document_id}.txt")
        Path(raw_text_path).write_text(raw_text, encoding="utf-8")
        indexed_at = datetime.utcnow().isoformat()

        async with self._connect() as conn:
            await conn.execute(
                """INSERT INTO documents
                   (document_id, filename, original_name, mime_type, size_bytes,
                    chunk_count, status, vector_db_provider, raw_text_path, uploaded_by, indexed_at)
                   VALUES (?, ?, ?, ?, ?, ?, 'indexed', ?, ?, ?, ?)""",
                (
                    document_id,
                    filename,
                    original_name,
                    mime_type,
                    size_bytes,
                    chunk_count,
                    vector_db_provider,
                    raw_text_path,
                    uploaded_by,
                    indexed_at,
                ),
            )
            await conn.commit()

        return DocumentRecord(
            document_id=document_id,
            filename=filename,
            original_name=original_name,
            mime_type=mime_type,
            size_bytes=size_bytes,
            chunk_count=chunk_count,
            status="indexed",
            vector_db_provider=vector_db_provider,
            raw_text_path=raw_text_path,
            uploaded_by=uploaded_by,
            indexed_at=indexed_at,
        )

    async def list_all(self) -> List[DocumentRecord]:
        async with self._connect() as conn:
            cursor = await conn.execute("SELECT * FROM documents ORDER BY indexed_at DESC")
            rows = await cursor.fetchall()
            return [_row_to_record(r) for r in rows]

    async def get(self, document_id: str) -> DocumentRecord:
        async with self._connect() as conn:
            cursor = await conn.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,))
            row = await cursor.fetchone()
            if row is None:
                raise NotFoundError(f"Document '{document_id}' was not found in the index.")
            return _row_to_record(row)

    async def get_document_name(self, document_id: str) -> str:
        try:
            record = await self.get(document_id)
            return record.original_name
        except NotFoundError:
            return document_id

    async def delete(self, document_id: str) -> None:
        record = await self.get(document_id)  # raises NotFoundError if missing
        async with self._connect() as conn:
            await conn.execute("DELETE FROM documents WHERE document_id = ?", (document_id,))
            await conn.commit()
        Path(record.raw_text_path).unlink(missing_ok=True)

    async def update_status(self, document_id: str, status: str, chunk_count: Optional[int] = None) -> None:
        async with self._connect() as conn:
            if chunk_count is not None:
                await conn.execute(
                    "UPDATE documents SET status = ?, chunk_count = ? WHERE document_id = ?",
                    (status, chunk_count, document_id),
                )
            else:
                await conn.execute("UPDATE documents SET status = ? WHERE document_id = ?", (status, document_id))
            await conn.commit()

    async def clear_all(self) -> None:
        async with self._connect() as conn:
            await conn.execute("DELETE FROM documents")
            await conn.commit()


_registry: Optional[DocumentRegistry] = None


def get_document_registry() -> DocumentRegistry:
    global _registry
    if _registry is None:
        _registry = DocumentRegistry(settings.REGISTRY_DB_PATH)
    return _registry
