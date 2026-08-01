"""
The four-stage research pipeline from the original prototype (agents.py +
pipeline.py), upgraded to run asynchronously behind FastAPI:

    Search Agent  -> gathers recent web info about a topic (Tavily)
    Reader Agent  -> picks a URL from those results and scrapes it deeply
    Writer Chain  -> drafts a structured report from both
    Critic Chain  -> scores and critiques the report

This is what POST /ask (mode="research") runs.
"""
import time
from dataclasses import dataclass, field
from typing import List

from langchain.agents import create_agent
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.agents.parsing import extract_web_sources_from_text
from app.agents.tools import scrape_url, web_search
from app.core.exceptions import LLMProviderError
from app.core.logging_config import get_logger
from app.schemas.common import WebSource
from app.services.llm_provider import get_chat_model

logger = get_logger(__name__)


def build_search_agent():
    return create_agent(model=get_chat_model(), tools=[web_search])


def build_reader_agent():
    return create_agent(model=get_chat_model(), tools=[scrape_url])


def _build_writer_chain():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
            (
                "human",
                """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional.""",
            ),
        ]
    )
    return prompt | get_chat_model() | StrOutputParser()


def _build_critic_chain():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a sharp and constructive research critic. Be honest and specific."),
            (
                "human",
                """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
...""",
            ),
        ]
    )
    return prompt | get_chat_model() | StrOutputParser()


@dataclass
class ResearchPipelineResult:
    topic: str
    search_results: str
    scraped_content: str
    report: str
    critique: str
    web_sources: List[WebSource] = field(default_factory=list)


async def run_research_pipeline(topic: str) -> ResearchPipelineResult:
    started = time.monotonic()
    logger.info("Research pipeline started", extra={"context": {"topic": topic}})

    try:
        search_agent = build_search_agent()
        search_result = await search_agent.ainvoke(
            {"messages": [("user", f"Find recent, reliable and detailed information about: {topic}")]}
        )
        search_results = search_result["messages"][-1].content
    except Exception as exc:
        logger.error("Search agent failed", extra={"context": {"topic": topic, "error": str(exc)}})
        raise LLMProviderError(f"Search agent failed: {exc}") from exc

    try:
        reader_agent = build_reader_agent()
        reader_result = await reader_agent.ainvoke(
            {
                "messages": [
                    (
                        "user",
                        f"Based on the following search results about '{topic}', pick the most relevant URL "
                        f"and scrape it for deeper content.\n\nSearch Results:\n{search_results[:800]}",
                    )
                ]
            }
        )
        scraped_content = reader_result["messages"][-1].content
    except Exception as exc:
        logger.error("Reader agent failed", extra={"context": {"topic": topic, "error": str(exc)}})
        raise LLMProviderError(f"Reader agent failed: {exc}") from exc

    research_combined = f"SEARCH RESULTS:\n{search_results}\n\nDETAILED SCRAPED CONTENT:\n{scraped_content}"

    try:
        writer_chain = _build_writer_chain()
        report = await writer_chain.ainvoke({"topic": topic, "research": research_combined})
    except Exception as exc:
        logger.error("Writer chain failed", extra={"context": {"topic": topic, "error": str(exc)}})
        raise LLMProviderError(f"Writer chain failed: {exc}") from exc

    try:
        critic_chain = _build_critic_chain()
        critique = await critic_chain.ainvoke({"report": report})
    except Exception as exc:
        logger.error("Critic chain failed", extra={"context": {"topic": topic, "error": str(exc)}})
        raise LLMProviderError(f"Critic chain failed: {exc}") from exc

    duration = time.monotonic() - started
    logger.info("Research pipeline finished", extra={"context": {"topic": topic, "duration_seconds": round(duration, 2)}})

    return ResearchPipelineResult(
        topic=topic,
        search_results=search_results,
        scraped_content=scraped_content,
        report=report,
        critique=critique,
        web_sources=extract_web_sources_from_text(search_results),
    )
