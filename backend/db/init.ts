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
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "googleId" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT,
      "avatar" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Analysis" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT,
      "content" TEXT NOT NULL,
      "sourceType" TEXT NOT NULL DEFAULT 'raw',
      "trustScore" INTEGER NOT NULL,
      "report" TEXT NOT NULL,
      "userId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_createdAt_idx" ON "Analysis"("createdAt")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_trustScore_idx" ON "Analysis"("trustScore")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_userId_idx" ON "Analysis"("userId")`,
  )

  // Migrate existing Analysis tables that predate userId
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("Analysis")`,
  )
  const hasUserId = columns.some((column) => column.name === 'userId')
  if (!hasUserId) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Analysis" ADD COLUMN "userId" TEXT`)
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Analysis_userId_idx" ON "Analysis"("userId")`,
    )
  }
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
