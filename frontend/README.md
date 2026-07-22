# PaperClue — Research Operating System (Frontend)

Next.js frontend for the PaperClue AI demo: upload a paper, explore it as a network, and run AI-powered research tools. All AI calls go through Supabase edge functions — the frontend never talks to the Anthropic API directly and never sees the service_role key.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in the Supabase URL + publishable key
npm run dev
```

## The research workspace (Michail's backend × this UI)

The app is manuscript-centric: upload a PDF → a workspace opens with tabs, all
backed by the FastAPI research backend (`/api` rewrite, see INTEGRATION_PLAN.md):

| Surface | What it does |
|---|---|
| Home / Library | Upload with visible ingestion pipeline; manuscripts + saved papers |
| Discover | Federated grounded search (public / university / mine) + evidence synthesis with [n] citations; add papers to your library; spin a mind map from any search |
| Workspace → Insight | Anchored brief (click a claim → the PDF scrolls to the exact quote) + SSE chat with page-cited answers |
| Workspace → Related research | Scoped search that records evidence; fed by PDF text selection ("Find sources") |
| Workspace → Mind map | Research map around the manuscript: clusters, "why this paper is here", provenance filters, Gap Finder, branch expansion |
| Workspace → Review | AI peer review with severity-graded anchored issues (accept / edit / dismiss), citation verification vs Semantic Scholar; accepted fixes record versions |
| Workspace → Journal | Compliance checklist per journal profile, abstract rewrite, restructure plan, DOCX export |
| Evidence drawer | Every proof from every feature, aggregated; click → PDF highlight |
| PDF viewer | react-pdf with quote-anchored highlights; select text → Explain / Find sources |
| EN/JA toggle | Chrome-level i18n (top bar) — the target market is Japanese universities |

## Quick tools (Supabase edge functions, standalone)

| Tool | Edge function | Status |
|---|---|---|
| Mind Map (home, free) | `mind-map` (keywords + analyze modes) | ✅ Topic canvas + paper analysis card |
| Paper Insights | `paper-insights` | ✅ Seven scored dimensions |
| Proofreader | `proofreading` | ✅ Stats + per-section feedback (5 req/min) |
| Journal Match | `journal-formatting` | ✅ Best-fit venue via Semantic Scholar |
| Manuscript Review | `manuscript-ingestion` | ✅ Simulated peer review |

These predate the workspace and stay as fallbacks while the research backend
deployment stabilizes; retire them once the workspace is verified end-to-end.

## Architecture notes

- **Auth**: Supabase email/password. Guests are modeled as "no session or anonymous session" (`isGuest` in `src/lib/auth-context.tsx`). Password policy is 12+ characters; public sign-ups require email confirmation.
- **Document parsing** happens entirely in the browser (`src/lib/parse-file.ts`, pdfjs + mammoth). Raw text is sent to edge functions in memory only and never persisted, per the security design.
- **API contracts**: every edge function returns structured JSON (typed in `src/lib/edge-functions.ts`, verified against the function sources in the paperclue-backend repo). All functions accept `lang: "ja"` for Japanese output (not yet surfaced in the UI). If the model output fails JSON parsing server-side, functions return `{ raw_response }`, which the UI renders as sanitized markdown.
- `/debug/mind-map` is a temporary API probe page — remove before production.

## Security rules (from the backend integration guide)

- Never call `api.anthropic.com` from frontend code.
- Never put the `service_role` key or DB connection string anywhere in this repo.
- Route every AI call through the edge functions with the user's session JWT.
