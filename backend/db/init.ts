import { prisma, isPersistentDatabase } from './prisma.js'
import { logger } from '../utils/logger.js'

let initialized = false

function isEphemeralDatabase(): boolean {
  if (isPersistentDatabase()) return false
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
      "sourceUrl" TEXT,
      "trustScore" INTEGER NOT NULL,
      "report" TEXT NOT NULL,
      "userId" TEXT,
      "shareToken" TEXT,
      "category" TEXT,
      "parentId" TEXT,
      "meshModel" TEXT,
      "meshLatencyMs" INTEGER,
      "forwardRisk" INTEGER,
      "verdict" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Analysis_shareToken_key" ON "Analysis"("shareToken")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_createdAt_idx" ON "Analysis"("createdAt")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_trustScore_idx" ON "Analysis"("trustScore")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_userId_idx" ON "Analysis"("userId")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_category_idx" ON "Analysis"("category")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_verdict_idx" ON "Analysis"("verdict")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Analysis_sourceUrl_idx" ON "Analysis"("sourceUrl")`,
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DomainReputation" (
      "domain" TEXT NOT NULL PRIMARY KEY,
      "caseCount" INTEGER NOT NULL DEFAULT 0,
      "lowTrustCount" INTEGER NOT NULL DEFAULT 0,
      "avgTrustScore" REAL NOT NULL DEFAULT 0,
      "updatedAt" DATETIME NOT NULL
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CaseAnnotation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "analysisId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "claimIndex" INTEGER,
      "note" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CaseAnnotation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "CaseAnnotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CaseAnnotation_analysisId_idx" ON "CaseAnnotation"("analysisId")`,
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ClaimWatch" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "claimText" TEXT NOT NULL,
      "claimNorm" TEXT NOT NULL,
      "sourceAnalysisId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSeenAt" DATETIME,
      "hitCount" INTEGER NOT NULL DEFAULT 0,
      "lastHitAnalysisId" TEXT,
      "emailAlerts" BOOLEAN NOT NULL DEFAULT 1,
      "browserAlerts" BOOLEAN NOT NULL DEFAULT 1,
      "lastWebScanAt" DATETIME,
      "webHitCount" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "ClaimWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ClaimWatch_sourceAnalysisId_fkey" FOREIGN KEY ("sourceAnalysisId") REFERENCES "Analysis" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "ClaimWatch_userId_claimNorm_key" ON "ClaimWatch"("userId", "claimNorm")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ClaimWatch_userId_claimNorm_idx" ON "ClaimWatch"("userId", "claimNorm")`,
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ClaimWatchHit" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "watchId" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "title" TEXT,
      "url" TEXT,
      "snippet" TEXT,
      "analysisId" TEXT,
      "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ClaimWatchHit_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "ClaimWatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ClaimWatchHit_watchId_discoveredAt_idx" ON "ClaimWatchHit"("watchId", "discoveredAt")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ClaimWatchHit_watchId_source_idx" ON "ClaimWatchHit"("watchId", "source")`,
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT,
      "href" TEXT,
      "meta" TEXT,
      "readAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt")`,
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CaseExhibit" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "analysisId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT,
      "url" TEXT,
      "note" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CaseExhibit_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "CaseExhibit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CaseExhibit_analysisId_idx" ON "CaseExhibit"("analysisId")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "CaseExhibit_userId_idx" ON "CaseExhibit"("userId")`,
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VerdictFeedback" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "analysisId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "originalVerdict" TEXT NOT NULL,
      "suggestedVerdict" TEXT,
      "reason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VerdictFeedback_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "VerdictFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "VerdictFeedback_analysisId_userId_key" ON "VerdictFeedback"("analysisId", "userId")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VerdictFeedback_analysisId_idx" ON "VerdictFeedback"("analysisId")`,
  )

  // Soft-migrate older Analysis tables
  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("Analysis")`,
  )
  const names = new Set(columns.map((c) => c.name))
  const addColumn = async (name: string, ddl: string) => {
    if (!names.has(name)) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Analysis" ADD COLUMN ${ddl}`)
    }
  }
  await addColumn('userId', '"userId" TEXT')
  await addColumn('sourceUrl', '"sourceUrl" TEXT')
  await addColumn('shareToken', '"shareToken" TEXT')
  await addColumn('category', '"category" TEXT')
  await addColumn('parentId', '"parentId" TEXT')
  await addColumn('meshModel', '"meshModel" TEXT')
  await addColumn('meshLatencyMs', '"meshLatencyMs" INTEGER')
  await addColumn('forwardRisk', '"forwardRisk" INTEGER')
  await addColumn('verdict', '"verdict" TEXT')
}

export async function ensureDatabase(): Promise<void> {
  if (initialized) return

  if (isPersistentDatabase()) {
    logger.info('Using persistent Turso database', {
      databaseUrl: process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@'),
    })
    // Schema is applied via `prisma db push` during vercel-build.
    initialized = true
    return
  }

  if (isEphemeralDatabase()) {
    logger.warn(
      'Using ephemeral SQLite — case files will NOT persist across Vercel cold starts. ' +
        'Set DATABASE_URL=libsql://… and TURSO_AUTH_TOKEN for production persistence.',
      { databaseUrl: process.env.DATABASE_URL },
    )
    await createTablesIfNeeded()
    logger.info('Database schema ready')
  }

  initialized = true
}
