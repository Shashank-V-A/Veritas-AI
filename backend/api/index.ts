import cookieParser from 'cookie-parser'
import cors from 'cors'
import compression from 'compression'
import express from 'express'
import { ensureDatabase } from '../db/init.js'
import { getCorsOptions } from '../utils/cors.js'
import { optionalAuth } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { rateLimiter, authRateLimiter, analyzeRateLimiter } from './middleware/rateLimiter.js'
import { analyzeRouter } from './routes/analyze.js'
import { authRouter } from './routes/auth.js'
import { historyRouter } from './routes/history.js'
import { reportRouter } from './routes/report.js'
import { requireAuth } from './middleware/auth.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(cors(getCorsOptions()))
  app.use(compression())
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(rateLimiter)
  app.use(optionalAuth)

  app.use(async (_req, _res, next) => {
    try {
      await ensureDatabase()
      next()
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'veritas-api',
      env: process.env.VERCEL ? 'vercel' : 'local',
    })
  })

  app.use('/api/auth', authRateLimiter, authRouter)
  app.use('/api/analyze', requireAuth, analyzeRateLimiter, analyzeRouter)
  app.use('/api/history', requireAuth, historyRouter)
  app.use('/api/report', requireAuth, reportRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

const app = createApp()
export default app
