from pathlib import Path

from fastapi import APIRouter, Depends

from app.api.deps import require_internal_auth
from app.core.logging_config import get_logger
from app.schemas.common import APIResponse
from app.schemas.summarize import SummarizeRequest, SummarizeResponseData
from app.services.document_registry import get_document_registry
from app.services.summarization import summarize_text

router = APIRouter(tags=["Summarize"], dependencies=[Depends(require_internal_auth)])
logger = get_logger(__name__)


@router.post("/summarize", response_model=APIResponse[SummarizeResponseData], summary="Summarize a document or raw text")
async def summarize(payload: SummarizeRequest):
    if payload.document_id:
        registry = get_document_registry()
        record = await registry.get(payload.document_id)  # raises NotFoundError -> 404 if missing
        source_text = Path(record.raw_text_path).read_text(encoding="utf-8")
        topic_hint = record.original_name
    else:
        source_text = payload.text
        topic_hint = ""

    summary, chunks_processed = await summarize_text(source_text, length=payload.length, topic_hint=topic_hint)

    return APIResponse(
        message="Summary generated.",
        data=SummarizeResponseData(
            source="document" if payload.document_id else "text",
            document_id=payload.document_id,
            summary=summary,
            original_length_chars=len(source_text),
            summary_length_chars=len(summary),
            chunks_processed=chunks_processed,
        ),
    )
