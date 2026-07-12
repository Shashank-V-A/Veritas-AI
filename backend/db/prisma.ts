import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma client for SQLite (local + Vercel /tmp).
 *
 * Important: do not statically import `@prisma/adapter-libsql` here.
 * That package is ESM-only and causes `ERR_REQUIRE_ESM` in the Vercel
 * serverless bundle even when DATABASE_URL is a local SQLite file.
 *
 * For Turso in production, use a dedicated libsql bootstrap or upgrade
 * the adapter wiring — Hobby deploys should use `file:/tmp/veritas.db`.
 */
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db'

  if (url.startsWith('libsql://') || url.startsWith('https://')) {
    throw new Error(
      'Turso/libSQL is configured, but the ESM adapter is disabled in this build. ' +
        'Set DATABASE_URL to file:/tmp/veritas.db on Vercel, or restore a Vercel-safe Turso adapter.',
    )
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
