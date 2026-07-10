import type { ErrorCode } from '@veritas/shared'
import { ApiClientError } from '@/services/api'

const FRIENDLY_MESSAGES: Partial<Record<ErrorCode, string>> = {
  RATE_LIMIT:
    'You\'ve reached the analysis limit for now. Please wait a few minutes and try again.',
  MESH_TIMEOUT:
    'The analysis engine took too long to respond. Try again with shorter content.',
  MESH_ERROR:
    'The analysis engine encountered an error. Please try again in a moment.',
  MESH_NOT_CONFIGURED:
    'Analysis is temporarily unavailable. The team has been notified.',
  VALIDATION_ERROR:
    'Some of the submitted content could not be processed. Check your input and try again.',
  UNAUTHORIZED:
    'Please sign in to continue.',
  NOT_FOUND:
    'That report or link could not be found.',
  INTERNAL:
    'Something went wrong on our end. Please try again.',
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    // Prefer specific server messages (e.g. YouTube caption failures)
    if (
      error.message &&
      error.message !== 'Request failed' &&
      !/^Request failed with status \d+$/i.test(error.message)
    ) {
      return error.message
    }

    const friendly = FRIENDLY_MESSAGES[error.code as ErrorCode]
    if (friendly) return friendly

    if (error.code.startsWith('MESH_')) {
      return FRIENDLY_MESSAGES.MESH_ERROR ?? 'Analysis engine error. Please try again.'
    }

    return error.message
  }

  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
