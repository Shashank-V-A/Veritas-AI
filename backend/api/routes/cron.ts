import { Router } from 'express'
import { prisma } from '../../db/prisma.js'
import { sendWeeklyDigests } from '../../services/email/digest.js'

export const cronRouter = Router()

function requireCronSecret(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } })
    return
  }
  next()
}

cronRouter.use(requireCronSecret)

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

cronRouter.get('/digest', handleDigest)
cronRouter.post('/digest', handleDigest)
