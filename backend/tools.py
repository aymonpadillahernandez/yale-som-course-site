"""The two agent tools: search_courses over the local JSON, web_search over the public web.

Both are plain functions with typed signatures and docstrings, so pydantic-ai can
expose them directly and the tool names the model calls are exactly
"search_courses" and "web_search".
"""

from __future__ import annotations

import html
import json
import re
from functools import lru_cache
from pathlib import Path

import httpx

from models import Course, CourseSearchResult, WebResult, WebSearchResult

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DATA_PATH = ROOT / "data" / "yale_som_classes.json"

MAX_COURSE_RESULTS = 15
MAX_WEB_RESULTS = 5

# 'Timings Day' uses two-letter codes ("We") and 'Daytimes' uses single letters
# ("W 4:10 PM-7:10 PM"), so "Tuesday" has to be expanded to reach both. These are
# matched against the day fields only — never the description, where a bare "t"
# would hit almost every row.
DAY_ALIASES = {
    "monday": ["mo", "m"],
    "mon": ["mo", "m"],
    "tuesday": ["tu", "t"],
    "tue": ["tu", "t"],
    "tues": ["tu", "t"],
    "wednesday": ["we", "w"],
    "wed": ["we", "w"],
    "thursday": ["th"],
    "thu": ["th"],
    "thurs": ["th"],
    "friday": ["fr", "f"],
    "fri": ["fr", "f"],
    "saturday": ["sa"],
    "sat": ["sa"],
    "sunday": ["su"],
    "sun": ["su"],
}

STOPWORDS = {
    "a", "an", "and", "any", "are", "class", "classes", "course", "courses",
    "do", "does", "for", "have", "in", "is", "list", "me", "of", "on", "or",
    "show", "some", "taught", "teach", "teaches", "that", "the", "there",
    "what", "which", "who", "with",
}


@lru_cache(maxsize=1)
def load_courses() -> list[Course]:
    """Load and validate every row of data/yale_som_classes.json."""
    if not DATA_PATH.exists():
        return []
    rows = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return [Course.model_validate(row) for row in rows]


def _matches(course: Course, token: str) -> bool:
    """Does one query token match this course?

    Day names are checked against the day fields with a word boundary; every
    other token is a plain substring match across the searchable fields.
    """
    codes = DAY_ALIASES.get(token)
    if codes:
        day_hay = f"{course.day} {course.daytimes}".lower()
        return any(re.search(rf"\b{code}", day_hay) for code in codes)
    return token in course.haystack()


def search_courses(query: str, limit: int = MAX_COURSE_RESULTS) -> dict:
    """Search the Yale SOM course catalog held in data/yale_som_classes.json.

    Matches against course title, course number, faculty name, category, meeting
    day and time, room, units, session and the course description. Use this for
    any question that the course catalog can answer.

    Args:
        query: Free text, e.g. "accounting", "MGMT 7307", "Simonsohn",
            "Tuesday afternoon", "PhD operations".
        limit: Maximum rows to return (capped at 15).

    Returns:
        total_matches, returned, truncated and the matching course rows.
    """
    courses = load_courses()
    limit = max(1, min(int(limit or MAX_COURSE_RESULTS), MAX_COURSE_RESULTS))
    cleaned = (query or "").lower().strip()

    if not cleaned:
        matched = courses
    else:
        tokens = [t for t in re.split(r"[^\w:]+", cleaned) if t and t not in STOPWORDS]
        if not tokens:
            tokens = [cleaned]
        matched = [c for c in courses if all(_matches(c, tok) for tok in tokens)]
        if not matched:
            # Fall back to "any token" so a multi-word query still returns leads.
            matched = [c for c in courses if any(_matches(c, tok) for tok in tokens)]

    result = CourseSearchResult(
        query=query or "",
        total_matches=len(matched),
        returned=min(len(matched), limit),
        truncated=len(matched) > limit,
        courses=[c.summary() for c in matched[:limit]],
    )
    return result.model_dump()


def web_search(query: str, limit: int = MAX_WEB_RESULTS) -> dict:
    """Search the public web when the course catalog does not hold the answer.

    Use this for things outside data/yale_som_classes.json — faculty news,
    published research, syllabus context, programme requirements. Do not use it
    for course times, rooms or faculty assignments; those come from
    search_courses and must not be guessed.

    Args:
        query: What to look up on the public web.
        limit: Maximum results to return (capped at 5).

    Returns:
        The result list, each with title, url and snippet, or an error string.
    """
    limit = max(1, min(int(limit or MAX_WEB_RESULTS), MAX_WEB_RESULTS))
    cleaned = (query or "").strip()
    if not cleaned:
        return WebSearchResult(query="", error="Empty query.").model_dump()

    try:
        response = httpx.get(
            "https://html.duckduckgo.com/html/",
            params={"q": cleaned},
            headers={"User-Agent": "Mozilla/5.0 (course-explorer)"},
            timeout=20.0,
            follow_redirects=True,
        )
        response.raise_for_status()
    except Exception as exc:
        return WebSearchResult(
            query=cleaned, error=f"Web search unavailable: {type(exc).__name__}: {exc}"
        ).model_dump()

    results: list[WebResult] = []
    blocks = re.split(r'<div class="result[ "]', response.text)
    for block in blocks[1:]:
        link = re.search(r'<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.S)
        if not link:
            continue
        snippet = re.search(r'class="result__snippet"[^>]*>(.*?)</a>', block, re.S)
        results.append(
            WebResult(
                title=_strip_tags(link.group(2)),
                url=html.unescape(link.group(1)),
                snippet=_strip_tags(snippet.group(1)) if snippet else "",
            )
        )
        if len(results) >= limit:
            break

    return WebSearchResult(
        query=cleaned, returned=len(results), results=results
    ).model_dump()


def _strip_tags(raw: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", "", raw)).split())
