from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.api.deps import require_internal_auth
from app.core.config import get_settings
from app.core.exceptions import FileTooLargeError, UnsupportedFileTypeError
from app.core.logging_config import get_logger
from app.schemas.common import APIResponse
from app.schemas.upload import UploadResponseData
from app.services.chunking import chunk_text
from app.services.document_registry import get_document_registry
from app.services.embeddings import embed_texts
from app.services.text_extraction import extract_text
from app.services.vector_store import ChunkToIndex, get_vector_store

router = APIRouter(tags=["Documents"], dependencies=[Depends(require_internal_auth)])
logger = get_logger(__name__)
settings = get_settings()


@router.post(
    "/upload",
    response_model=APIResponse[UploadResponseData],
    status_code=status.HTTP_201_CREATED,
    summary="Upload and index a document (PDF/DOCX/TXT/MD)",
)
async def upload_document(
    file: UploadFile = File(...),
    uploaded_by: Optional[str] = Form(default=None, description="Opaque user id, passed through from Node for auditing"),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in settings.allowed_upload_extensions_list:
        raise UnsupportedFileTypeError(
            f"'{ext}' is not supported. Allowed types: {', '.join(settings.allowed_upload_extensions_list)}"
        )

    content = await file.read()
    size_bytes = len(content)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise FileTooLargeError(f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit.")

    logger.info("Processing upload", extra={"context": {"filename": file.filename, "size_bytes": size_bytes}})

    raw_text = await extract_text(file.filename, content)
    chunks = chunk_text(raw_text)

    registry = get_document_registry()
    record = await registry.create(
        original_name=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        raw_text=raw_text,
        vector_db_provider=settings.VECTOR_DB_PROVIDER,
        chunk_count=len(chunks),
        uploaded_by=uploaded_by,
    )

    try:
        embeddings = await embed_texts([c.content for c in chunks])
        store = get_vector_store()
        chunks_to_index = [
            ChunkToIndex(chunk_id=f"{record.document_id}::{c.index}", content=c.content, embedding=emb)
            for c, emb in zip(chunks, embeddings)
        ]
        await store.add_chunks(record.document_id, record.original_name, chunks_to_index)
    except Exception:
        await registry.update_status(record.document_id, status="failed")
        raise

    logger.info(
        "Document indexed successfully",
        extra={"context": {"document_id": record.document_id, "chunk_count": len(chunks)}},
    )

    return APIResponse(
        message="Document uploaded and indexed successfully.",
        data=UploadResponseData(
            document_id=record.document_id,
            filename=record.filename,
            original_name=record.original_name,
            size_bytes=record.size_bytes,
            mime_type=record.mime_type,
            chunk_count=len(chunks),
            status="indexed",
            indexed_at=record.indexed_at,
            vector_db_provider=record.vector_db_provider,
            uploaded_by=record.uploaded_by,
        ),
    )
