import { Router } from 'express'
import multer from 'multer'
import type { AnalysisCategory, SourceType } from '@veritas/shared'
import { runAnalysis } from '../../services/analysis/pipeline.js'
import { recordDomainAnalysis } from '../../services/domain/reputation.js'
import { syncAnalysisToGraph } from '../../services/graph/neo4j.js'
import {
  assessForwardRisk,
  shouldAutoDetectForward,
} from '../../services/forward/assessForward.js'
import { extractYouTubeContent, extractYouTubeVideoId } from '../../services/media/youtube.js'
import { extractTextFromImage } from '../../services/media/ocr.js'
import { extractTextFromPdf } from '../../services/pdf/extract.js'
import { extractFromUrl } from '../../services/url/extract.js'
import { reportRepository } from '../../services/report/repository.js'
import {
  analyzeRequestSchema,
  sanitizeContent,
  urlAnalyzeRequestSchema,
} from '../../utils/validation.js'
import { AppError } from '../../utils/errors.js'
import { getSampleCase } from '../../services/analysis/sampleCases.js'

export const analyzeRouter = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
      return
    }
    cb(new AppError('Only PDF files are allowed', 'VALIDATION_ERROR', 400))
  },
})

const batchUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
      return
    }
    cb(new AppError('Only PDF files are allowed', 'VALIDATION_ERROR', 400))
  },
})

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
      return
    }
    cb(new AppError('Only image files are allowed', 'VALIDATION_ERROR', 400))
  },
})

function buildAnalyzeResponse(
  record: Awaited<ReturnType<typeof reportRepository.save>>,
  meta: { meshModel: string; meshLatencyMs: number },
) {
  return {
    id: record.id,
    report: record.report,
    createdAt: record.createdAt,
    meta: {
      meshModel: meta.meshModel,
      meshLatencyMs: meta.meshLatencyMs,
    },
    forwardRisk: record.forwardRisk,
  }
}

function resolveSourceType(
  content: string,
  requested: SourceType,
): { sourceType: SourceType; forwardRisk?: number } {
  if (requested === 'forward') {
    const assessment = assessForwardRisk(content)
    return { sourceType: 'forward', forwardRisk: assessment.score }
  }
  if ((requested === 'raw' || requested === 'article') && shouldAutoDetectForward(content)) {
    const assessment = assessForwardRisk(content)
    return { sourceType: 'forward', forwardRisk: assessment.score }
  }
  return { sourceType: requested }
}

async function persistAnalysis(
  input: Parameters<typeof reportRepository.save>[0],
  meta: { meshModel: string; meshLatencyMs: number },
  sourceUrl?: string,
) {
  const record = await reportRepository.save({ ...input, sourceUrl })
  if (sourceUrl) {
    await recordDomainAnalysis(sourceUrl, record.trustScore)
  }
  await syncAnalysisToGraph(record.id, record.report)
  try {
    const { checkWatchlistHits } = await import(
      '../../services/watchlist/checkHits.js'
    )
    await checkWatchlistHits(input.userId, record.id, record.report)
  } catch {
    /* watchlist matching is best-effort */
  }
  return buildAnalyzeResponse(record, meta)
}

analyzeRouter.post('/', async (req, res, next) => {
  try {
    const parsed = analyzeRequestSchema.parse(req.body)
    const content = sanitizeContent(parsed.content)
    const { sourceType, forwardRisk } = resolveSourceType(content, parsed.sourceType)

    const pipeline = await runAnalysis({
      content,
      sourceType,
      title: parsed.title,
    })

    const response = await persistAnalysis(
      {
        content,
        sourceType,
        title: parsed.title,
        category: parsed.category,
        report: pipeline.report,
        meshModel: pipeline.meshModel,
        meshLatencyMs: pipeline.meshLatencyMs,
        forwardRisk,
        userId: req.user?.sub,
      },
      pipeline,
    )

    res.status(201).json(response)
  } catch (error) {
    next(error)
  }
})

