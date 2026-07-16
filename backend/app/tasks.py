"""In-process async task registry (demo scale). task_id -> state, polled by the UI."""
import threading
import time
import uuid

_tasks: dict[str, dict] = {}
_lock = threading.Lock()


def create(kind: str, user_id: str | None = None) -> str:
    task_id = uuid.uuid4().hex[:10]
    with _lock:
        _tasks[task_id] = {
            "id": task_id, "kind": kind, "status": "running",
            "progress": 0, "step": "", "result": None, "error": None,
            "created": time.time(), "user_id": user_id,
        }
    return task_id


def update(task_id: str, **kw):
    with _lock:
        if task_id in _tasks:
            _tasks[task_id].update(kw)


def finish(task_id: str, result):
    update(task_id, status="done", progress=100, result=result)


def fail(task_id: str, error: str):
    update(task_id, status="error", error=error)


def get(task_id: str) -> dict | None:
    with _lock:
        return dict(_tasks[task_id]) if task_id in _tasks else None


def get_for_user(task_id: str, user_id: str) -> dict | None:
    """Only returns the task if it belongs to this user. Used by the public
    /tasks/{id} endpoint so one user can never poll another user's job."""
    t = get(task_id)
    if not t or t.get("user_id") != user_id:
        return None
    t.pop("user_id", None)  # internal bookkeeping, not part of the API response
    return t
