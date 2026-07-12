import cookieParser from 'cookie-parser'
import cors from 'cors'
import compression from 'compression'
import express from 'express'
import { getDatabaseUrl, isPersistentDatabase } from '../db/databaseEnv.js'
import { ensureDatabase } from '../db/init.js'
import { getCorsOptions } from '../utils/cors.js'
import { optionalAuth } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import {
  rateLimiter,
  authRateLimiter,
  analyzeRateLimiter,
} from './middleware/rateLimiter.js'
import { analyzeRouter } from './routes/analyze.js'
import { authRouter } from './routes/auth.js'
import { historyRouter } from './routes/history.js'
import { publicReportRouter } from './routes/publicReport.js'
import { reportRouter } from './routes/report.js'
import { requireAuth } from './middleware/auth.js'
import { domainRouter } from './routes/domain.js'
import { annotationsRouter } from './routes/annotations.js'
import { ogRouter } from './routes/og.js'
import { graphRouter } from './routes/graph.js'
import { watchlistRouter } from './routes/watchlist.js'
import { exhibitsRouter } from './routes/exhibits.js'
import { notificationsRouter } from './routes/notifications.js'
import { cronRouter } from './routes/cron.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(cors(getCorsOptions()))
  app.use(compression())
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(rateLimiter)

  // Schema must exist before optionalAuth may touch Prisma (ephemeral /tmp on Vercel).
  app.use(async (_req, _res, next) => {
    try {
      await ensureDatabase()
      next()
    } catch (error) {
      next(error)
    }
  })

  app.use(optionalAuth)

  app.get('/api/health', (_req, res) => {
    const dbUrl = getDatabaseUrl()
    res.json({
      status: 'ok',
      service: 'veritas-api',
      env: process.env.VERCEL ? 'vercel' : 'local',
      database: isPersistentDatabase()
        ? 'turso'
        : dbUrl.includes('/tmp')
          ? 'ephemeral'
          : 'sqlite',
    })
  })

  app.use('/api/auth', authRateLimiter, authRouter)
  app.use('/api/analyze', requireAuth, analyzeRateLimiter, analyzeRouter)
  app.use('/api/public/report', publicReportRouter)
  app.use('/api/history', requireAuth, historyRouter)
  app.use('/api/og', ogRouter)
  app.use('/api/domain', domainRouter)
  app.use('/api/graph', graphRouter)
  app.use('/api/annotations', annotationsRouter)
  app.use('/api/watchlist', watchlistRouter)
  app.use('/api/exhibits', exhibitsRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/cron', cronRouter)
  app.use('/api/report', requireAuth, reportRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

const app = createApp()
export default app
