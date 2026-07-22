# PaperClue — Research Operating System

Full-stack monorepo for the PaperClue research platform.

```
.
├── frontend/          Next.js 16 app (the UI) — see frontend/README if present
├── backend/           FastAPI research backend (ingest, insight, review, mind maps, paper tools)
├── supabase/          Supabase edge functions (the browser-invoked quick tools) + config
├── docker-compose.yml Backend stack: postgres + qdrant + api
└── INTEGRATION_PLAN.md
```

## Run it locally

**Backend** (Docker — postgres, qdrant, FastAPI api):

```bash
cp .env.example .env          # then fill in real keys (Anthropic, Supabase, DATABASE_URL, S2)
docker compose up -d          # api on :8000
```

`docker-compose.override.yml` bind-mounts `./backend/app` so backend edits take
effect on `docker compose restart api` instead of a full rebuild.

**Frontend** (Next dev server, proxies to the local api):

```bash
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
BACKEND_API_URL=http://localhost:8000/api npm run dev -- -p 3300
```

The frontend reaches the backend through a same-origin `/api` rewrite
(`frontend/next.config.ts`), so there is no CORS to configure. It is not
containerised — run it with `npm` as above.

**Edge functions** (Supabase, Deno): see `supabase/README.md` for deploy steps
and the required function secrets. They are invoked from the browser at
`${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/<name>`.

## Auth

One Supabase project backs everything: the frontend holds the session, the
FastAPI backend validates the same project's JWTs via JWKS, and the edge
functions run under the same auth.
