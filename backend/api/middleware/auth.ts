import type { NextFunction, Request, Response } from 'express'
import {
  SESSION_COOKIE,
  verifySession,
  type SessionPayload,
} from '../../services/auth/jwt.js'
import { AppError } from '../../utils/errors.js'

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

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) {
    return next(new AppError('Sign in required', 'UNAUTHORIZED', 401))
  }

  const session = verifySession(token)
  if (!session) {
    return next(new AppError('Session expired — sign in again', 'UNAUTHORIZED', 401))
  }

  req.user = session
  next()
}
