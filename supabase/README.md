# Supabase Edge Functions

The five browser-invoked "quick tools", co-located with the app that calls them.
They run on Supabase (Deno), share this project's Supabase auth + database, and
are reached from the client via `src/lib/edge-functions.ts`:

```
POST ${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/<name>
  headers: apikey: <anon>, Authorization: Bearer <user session JWT>
```

| Function                 | Purpose                                             |
|--------------------------|-----------------------------------------------------|
| `mind-map`               | `topic` → keyword clusters; `mode:"analyze"` → brief |
| `paper-insights`         | scored review dimensions + overall summary          |
| `proofreading`           | grammar/clarity/passive-voice + per-section feedback |
| `manuscript-ingestion`   | publication/submission readiness + reviewer concerns |
| `journal-formatting`     | best-fit journal match (Semantic Scholar)           |

Every function returns parsed JSON directly. If the model output failed
server-side JSON parsing, the response is `{ "raw_response": "<text>" }`, which
the client renders as sanitized markdown.

## Deploy

```bash
supabase link --project-ref <project-ref>     # writes supabase/.temp (gitignored)
supabase functions deploy <name>              # or omit <name> to deploy all
```

## Secrets (set in the cloud, never committed)

```bash
supabase secrets set ANTHROPIC_API_KEY=...
supabase secrets set SEMANTIC_SCHOLAR_API_KEY=...
```

Local link state under `supabase/.temp/` and any `.env` files are gitignored.
