from fastapi import APIRouter, Depends, Query

from app.api.deps import require_internal_auth
from app.core.logging_config import get_logger
from app.schemas.common import APIResponse
from app.schemas.history import HistoryData, HistoryEntry
from app.services.session_store import get_session_store

router = APIRouter(tags=["History"], dependencies=[Depends(require_internal_auth)])
logger = get_logger(__name__)


@router.get("/history/{session_id}", response_model=APIResponse[HistoryData], summary="Get this service's turn buffer for a session")
async def get_history(session_id: str, limit: int = Query(default=200, ge=1, le=1000)):
    store = get_session_store()
    records = await store.get_history(session_id, limit=limit)

    turns = [
        HistoryEntry(turn_id=r.turn_id, role=r.role, endpoint=r.endpoint, content=r.content, created_at=r.created_at)
        for r in records
    ]
    return APIResponse(
        message=f"Found {len(turns)} turn(s) for session '{session_id}'.",
        data=HistoryData(session_id=session_id, turns=turns, total=len(turns)),
    )
