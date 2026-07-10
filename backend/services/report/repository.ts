import { randomBytes } from 'node:crypto'
import type {
  AnalysisCategory,
  AnalysisRecord,
  CredibilityReport,
  HistoryItem,
  PublicReportResponse,
  SourceType,
  Verdict,
} from '@veritas/shared'
import { prisma } from '../../db/prisma.js'
import { AppError } from '../../utils/errors.js'
import { runAnalysis } from '../analysis/pipeline.js'

interface SaveAnalysisInput {
  content: string
  sourceType: SourceType
  title?: string
  report: CredibilityReport
  userId?: string
  category?: AnalysisCategory
  parentId?: string
  compareContent?: string
  meshModel?: string
  meshLatencyMs?: number
  isGuest?: boolean
  shareToken?: string
  sourceUrl?: string
  forwardRisk?: number
  teamId?: string
}

type AnalysisRow = {
  id: string
  title: string | null
  content: string
  sourceType: string
  trustScore: number
  report: string
  createdAt: Date
  shareToken?: string | null
  category?: string | null
  parentId?: string | null
  compareContent?: string | null
  meshModel?: string | null
  meshLatencyMs?: number | null
  verdict?: string | null
  sourceUrl?: string | null
  forwardRisk?: number | null
}

function toAnalysisRecord(row: AnalysisRow): AnalysisRecord {
  return {
    id: row.id,
    title: row.title ?? undefined,
    content: row.content,
    sourceType: row.sourceType as SourceType,
    trustScore: row.trustScore,
    report: JSON.parse(row.report) as CredibilityReport,
    createdAt: row.createdAt.toISOString(),
    shareToken: row.shareToken ?? undefined,
    category: (row.category as AnalysisCategory | null) ?? undefined,
    parentId: row.parentId ?? undefined,
    compareContent: row.compareContent ?? undefined,
    meshModel: row.meshModel ?? undefined,
    meshLatencyMs: row.meshLatencyMs ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    forwardRisk: row.forwardRisk ?? undefined,
  }
}

