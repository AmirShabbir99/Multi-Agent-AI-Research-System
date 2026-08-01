from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel


class DependencyStatus(BaseModel):
    name: str
    status: str  # "ok" | "degraded" | "down"
    detail: str = ""


class HealthData(BaseModel):
    status: str  # "ok" | "degraded"
    version: str
    uptime_seconds: float
    dependencies: List[DependencyStatus]
