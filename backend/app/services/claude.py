"""Anthropic Claude helpers: JSON-strict calls and SSE streaming."""
import json
import re

from anthropic import Anthropic, AsyncAnthropic

from ..config import settings

_client = Anthropic(api_key=settings.anthropic_api_key)
_aclient = AsyncAnthropic(api_key=settings.anthropic_api_key)


def complete(prompt: str, system: str = "", model: str | None = None,
             max_tokens: int = 4096, temperature: float | None = None) -> str:
    kwargs = dict(
        model=model or settings.claude_model_fast,
        max_tokens=max_tokens,
        system=system or "You are PaperClue, a rigorous academic research assistant.",
        messages=[{"role": "user", "content": prompt}],
    )
    if temperature is not None:
        kwargs["temperature"] = temperature
    msg = _client.messages.create(**kwargs)
    return "".join(b.text for b in msg.content if b.type == "text")


def complete_json(prompt: str, system: str = "", model: str | None = None,
                  max_tokens: int = 4096):
    txt = complete(
        prompt + "\n\nRespond with valid JSON only. No markdown fences, no commentary.",
        system=system, model=model, max_tokens=max_tokens,
    )
    txt = txt.strip()
    txt = re.sub(r"^```(json)?|```$", "", txt, flags=re.MULTILINE).strip()
    start = min([i for i in (txt.find("{"), txt.find("[")) if i >= 0], default=0)
    return json.loads(txt[start:])


def complete_json_or_raw(prompt: str, system: str = "", model: str | None = None,
                         max_tokens: int = 4096) -> dict:
    """Like complete_json, but on a parse failure returns {"raw_response": text}
    instead of raising - lets callers fall back to rendering the model's prose
    (used by the quick tools, where the system prompt - not this helper -
    is what asks the model for strict JSON)."""
    txt = complete(prompt, system=system, model=model, max_tokens=max_tokens)
    cleaned = re.sub(r"```json|```", "", txt, flags=re.IGNORECASE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    # Fall back to the outermost {...} so a stray preamble/suffix around
    # otherwise-valid JSON doesn't force a raw dump (the #7-class robustness fix).
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError:
            pass
    return {"raw_response": txt}


async def stream(messages: list[dict], system: str = "", model: str | None = None,
                 max_tokens: int = 2048):
    """Async generator of text deltas."""
    async with _aclient.messages.stream(
        model=model or settings.claude_model_fast,
        max_tokens=max_tokens,
        system=system or "You are PaperClue, a rigorous academic research assistant.",
        messages=messages,
    ) as s:
        async for text in s.text_stream:
            yield text
