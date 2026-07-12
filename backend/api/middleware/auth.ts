import type { NextFunction, Request, Response } from 'express'
import {
  SESSION_COOKIE,
  verifySession,
  type SessionPayload,
} from '../../services/auth/jwt.js'
import { userRepository } from '../../services/auth/userRepository.js'
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
  if (!token) {
    next()
    return
  }

  const session = verifySession(token)
  if (!session) {
    next()
    return
  }

  void userRepository
    .ensureFromSession(session)
    .then((user) => {
      req.user = {
        ...session,
        sub: user.id,
      }
      next()
    })
    .catch(() => {
      // Never block public routes (including OAuth start) if session restore fails.
      req.user = session
      next()
    })
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (!token) {
    next(new AppError('Sign in required', 'UNAUTHORIZED', 401))
    return
  }

  const session = verifySession(token)
  if (!session) {
    next(new AppError('Session expired — sign in again', 'UNAUTHORIZED', 401))
    return
  }

  void userRepository
    .ensureFromSession(session)
    .then((user) => {
      req.user = {
        ...session,
        sub: user.id,
      }
      next()
    })
    .catch(next)
}
