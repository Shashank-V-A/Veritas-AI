# Deploying Veritas AI on Vercel

## Prerequisites

- [Vercel account](https://vercel.com)
- [Mesh API key](https://meshapi.ai) with credits
- Git repository connected to Vercel (or Vercel CLI)

## Quick deploy

### Option A: Vercel Dashboard

1. Import your Git repository at [vercel.com/new](https://vercel.com/new)
2. Vercel auto-detects settings from `vercel.json`
3. Add environment variables (see below)
4. Deploy

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add MESH_API_KEY
vercel env add MESH_API_URL
vercel env add MESH_MODEL
vercel env add DATABASE_URL
vercel env add VITE_API_BASE_URL
vercel --prod
```

## Required environment variables

Set these in **Vercel Project → Settings → Environment Variables**:

| Variable | Value | Scope |
|----------|-------|-------|
| `MESH_API_KEY` | `rsk_...` | Production, Preview |
| `MESH_API_URL` | `https://api.meshapi.ai` | Production, Preview |
| `MESH_MODEL` | `google/gemini-2.5-flash` | Production, Preview |
| `DATABASE_URL` | `file:/tmp/veritas.db` | Production, Preview |
| `VITE_API_BASE_URL` | `/api` | Production, Preview |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Production, Preview |
| `GOOGLE_CALLBACK_URL` | `https://your-domain.vercel.app/api/auth/google/callback` | Production, Preview |
| `JWT_SECRET` | long random string | Production, Preview |
| `FRONTEND_URL` | `https://your-domain.vercel.app` | Production, Preview |

> **Never** add `MESH_API_KEY`, `GOOGLE_CLIENT_SECRET`, or `JWT_SECRET` to frontend-exposed variables.

## Google OAuth setup

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth 2.0 Client ID (Web application).
2. Add **Authorized redirect URIs**:
   - Local: `http://localhost:5173/api/auth/google/callback`
   - Production: `https://your-domain.vercel.app/api/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `JWT_SECRET`, and `FRONTEND_URL` in Vercel env vars.

## Architecture on Vercel

```
Browser
   │
   ├─ /              → frontend/dist (static SPA)
   ├─ /app/*         → frontend/dist (SPA rewrite)
   └─ /api/*         → api/index.ts (Express serverless, 60s max)
                          │
                          ├─ Mesh API
                          └─ SQLite (/tmp/veritas.db)
```

## SQLite on Vercel

Vercel serverless functions use ephemeral `/tmp` storage:

- Data persists **within a warm instance** but may reset on cold starts
- Schema is auto-created on first request via `ensureDatabase()`
- For production persistence, migrate to [Turso](https://turso.tech) with the same Prisma schema

## Build pipeline

`vercel.json` runs:

```
npm install          → postinstall: prisma generate
npm run build        → shared + backend + frontend
```

Output: `frontend/dist` (static) + `api/index.ts` (serverless)

## Custom domain

1. Vercel Project → Settings → Domains → Add domain
2. Set `FRONTEND_URL=https://yourdomain.com` for CORS
3. Redeploy

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `502 MESH_ERROR` billing | Top up Mesh API account |
| API 404 on `/api/*` | Verify `vercel.json` rewrites are committed |
| Empty history after redeploy | Expected with `/tmp` SQLite — use Turso for persistence |
| Analysis timeout | Mesh calls can take up to 60s; `maxDuration` is configured |

## Local production test

```bash
npm run build
cd frontend && npx vite preview
# In another terminal:
cd backend && npm start
```