/** Reference dossiers — instant pre-built reports (no Mesh call). */
analyzeRouter.post('/sample', async (req, res, next) => {
  try {
    const sampleId = typeof req.body?.sample === 'string' ? req.body.sample.trim() : ''
    const sample = getSampleCase(sampleId)
    if (!sample) {
      throw new AppError(
        'Unknown sample case. Use health, political, or news.',
        'VALIDATION_ERROR',
        400,
      )
    }

    const { forwardRisk } = resolveSourceType(sample.content, sample.sourceType)

    const response = await persistAnalysis(
      {
        content: sample.content,
        sourceType: sample.sourceType,
        title: sample.title,
        category: sample.category,
        report: sample.report,
        meshModel: 'veritas-reference-dossier',
        meshLatencyMs: 0,
        forwardRisk,
        userId: req.user?.sub,
      },
      { meshModel: 'veritas-reference-dossier', meshLatencyMs: 0 },
    )

    res.status(201).json(response)
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/url', async (req, res, next) => {
  try {
    const parsed = urlAnalyzeRequestSchema.parse(req.body)
    const extracted = await extractFromUrl(parsed.url)

    const pipeline = await runAnalysis({
      content: extracted.content,
      sourceType: 'article',
      title: parsed.title ?? extracted.title ?? extracted.domain,
    })

    const response = await persistAnalysis(
      {
        content: extracted.content,
        sourceType: 'article',
        title: parsed.title ?? extracted.title ?? extracted.domain,
        category: parsed.category,
        report: pipeline.report,
        meshModel: pipeline.meshModel,
        meshLatencyMs: pipeline.meshLatencyMs,
        userId: req.user?.sub,
      },
      pipeline,
      parsed.url,
    )

    res.status(201).json(response)
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/youtube', async (req, res, next) => {
  try {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : ''
    if (!url) throw new AppError('YouTube URL is required', 'VALIDATION_ERROR', 400)

    const titleOverride =
      typeof req.body?.title === 'string' && req.body.title.trim()
        ? req.body.title.trim()
        : undefined
    const categoryRaw =
      typeof req.body?.category === 'string' && req.body.category.trim()
        ? req.body.category.trim()
        : undefined
    const category = categoryRaw as AnalysisCategory | undefined

    // Prefer client-supplied transcript (two-step flow) to stay under Vercel 60s.
    const prefetched =
      typeof req.body?.content === 'string' && req.body.content.trim().length >= 20
        ? req.body.content.trim()
        : undefined

    const extracted = prefetched
      ? {
          content: prefetched.slice(0, 10_000),
          title: titleOverride ?? `YouTube transcript`,
          videoId: extractYouTubeVideoId(url) ?? 'unknown',
        }
      : await extractYouTubeContent(url)
    const title = titleOverride ?? extracted.title

    const pipeline = await runAnalysis({
      content: extracted.content,
      sourceType: 'transcript',
      title,
    })

    const response = await persistAnalysis(
      {
        content: extracted.content,
        sourceType: 'transcript',
        title,
        category,
        report: pipeline.report,
        meshModel: pipeline.meshModel,
        meshLatencyMs: pipeline.meshLatencyMs,
        userId: req.user?.sub,
      },
      pipeline,
      url,
    )

    res.status(201).json(response)
  } catch (error) {
    next(error)
  }
})

/** Extract transcript only — keeps Gemini under the 60s limit before Mesh runs. */
analyzeRouter.post('/youtube/transcript', async (req, res, next) => {
  try {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : ''
    if (!url) throw new AppError('YouTube URL is required', 'VALIDATION_ERROR', 400)

    const extracted = await extractYouTubeContent(url)
    res.json({
      videoId: extracted.videoId,
      title: extracted.title,
      content: extracted.content,
      sourceUrl: url,
    })
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/image', imageUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Image file is required', 'VALIDATION_ERROR', 400)
    }

    const ocr = await extractTextFromImage(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
    )

    const content = [
      `[Image OCR · ${req.file.originalname}]`,
      '',
      ocr.text,
    ].join('\n')

    const title =
      typeof req.body.title === 'string' && req.body.title.trim()
        ? req.body.title.trim().slice(0, 200)
        : req.file.originalname.replace(/\.[^.]+$/, '')

    const pipeline = await runAnalysis({
      content,
      sourceType: 'raw',
      title,
    })

    const response = await persistAnalysis(
      {
        content,
        sourceType: 'raw',
        title,
        report: pipeline.report,
        meshModel: pipeline.meshModel || ocr.model,
        meshLatencyMs: pipeline.meshLatencyMs,
        userId: req.user?.sub,
      },
      pipeline,
    )

    res.status(201).json(response)
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/pdf', upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('PDF file is required', 'VALIDATION_ERROR', 400)
    }

    const content = await extractTextFromPdf(req.file.buffer)
    const title =
      typeof req.body.title === 'string' && req.body.title.trim()
        ? req.body.title.trim().slice(0, 200)
        : req.file.originalname.replace(/\.pdf$/i, '')

    const pipeline = await runAnalysis({
      content,
      sourceType: 'pdf',
      title,
    })

    const response = await persistAnalysis(
      {
        content,
        sourceType: 'pdf',
        title,
        report: pipeline.report,
        meshModel: pipeline.meshModel,
        meshLatencyMs: pipeline.meshLatencyMs,
        userId: req.user?.sub,
      },
      pipeline,
    )

    res.status(201).json(response)
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/batch', batchUpload.array('pdfs', 5), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined

    if (!files || files.length === 0) {
      throw new AppError('At least one PDF file is required', 'VALIDATION_ERROR', 400)
    }

    const results = []

    for (const file of files) {
      const content = await extractTextFromPdf(file.buffer)
      const title = file.originalname.replace(/\.pdf$/i, '')

      const pipeline = await runAnalysis({
        content,
        sourceType: 'pdf',
        title,
      })

      results.push(
        await persistAnalysis(
          {
            content,
            sourceType: 'pdf',
            title,
            report: pipeline.report,
            meshModel: pipeline.meshModel,
            meshLatencyMs: pipeline.meshLatencyMs,
            userId: req.user?.sub,
          },
          pipeline,
        ),
      )
    }

    res.status(201).json({ results })
  } catch (error) {
    next(error)
  }
})

analyzeRouter.post('/forward-check', async (req, res, next) => {
  try {
    const content = typeof req.body?.content === 'string' ? req.body.content : ''
    if (!content.trim()) {
      throw new AppError('Content is required', 'VALIDATION_ERROR', 400)
    }
    res.json(assessForwardRisk(content))
  } catch (error) {
    next(error)
  }
})
