import type { RequestHandler } from 'express'

export function cacheControl(maxAgeSeconds: number): RequestHandler {
  return (_req, res, next) => {
    res.set('Cache-Control', `private, max-age=${maxAgeSeconds}`)
    next()
  }
}
