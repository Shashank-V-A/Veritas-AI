# Veritas AI

> **Don't consume information. Verify it.**

## About Veritas AI

Veritas AI is an AI-powered credibility investigation platform. Instead of open-ended chat, it turns messy input — news articles, WhatsApp forwards, YouTube transcripts, PDFs, and images — into structured **credibility dossiers**: trust scores, extracted claims, bias and fallacy signals, evidence context, and neutral rewrites.

The product is built for analysts, journalists, researchers, and everyday users who need to verify information before they share it. The UI follows an investigation-desk aesthetic: case files, dossiers, and a live knowledge graph of how claims connect across your work.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React, Vite, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, Recharts |
| **Backend** | Node.js, Express (Vercel serverless) |
| **Database** | SQLite + Prisma (local) · Turso/libSQL (production) |
| **AI inference** | Mesh API (`MESH_API_KEY`) |
| **Knowledge graph** | Neo4j Aura (optional) |
| **Auth** | Google OAuth, JWT session cookies |
| **Deploy** | Vercel |

---

## How Mesh API is used

All credibility analysis runs through **Mesh API** — the backend never calls LLM providers directly.

**Flow:**

1. User submits content (text, URL, PDF, YouTube transcript, or OCR from an image).
2. Optional **web search** (Tavily or DuckDuckGo) gathers real URLs for evidence and suggested reading.
3. The **analysis pipeline** (`backend/services/analysis/pipeline.ts`) sends a structured prompt to Mesh via `MeshClient` (`/v1/chat/completions`).
4. Mesh returns **JSON only**, constrained by a strict `credibility_report` schema: trust score, claims, bias, emotion, fallacies, verdict, timeline, and more.
5. The response is parsed, validated with Zod, and repaired with a second Mesh call if JSON is invalid.
6. Results are saved to the database and synced to Neo4j for the knowledge graph.

**Configuration:** `MESH_API_KEY`, `MESH_API_URL` (default `https://api.meshapi.ai`), `MESH_MODEL` (e.g. `google/gemini-2.5-flash`). Without a key, dev mode falls back to a local stub report.

Mesh handles retries, timeouts, and rate limits. Each report records which model ran and latency for transparency in the UI.

---

## How Neo4j is used

Neo4j is **not** the primary database. Case files, users, and history live in **SQLite/Turso** via Prisma. Neo4j powers the **Knowledge graph** — a visual map of how investigations connect.

**After each analysis**, `syncAnalysisToGraph()` writes to Neo4j Aura:

- **Analysis** nodes — verdict, trust score, summary
- **Claim** nodes — text, status (`verified`, `unverified`, `disputed`, `false`), confidence
- **Source** and **Domain** nodes — from evidence URLs and suggested reading
- **Relationships** — `HAS_CLAIM`, `CITED_BY`, `FROM_DOMAIN`, `SUPPORTS`, `CONTRADICTS`, `RELATED_TO`

**Reading the graph:** `GET /api/graph` returns a scoped snapshot for the signed-in user. The **Knowledge graph** page (`/app/graph`) renders analyses at the center, with claims, sources, and domains as connected nodes.

**Lifecycle:** Deleting a case file removes its subgraph from Neo4j. Opening the graph page backfills any cases that failed to sync earlier.

**Configuration:** `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`. If unset, analysis still works — only the graph feature is disabled.

---

## Live deployment

**Production:** [https://veritas-ai-shashank.vercel.app](https://veritas-ai-shashank.vercel.app)

---

## Features

- **Multi-format intake** — paste text, web links, YouTube (transcript), PDF upload, image OCR
- **Structured reports** — trust score, claim breakdown, bias meters, emotion profile, logical fallacies
- **India / social signals** — forward-message detection, forward-risk scoring, domain reputation
- **Case file archive** — searchable history, filters by category and verdict, re-analyze with changelog
- **Knowledge graph** — Neo4j constellation of analyses, claims, sources, and domains
- **Claim watchlist** — monitor claims across new analyses and the web; email alerts via Resend
- **Public share links** — shareable reports with dynamic OG preview images
- **Export** — PDF and Markdown download
- **Judge mode** — kiosk-style demo loop for presentations
- **Chrome extension** — verify any page or text selection from the browser
- **Accessibility & i18n** — English and Hindi, reduced-motion support, investigation soundscape (optional)
- **Google sign-in** — private workspace tied to your account

---

## Developer

**Shashank V.A** — student at **MVJ College of Engineering**, based in **Bangalore**.

Built Veritas AI as a full-stack credibility intelligence product: React frontend, Express API on Vercel, Mesh-powered analysis, and Neo4j graph sync.

**Portfolio & contact:** [shashankva.me](https://shashankva.me)

---

## Local development

```bash
npm install
cp .env.example backend/.env
npm run db:push
npm run dev:all
```

- Frontend: http://localhost:5173  
- API: `/api` (proxied to backend on port 3001)

See `.env.example` for required keys (`MESH_API_KEY`, Google OAuth, `JWT_SECRET`, optional Neo4j and Turso).
