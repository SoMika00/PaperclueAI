import type { Task } from "./types";

export const BASE = "/paperclue/api";

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export async function upload(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function pollTask<T = any>(
  taskId: string,
  onUpdate?: (t: Task<T>) => void,
  intervalMs = 1500
): Promise<Task<T>> {
  for (;;) {
    const t = await api<Task<T>>(`/tasks/${taskId}`);
    onUpdate?.(t);
    if (t.status !== "running") return t;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/** Consume an SSE POST stream (chat). */
export async function sseStream(
  path: string,
  body: any,
  handlers: {
    onDelta: (text: string) => void;
    onSources?: (sources: any[]) => void;
    onDone?: () => void;
    onError?: (e: string) => void;
  }
) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    handlers.onError?.(`HTTP ${res.status}`);
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const events = buf.split("\n\n");
    buf = events.pop() || "";
    for (const evt of events) {
      let eventName = "message";
      let data = "";
      for (const line of evt.split("\n")) {
        if (line.startsWith("event: ")) eventName = line.slice(7).trim();
        else if (line.startsWith("data: ")) data += line.slice(6);
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        if (eventName === "sources") handlers.onSources?.(parsed);
        else if (eventName === "error") handlers.onError?.(parsed);
        else if (eventName === "done") handlers.onDone?.();
        else handlers.onDelta(parsed);
      } catch {
        /* ignore malformed frames */
      }
    }
  }
  handlers.onDone?.();
}
