import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { isAppError } from '../../utils/errors.js'
import { logger } from '../../utils/logger.js'

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    const message = error.errors.map((e) => e.message).join('; ')
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    })
    return
  }

  if (isAppError(error)) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
      },
    })
    return
  }

  logger.error('Unhandled error', {
    message: error instanceof Error ? error.message : String(error),
  })

  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'An unexpected error occurred',
    },
  })
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  })
}
