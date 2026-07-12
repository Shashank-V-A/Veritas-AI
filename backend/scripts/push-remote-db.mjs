/**
 * Ensure Turso schema exists at build time (Prisma CLI only accepts file: for sqlite).
 * Runtime also calls ensureDatabase() on first request.
 */
import { fileURLToPath } from 'node:url'
import path from 'node:path'

function isLibsqlUrl(url) {
  return (
    url.startsWith('libsql://') ||
    (url.startsWith('https://') && url.includes('.turso.io'))
  )
}

let url = process.env.DATABASE_URL?.trim() ?? ''
const tursoUrl = process.env.TURSO_DATABASE_URL?.trim() ?? ''
if (!isLibsqlUrl(url) && tursoUrl && isLibsqlUrl(tursoUrl)) {
  process.env.DATABASE_URL = tursoUrl
  url = tursoUrl
}

const isTurso = isLibsqlUrl(url)

if (!isTurso) {
  console.log('[db] Skipping remote push — DATABASE_URL is not Turso/libsql')
  process.exit(0)
}

if (!process.env.TURSO_AUTH_TOKEN?.trim()) {
  console.error('[db] TURSO_AUTH_TOKEN is required for Turso schema setup')
  process.exit(1)
}

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const initModule = path.join(backendDir, 'dist', 'db', 'init.js')

console.log('[db] Applying schema to Turso via ensureDatabase…')

const { ensureDatabase } = await import(initModule)
await ensureDatabase()

console.log('[db] Turso schema ready')
