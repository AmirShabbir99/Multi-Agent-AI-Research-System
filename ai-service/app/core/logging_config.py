"""
Centralized logging configuration.

Console logs are human-readable (via `rich`, keeping the flavour of the original
prototype's console output). File logs are JSON lines so they can later be
shipped to any log aggregator without a rewrite.
"""
import json
import logging
import logging.config
import os
import sys
import time
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


class JsonFormatter(logging.Formatter):
    """Renders each log record as a single JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        # allow callers to attach structured context via `extra={"context": {...}}`
        if hasattr(record, "context"):
            payload["context"] = record.context
        return json.dumps(payload, ensure_ascii=False)


def configure_logging() -> None:
    log_dir = Path(settings.LOG_DIR)
    handlers = {
        "console": {
            "class": "rich.logging.RichHandler",
            "level": settings.LOG_LEVEL,
            "rich_tracebacks": True,
            "show_path": False,
            "log_time_format": "[%X]",
        }
    }

    if settings.LOG_TO_FILE:
        log_dir.mkdir(parents=True, exist_ok=True)
        handlers["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "level": settings.LOG_LEVEL,
            "filename": str(log_dir / "ai-service.log"),
            "maxBytes": 5 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "json",
        }

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {"()": JsonFormatter},
            },
            "handlers": handlers,
            "root": {
                "level": settings.LOG_LEVEL,
                "handlers": list(handlers.keys()),
            },
            "loggers": {
                # keep third-party libraries quieter than our own app logs
                "httpx": {"level": "WARNING"},
                "uvicorn.access": {"level": "WARNING"},
            },
        }
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
