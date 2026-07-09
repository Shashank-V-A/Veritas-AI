# Veritas AI — System Architecture

> **"Don't consume information. Verify it."**

Production architecture for a credibility analysis platform. All AI inference routes through **Mesh API** exclusively.

---

## 1. Executive Summary

Veritas AI accepts arbitrary text content (articles, posts, transcripts, forwards, PDFs) and produces a structured **credibility report** — not a chat response. The product is a premium dark-mode SaaS with a landing page, analysis dashboard, and rich visual report UI.

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, React Router, Recharts |
| Backend | Node.js, Express (Vercel serverless) |
| Database | SQLite via Prisma |
| AI Provider | **Mesh API only** — no direct LLM calls |
| Deployment | Vercel (monorepo) |

---

## 2. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    React SPA (Vite build)                        │   │
│  │  Landing │ Dashboard │ Analysis │ Report │ Command Palette       │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                               │ HTTPS /api/*                            │
│  ┌────────────────────────────▼─────────────────────────────────────┐   │
│  │              Express API (Vercel Serverless Functions)           │   │
│  │  /api/analyze  │  /api/history  │  /api/report/:id              │   │
│  └──────┬─────────────────┬──────────────────┬──────────────────────┘   │
│         │                 │                  │                          │
│         ▼                 ▼                  ▼                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐              │
│  │ Mesh Client │   │   Prisma    │   │  PDF Export     │              │
│  │  (wrapper)  │   │   + SQLite  │   │  Service        │              │
│  └──────┬──────┘   └─────────────┘   └─────────────────┘              │
└─────────┼───────────────────────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────┐
   │   Mesh API   │  ← sole AI provider
   └──────────────┘
```

---

## 3. Repository Structure

Monorepo layout optimized for Vercel deployment with shared types.

```
veritas-ai/
├── frontend/                    # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/          # UI primitives + domain components
│   │   │   ├── ui/              # shadcn/ui generated components
│   │   │   ├── analysis/        # Input, loading, report cards
│   │   │   ├── charts/          # Recharts wrappers
│   │   │   ├── layout/          # Sidebar, header, shell
│   │   │   └── landing/         # Marketing sections
│   │   ├── layouts/             # Page-level layout wrappers
│   │   ├── pages/               # Route entry points
│   │   ├── hooks/               # useAnalysis, useHistory, useKeyboard
│   │   ├── lib/                 # utils, cn(), constants, tokens
│   │   ├── services/            # API client (fetch wrappers)
│   │   ├── animations/          # Framer Motion variants & presets
│   │   ├── types/               # Frontend-specific types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── components.json          # shadcn config
│   └── package.json
│
├── backend/                     # Express API
│   ├── api/                     # Vercel serverless entry points
│   │   ├── index.ts             # Express app factory
│   │   ├── analyze.ts
│   │   ├── history.ts
│   │   └── report/
│   │       └── [id].ts
│   ├── services/
│   │   ├── mesh/                # Mesh API client & config
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── errors.ts
│   │   ├── analysis/            # Pipeline orchestration
│   │   │   ├── pipeline.ts
│   │   │   ├── prompts.ts
│   │   │   ├── parser.ts        # JSON validation & normalization
│   │   │   └── schema.ts        # Zod schemas
│   │   ├── report/
│   │   │   └── repository.ts    # DB read/write
│   │   └── export/
│   │       └── pdf.ts
│   ├── db/
│   │   └── prisma.ts            # Prisma client singleton
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── errors.ts
│   │   └── logger.ts
│   └── package.json
│
├── shared/                      # Cross-package types & constants
│   ├── types/
│   │   ├── analysis.ts          # CredibilityReport, Claim, etc.
│   │   └── api.ts               # Request/response contracts
│   └── constants/
│       └── limits.ts            # Max input length, timeouts
│
├── vercel.json                  # Routing, rewrites, env
├── package.json                 # Workspace root
├── .env.example
├── ARCHITECTURE.md              # This document
└── README.md
```

---

## 4. Frontend Architecture

### 4.1 Routing

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing | Marketing, demo preview, CTA |
| `/app` | Dashboard | Main analysis workspace |
| `/app/analysis/:id` | Report | Full credibility report view |
| `/app/history` | History | Past analyses list |

### 4.2 State Management

No Redux. Lightweight approach:

- **Server state**: TanStack Query (React Query) for API data, caching, optimistic updates
- **UI state**: React `useState` / `useReducer` for local UI (modals, command palette, input draft)
- **URL state**: Analysis ID in route params for shareable report links

### 4.3 Component Hierarchy

```
App
├── Router
│   ├── LandingLayout
│   │   └── LandingPage (sections as lazy-loaded chunks)
│   └── DashboardLayout
│       ├── Sidebar
│       ├── CommandPalette (Ctrl+K)
│       └── Outlet
│           ├── DashboardPage
│           │   ├── AnalysisInput
│           │   ├── RecentAnalyses
│           │   └── EmptyState
│           ├── ReportPage
│           │   ├── TrustScoreRing
│           │   ├── ClaimBreakdown
│           │   ├── BiasMeter
│           │   ├── EmotionRadar
│           │   ├── FallacyBadges
│           │   ├── ReasoningTimeline
│           │   ├── NeutralRewrite
│           │   ├── ELI15
│           │   └── ReportActions (copy, share, export PDF)
│           └── HistoryPage
```

### 4.4 Design System

Tokens defined in `frontend/src/lib/tokens.ts` and mirrored in `tailwind.config.ts`:

```ts
colors: {
  parchment: '#F4F0E6',
  ink: '#1A1A1F',
  charcoal: '#2C2C30',
  background: '#F4F0E6',        // Warm parchment
  surface: '#1A1A1F',           // Deep ink panels
  foreground: '#2C2C30',         // Text on parchment
  accent: '#8B2942',             // Oxblood — verdicts, stamps
  accentSecondary: '#9A7B4F',    // Aged brass — highlights
  success: '#2D5A4A',            // Forest — verified
  warning: '#B8860B',            // Amber — disputed
  danger: '#A63D3D',             // Rust — false/misleading
}
```

Typography: **Inter** via `@fontsource/inter`. Clean sans-serif headings (`font-semibold`), no decorative serif fonts.

### 4.5 Animation Strategy

Centralized Framer Motion variants in `frontend/src/animations/`:

| Variant | Usage |
|---------|-------|
| `fadeIn` | Page transitions, card reveals |
| `slideUp` | Section entrances on scroll |
| `scaleIn` | Score ring, modals |
| `shimmer` | Skeleton loading (no spinners) |
| `staggerChildren` | Claim cards, feature lists |

Respect `prefers-reduced-motion`.

### 4.6 Key UX Features

- **Command palette** (Ctrl+K): New analysis, search history, navigate, export
- **Keyboard shortcuts**: Documented in palette footer
- **Onboarding**: First-visit animated walkthrough (localStorage flag)
- **Empty states**: Illustrated, actionable
- **Export**: PDF via backend endpoint; copy as formatted text client-side

---

## 5. Backend Architecture

### 5.1 API Endpoints

#### `GET /api/auth/google`

Starts Google OAuth flow (redirect).

#### `GET /api/auth/google/callback`

Handles OAuth callback, sets session cookie, redirects to `/app`.

#### `GET /api/auth/me` · `POST /api/auth/logout`

Session check and sign-out.

#### `POST /api/analyze`

Analyze pasted content and persist result.

**Request:**
```json
{
  "content": "string (required, max 50,000 chars)",
  "sourceType": "article | social | transcript | forward | blog | pdf | raw",
  "title": "string (optional)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "report": { /* CredibilityReport */ },
  "createdAt": "ISO8601"
}
```

**Flow:**
1. Validate input (Zod)
2. Truncate/sanitize content
3. Call analysis pipeline → Mesh API
4. Parse & validate JSON response
5. Persist to SQLite
6. Return report + ID

#### `GET /api/history`

Paginated list of past analyses.

**Query:** `?page=1&limit=20&search=keyword`

**Response:**
```json
{
  "items": [{ "id", "title", "trustScore", "sourceType", "createdAt", "preview" }],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

#### `GET /api/report/:id`

Full report by ID.

**Response:**
```json
{
  "id": "uuid",
  "content": "original input",
  "sourceType": "article",
  "report": { /* CredibilityReport */ },
  "createdAt": "ISO8601"
}
```

#### `GET /api/report/:id/export`

Returns PDF binary (`application/pdf`). Generated server-side via PDFKit.

#### `DELETE /api/report/:id`

Deletes an analysis owned by the authenticated user.

#### `POST /api/analyze/pdf`

Multipart upload (`pdf` field, max 10 MB). Extracts text with `pdf-parse`, then runs the analysis pipeline.

### 5.2 Service Layer

```
Route Handler
    → validation.middleware
    → AnalysisService.analyze(content)
        → MeshClient.complete(prompt, systemPrompt)
        → ResponseParser.parse(rawJson)
        → ReportRepository.save(record)
    → response
```

**Separation of concerns:**

| Service | Responsibility |
|---------|----------------|
| `MeshClient` | HTTP to Mesh API, retries, timeout, auth header |
| `AnalysisPipeline` | Orchestrates single structured prompt call |
| `PromptTemplates` | System + user prompt construction |
| `ResponseParser` | Zod validation, fallback repair |
| `ReportRepository` | Prisma CRUD |

### 5.3 Error Handling

Standardized error envelope:

```json
{
  "error": {
    "code": "MESH_TIMEOUT | VALIDATION_ERROR | NOT_FOUND | INTERNAL",
    "message": "Human-readable message"
  }
}
```

HTTP status mapping: 400 validation, 404 not found, 502 Mesh failure, 500 internal.

---

## 6. Mesh API Integration

### 6.1 Principle

**Every AI request goes through Mesh API.** No direct OpenAI, Anthropic, Gemini, or Groq calls anywhere in the codebase.

### 6.2 Client Design

```ts
// backend/services/mesh/client.ts
interface MeshConfig {
  apiKey: string;       // MESH_API_KEY
  baseUrl: string;      // MESH_API_URL
  model: string;        // MESH_MODEL
  timeout: number;      // 60_000 ms
  maxRetries: number;   // 2
}

interface MeshCompletionRequest {
  messages: { role: 'system' | 'user'; content: string }[];
  response_format?: { type: 'json_object' };
  temperature?: number;
}

interface MeshCompletionResponse {
  content: string;      // Raw JSON string from model
  usage?: { prompt_tokens: number; completion_tokens: number };
}
```

### 6.3 Single-Call Pipeline (MVP)

For hackathon speed, one structured prompt performs all 10 analysis steps in a single Mesh API call. The system prompt enforces strict JSON output.

**Rationale:** Fewer round-trips, lower latency, simpler error handling. Post-MVP can split into multi-step pipeline if needed.

### 6.4 System Prompt Structure

```
ROLE: You are Veritas AI, a credibility analysis engine.

RULES:
- Return ONLY valid JSON matching the schema below
- Never return markdown, prose, or code fences
- Base assessments on evidence and reasoning, not opinion
- Flag uncertainty explicitly via confidence scores
- Detect emotional manipulation patterns
- Identify logical fallacies by name
- Provide neutral rewrite and ELI15 summary

SCHEMA:
{ trustScore, claims[], bias, emotion, fallacies[], missingContext[],
  neutralRewrite, eli15, summary, verdict, suggestedReading[] }
```

User prompt wraps the content with source type context.

### 6.5 Response Validation

Zod schema in `backend/services/analysis/schema.ts` validates every field. On parse failure:

1. Attempt JSON repair (strip markdown fences, fix trailing commas)
2. Retry Mesh call once with "fix your JSON" instruction
3. Return 502 with partial error details if still invalid

---

## 7. Data Model

### 7.1 Prisma Schema

```prisma
model Analysis {
  id          String   @id @default(uuid())
  title       String?
  content     String
  sourceType  String   @default("raw")
  trustScore  Int
  report      String   // JSON string — full CredibilityReport
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([createdAt])
  @@index([trustScore])
}
```

SQLite chosen for zero-config Vercel deployment. For production scale, migrate to Turso or PlanetScale with identical schema.

### 7.2 CredibilityReport Type (shared)

```ts
interface CredibilityReport {
  trustScore: number;                    // 0–100
  claims: Claim[];
  bias: BiasAnalysis;
  emotion: EmotionAnalysis;
  fallacies: Fallacy[];
  missingContext: string[];
  neutralRewrite: string;
  eli15: string;
  summary: string;
  verdict: 'credible' | 'mixed' | 'misleading' | 'unsupported';
  suggestedReading: SuggestedSource[];
  reasoningTimeline: TimelineEvent[];
}

interface Claim {
  claim: string;
  status: 'verified' | 'disputed' | 'unverified' | 'false';
  confidence: number;                    // 0–100
  evidence: string[];
  explanation: string;
}

interface BiasAnalysis {
  overall: number;                       // 0–100 (higher = more biased)
  political: number;
  commercial: number;
  ideological: number;
  explanation: string;
}

interface EmotionAnalysis {
  fear: number;
  urgency: number;
  anger: number;
  sensationalism: number;
  loadedLanguage: number;
  dominant: string;
}

interface Fallacy {
  type: string;
  excerpt: string;
  explanation: string;
}

interface TimelineEvent {
  step: string;
  description: string;
  timestamp?: string;
}

interface SuggestedSource {
  title: string;
  url?: string;
  reason: string;
}
```

---

## 8. Analysis Pipeline (10 Steps)

All steps execute within a single Mesh API call for MVP:

| Step | Output Field | UI Component |
|------|-------------|--------------|
| 1. Claim Extraction | `claims[]` | ClaimBreakdown cards |
| 2. Evidence Summary | `claims[].evidence` | Evidence list per claim |
| 3. Credibility Score | `trustScore` | Animated ring chart |
| 4. Emotion Detection | `emotion` | Radar chart |
| 5. Bias Detection | `bias` | Horizontal bias meter |
| 6. Logical Fallacies | `fallacies[]` | Badge grid |
| 7. Missing Context | `missingContext[]` | Warning callout |
| 8. Neutral Rewrite | `neutralRewrite` | Side-by-side diff card |
| 9. Explain Like I'm 15 | `eli15` | Expandable section |
| 10. Overall Verdict | `verdict`, `summary` | Final verdict card |

---

## 9. Vercel Deployment Architecture

### 9.1 `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/backend/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### 9.2 Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `MESH_API_KEY` | Server | Mesh API authentication |
| `MESH_API_URL` | Server | Mesh API base URL |
| `MESH_MODEL` | Server | Model identifier |
| `DATABASE_URL` | Server | `file:./dev.db` locally; Vercel uses `/tmp/veritas.db` |
| `VITE_API_BASE_URL` | Client | `/api` (relative) |

### 9.3 SQLite on Vercel

Vercel serverless is ephemeral. Strategy for MVP:

- Use `DATABASE_URL=file:/tmp/veritas.db`
- Accept that data resets on cold starts (acceptable for hackathon demo)
- Document migration path to Turso (serverless SQLite) for persistence

### 9.4 Build Pipeline

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && vite",
    "dev:backend": "cd backend && tsx watch api/index.ts",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && vite build",
    "build:backend": "cd backend && prisma generate && tsc",
    "postinstall": "cd backend && prisma generate"
  }
}
```

---

## 10. Security Considerations

| Concern | Mitigation |
|---------|------------|
| API key exposure | Mesh key server-side only; never in frontend bundle |
| Authentication | Google OAuth + JWT httpOnly cookies; `requireAuth` on analyze/history/report |
| OAuth CSRF | State cookie validated on callback |
| Input injection | Zod validation, max length, content sanitization |
| Rate limiting | Per-route in-memory limiter (auth, analyze, general API); use Redis/KV for distributed limits in production |
| CORS | Restrict to `FRONTEND_URL` in production |
| Report access | Users can only read/delete their own analyses (`userId` enforced) |
| Content safety | Mesh API handles model safety; log flagged content |

---

## 11. Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Analysis latency | < 30s (Mesh-dependent) |
| Lighthouse Performance | > 90 |
| Bundle size (gzip) | < 300KB initial |

Strategies: route-based code splitting, lazy-loaded Recharts, skeleton loaders, React Query caching for history.

---

## 12. Accessibility

- Semantic HTML (`main`, `nav`, `article`, `section`)
- ARIA labels on interactive charts and score rings
- Keyboard navigation for sidebar, command palette, accordions
- Focus-visible rings using accent color
- `prefers-reduced-motion` disables animations
- Color contrast ≥ 4.5:1 for all text

---

## 13. Implementation Roadmap

| Step | Deliverable | Status |
|------|-------------|--------|
| **1** | Architecture (this document) | ✅ Complete |
| **2** | Initialize frontend (Vite, Tailwind, shadcn, routing) | ✅ Complete |
| **3** | Initialize backend (Express, Prisma, SQLite) | ✅ Complete |
| **4** | Mesh API integration (client, prompts, parser) | ✅ Complete |
| **5** | Dashboard (sidebar, input, history, empty states) | ✅ Complete |
| **6** | Analysis pipeline + report page (charts, cards) | ✅ Complete |
| **7** | Polish UI (landing, animations, command palette, onboarding) | ✅ Complete |
| **8** | Optimize (bundle, caching, error boundaries) | ✅ Complete |
| **9** | Vercel deployment (vercel.json, env, build) | ✅ Complete |

---

## 14. Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | Yes | Shared types, single Vercel deploy |
| Single AI call | Yes (MVP) | Faster to build, lower latency |
| SQLite | Yes | Zero config, Prisma support, hackathon speed |
| Google OAuth | Yes | Private analyses per user; JWT session cookies |
| TanStack Query | Yes | Best-in-class server state for React |
| shadcn/ui | Yes | Accessible primitives, full design control |
| Ink & Parchment theme | Yes | Parchment `#F4F0E6` + ink `#1A1A1F` + oxblood `#8B2942` forensic palette |

---

## 15. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mesh API returns malformed JSON | High | Zod validation + retry + repair |
| SQLite data loss on Vercel | Medium | Accept for demo; document Turso path |
| Analysis timeout | Medium | 60s timeout, progress UI, retry button |
| Large input content | Low | 50K char limit with user feedback |
| Recharts bundle size | Low | Lazy import on report page only |

---

*Architecture v1.0 — All 9 steps complete. Veritas AI is ready to deploy on Vercel.*
