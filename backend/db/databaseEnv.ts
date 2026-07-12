/**
 * Resolve DATABASE_URL for Prisma — supports Vercel Turso integration vars.
 *
 * Vercel's `npx vercel integration add turso` sets TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 * Older deployments may still have DATABASE_URL=file:/tmp/veritas.db — prefer Turso when present.
 */

export function isLibsqlUrl(url: string): boolean {
  return (
    url.startsWith('libsql://') ||
    (url.startsWith('https://') && url.includes('.turso.io'))
  )
}

export function isEphemeralDatabaseUrl(url: string): boolean {
  if (!url) return process.env.VERCEL === '1'
  return url.includes('/tmp') || url.includes('file:/tmp')
}

/**
 * Returns the effective database URL and syncs process.env.DATABASE_URL when Turso wins.
 */
export function resolveDatabaseEnv(): string {
  const direct = process.env.DATABASE_URL?.trim() ?? ''
  const turso = process.env.TURSO_DATABASE_URL?.trim() ?? ''

  if (direct && isLibsqlUrl(direct)) {
    return direct
  }

  if (turso && isLibsqlUrl(turso)) {
    process.env.DATABASE_URL = turso
    return turso
  }

  if (direct) return direct
  return 'file:./dev.db'
}

export function getDatabaseUrl(): string {
  return resolveDatabaseEnv()
}

export function isPersistentDatabase(): boolean {
  return isLibsqlUrl(getDatabaseUrl())
}
