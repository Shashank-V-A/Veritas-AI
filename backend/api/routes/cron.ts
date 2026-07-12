import { Router } from 'express'
import { scanAllWatches } from '../../services/watchlist/scanWeb.js'

export const cronRouter = Router()

function authorizeCron(req: import('express').Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const querySecret = typeof req.query.secret === 'string' ? req.query.secret : ''
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  return token === secret || querySecret === secret
}

async function runScan(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) {
  try {
    if (!authorizeCron(req)) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' },
      })
      return
    }
    const result = await scanAllWatches()
    res.json({ ok: true, ...result })
  } catch (error) {
    next(error)
  }
}

/** Vercel Cron uses GET; allow POST for manual ops. */
cronRouter.get('/watchlist-scan', runScan)
cronRouter.post('/watchlist-scan', runScan)
