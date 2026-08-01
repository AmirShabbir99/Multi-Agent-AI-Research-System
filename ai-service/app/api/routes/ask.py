from fastapi import APIRouter, Depends

from app.agents.chat_agent import run_chat_agent
from app.agents.pipeline import run_research_pipeline
from app.api.deps import require_internal_auth
from app.core.logging_config import get_logger
from app.schemas.ask import AskRequest, QuickAnswerData, ResearchReportData
from app.schemas.common import APIResponse
from app.services.session_store import get_session_store

router = APIRouter(tags=["Ask"], dependencies=[Depends(require_internal_auth)])
logger = get_logger(__name__)


@router.post("/ask", response_model=APIResponse[QuickAnswerData | ResearchReportData], summary="Ask a question")
async def ask(payload: AskRequest):
    store = get_session_store()

    if payload.session_id:
        await store.add_turn(payload.session_id, role="user", endpoint="ask", content=payload.query)

    if payload.mode == "research":
        result = await run_research_pipeline(payload.query)
        data = ResearchReportData(
            topic=result.topic,
            search_results=result.search_results,
            scraped_content=result.scraped_content,
            report=result.report,
            critique=result.critique,
            web_sources=result.web_sources,
            session_id=payload.session_id,
        )
        if payload.session_id:
            await store.add_turn(payload.session_id, role="assistant", endpoint="ask", content=result.report)
        return APIResponse(message="Research report generated.", data=data)

    result = await run_chat_agent(
        message=payload.query,
        history=[],
        document_ids=payload.document_ids or None,
        top_k=payload.top_k,
        allow_web_search=payload.allow_web_search,
    )
    data = QuickAnswerData(
        answer=result.reply,
        sources=result.sources,
        web_sources=result.web_sources,
        used_web_search="web_search" in result.tools_used,
        session_id=payload.session_id,
    )
    if payload.session_id:
        await store.add_turn(payload.session_id, role="assistant", endpoint="ask", content=result.reply)

    return APIResponse(message="Answer generated.", data=data)
