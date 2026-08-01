"""
Summarization business logic used by POST /summarize.

Short inputs are summarized in a single LLM call. Long inputs are handled
map-reduce style: each chunk is summarized independently (map), then the
chunk summaries are combined and summarized again (reduce) so the final
result stays coherent regardless of source document length.
"""
from typing import Literal, Tuple

from app.core.logging_config import get_logger
from app.services.chunking import chunk_text
from app.services.llm_provider import safe_ainvoke

logger = get_logger(__name__)

_LENGTH_INSTRUCTIONS = {
    "short": "in 3-4 concise sentences",
    "medium": "in 2-3 well-organized paragraphs",
    "detailed": "in a detailed multi-paragraph summary covering all major points, using headings if helpful",
}

_SINGLE_PASS_CHAR_THRESHOLD = 6000


async def _summarize_chunk(chunk: str, length: Literal["short", "medium", "detailed"]) -> str:
    messages = [
        ("system", "You are a precise summarization assistant. Preserve key facts, names, and numbers accurately."),
        ("human", f"Summarize the following text {_LENGTH_INSTRUCTIONS[length]}:\n\n{chunk}"),
    ]
    return await safe_ainvoke(messages)


async def _reduce_summaries(summaries: list[str], length: Literal["short", "medium", "detailed"], topic_hint: str = "") -> str:
    combined = "\n\n---\n\n".join(summaries)
    context = f" about {topic_hint}" if topic_hint else ""
    messages = [
        (
            "system",
            "You are a precise summarization assistant. You will be given several partial summaries of "
            "sections of the same document. Merge them into one coherent, non-repetitive summary.",
        ),
        (
            "human",
            f"Combine the following partial summaries of a document{context} into a single coherent summary, "
            f"{_LENGTH_INSTRUCTIONS[length]}. Remove redundancy between sections:\n\n{combined}",
        ),
    ]
    return await safe_ainvoke(messages)


async def summarize_text(
    text: str, length: Literal["short", "medium", "detailed"] = "medium", topic_hint: str = ""
) -> Tuple[str, int]:
    """Returns (summary, chunks_processed)."""
    text = text.strip()

    if len(text) <= _SINGLE_PASS_CHAR_THRESHOLD:
        summary = await _summarize_chunk(text, length)
        return summary, 1

    chunks = chunk_text(text, chunk_size=4000, chunk_overlap=200)
    logger.info("Running map-reduce summarization", extra={"context": {"chunk_count": len(chunks)}})

    chunk_summaries = []
    for c in chunks:
        chunk_summaries.append(await _summarize_chunk(c.content, "medium"))

    final_summary = await _reduce_summaries(chunk_summaries, length, topic_hint)
    return final_summary, len(chunks)
