"""
Recursive, structure-aware text chunker.

Implemented from scratch (rather than pulling in a heavier text-splitting
dependency) so chunk boundaries respect paragraph/sentence structure whenever
possible, falling back to a hard character split only as a last resort. Each
chunk overlaps with the previous one so retrieval doesn't lose context that
straddles a boundary.
"""
import re
from dataclasses import dataclass
from typing import List

from app.core.config import get_settings

settings = get_settings()

_SEPARATORS = ["\n\n", "\n", ". ", " "]


@dataclass
class Chunk:
    index: int
    content: str
    char_start: int
    char_end: int


def _split_on_separator(text: str, separator: str) -> List[str]:
    if separator == "":
        return list(text)
    parts = text.split(separator)
    # re-attach the separator to keep sentence punctuation / newlines intact
    return [p + separator for p in parts[:-1]] + [parts[-1]]


def _recursive_split(text: str, max_size: int, separators: List[str]) -> List[str]:
    if len(text) <= max_size:
        return [text] if text else []

    if not separators:
        # last resort: hard split by characters
        return [text[i : i + max_size] for i in range(0, len(text), max_size)]

    sep, rest_separators = separators[0], separators[1:]
    pieces = _split_on_separator(text, sep)

    chunks: List[str] = []
    buffer = ""
    for piece in pieces:
        candidate = buffer + piece
        if len(candidate) <= max_size:
            buffer = candidate
        else:
            if buffer:
                chunks.append(buffer)
            if len(piece) > max_size:
                chunks.extend(_recursive_split(piece, max_size, rest_separators))
                buffer = ""
            else:
                buffer = piece
    if buffer:
        chunks.append(buffer)
    return chunks


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> List[Chunk]:
    """Splits `text` into overlapping chunks, preferring paragraph/sentence boundaries."""
    chunk_size = chunk_size or settings.CHUNK_SIZE
    chunk_overlap = chunk_overlap if chunk_overlap is not None else settings.CHUNK_OVERLAP
    text = re.sub(r"[ \t]+", " ", text).strip()
    if not text:
        return []

    raw_pieces = _recursive_split(text, chunk_size, _SEPARATORS)

    # Merge tiny trailing pieces into the previous chunk when it still fits,
    # and apply a trailing-overlap prefix so consecutive chunks share context.
    merged: List[str] = []
    for piece in raw_pieces:
        piece = piece.strip()
        if not piece:
            continue
        if merged and len(merged[-1]) < chunk_overlap and len(merged[-1]) + len(piece) <= chunk_size:
            merged[-1] = f"{merged[-1]} {piece}".strip()
        else:
            merged.append(piece)

    chunks: List[Chunk] = []
    cursor = 0
    for i, piece in enumerate(merged):
        if i > 0 and chunk_overlap > 0:
            prev_tail = merged[i - 1][-chunk_overlap:]
            piece_with_overlap = f"{prev_tail.strip()} {piece}".strip()
        else:
            piece_with_overlap = piece

        start = cursor
        end = start + len(piece_with_overlap)
        chunks.append(Chunk(index=i, content=piece_with_overlap, char_start=start, char_end=end))
        cursor = end

    return chunks
