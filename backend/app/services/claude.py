"""Anthropic Claude helpers: JSON-strict calls and SSE streaming."""
import json
import re

from anthropic import Anthropic, AsyncAnthropic

from ..config import settings

_client = Anthropic(api_key=settings.anthropic_api_key)
_aclient = AsyncAnthropic(api_key=settings.anthropic_api_key)


def complete(prompt: str, system: str = "", model: str | None = None,
             max_tokens: int = 4096, temperature: float = 0.2) -> str:
    msg = _client.messages.create(
        model=model or settings.claude_model_fast,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system or "You are PaperClue, a rigorous academic research assistant.",
        messages=[{"role": "user", "content": prompt}],
    )
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
