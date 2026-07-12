import { PrismaClient } from '@prisma/client'
import { getDatabaseUrl, isLibsqlUrl } from './databaseEnv.js'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Bootstrap before Prisma reads env (Vercel Turso integration uses TURSO_DATABASE_URL).
getDatabaseUrl()

/**
 * Prisma client for SQLite (local file) and Turso/libSQL (production).
 *
 * Uses dynamic import for the libsql adapter so Vercel's mixed CJS/ESM
 * bundle does not hit ERR_REQUIRE_ESM on a static import.
 */
async function createPrismaClient(): Promise<PrismaClient> {
  const url = getDatabaseUrl()

  if (isLibsqlUrl(url)) {
    const token = process.env.TURSO_AUTH_TOKEN?.trim()
    if (!token) {
      throw new Error(
        'TURSO_AUTH_TOKEN is required when DATABASE_URL points to Turso (libsql://…).',
      )
    }

    const { PrismaLibSQL } = await import('@prisma/adapter-libsql')

    const adapter = new PrismaLibSQL({
      url,
      authToken: token,
    })

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  const client = await createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

/** Singleton Prisma client (awaits Turso adapter bootstrap when needed). */
export const prisma = await getPrisma()

export { isPersistentDatabase } from './databaseEnv.js'
