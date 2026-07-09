import cors from 'cors'
import compression from 'compression'
import express from 'express'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { analyzeRouter } from './routes/analyze.js'
import { historyRouter } from './routes/history.js'
import { reportRouter } from './routes/report.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true }))
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'veritas-api' })
  })

  app.use('/api/analyze', analyzeRouter)
  app.use('/api/history', historyRouter)
  app.use('/api/report', reportRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export default createApp()
