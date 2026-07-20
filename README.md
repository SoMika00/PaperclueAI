# PaperClue — Grounded research workspace

Understand your research. Discover what is missing. Prepare your work for
publication — **every AI claim traced back to an inspectable source**.

Live demo: **https://mymirror.fr/paperclue** (auto-connected to the demo user
*Dr. Test Researcher — Demo University*; the account menu top-right lets you
sign out/in).

---

## The mental model: My Research ↔ Discover

| | **My Research** (private) | **Discover** (external) |
|---|---|---|
| What | Manuscripts, uploaded PDFs, collections, university corpus, versions | Public literature via Semantic Scholar |
| Storage | Postgres + Qdrant (one collection per manuscript, one per tenant) | S2 API with a server-side TTL cache |
| Provenance color | 🟢 green (manuscript) · 🟠 amber (university) | 🔵 indigo (public) |

The bridge between the two spaces is a pair of ever-present actions:
**Add to my research** (a Discover paper joins your library) and
**Find sources for this** (select text in your PDF → contextual public search).

`source_scope` (`manuscript` / `university` / `public`) is stored in the
database, returned in every API response and every graph node/edge — never
reconstructed from a color or URL. The university corpus never leaves the
tenant; citation verification is the only place a manuscript crosses the
public corpus.

## Features

- **Upload & visible ingestion** — parse structure → extract references →
  detect metadata → *the workspace opens here* → semantic indexing continues
  in the background (batched). Until the index is ready, chat/explain fall
  back to lexical search, so a fresh upload is usable in seconds.
- **Paper Insight** — structured brief (problem, contribution, method,
  results, limitations), every claim anchored to an exact quote: click →
  the PDF scrolls and highlights the passage. Chat with your paper (SSE
  streaming, page-cited answers).
- **Living PDF** — pdf.js viewer with quote-anchored highlight layers, and
  selection → **Explain** / **Find sources**.
- **Discover** — federated grounded search with scopes
  `All / Public / University / My research` (the last one is private RAG over
  your own uploads). Two views: result list (with "why it matches") and an
  evidence synthesis whose inline `[n]` citations are clickable — every
  citation is linked to a retrieved paper, never invented.
- **Mind Maps** — first-class objects seeded from a *research question*, a
  *manuscript* or a *collection*. Nodes carry a "why this paper is here"
  explanation; edge color = provenance, edge style = relation (solid cites /
  dashed similar). Control bar: label/dot mode, provenance filters; summary
  line (papers · research families · cited · gaps). **Gap Finder**: clusters
  your manuscript cites nothing from, with inspect/add actions. Branch
  expansion via the S2 recommendations API.
- **Review** — peer-review-style issues (severity, category, anchored quote,
  suggestion, confidence) in a workflow: severity groups → issue detail →
  Accept / Edit / Dismiss. Accepting a fix records a **version** (diff kept)
  and visibly moves the readiness score. Citation verification resolves every
  reference against Semantic Scholar (✓ verified / ⚠ mismatch / ✗ not found).
- **Journal Format** — real journal profiles (*Scientific Reports — Research
  Article*, *IEEE Access — Regular Paper*): compliance checklist with
  localized details, abstract before/after, restructure plan, DOCX export.
- **Evidence Ledger** — a drawer (closed by default) aggregating every proof
  the features produce, with graded statuses (direct / partial / contextual
  support, conflict, unresolved). Clicking a proof highlights the PDF or
  opens the source paper.
- **Readiness Score, explicable** — 0 credit until the work is done:
  ingestion 15 + insight 15 + citations 30×(verified/total) + review
  40−open-issue penalties. Click the gauge for the component breakdown.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 16 (App Router, React 19, TS 6, `basePath /paperclue`) | SSR + streaming, single deployable |
| UI | Tailwind 4 (custom tokens via `@config` bridge), lucide icons | high-contrast, no generic-AI look |
| PDF | react-pdf / pdf.js + custom highlight layer | quote-anchored, bidirectional |
| Graph | React Flow | custom nodes, radial cluster layout |
| Backend | FastAPI (Python 3.12, async) | I/O-bound pipelines, SSE |
| LLM | Anthropic Claude (Sonnet) | brief/review/synthesis/cluster labels |
| Public grounding | Semantic Scholar Graph + Recommendations API | real papers, citation graph |
| Embeddings | FastEmbed (local, `BAAI/bge-small-en-v1.5`, 384d) | free, no external dependency |
| Vector DB | Qdrant 1.18 | one collection per manuscript / tenant |
| Metadata | PostgreSQL 18 | manuscripts, refs, issues, versions, maps — local container by default, or Supabase/any Postgres via `DATABASE_URL` |
| Jobs | FastAPI BackgroundTasks + in-process task registry | demo scale; poll `/tasks/{id}` |
| Hosting | Docker Compose behind the MIRROR Caddy | route `/paperclue*` → `paperclue-web:3000` |

