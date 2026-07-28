"""In-process per-key rate limiting (fixed window). Good enough for a
single backend instance - no shared table needed, unlike the old
Supabase edge functions which tracked counters in a `rate_limits` row
per user since each invocation was a stateless, possibly-parallel
function instance."""
import threading
import time

from fastapi import HTTPException

_state: dict[str, tuple[int, float]] = {}
_lock = threading.Lock()


def check(key: str, limit: int, window_s: float) -> None:
    """Raise 429 once `key` has been hit more than `limit` times within
    `window_s` seconds. Each key gets its own fixed window."""
    now = time.time()
    with _lock:
        count, reset_at = _state.get(key, (0, 0.0))
        if now >= reset_at:
            count, reset_at = 0, now + window_s
        count += 1
        _state[key] = (count, reset_at)
    if count > limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
