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
import { extractYouTubeContent } from '../../services/media/youtube.js'
import { extractTextFromPdf } from '../../services/pdf/extract.js'
import { extractFromUrl } from '../../services/url/extract.js'
import { reportRepository } from '../../services/report/repository.js'
import {
  analyzeRequestSchema,
  compareRequestSchema,
  sanitizeContent,
  urlAnalyzeRequestSchema,
} from '../../utils/validation.js'
import { AppError } from '../../utils/errors.js'

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
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
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
      compareContent: parsed.compareContent
        ? sanitizeContent(parsed.compareContent)
        : undefined,
    })

    const response = await persistAnalysis(
      {
        content,
        sourceType,
        title: parsed.title,
        category: parsed.category,
        compareContent: parsed.compareContent
          ? sanitizeContent(parsed.compareContent)
          : undefined,
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

analyzeRouter.post('/compare', async (req, res, next) => {
  try {
    const parsed = compareRequestSchema.parse(req.body)
    const content = sanitizeContent(parsed.content)
    const compareContent = sanitizeContent(parsed.compareContent)

    const pipeline = await runAnalysis({
      content,
      sourceType: parsed.sourceType,
      title: parsed.title,
      compareContent,
    })

    const response = await persistAnalysis(
      {
        content,
        sourceType: parsed.sourceType,
        title: parsed.title,
        category: parsed.category,
        compareContent,
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

    const extracted = await extractYouTubeContent(url)
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

analyzeRouter.post('/image', imageUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Image file is required', 'VALIDATION_ERROR', 400)
    }

    // OCR-lite: describe image context for Mesh text analysis (vision via Mesh when available)
    const content = `[Image upload: ${req.file.originalname}]\nAnalyze visible text and claims in this meme/screenshot. Use OCR-style extraction for any text overlays.`
    const title =
      typeof req.body.title === 'string' && req.body.title.trim()
        ? req.body.title.trim().slice(0, 200)
        : req.file.originalname

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
