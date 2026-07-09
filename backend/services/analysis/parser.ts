import type { CredibilityReport } from '@veritas/shared'
import { AppError } from '../../utils/errors.js'
import { credibilityReportSchema } from './schema.js'

export function repairJson(raw: string): string {
  let text = raw.trim()

  // Strip markdown code fences
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  }

  // Extract first JSON object if surrounded by prose
  const objectStart = text.indexOf('{')
  const objectEnd = text.lastIndexOf('}')
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    text = text.slice(objectStart, objectEnd + 1)
  }

  // Remove trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, '$1')

  return text
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

  const result = credibilityReportSchema.safeParse(parsed)
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

export function getValidationErrorMessage(raw: string): string {
  try {
    parseCredibilityReport(raw)
    return 'Unknown validation error'
  } catch (error) {
    return error instanceof Error ? error.message : 'Unknown validation error'
  }
}
