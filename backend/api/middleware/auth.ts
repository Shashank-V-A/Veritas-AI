import type { NextFunction, Request, Response } from 'express'
import {
  SESSION_COOKIE,
  verifySession,
  type SessionPayload,
} from '../../services/auth/jwt.js'

declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (token) {
    const session = verifySession(token)
    if (session) {
      req.user = session
    }
  }
  next()
}
