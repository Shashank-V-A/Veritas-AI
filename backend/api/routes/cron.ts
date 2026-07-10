import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { runAnalysis } from '../../services/analysis/pipeline.js'
import { extractFromUrl } from '../../services/url/extract.js'
import { reportRepository } from '../../services/report/repository.js'
import { requireAuth } from '../middleware/auth.js'
import { sendWeeklyDigests } from '../../services/email/digest.js'

export const cronRouter = Router()

function requireCronSecret(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } })
    return
  }
  next()
}

cronRouter.use(requireCronSecret)

async function runRecheckJobs() {
  const due = await prisma.scheduledRecheck.findMany({
    where: { completed: false, runAt: { lte: new Date() } },
    take: 10,
  })

  const results = []
  for (const job of due) {
    try {
      if (job.sourceUrl) {
        const extracted = await extractFromUrl(job.sourceUrl)
        const pipeline = await runAnalysis({
          content: extracted.content,
          sourceType: 'article',
          title: extracted.title,
        })
        await reportRepository.save({
          content: extracted.content,
          sourceType: 'article',
          title: extracted.title,
          report: pipeline.report,
          meshModel: pipeline.meshModel,
          meshLatencyMs: pipeline.meshLatencyMs,
          userId: job.userId,
          parentId: job.analysisId ?? undefined,
          sourceUrl: job.sourceUrl,
        })
      }
      await prisma.scheduledRecheck.update({
        where: { id: job.id },
        data: { completed: true },
      })
      results.push({ id: job.id, status: 'completed' })
    } catch (err) {
      results.push({
        id: job.id,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return { processed: results.length, results }
}

async function runWeeklyDigest() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const users = await prisma.user.findMany({
    where: { analyses: { some: { createdAt: { gte: since } } } },
    select: {
      email: true,
      name: true,
      analyses: {
        where: { createdAt: { gte: since } },
        select: { id: true, title: true, trustScore: true, verdict: true },
      },
    },
  })

  const digest = users.map((u) => ({
    email: u.email,
    name: u.name,
    caseCount: u.analyses.length,
    cases: u.analyses,
  }))

  const emailResult = await sendWeeklyDigests(digest)

  return {
    sent: emailResult.sent,
    failed: emailResult.failed,
    errors: emailResult.errors,
    digest,
  }
}

const handleRecheck = async (
  _req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) => {
  try {
    res.json(await runRecheckJobs())
  } catch (error) {
    next(error)
  }
}

const handleDigest = async (
  _req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) => {
  try {
    res.json(await runWeeklyDigest())
  } catch (error) {
    next(error)
  }
}

cronRouter.get('/recheck', handleRecheck)
cronRouter.post('/recheck', handleRecheck)
cronRouter.get('/digest', handleDigest)
cronRouter.post('/digest', handleDigest)

export const scheduleRouter = Router()
scheduleRouter.use(requireAuth)

scheduleRouter.post('/', async (req, res, next) => {
  try {
    const { sourceUrl, analysisId, days = 7 } = req.body as {
      sourceUrl?: string
      analysisId?: string
      days?: number
    }

    if (!sourceUrl && !analysisId) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'sourceUrl or analysisId required' } })
      return
    }

    const runAt = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000)
    const job = await prisma.scheduledRecheck.create({
      data: {
        userId: req.user!.sub,
        sourceUrl,
        analysisId,
        runAt,
      },
    })

    res.status(201).json(job)
  } catch (error) {
    next(error)
  }
})
