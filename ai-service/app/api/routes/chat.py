from fastapi import APIRouter, Depends

from app.agents.chat_agent import run_chat_agent
from app.api.deps import require_internal_auth
from app.core.logging_config import get_logger
from app.schemas.chat import ChatRequest, ChatResponseData
from app.schemas.common import APIResponse
from app.services.session_store import get_session_store

router = APIRouter(tags=["Chat"], dependencies=[Depends(require_internal_auth)])
logger = get_logger(__name__)


@router.post("/chat", response_model=APIResponse[ChatResponseData], summary="Conversational chat with tool access")
async def chat(payload: ChatRequest):
    store = get_session_store()
    await store.add_turn(payload.session_id, role="user", endpoint="chat", content=payload.message)

    # Prefer Node's forwarded history (it is the source of truth for the UI); fall back to
    # this service's own buffer only if Node sent nothing, e.g. on the very first message.
    history = [{"role": t.role, "content": t.content} for t in payload.history]
    if not history:
        history = await store.get_recent_for_prompt(payload.session_id, max_turns=12)

    result = await run_chat_agent(
        message=payload.message,
        history=history,
        document_ids=payload.document_ids or None,
        allow_web_search=payload.allow_web_search,
    )

    await store.add_turn(payload.session_id, role="assistant", endpoint="chat", content=result.reply)

    return APIResponse(
        message="Reply generated.",
        data=ChatResponseData(
            session_id=payload.session_id,
            reply=result.reply,
            sources=result.sources,
            web_sources=result.web_sources,
            tools_used=result.tools_used,
        ),
    )
