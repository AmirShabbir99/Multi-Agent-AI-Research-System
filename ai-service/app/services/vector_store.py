"""
Vector store abstraction.

Two concrete backends ship today:

  * FAISSVectorStore    - local, on-disk, zero external infra. Default.
  * MongoDBVectorStore   - MongoDB Atlas Vector Search. Requires an Atlas
                           cluster with a `$vectorSearch` index already
                           created on MONGODB_VECTOR_COLLECTION - this is the
                           concrete "future-ready" path the brief asked for:
                           switching VECTOR_DB_PROVIDER=mongodb is all that's
                           needed at the config layer, no route/service code
                           changes required.

Adding Pinecone/Qdrant/Weaviate later just means implementing VectorStoreBase
and registering it in get_vector_store().
"""
from __future__ import annotations

import asyncio
import json
import threading
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

import anyio
import numpy as np

from app.core.config import get_settings
from app.core.exceptions import VectorStoreError
from app.core.logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()


@dataclass
class RetrievedChunk:
    document_id: str
    document_name: str
    chunk_id: str
    content: str
    score: float


@dataclass
class ChunkToIndex:
    chunk_id: str
    content: str
    embedding: List[float]


class VectorStoreBase(ABC):
    @abstractmethod
    async def add_chunks(self, document_id: str, document_name: str, chunks: List[ChunkToIndex]) -> None: ...

    @abstractmethod
    async def similarity_search(
        self, query_embedding: List[float], top_k: int, document_ids: Optional[List[str]] = None
    ) -> List[RetrievedChunk]: ...

    @abstractmethod
    async def delete_document(self, document_id: str) -> int: ...

    @abstractmethod
    async def clear(self) -> None: ...

    @abstractmethod
    async def count(self) -> int: ...

    @property
    @abstractmethod
    def provider_name(self) -> str: ...


