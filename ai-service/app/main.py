"""
FastAPI application entrypoint.

Run with:  uvicorn app.main:app --reload
"""
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ask, chat, documents, health, history, search, summarize, upload
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import configure_logging, get_logger
from app.services.document_registry import get_document_registry
from app.services.session_store import get_session_store
from app.services.vector_store import get_vector_store

settings = get_settings()
configure_logging()
logger = get_logger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Internal AI service powering document RAG, multi-agent web research, and conversational "
            "chat. Not exposed to the browser directly - the Node.js server is the sole intended caller "
            "(see the X-Internal-Api-Key requirement on every route below)."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        started = time.monotonic()

        response = await call_next(request)

        duration_ms = round((time.monotonic() - started) * 1000, 2)
        response.headers["X-Request-Id"] = request_id
        logger.info(
            "Request handled",
            extra={
                "context": {
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                }
            },
        )
        return response

    register_exception_handlers(app)

    for module in (upload, ask, chat, search, summarize, documents, health, history):
        app.include_router(module.router)

    @app.on_event("startup")
    async def on_startup() -> None:
        app.state.start_time = time.monotonic()
        logger.info("Starting AI service", extra={"context": {"env": settings.APP_ENV, "llm_provider": settings.LLM_PROVIDER}})

        # Infra singletons: fine to fail loudly, they don't need external API keys.
        get_document_registry()
        get_session_store()

        try:
            get_vector_store()
        except Exception as exc:
            logger.error("Vector store failed to initialize at startup", extra={"context": {"error": str(exc)}})

        if not settings.INTERNAL_API_KEY:
            logger.warning("INTERNAL_API_KEY is not set - all authenticated routes will reject requests.")

        logger.info("AI service ready", extra={"context": {"port": settings.PORT}})

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        logger.info("AI service shutting down")

    return app


app = create_app()
