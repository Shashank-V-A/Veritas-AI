import type { RequestHandler } from 'express'

interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
  /** Dev multiplier — higher limits when not in production */
  devMultiplier?: number
}

const hits = new Map<string, { count: number; resetAt: number }>()

function cleanupStaleEntries(now: number) {
  if (hits.size < 500) return
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key)
  }
}

function getClientKey(req: Parameters<RequestHandler>[0], prefix: string): string {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown'
  const userId = req.user?.sub
  return userId ? `${prefix}:${userId}` : `${prefix}:${ip}`
}

export function createRateLimiter(options: RateLimitOptions = {}): RequestHandler {
  const windowMs = options.windowMs ?? 60_000
  const maxRequests =
    process.env.NODE_ENV === 'production'
      ? (options.maxRequests ?? 30)
      : (options.maxRequests ?? 30) * (options.devMultiplier ?? 10)

  return (req, res, next) => {
    const now = Date.now()
    cleanupStaleEntries(now)

    const key = getClientKey(req, req.baseUrl || req.path)
    const entry = hits.get(key)

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    if (entry.count >= maxRequests) {
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
}

/** Default API rate limiter */
export const rateLimiter = createRateLimiter({ maxRequests: 60 })

/** Stricter limit for OAuth endpoints */
export const authRateLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 })

/** Stricter limit for analysis (expensive) */
export const analyzeRateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 })