def _normalize(vec: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(vec, axis=-1, keepdims=True)
    norm[norm == 0] = 1e-12
    return vec / norm


class FAISSVectorStore(VectorStoreBase):
    """
    A cosine-similarity FAISS index (IndexIDMap2 wrapping IndexFlatIP so
    individual vectors can be removed by id, which a plain IndexFlatIP does
    not support). Metadata for each vector id is kept alongside on disk.
    """

    def __init__(self) -> None:
        import faiss  # deferred import: keeps this module importable even if faiss isn't installed in some environments

        self._faiss = faiss
        self._dim = settings.EMBEDDING_DIMENSION
        self._dir = Path(settings.VECTOR_STORE_DIR)
        self._dir.mkdir(parents=True, exist_ok=True)
        self._index_path = self._dir / "index.faiss"
        self._meta_path = self._dir / "metadata.json"
        self._lock = threading.Lock()

        self._index = self._load_index()
        self._metadata: Dict[int, dict] = self._load_metadata()
        self._next_id = (max(self._metadata.keys()) + 1) if self._metadata else 0

    # ── persistence ──────────────────────────────────────────────
    def _load_index(self):
        if self._index_path.exists():
            return self._faiss.read_index(str(self._index_path))
        base = self._faiss.IndexFlatIP(self._dim)
        return self._faiss.IndexIDMap2(base)

    def _load_metadata(self) -> Dict[int, dict]:
        if self._meta_path.exists():
            raw = json.loads(self._meta_path.read_text())
            return {int(k): v for k, v in raw.items()}
        return {}

    def _persist(self) -> None:
        self._faiss.write_index(self._index, str(self._index_path))
        self._meta_path.write_text(json.dumps(self._metadata))

    # ── sync internals (run under thread executor) ──────────────
    def _add_chunks_sync(self, document_id: str, document_name: str, chunks: List[ChunkToIndex]) -> None:
        with self._lock:
            if not chunks:
                return
            vectors = np.array([c.embedding for c in chunks], dtype="float32")
            vectors = _normalize(vectors)
            ids = np.arange(self._next_id, self._next_id + len(chunks), dtype="int64")
            self._index.add_with_ids(vectors, ids)
            for vid, chunk in zip(ids.tolist(), chunks):
                self._metadata[vid] = {
                    "document_id": document_id,
                    "document_name": document_name,
                    "chunk_id": chunk.chunk_id,
                    "content": chunk.content,
                }
            self._next_id += len(chunks)
            self._persist()

    def _search_sync(
        self, query_embedding: List[float], top_k: int, document_ids: Optional[List[str]]
    ) -> List[RetrievedChunk]:
        with self._lock:
            if self._index.ntotal == 0:
                return []
            query = _normalize(np.array([query_embedding], dtype="float32"))
            # over-fetch when filtering by document id, since FAISS can't pre-filter
            fetch_k = top_k * 5 if document_ids else top_k
            fetch_k = min(fetch_k, self._index.ntotal)
            scores, ids = self._index.search(query, fetch_k)

            results: List[RetrievedChunk] = []
            for score, vid in zip(scores[0].tolist(), ids[0].tolist()):
                if vid == -1:
                    continue
                meta = self._metadata.get(vid)
                if meta is None:
                    continue
                if document_ids and meta["document_id"] not in document_ids:
                    continue
                results.append(
                    RetrievedChunk(
                        document_id=meta["document_id"],
                        document_name=meta["document_name"],
                        chunk_id=meta["chunk_id"],
                        content=meta["content"],
                        score=float(score),
                    )
                )
                if len(results) >= top_k:
                    break
            return results

    def _delete_document_sync(self, document_id: str) -> int:
        with self._lock:
            ids_to_remove = [vid for vid, meta in self._metadata.items() if meta["document_id"] == document_id]
            if not ids_to_remove:
                return 0
            self._index.remove_ids(np.array(ids_to_remove, dtype="int64"))
            for vid in ids_to_remove:
                self._metadata.pop(vid, None)
            self._persist()
            return len(ids_to_remove)

    def _clear_sync(self) -> None:
        with self._lock:
            base = self._faiss.IndexFlatIP(self._dim)
            self._index = self._faiss.IndexIDMap2(base)
            self._metadata = {}
            self._next_id = 0
            self._persist()

    # ── public async API ─────────────────────────────────────────
    async def add_chunks(self, document_id: str, document_name: str, chunks: List[ChunkToIndex]) -> None:
        try:
            await anyio.to_thread.run_sync(self._add_chunks_sync, document_id, document_name, chunks)
        except Exception as exc:
            raise VectorStoreError(f"Failed to index chunks into FAISS: {exc}") from exc

    async def similarity_search(
        self, query_embedding: List[float], top_k: int, document_ids: Optional[List[str]] = None
    ) -> List[RetrievedChunk]:
        try:
            return await anyio.to_thread.run_sync(self._search_sync, query_embedding, top_k, document_ids)
        except Exception as exc:
            raise VectorStoreError(f"FAISS similarity search failed: {exc}") from exc

    async def delete_document(self, document_id: str) -> int:
        try:
            return await anyio.to_thread.run_sync(self._delete_document_sync, document_id)
        except Exception as exc:
            raise VectorStoreError(f"Failed to delete document from FAISS: {exc}") from exc

    async def clear(self) -> None:
        try:
            await anyio.to_thread.run_sync(self._clear_sync)
        except Exception as exc:
            raise VectorStoreError(f"Failed to clear FAISS index: {exc}") from exc

    async def count(self) -> int:
        return self._index.ntotal

    @property
    def provider_name(self) -> str:
        return "faiss"


class MongoDBVectorStore(VectorStoreBase):
    """
    MongoDB Atlas Vector Search backend. Requires:
      1. An Atlas cluster (vector search is not available on self-hosted Mongo).
      2. A vector search index named MONGODB_VECTOR_INDEX_NAME on
         MONGODB_VECTOR_COLLECTION, indexing the `embedding` field with
         `numDimensions: EMBEDDING_DIMENSION` and `similarity: "cosine"`.
    """

    def __init__(self) -> None:
        from motor.motor_asyncio import AsyncIOMotorClient

        if not settings.MONGODB_URI:
            raise VectorStoreError("MONGODB_URI is not set but VECTOR_DB_PROVIDER=mongodb.")
        self._client = AsyncIOMotorClient(settings.MONGODB_URI)
        self._collection = self._client[settings.MONGODB_DB_NAME][settings.MONGODB_VECTOR_COLLECTION]

    async def add_chunks(self, document_id: str, document_name: str, chunks: List[ChunkToIndex]) -> None:
        if not chunks:
            return
        docs = [
            {
                "document_id": document_id,
                "document_name": document_name,
                "chunk_id": c.chunk_id,
                "content": c.content,
                "embedding": c.embedding,
            }
            for c in chunks
        ]
        try:
            await self._collection.insert_many(docs)
        except Exception as exc:
            raise VectorStoreError(f"Failed to index chunks into MongoDB: {exc}") from exc

    async def similarity_search(
        self, query_embedding: List[float], top_k: int, document_ids: Optional[List[str]] = None
    ) -> List[RetrievedChunk]:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": settings.MONGODB_VECTOR_INDEX_NAME,
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": max(top_k * 10, 100),
                    "limit": top_k,
                    **({"filter": {"document_id": {"$in": document_ids}}} if document_ids else {}),
                }
            },
            {
                "$project": {
                    "document_id": 1,
                    "document_name": 1,
                    "chunk_id": 1,
                    "content": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        try:
            cursor = self._collection.aggregate(pipeline)
            return [
                RetrievedChunk(
                    document_id=doc["document_id"],
                    document_name=doc["document_name"],
                    chunk_id=doc["chunk_id"],
                    content=doc["content"],
                    score=float(doc["score"]),
                )
                async for doc in cursor
            ]
        except Exception as exc:
            raise VectorStoreError(
                f"MongoDB Atlas vector search failed - confirm the '{settings.MONGODB_VECTOR_INDEX_NAME}' "
                f"search index exists on '{settings.MONGODB_VECTOR_COLLECTION}': {exc}"
            ) from exc

    async def delete_document(self, document_id: str) -> int:
        try:
            result = await self._collection.delete_many({"document_id": document_id})
            return result.deleted_count
        except Exception as exc:
            raise VectorStoreError(f"Failed to delete document from MongoDB: {exc}") from exc

    async def clear(self) -> None:
        try:
            await self._collection.delete_many({})
        except Exception as exc:
            raise VectorStoreError(f"Failed to clear MongoDB vector collection: {exc}") from exc

    async def count(self) -> int:
        return await self._collection.count_documents({})

    @property
    def provider_name(self) -> str:
        return "mongodb"


@lru_cache
def get_vector_store() -> VectorStoreBase:
    provider = settings.VECTOR_DB_PROVIDER
    if provider == "faiss":
        return FAISSVectorStore()
    if provider == "mongodb":
        return MongoDBVectorStore()
    raise VectorStoreError(f"Unknown VECTOR_DB_PROVIDER: {provider}")
