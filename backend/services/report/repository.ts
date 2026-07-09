import type {
  AnalysisRecord,
  CredibilityReport,
  HistoryItem,
  SourceType,
} from '@veritas/shared'
import { prisma } from '../../db/prisma.js'
import { AppError } from '../../utils/errors.js'

interface SaveAnalysisInput {
  content: string
  sourceType: SourceType
  title?: string
  report: CredibilityReport
  userId?: string
}

function toAnalysisRecord(row: {
  id: string
  title: string | null
  content: string
  sourceType: string
  trustScore: number
  report: string
  createdAt: Date
}): AnalysisRecord {
  return {
    id: row.id,
    title: row.title ?? undefined,
    content: row.content,
    sourceType: row.sourceType as SourceType,
    trustScore: row.trustScore,
    report: JSON.parse(row.report) as CredibilityReport,
    createdAt: row.createdAt.toISOString(),
  }
}

function toPreview(content: string, maxLength = 140): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}…`
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
        userId: input.userId,
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

    return toAnalysisRecord(row)
  },

  async deleteById(id: string, userId: string): Promise<void> {
    const row = await prisma.analysis.findUnique({ where: { id } })

    if (!row || row.userId !== userId) {
      throw new AppError('Report not found', 'NOT_FOUND')
    }

    await prisma.analysis.delete({ where: { id } })
  },

  async findHistory(params: {
    page: number
    limit: number
    search?: string
    userId?: string
  }): Promise<{ items: HistoryItem[]; total: number }> {
    const { page, limit, search, userId } = params
    const skip = (page - 1) * limit

    const filters = []

    if (userId) {
      filters.push({ userId })
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
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
    }))

    return { items, total }
  },
}
