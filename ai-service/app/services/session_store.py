"""
Session history buffer.

Node.js owns the canonical, user-facing chat history (persisted in MongoDB
for the UI, audit, etc). This store is different: it's the AI service's own
short-term working memory, written on every /ask and /chat call so that:

  1. GET /history/{session_id} has something real to return without this
     stateless-looking service needing to call back into Node.
  2. /chat can rebuild conversational context even if Node ever fails to
     forward `history` on a given request (defense in depth).
"""
from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Literal

import aiosqlite

from app.core.config import get_settings

settings = get_settings()

_SCHEMA = """
CREATE TABLE IF NOT EXISTS history (
    turn_id     TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL,
    endpoint    TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_history_session ON history(session_id, created_at);
"""


@dataclass
class HistoryEntryRecord:
    turn_id: str
    session_id: str
    role: str
    endpoint: str
    content: str
    created_at: str


class SessionStore:
    def __init__(self, db_path: str):
        self._db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    @asynccontextmanager
    async def _connect(self):
        conn = await aiosqlite.connect(self._db_path)
        conn.row_factory = aiosqlite.Row
        try:
            await conn.executescript(_SCHEMA)
            yield conn
        finally:
            await conn.close()

    async def add_turn(
        self, session_id: str, role: Literal["user", "assistant", "system"], endpoint: Literal["ask", "chat"], content: str
    ) -> HistoryEntryRecord:
        entry = HistoryEntryRecord(
            turn_id=uuid.uuid4().hex,
            session_id=session_id,
            role=role,
            endpoint=endpoint,
            content=content,
            created_at=datetime.utcnow().isoformat(),
        )
        async with self._connect() as conn:
            await conn.execute(
                "INSERT INTO history (turn_id, session_id, role, endpoint, content, created_at) VALUES (?,?,?,?,?,?)",
                (entry.turn_id, entry.session_id, entry.role, entry.endpoint, entry.content, entry.created_at),
            )
            await conn.commit()
        return entry

    async def get_history(self, session_id: str, limit: int = 200) -> List[HistoryEntryRecord]:
        async with self._connect() as conn:
            cursor = await conn.execute(
                "SELECT * FROM history WHERE session_id = ? ORDER BY created_at ASC LIMIT ?",
                (session_id, limit),
            )
            rows = await cursor.fetchall()
            return [HistoryEntryRecord(**dict(r)) for r in rows]

    async def get_recent_for_prompt(self, session_id: str, max_turns: int) -> List[dict]:
        """Returns the most recent turns as plain {role, content} dicts for prompt construction."""
        history = await self.get_history(session_id, limit=1000)
        recent = history[-max_turns:] if max_turns > 0 else history
        return [{"role": h.role, "content": h.content} for h in recent if h.role in ("user", "assistant")]


_store: SessionStore | None = None


def get_session_store() -> SessionStore:
    global _store
    if _store is None:
        _store = SessionStore(settings.SESSION_DB_PATH)
    return _store
