/**
 * Push Prisma schema to Turso when DATABASE_URL is libsql://…
 * Skips silently for local file: SQLite (dev) and ephemeral /tmp URLs.
 */
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const url = process.env.DATABASE_URL ?? ''
const isTurso =
  url.startsWith('libsql://') ||
  (url.startsWith('https://') && url.includes('.turso.io'))

if (!isTurso) {
  console.log('[db] Skipping remote push — DATABASE_URL is not Turso/libsql')
  process.exit(0)
}

if (!process.env.TURSO_AUTH_TOKEN?.trim()) {
  console.error('[db] TURSO_AUTH_TOKEN is required for Turso db push')
  process.exit(1)
}

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
console.log('[db] Pushing schema to Turso…')

execSync('npx prisma db push --skip-generate', {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env,
})

console.log('[db] Turso schema ready')
