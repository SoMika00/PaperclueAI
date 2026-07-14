"""In-process async task registry (demo scale). task_id -> state, polled by the UI."""
import threading
import time
import uuid

_tasks: dict[str, dict] = {}
_lock = threading.Lock()


def create(kind: str) -> str:
    task_id = uuid.uuid4().hex[:10]
    with _lock:
        _tasks[task_id] = {
            "id": task_id, "kind": kind, "status": "running",
            "progress": 0, "step": "", "result": None, "error": None,
            "created": time.time(),
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
