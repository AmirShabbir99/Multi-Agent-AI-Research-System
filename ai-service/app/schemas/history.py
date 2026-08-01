from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel


class HistoryEntry(BaseModel):
    turn_id: str
    role: Literal["user", "assistant", "system"]
    endpoint: Literal["ask", "chat"]
    content: str
    created_at: datetime


class HistoryData(BaseModel):
    session_id: str
    turns: List[HistoryEntry]
    total: int
