"""
Custom exception hierarchy + centralized FastAPI exception handlers.

Every handler returns the same envelope shape so the Node.js layer (and,
transitively, the frontend) can rely on one consistent error contract:

    {
        "success": false,
        "message": "...",
        "error_code": "...",
        "details": { ... } | null
    }
"""
from __future__ import annotations

import traceback
import uuid
from typing import Any, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging_config import get_logger

logger = get_logger(__name__)


class AppException(Exception):
    """Base class for all handled application errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "internal_error"

    def __init__(self, message: str, details: Optional[Any] = None):
        self.message = message
        self.details = details
        super().__init__(message)


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"


class ValidationFailedError(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "validation_failed"


class UnauthorizedError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "unauthorized"


class UnsupportedFileTypeError(AppException):
    status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    error_code = "unsupported_file_type"


class FileTooLargeError(AppException):
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    error_code = "file_too_large"


class VectorStoreError(AppException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "vector_store_error"


class LLMProviderError(AppException):
    status_code = status.HTTP_502_BAD_GATEWAY
    error_code = "llm_provider_error"


class ExternalToolError(AppException):
    status_code = status.HTTP_502_BAD_GATEWAY
    error_code = "external_tool_error"


class RateLimitedError(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "rate_limited"


def _envelope(message: str, error_code: str, details: Any = None, request_id: str | None = None) -> dict:
    return {
        "success": False,
        "message": message,
        "error_code": error_code,
        "details": details,
        "request_id": request_id,
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def handle_app_exception(request: Request, exc: AppException):
        request_id = getattr(request.state, "request_id", None)
        logger.warning(
            "Handled application exception",
            extra={"context": {"path": request.url.path, "error_code": exc.error_code, "request_id": request_id}},
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(exc.message, exc.error_code, exc.details, request_id),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_envelope(
                "Request validation failed.",
                "validation_failed",
                details=exc.errors(),
                request_id=request_id,
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException):
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(str(exc.detail), "http_error", request_id=request_id),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        logger.error(
            "Unhandled exception",
            extra={
                "context": {
                    "path": request.url.path,
                    "request_id": request_id,
                    "trace": traceback.format_exc(),
                }
            },
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_envelope(
                "An unexpected error occurred. Please try again.",
                "internal_error",
                request_id=request_id,
            ),
        )
