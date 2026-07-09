# Veritas AI

> **Don't consume information. Verify it.**

An AI-powered credibility analysis platform that evaluates news, social posts, transcripts, PDFs, and more — producing professional trust reports instead of chat responses.

## Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Architecture | ✅ Complete |
| 2 | Initialize frontend | ✅ Complete |
| 3 | Initialize backend | ✅ Complete |
| 4 | Mesh API integration | ✅ Complete |
| 5 | Dashboard | ✅ Complete |
| 6 | Analysis pipeline | ✅ Complete |
| 7 | Polish UI | ✅ Complete |
| 8 | Optimize | ✅ Complete |
| 9 | Vercel deployment | ✅ Complete |
| 10 | Google OAuth + auth | ✅ Complete |

## Tech Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, Recharts, Inter
- **Backend:** Node.js, Express (Vercel serverless)
- **Database:** SQLite + Prisma
- **AI:** Mesh API (exclusive provider)
- **Auth:** Google OAuth + JWT session cookies

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `backend/.env` and fill in:

- `MESH_API_KEY` — Mesh API credentials
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `GOOGLE_CALLBACK_URL` — `http://localhost:5173/api/auth/google/callback`
- `JWT_SECRET` — random string for session signing
- `FRONTEND_URL` — `http://localhost:5173`

### 3. Initialize the database

```bash
npm run db:push
```

### 4. Google OAuth (required for sign-in)

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- **Authorized JavaScript origins:** `http://localhost:5173`
- **Authorized redirect URIs:** `http://localhost:5173/api/auth/google/callback`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full OAuth setup.

### 5. Run dev servers

```bash
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001 (proxied via `/api` in dev)

## Features

- Paste text or upload PDF for credibility analysis
- Structured reports: claims, bias, fallacies, trust score
- PDF export of reports
- Private analysis history per user
- Delete analyses from report view

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel deployment guide

## Deploy

```bash
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for required environment variables.
