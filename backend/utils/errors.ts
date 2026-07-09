export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'MESH_TIMEOUT'
  | 'MESH_ERROR'
  | 'MESH_NOT_CONFIGURED'
  | 'INTERNAL'

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  MESH_TIMEOUT: 502,
  MESH_ERROR: 502,
  MESH_NOT_CONFIGURED: 503,
  INTERNAL: 500,
}

export class AppError extends Error {
  code: ErrorCode
  status: number

  constructor(message: string, code: ErrorCode, status?: number) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status ?? statusByCode[code]
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
