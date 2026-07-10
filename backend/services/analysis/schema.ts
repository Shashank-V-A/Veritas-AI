import { z } from 'zod'

export const claimSchema = z.object({
  claim: z.string(),
  status: z.enum(['verified', 'disputed', 'unverified', 'false']),
  confidence: z.number().min(0).max(100),
  evidence: z.array(z.string()),
  explanation: z.string(),
})

export const biasSchema = z.object({
  overall: z.number().min(0).max(100),
  political: z.number().min(0).max(100),
  commercial: z.number().min(0).max(100),
  ideological: z.number().min(0).max(100),
  explanation: z.string(),
})

export const emotionSchema = z.object({
  fear: z.number().min(0).max(100),
  urgency: z.number().min(0).max(100),
  anger: z.number().min(0).max(100),
  sensationalism: z.number().min(0).max(100),
  loadedLanguage: z.number().min(0).max(100),
  dominant: z.string(),
})

export const fallacySchema = z.object({
  type: z.string(),
  excerpt: z.string(),
  explanation: z.string(),
})

export const timelineEventSchema = z.object({
  step: z.string(),
  description: z.string(),
  timestamp: z.string().optional(),
})

/** Mesh often returns "", "N/A", or non-http strings — drop those instead of failing. */
function coerceOptionalHttpUrl(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined
    return parsed.toString()
  } catch {
    return undefined
  }
}

export const suggestedSourceSchema = z.object({
  title: z.string(),
  url: z.preprocess(coerceOptionalHttpUrl, z.string().url().optional()),
  reason: z.string(),
})

export const credibilityReportSchema = z.object({
  trustScore: z.number().min(0).max(100),
  claims: z.array(claimSchema),
  bias: biasSchema,
  emotion: emotionSchema,
  fallacies: z.array(fallacySchema),
  missingContext: z.array(z.string()),
  neutralRewrite: z.string(),
  eli15: z.string(),
  summary: z.string(),
  verdict: z.enum(['credible', 'mixed', 'misleading', 'unsupported']),
  suggestedReading: z.array(suggestedSourceSchema),
  reasoningTimeline: z.array(timelineEventSchema),
}).passthrough()

export type CredibilityReportSchema = z.infer<typeof credibilityReportSchema>
