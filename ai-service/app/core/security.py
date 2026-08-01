"""
Service-to-service security.

This API is never meant to be reachable by the browser. The Node.js backend is
the sole authorized caller, so every route (except /health) is protected by a
shared-secret header rather than a full auth system - that responsibility
belongs to Node.
"""
import hmac

from fastapi import Header, status

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError

settings = get_settings()


async def verify_internal_api_key(x_internal_api_key: str = Header(default="")) -> None:
    if not settings.INTERNAL_API_KEY:
        # Fail closed: if no key is configured on this service, refuse all traffic
        # rather than silently allowing unauthenticated access.
        raise UnauthorizedError("Internal API key is not configured on the AI service.")

    if not x_internal_api_key or not hmac.compare_digest(x_internal_api_key, settings.INTERNAL_API_KEY):
        raise UnauthorizedError("Missing or invalid X-Internal-Api-Key header.")