Robustness choices for keyless Semantic Scholar: max 1 concurrent request,
1.2 s spacing, 9 s timeout, bounded retries, in-memory TTL cache (searches
24 h, metadata/recommendations 7 days), partial results with a visible
warning instead of a blocked screen.

## Repository layout

```
PaperclueAI/
├── docker-compose.yml       # postgres + qdrant + api + web (joins mirror_default)
├── .env.example             # ANTHROPIC_API_KEY, S2_API_KEY, models, tenant
├── backend/
│   ├── Dockerfile  start.sh
│   └── app/
│       ├── main.py          # app factory; non-blocking warmup (model + seed)
│       ├── config.py  db.py  models.py  serializers.py  tasks.py
│       ├── seed_university.py       # demo tenant corpus (real OA papers)
│       ├── services/
│       │   ├── claude.py    # completions, strict-JSON, SSE streaming
│       │   ├── embeddings.py# fastembed + qdrant, batched upserts
│       │   ├── lexical.py   # fallback search while the index builds
│       │   ├── pdf_parse.py # pymupdf pages/sections/chunks
│       │   ├── readiness.py # explicable score
│       │   └── s2.py        # semantic scholar client (throttle + cache)
│       └── routers/
│           ├── ingest.py    # POST /ingest → visible pipeline
│           ├── manuscripts.py
│           ├── insight.py   # brief, chat (SSE), explain
│           ├── browse.py    # federated search (public/university/mine)
│           ├── review.py    # review, async verify, accept/edit/dismiss
│           ├── mindmaps.py  # maps from question/manuscript/collection + expand
│           ├── mindmap.py   # legacy manuscript-map endpoint
│           ├── library.py   # saved papers, university repo, recent searches
│           └── journal_format.py    # compliance, rewrite, DOCX export
└── frontend/
    ├── Dockerfile  next.config.mjs  tailwind.config.ts
    └── src/
        ├── lib/             # api client, types, auth (demo), workspace ctx
        ├── components/
        │   ├── TopBar.tsx  Sidebar.tsx  GlobalShell.tsx
        │   ├── PdfViewer.tsx  EvidenceDrawer.tsx  MindMapCanvas.tsx
        │   ├── LiteratureSearch.tsx  HeroMap.tsx  IngestStepper.tsx
        │   ├── UploadDropzone.tsx  UploadModal.tsx  ui.tsx
        │   └── panels/      # InsightPanel, ReviewPanel, FormatPanel
        └── app/
            ├── home/  discover/  mind-maps/[id]/  library/  university/
            └── manuscripts/[id]/   # layout + overview, insight,
                                    # related-research, mind-map, review,
                                    # journal, versions
```

## Run it

```bash
cp .env.example .env    # set ANTHROPIC_API_KEY + NEXT_PUBLIC_SUPABASE_* (see below)
docker compose up -d --build
# → web on :3000 under basePath /paperclue, api on :8000
```

Required in `.env` before the first build:
- `ANTHROPIC_API_KEY` — backend generation (insight/review/format/browse).
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the frontend
  auth gate (`SignInGate` in `frontend/src/lib/auth.tsx`) always requires a
  Supabase project. Next.js inlines `NEXT_PUBLIC_*` vars **at image build
  time**, not at container start, so `docker-compose.yml` passes them as
  `build.args` to the `web` service — changing them means a rebuild
  (`docker compose up -d --build web`), a restart alone won't pick them up.
  Use the **anon** key here, never the service role key.
- `DATABASE_URL` — optional. Leave blank to use the local `postgres` container
  (`paperclue`/`paperclue`, already wired in `docker-compose.yml`). Point it at
  Supabase (or any Postgres) to use that instead. If the password contains
  special characters (`# % & ! ^ …`), percent-encode it — an unescaped `#` is
  read as a URI fragment and silently truncates the connection string.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — backend-side Supabase access
  (profile lookups, service-role operations). Backend-only, never exposed to
  the browser.