function toPreview(content: string, maxLength = 140): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}…`
}

function createShareToken(): string {
  return randomBytes(24).toString('base64url')
}

export const reportRepository = {
  async save(input: SaveAnalysisInput): Promise<AnalysisRecord> {
    const row = await prisma.analysis.create({
      data: {
        title: input.title,
        content: input.content,
        sourceType: input.sourceType,
        trustScore: input.report.trustScore,
        report: JSON.stringify(input.report),
        verdict: input.report.verdict,
        userId: input.userId,
        category: input.category,
        parentId: input.parentId,
        compareContent: input.compareContent,
        meshModel: input.meshModel,
        meshLatencyMs: input.meshLatencyMs,
        isGuest: input.isGuest ?? false,
        shareToken:
          input.shareToken ?? (input.isGuest ? createShareToken() : undefined),
        sourceUrl: input.sourceUrl,
        forwardRisk: input.forwardRisk,
        teamId: input.teamId,
      },
    })

    return toAnalysisRecord(row)
  },

  async findById(id: string, userId?: string): Promise<AnalysisRecord> {
    const row = await prisma.analysis.findUnique({ where: { id } })

    if (!row) {
      throw new AppError('Report not found', 'NOT_FOUND')
    }

    if (userId) {
      if (!row.userId || row.userId !== userId) {
        throw new AppError('Report not found', 'NOT_FOUND')
      }
    }

    const record = toAnalysisRecord(row)

    if (row.parentId) {
      const parent = await prisma.analysis.findUnique({
        where: { id: row.parentId },
        select: { trustScore: true, verdict: true },
      })

      if (parent) {
        record.previousTrustScore = parent.trustScore
        record.previousVerdict = parent.verdict as Verdict | undefined
      }
    }

    return record
  },

  async findByShareToken(token: string): Promise<AnalysisRecord | null> {
    const row = await prisma.analysis.findUnique({
      where: { shareToken: token },
    })

    return row ? toAnalysisRecord(row) : null
  },

  async findPublicByToken(token: string): Promise<PublicReportResponse> {
    const row = await prisma.analysis.findUnique({
      where: { shareToken: token },
    })

    if (!row) {
      throw new AppError('Report not found', 'NOT_FOUND')
    }

    const report = JSON.parse(row.report) as CredibilityReport

    return {
      id: row.id,
      title: row.title ?? undefined,
      sourceType: row.sourceType as SourceType,
      trustScore: row.trustScore,
      verdict: (row.verdict ?? report.verdict) as Verdict,
      category: (row.category as AnalysisCategory | null) ?? undefined,
      report,
      createdAt: row.createdAt.toISOString(),
    }
  },

  async enableShare(
    id: string,
    userId: string,
    baseUrl: string,
  ): Promise<{ shareToken: string; shareUrl: string }> {
    const row = await prisma.analysis.findUnique({ where: { id } })

    if (!row || row.userId !== userId) {
      throw new AppError('Report not found', 'NOT_FOUND')
    }

    const shareToken = row.shareToken ?? createShareToken()

    if (!row.shareToken) {
      await prisma.analysis.update({
        where: { id },
        data: { shareToken },
      })
    }

    const normalizedBase = baseUrl.replace(/\/$/, '')
    return {
      shareToken,
      shareUrl: `${normalizedBase}/share/${shareToken}`,
    }
  },

  async reanalyze(id: string, userId: string): Promise<AnalysisRecord> {
    const original = await prisma.analysis.findUnique({ where: { id } })

    if (!original || original.userId !== userId) {
      throw new AppError('Report not found', 'NOT_FOUND')
    }

    const pipeline = await runAnalysis({
      content: original.content,
      sourceType: original.sourceType as SourceType,
      title: original.title ?? undefined,
      compareContent: original.compareContent ?? undefined,
    })

    return this.save({
      content: original.content,
      sourceType: original.sourceType as SourceType,
      title: original.title ?? undefined,
      category: (original.category as AnalysisCategory | null) ?? undefined,
      compareContent: original.compareContent ?? undefined,
      report: pipeline.report,
      meshModel: pipeline.meshModel,
      meshLatencyMs: pipeline.meshLatencyMs,
      parentId: original.id,
      userId,
    })
  },

  async deleteById(id: string, userId: string): Promise<void> {
    const row = await prisma.analysis.findUnique({ where: { id } })

    if (!row) {
      throw new AppError('Report not found', 'NOT_FOUND')
    }

    // Allow owner, or orphaned rows (userId null) so signed-in users can clean them up
    if (row.userId && row.userId !== userId) {
      throw new AppError('Report not found', 'NOT_FOUND')
    }

    await prisma.$transaction(async (tx) => {
      await tx.caseAnnotation.deleteMany({ where: { analysisId: id } })
      await tx.scheduledRecheck.deleteMany({ where: { analysisId: id } })
      await tx.analysis.delete({ where: { id } })
    })
  },

  async findHistory(params: {
    page: number
    limit: number
    search?: string
    category?: AnalysisCategory
    verdict?: Verdict
    userId?: string
  }): Promise<{ items: HistoryItem[]; total: number }> {
    const { page, limit, search, category, verdict, userId } = params
    const skip = (page - 1) * limit

    const filters: Record<string, unknown>[] = []

    if (userId) {
      filters.push({ userId })
    }

    if (category) {
      filters.push({ category })
    }

    if (verdict) {
      filters.push({ verdict })
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
          { report: { contains: search } },
        ],
      })
    }

    const where = filters.length > 0 ? { AND: filters } : undefined

    const [rows, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          sourceType: true,
          trustScore: true,
          createdAt: true,
          verdict: true,
          category: true,
        },
      }),
      prisma.analysis.count({ where }),
    ])

    const items: HistoryItem[] = rows.map((row) => ({
      id: row.id,
      title: row.title ?? undefined,
      trustScore: row.trustScore,
      sourceType: row.sourceType as SourceType,
      createdAt: row.createdAt.toISOString(),
      preview: toPreview(row.content),
      verdict: (row.verdict as Verdict | null) ?? undefined,
      category: (row.category as AnalysisCategory | null) ?? undefined,
    }))

    return { items, total }
  },
}
