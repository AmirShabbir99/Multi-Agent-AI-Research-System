"""
Tools available to the LangChain agents.

Upgraded from the original prototype's tools.py:
  * async implementations (the prototype's Tavily/requests calls were
    blocking, which is a real problem once this runs inside an async
    FastAPI worker instead of a Streamlit script)
  * no top-level side effects on import (the original had a bare
    `print(web_search.invoke(...))` at module scope, which fired a real
    Tavily API call every time the module was imported - removed)
  * failures are returned to the agent as a descriptive string instead of
    raising, so a bad search/scrape doesn't crash the whole agent loop -
    the LLM can see the tool failed and decide how to proceed
"""
from typing import List, Optional

import anyio
import httpx
from bs4 import BeautifulSoup
from langchain_core.tools import tool
from tavily import TavilyClient

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.services.embeddings import embed_query
from app.services.vector_store import get_vector_store

logger = get_logger(__name__)
settings = get_settings()

_tavily_client: Optional[TavilyClient] = None


def _get_tavily() -> TavilyClient:
    global _tavily_client
    if _tavily_client is None:
        if not settings.TAVILY_API_KEY:
            raise RuntimeError("TAVILY_API_KEY is not configured.")
        _tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    return _tavily_client


def _format_tavily_results(raw: dict) -> str:
    results = raw.get("results", [])
    if not results:
        return "No web results found."
    lines = []
    for r in results:
        lines.append(f"- {r.get('title', 'Untitled')}\n  URL: {r.get('url', '')}\n  {r.get('content', '')[:400]}")
    return "\n\n".join(lines)


@tool
async def web_search(query: str) -> str:
    """Search the live web for recent, reliable information on a topic. Returns titles, URLs, and snippets."""
    try:
        client = _get_tavily()
        raw = await anyio.to_thread.run_sync(lambda: client.search(query=query, max_results=5))
        return _format_tavily_results(raw)
    except Exception as exc:
        logger.warning("web_search tool failed", extra={"context": {"query": query, "error": str(exc)}})
        return f"Web search failed: {exc}"


@tool
async def scrape_url(url: str) -> str:
    """Scrape and return clean text content from a given URL for deeper reading."""
    try:
        async with httpx.AsyncClient(timeout=settings.SCRAPE_TIMEOUT_SECONDS, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; ResearchMindBot/1.0)"})
            resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        return text[: settings.SCRAPE_MAX_CHARS] if text else "The page had no readable text content."
    except Exception as exc:
        logger.warning("scrape_url tool failed", extra={"context": {"url": url, "error": str(exc)}})
        return f"Could not scrape URL '{url}': {exc}"


def make_document_search_tool(document_ids: Optional[List[str]], top_k: int = 5):
    """
    Builds a request-scoped tool bound to a specific set of document ids (or
    all documents, when none are given). Built per-request because the agent
    framework itself only lets the LLM control the declared tool arguments
    (`query`) - retrieval scope is server-side context, not something we want
    the model choosing.
    """

    @tool
    async def search_documents(query: str) -> str:
        """Search the user's uploaded documents for content relevant to the query. Use this before web_search when the user refers to 'my documents', 'the file', or an uploaded document."""
        try:
            query_embedding = await embed_query(query)
            store = get_vector_store()
            results = await store.similarity_search(query_embedding, top_k=top_k, document_ids=document_ids)
            if not results:
                return "No relevant content found in the uploaded documents."
            lines = [f"- [{r.document_name} | score={r.score:.2f}] {r.content[:500]}" for r in results]
            return "\n\n".join(lines)
        except Exception as exc:
            logger.warning("search_documents tool failed", extra={"context": {"query": query, "error": str(exc)}})
            return f"Document search failed: {exc}"

    return search_documents
