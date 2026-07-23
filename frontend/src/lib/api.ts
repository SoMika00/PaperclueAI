import type { Task } from "./types";
import { supabase } from "./supabase";

export const BASE = "/api";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const auth = await authHeaders();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...auth, ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export async function upload(file: File) {
  const auth = await authHeaders();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest`, { method: "POST", body: form, headers: auth });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function downloadFile(path: string, fallbackName = "paperclue-export.docx") {
  const auth = await authHeaders();
  const res = await fetch(`${BASE}${path}`, { headers: auth });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = match?.[1] || fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
  const auth = await authHeaders();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
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
