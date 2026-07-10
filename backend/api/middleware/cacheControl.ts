import type { RequestHandler } from 'express'

export function cacheControl(maxAgeSeconds: number): RequestHandler {
  return (_req, res, next) => {
    if (maxAgeSeconds <= 0) {
      res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
      res.set('Pragma', 'no-cache')
    } else {
      res.set('Cache-Control', `private, max-age=${maxAgeSeconds}`)
    }
    next()
  }
}
