import type { RequestHandler } from 'express'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

const hits = new Map<string, { count: number; resetAt: number }>()

export const rateLimiter: RequestHandler = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    next()
    return
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown'

  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    next()
    return
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests. Please try again shortly.',
      },
    })
    return
  }

  entry.count += 1
  next()
}
