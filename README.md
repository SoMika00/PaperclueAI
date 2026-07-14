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
| Frontend | Next.js 14 (App Router, TS, `basePath /paperclue`) | SSR + streaming, single deployable |
| UI | Tailwind (custom tokens), lucide icons | high-contrast, no generic-AI look |
| PDF | react-pdf / pdf.js + custom highlight layer | quote-anchored, bidirectional |
| Graph | React Flow | custom nodes, radial cluster layout |
| Backend | FastAPI (Python 3.11, async) | I/O-bound pipelines, SSE |
| LLM | Anthropic Claude (Sonnet) | brief/review/synthesis/cluster labels |
| Public grounding | Semantic Scholar Graph + Recommendations API | real papers, citation graph |
| Embeddings | FastEmbed (local, `BAAI/bge-small-en-v1.5`, 384d) | free, no external dependency |
| Vector DB | Qdrant | one collection per manuscript / tenant |
| Metadata | PostgreSQL 16 | manuscripts, refs, issues, versions, maps |
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
cp .env.example .env    # set ANTHROPIC_API_KEY (S2_API_KEY optional but recommended)
docker compose up -d --build
# → web on :3000 under basePath /paperclue, api on :8000
```

The `web` container also joins the external `mirror_default` network so the
MIRROR Caddy can reverse-proxy it. Without that stack:
`docker network create mirror_default`.

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
