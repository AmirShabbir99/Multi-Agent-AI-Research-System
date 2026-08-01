"""Small shared parsing helpers for the agents package."""
import re
from typing import List

from app.schemas.common import WebSource

_URL_LINE_RE = re.compile(r"^-\s*(.+?)\n\s*URL:\s*(\S+)", re.MULTILINE)


def extract_web_sources_from_text(search_results_text: str) -> List[WebSource]:
    """Parses the `- Title\\n  URL: https://...` format produced by tools.web_search."""
    sources = []
    for title, url in _URL_LINE_RE.findall(search_results_text or ""):
        sources.append(WebSource(title=title.strip(), url=url.strip()))
    return sources
