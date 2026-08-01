import time

from fastapi import APIRouter, Request

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.schemas.common import APIResponse
from app.schemas.health import DependencyStatus, HealthData
from app.services.document_registry import get_document_registry
from app.services.vector_store import get_vector_store

router = APIRouter(tags=["Health"])
logger = get_logger(__name__)
settings = get_settings()


@router.get("/health", response_model=APIResponse[HealthData], summary="Service health check")
async def health_check(request: Request):
    dependencies = []

    # Vector store
    try:
        store = get_vector_store()
        count = await store.count()
        dependencies.append(
            DependencyStatus(name=f"vector_store ({store.provider_name})", status="ok", detail=f"{count} vectors indexed")
        )
    except Exception as exc:
        dependencies.append(DependencyStatus(name="vector_store", status="down", detail=str(exc)))

    # Document registry (SQLite)
    try:
        registry = get_document_registry()
        docs = await registry.list_all()
        dependencies.append(DependencyStatus(name="document_registry", status="ok", detail=f"{len(docs)} documents"))
    except Exception as exc:
        dependencies.append(DependencyStatus(name="document_registry", status="down", detail=str(exc)))

    # LLM provider configuration (a cheap check, not a live call, to keep /health fast)
    provider_key_map = {
        "mistral": settings.MISTRAL_API_KEY,
        "openai": settings.OPENAI_API_KEY,
        "anthropic": settings.ANTHROPIC_API_KEY,
    }
    key_present = bool(provider_key_map.get(settings.LLM_PROVIDER))
    dependencies.append(
        DependencyStatus(
            name=f"llm_provider ({settings.LLM_PROVIDER})",
            status="ok" if key_present else "degraded",
            detail="API key configured" if key_present else "API key missing",
        )
    )

    # Tavily (web search tool)
    dependencies.append(
        DependencyStatus(
            name="tavily",
            status="ok" if settings.TAVILY_API_KEY else "degraded",
            detail="API key configured" if settings.TAVILY_API_KEY else "API key missing - web_search tool will fail",
        )
    )

    overall = "ok" if all(d.status == "ok" for d in dependencies) else "degraded"
    uptime = time.monotonic() - getattr(request.app.state, "start_time", time.monotonic())

    return APIResponse(
        message="Service is running",
        data=HealthData(status=overall, version=settings.APP_VERSION, uptime_seconds=round(uptime, 2), dependencies=dependencies),
    )
