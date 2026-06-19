"""Lightweight in-process sliding-window rate limiter.

AWS transition: this in-memory store only protects a single process. On AWS
(multiple instances behind a load balancer) back this with Redis/ElastiCache or
enforce throttling at API Gateway / the ALB instead.
"""

import time
from collections import defaultdict

from app.core.exceptions import AppError

_hits: dict[str, list[float]] = defaultdict(list)


def enforce(
    key: str,
    limit: int,
    window_seconds: int,
    *,
    code: str = "rate_limited",
    message: str = "Demasiadas solicitudes, intente más tarde.",
) -> None:
    """Allow at most ``limit`` calls per ``key`` within ``window_seconds``.

    Raises ``AppError`` 429 once the window is saturated."""
    now = time.monotonic()
    window_start = now - window_seconds
    recent = [t for t in _hits[key] if t > window_start]
    if len(recent) >= limit:
        _hits[key] = recent
        raise AppError(status_code=429, message=message, code=code)
    recent.append(now)
    _hits[key] = recent


def reset() -> None:
    """Clear all counters (used by tests)."""
    _hits.clear()
