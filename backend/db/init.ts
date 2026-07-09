import { prisma } from './prisma.js'
import { logger } from '../utils/logger.js'

let initialized = false

function isEphemeralDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? ''
  return (
    process.env.VERCEL === '1' ||
    url.includes('/tmp') ||
    url.includes('file:/tmp')
  )
}

async function createTablesIfNeeded(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Analysis" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT,
      "content" TEXT NOT NULL,
      "sourceType" TEXT NOT NULL DEFAULT 'raw',
      "trustScore" INTEGER NOT NULL,
      "report" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_createdAt_idx" ON "Analysis"("createdAt")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_trustScore_idx" ON "Analysis"("trustScore")`,
  )
}

export async function ensureDatabase(): Promise<void> {
  if (initialized) return

  if (isEphemeralDatabase()) {
    logger.info('Initializing ephemeral SQLite database', {
      databaseUrl: process.env.DATABASE_URL,
    })
    await createTablesIfNeeded()
    logger.info('Database schema ready')
  }

  initialized = true
}
