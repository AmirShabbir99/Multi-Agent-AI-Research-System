import time
from pathlib import Path

from fastapi import APIRouter, Depends, status

from app.api.deps import require_internal_auth
from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.schemas.common import APIResponse
from app.schemas.documents import DeleteDocumentData, DocumentListData, DocumentRecord, RebuildVectorDbData
from app.services.chunking import chunk_text
from app.services.document_registry import get_document_registry
from app.services.embeddings import embed_texts
from app.services.vector_store import ChunkToIndex, get_vector_store

router = APIRouter(tags=["Documents"], dependencies=[Depends(require_internal_auth)])
logger = get_logger(__name__)
settings = get_settings()


@router.get("/documents", response_model=APIResponse[DocumentListData], summary="List all indexed documents")
async def list_documents():
    registry = get_document_registry()
    records = await registry.list_all()
    documents = [
        DocumentRecord(
            document_id=r.document_id,
            filename=r.filename,
            original_name=r.original_name,
            mime_type=r.mime_type,
            size_bytes=r.size_bytes,
            chunk_count=r.chunk_count,
            status=r.status,
            vector_db_provider=r.vector_db_provider,
            indexed_at=r.indexed_at,
            uploaded_by=r.uploaded_by,
        )
        for r in records
    ]
    return APIResponse(message=f"Found {len(documents)} document(s).", data=DocumentListData(documents=documents, total=len(documents)))


@router.delete("/documents/{file}", response_model=APIResponse[DeleteDocumentData], summary="Delete an indexed document")
async def delete_document(file: str):
    registry = get_document_registry()
    store = get_vector_store()

    # Raises NotFoundError (-> 404) if the id doesn't exist, handled by the global exception handler.
    await registry.get(file)

    chunks_removed = await store.delete_document(file)
    await registry.delete(file)

    logger.info("Document deleted", extra={"context": {"document_id": file, "chunks_removed": chunks_removed}})
    return APIResponse(
        message="Document deleted successfully.",
        data=DeleteDocumentData(document_id=file, chunks_removed=chunks_removed),
    )


@router.post(
    "/rebuild-vector-db",
    response_model=APIResponse[RebuildVectorDbData],
    status_code=status.HTTP_200_OK,
    summary="Rebuild the entire vector index from stored document text",
)
async def rebuild_vector_db():
    """
    Re-chunks and re-embeds every document currently in the registry, then
    replaces the vector index wholesale. Useful after changing chunk size,
    the embedding model, or if the index is suspected to be out of sync.
    """
    started = time.monotonic()
    registry = get_document_registry()
    store = get_vector_store()

    records = await registry.list_all()
    await store.clear()

    total_chunks = 0
    processed = 0
    failed: list[str] = []

    for record in records:
        try:
            raw_text = Path(record.raw_text_path).read_text(encoding="utf-8")
            chunks = chunk_text(raw_text)
            embeddings = await embed_texts([c.content for c in chunks])
            chunks_to_index = [
                ChunkToIndex(chunk_id=f"{record.document_id}::{c.index}", content=c.content, embedding=emb)
                for c, emb in zip(chunks, embeddings)
            ]
            await store.add_chunks(record.document_id, record.original_name, chunks_to_index)
            await registry.update_status(record.document_id, status="indexed", chunk_count=len(chunks))
            total_chunks += len(chunks)
            processed += 1
        except Exception as exc:
            logger.error(
                "Failed to rebuild document during vector db rebuild",
                extra={"context": {"document_id": record.document_id, "error": str(exc)}},
            )
            await registry.update_status(record.document_id, status="failed")
            failed.append(record.document_id)

    duration = time.monotonic() - started
    logger.info(
        "Vector DB rebuild complete",
        extra={"context": {"processed": processed, "total_chunks": total_chunks, "failed": len(failed)}},
    )

    return APIResponse(
        message=f"Rebuilt vector index from {processed} document(s).",
        data=RebuildVectorDbData(
            documents_processed=processed,
            total_chunks=total_chunks,
            provider=store.provider_name,
            duration_seconds=round(duration, 2),
            failed_documents=failed,
        ),
    )