The `web` container also joins the external `mirror_default` network so the
MIRROR Caddy can reverse-proxy it. Without that stack:
`docker network create mirror_default`.

### Version notes

- **Next.js 16 defaults to Turbopack**, which ignores the `webpack()` config in
  `next.config.mjs` (needed for the pdf.js `canvas` alias). `frontend/package.json`
  therefore runs `next build`/`next dev` with an explicit `--webpack` flag —
  don't drop it without re-verifying the PDF viewer.
- **TypeScript 7.0 + Next.js 16.3.0-preview.6.** TS 7's npm package dropped
  `lib/typescript.js` (the JS Compiler API) in favor of a native Go binary, so
  stable Next.js 16.2.10 — which reads `tsconfig.json` through that JS API —
  can't find any `@/*` alias and fails every route with `Module not found`.
  The fix (`experimental.useTypeScriptCli` in `next.config.mjs`, delegating to
  the native `tsc` binary) only exists on Next's `preview`/`canary` channels
  as of July 2026, not yet in a stable release — hence pinning `next` to
  `16.3.0-preview.6` instead of the `latest` tag. This is a real tradeoff:
  preview builds carry no semver guarantee. If the preview channel causes
  issues, the fallback is `next@16.2.10` + `typescript@6.0.3` (no experimental
  flag needed) — verified working in an earlier pass. Move both back to
  `latest` once `useTypeScriptCli` (or native TS 7 support) ships stable.
- **Tailwind is on v4** via the compatibility bridge (`@import "tailwindcss";`
  + `@config "../../tailwind.config.ts";` in `globals.css`, `@tailwindcss/postcss`
  in `postcss.config.mjs`) — the JS config file and `@apply`/`theme()` calls
  across the codebase keep working unchanged. `autoprefixer` was dropped;
  v4 handles vendor prefixing itself.
- **Postgres (16→18) and Qdrant (1.12→1.18) are major version bumps that break
  on-disk compatibility** — an in-place image swap makes the old data
  unreadable (Qdrant panics on load; Postgres refuses to start). If you're
  upgrading a deployment with real data, dump/restore (Postgres:
  `pg_dump -F custom` → `pg_restore`) rather than just changing the image tag,
  and expect to rebuild Qdrant collections via re-ingestion. The volume names
  in `docker-compose.yml` (`pg_data_pg18`, `qdrant_data_v118`) are new on
  purpose, so the pre-upgrade `pg_data`/`qdrant_data` volumes survive untouched
  as an offline backup.

Note: the Caddyfile is bind-mounted as a single file — after editing it,
`docker restart mirror-caddy` (an in-container reload still sees the old inode).

## API surface

| Method | Endpoint | Role |
|---|---|---|
| POST | `/api/ingest` | upload → visible pipeline (workspace ready before indexing) |
| GET | `/api/manuscripts` `/{id}` `/{id}/pdf|references|issues|evidence|versions` | manuscript data |
| POST | `/api/insight/{id}` · `/chat` (SSE) · `/explain` | anchored brief, grounded chat |
| POST | `/api/browse` | federated search → `task_id` |
| POST | `/api/review/{id}` · `/api/verify/{id}` | async review / citation resolution |
| PATCH | `/api/review-issues/{id}` | accept / reject (+ edited suggestion) |
| POST/GET | `/api/mindmaps` `/{id}` `/{id}/expand` | maps from 3 seed types |
| POST/GET/DELETE | `/api/library` · GET `/api/university` · GET `/api/searches/recent` | my research |
| POST | `/api/format/{id}?journal=` · GET `/export` | compliance + DOCX |
| GET | `/api/tasks/{task_id}` | poll any async job |

## Demo script (7 minutes)

1. **Home** — three actions; the animated mini-map explains the product.
2. **Discover** — ask a literature question; provenance badges, synthesis with
   clickable citations; *Add to my research*; *Create map from this search*.
3. **Mind map** — clusters, why-connected nodes, provenance toggles; open a
   paper, expand a branch.
4. **Upload the manuscript** — visible pipeline, workspace opens immediately
   (readiness 15), indexing badge in the header.
5. **Paper Insight** — click a claim → the PDF highlights the quote; ask the
   chat "what is the contribution?" (readiness → 30).
6. **Review** — verify citations (→ ~58), run review, open an issue, accept a
   fix → version recorded, gauge moves; click the gauge for the breakdown.
7. **Journal** — IEEE Access checklist, restructure plan, export DOCX.
