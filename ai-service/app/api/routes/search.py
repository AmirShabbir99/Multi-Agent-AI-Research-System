from fastapi import APIRouter, Depends

from app.agents.parsing import extract_web_sources_from_text
from app.agents.tools import web_search
from app.api.deps import require_internal_auth
from app.core.logging_config import get_logger
from app.schemas.common import APIResponse, SourceChunk
from app.schemas.search import SearchRequest, SearchResponseData
from app.services.embeddings import embed_query
from app.services.vector_store import get_vector_store

router = APIRouter(tags=["Search"], dependencies=[Depends(require_internal_auth)])
logger = get_logger(__name__)


async def _search_documents(query: str, document_ids, top_k) -> list[SourceChunk]:
    query_embedding = await embed_query(query)
    store = get_vector_store()
    results = await store.similarity_search(query_embedding, top_k=top_k, document_ids=document_ids or None)
    return [
        SourceChunk(document_id=r.document_id, document_name=r.document_name, chunk_id=r.chunk_id, content=r.content, score=r.score)
        for r in results
    ]


@router.post("/search", response_model=APIResponse[SearchResponseData], summary="Semantic search over documents and/or the web")
async def search(payload: SearchRequest):
    document_results: list[SourceChunk] = []
    web_results = []

    if payload.mode in ("documents", "hybrid"):
        document_results = await _search_documents(payload.query, payload.document_ids, payload.top_k)

    if payload.mode in ("web", "hybrid"):
        raw = await web_search.ainvoke({"query": payload.query})
        web_results = extract_web_sources_from_text(str(raw))

    return APIResponse(
        message=f"Found {len(document_results)} document result(s) and {len(web_results)} web result(s).",
        data=SearchResponseData(
            query=payload.query,
            mode=payload.mode,
            document_results=document_results,
            web_results=web_results,
            total_results=len(document_results) + len(web_results),
        ),
    )
