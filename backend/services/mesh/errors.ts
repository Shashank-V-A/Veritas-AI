import { AppError } from '../../utils/errors.js'

export function mapMeshHttpError(status: number, body: string): AppError {
  let parsed: { error?: { code?: string; message?: string } } | null = null
  try {
    parsed = JSON.parse(body) as { error?: { code?: string; message?: string } }
  } catch {
    // body is not JSON
  }

  const code = parsed?.error?.code
  const message =
    parsed?.error?.message ?? `Mesh API request failed with status ${status}`

  switch (status) {
    case 401:
      return new AppError('Invalid Mesh API key', 'MESH_ERROR', 502)
    case 402:
      return new AppError(
        code === 'spend_limit_exceeded'
          ? 'Mesh API account has insufficient balance. Top up at meshapi.ai to run analyses.'
          : 'Mesh API billing or spend limit issue',
        'MESH_ERROR',
        502,
      )
    case 422:
      return new AppError(`Mesh API rejected the request: ${message}`, 'MESH_ERROR', 502)
    case 429:
      return new AppError('Mesh API rate limit exceeded', 'MESH_TIMEOUT', 502)
    case 408:
    case 504:
      return new AppError('Mesh API request timed out', 'MESH_TIMEOUT', 502)
    default:
      return new AppError(message, 'MESH_ERROR', 502)
  }
}

export function mapMeshNetworkError(error: unknown): AppError {
  if (error instanceof Error && error.name === 'AbortError') {
    return new AppError('Mesh API request timed out', 'MESH_TIMEOUT', 502)
  }

  const message = error instanceof Error ? error.message : 'Unknown Mesh API error'
  return new AppError(`Mesh API network error: ${message}`, 'MESH_ERROR', 502)
}
