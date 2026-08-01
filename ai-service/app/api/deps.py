"""Shared FastAPI dependencies."""
from fastapi import Request

from app.core.security import verify_internal_api_key

# Re-exported so route modules only need one import path for auth.
require_internal_auth = verify_internal_api_key


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")
