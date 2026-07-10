import { jsonrepair } from 'jsonrepair'
import type { CredibilityReport } from '@veritas/shared'
import { AppError } from '../../utils/errors.js'
import { credibilityReportSchema } from './schema.js'

export function repairJson(raw: string): string {
  let text = raw.trim()

  // Strip markdown code fences (full or partial)
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  } else if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }

  // Extract first JSON object if surrounded by prose
  const objectStart = text.indexOf('{')
  if (objectStart > 0) {
    text = text.slice(objectStart)
  }

  // Remove trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, '$1')

  // Strip illegal control characters outside of a best-effort pass
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')

  try {
    return jsonrepair(text)
  } catch {
    // Fall back to balanced-brace slice + jsonrepair once more
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) {
      const sliced = text.slice(start, end + 1)
      try {
        return jsonrepair(sliced)
      } catch {
        return sliced
      }
    }
    return text
  }
}

export function parseCredibilityReport(raw: string): CredibilityReport {
  const repaired = repairJson(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(repaired)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    throw new AppError(
      `Failed to parse Mesh API response as JSON: ${message}`,
      'MESH_ERROR',
      502,
    )
  }

  const sanitized = sanitizeMeshPayload(parsed)
  const result = credibilityReportSchema.safeParse(sanitized)
  if (!result.success) {
    const message = result.error.errors
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')

    throw new AppError(
      `Mesh API response failed validation: ${message}`,
      'MESH_ERROR',
      502,
    )
  }

  return result.data
}

/** Soft-clean common Mesh quirks before strict Zod validation. */
function sanitizeMeshPayload(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const report = { ...(value as Record<string, unknown>) }

  if (Array.isArray(report.suggestedReading)) {
    report.suggestedReading = report.suggestedReading.map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return item
      const source = { ...(item as Record<string, unknown>) }
      if (typeof source.url === 'string') {
        const trimmed = source.url.trim()
        if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
          delete source.url
        } else {
          source.url = trimmed
        }
      } else if (source.url != null) {
        delete source.url
      }
      if (typeof source.title !== 'string') source.title = 'Suggested source'
      if (typeof source.reason !== 'string') source.reason = ''
      return source
    })
  }

  return report
}

export function getValidationErrorMessage(raw: string): string {
  try {
    parseCredibilityReport(raw)
    return 'Unknown validation error'
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown validation error'
  }
}
