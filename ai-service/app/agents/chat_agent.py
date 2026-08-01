"""
The conversational agent behind POST /chat and POST /ask (mode="quick").

Design: relevant document chunks are retrieved deterministically *before* the
LLM is called and injected as grounding context (so `sources` in the response
is always accurate, structured data - never reconstructed by parsing the
model's own tool-call output). The model additionally gets `web_search`,
`scrape_url` and `search_documents` as real tools it can call mid-conversation
if the pre-fetched context isn't enough to answer the question.
"""
from dataclasses import dataclass, field
from typing import List, Optional

from langchain.agents import create_agent
from langchain_core.messages import ToolMessage

from app.agents.parsing import extract_web_sources_from_text
from app.agents.tools import make_document_search_tool, scrape_url, web_search
from app.core.exceptions import LLMProviderError
from app.core.logging_config import get_logger
from app.schemas.common import SourceChunk, WebSource
from app.services.embeddings import embed_query
from app.services.llm_provider import get_chat_model
from app.services.vector_store import get_vector_store

logger = get_logger(__name__)

_RETRIEVAL_SCORE_THRESHOLD = 0.35  # below this, a chunk is probably not actually relevant

_SYSTEM_PROMPT = """You are ResearchMind, a helpful and honest AI research assistant.

You may be given "Relevant document excerpts" retrieved from the user's own uploaded documents - \
treat these as ground truth about the user's documents. If they answer the question, cite them naturally \
(e.g. "According to your document...").

You also have tools available:
- search_documents: search the user's uploaded documents again with a different/refined query if the \
provided excerpts aren't enough.
- web_search: search the live web for current information not in the documents.
- scrape_url: read the full content of a specific URL found via web_search.

Rules:
- If the document excerpts already answer the question, prefer them over web search.
- Only use web_search when the question needs current/external information or the documents are insufficient.
- If you don't know something and no tool can help, say so plainly instead of guessing.
- Be concise, clear and well-structured. Use markdown when it helps readability.
"""


@dataclass
class ChatAgentResult:
    reply: str
    sources: List[SourceChunk] = field(default_factory=list)
    web_sources: List[WebSource] = field(default_factory=list)
    tools_used: List[str] = field(default_factory=list)


def _history_to_messages(history: List[dict]):
    messages = []
    for turn in history:
        role = "human" if turn.get("role") == "user" else "ai"
        content = turn.get("content", "")
        if content:
            messages.append((role, content))
    return messages


async def _retrieve_context(
    message: str, document_ids: Optional[List[str]], top_k: int
) -> List[SourceChunk]:
    try:
        query_embedding = await embed_query(message)
        store = get_vector_store()
        results = await store.similarity_search(query_embedding, top_k=top_k, document_ids=document_ids)
    except Exception as exc:
        # Retrieval failing shouldn't block the whole conversation - the agent can still
        # fall back to web search / general knowledge, so we log and continue with no context.
        logger.warning("Context retrieval failed, continuing without it", extra={"context": {"error": str(exc)}})
        return []

    return [
        SourceChunk(
            document_id=r.document_id,
            document_name=r.document_name,
            chunk_id=r.chunk_id,
            content=r.content,
            score=r.score,
        )
        for r in results
        if r.score >= _RETRIEVAL_SCORE_THRESHOLD
    ]


def _extract_tool_usage(messages) -> tuple[List[str], List[WebSource]]:
    tools_used: List[str] = []
    web_sources: List[WebSource] = []
    for m in messages:
        if isinstance(m, ToolMessage):
            tool_name = getattr(m, "name", None) or "unknown_tool"
            if tool_name not in tools_used:
                tools_used.append(tool_name)
            if tool_name == "web_search":
                web_sources.extend(extract_web_sources_from_text(str(m.content)))
    return tools_used, web_sources


async def run_chat_agent(
    message: str,
    history: List[dict],
    document_ids: Optional[List[str]] = None,
    top_k: int = 5,
    allow_web_search: bool = True,
) -> ChatAgentResult:
    sources = await _retrieve_context(message, document_ids, top_k)

    tools = [make_document_search_tool(document_ids, top_k)]
    if allow_web_search:
        tools.extend([web_search, scrape_url])

    context_block = ""
    if sources:
        excerpts = "\n\n".join(f"[{s.document_name}] {s.content}" for s in sources)
        context_block = f"\n\nRelevant document excerpts:\n{excerpts}"

    try:
        agent = create_agent(model=get_chat_model(), tools=tools)
        messages = [("system", _SYSTEM_PROMPT)]
        messages.extend(_history_to_messages(history))
        messages.append(("human", f"{message}{context_block}"))

        result = await agent.ainvoke({"messages": messages})
        reply = result["messages"][-1].content
        tools_used, web_sources = _extract_tool_usage(result["messages"])
    except Exception as exc:
        logger.error("Chat agent failed", extra={"context": {"error": str(exc)}})
        raise LLMProviderError(f"The chat agent failed to respond: {exc}") from exc

    return ChatAgentResult(reply=reply, sources=sources, web_sources=web_sources, tools_used=tools_used)
