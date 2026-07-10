import { z } from 'zod'
import {
  CASE_CATEGORIES,
  MAX_CONTENT_LENGTH,
  SOURCE_TYPES,
} from '@veritas/shared'

export const analyzeRequestSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(MAX_CONTENT_LENGTH, `Content must be under ${MAX_CONTENT_LENGTH} characters`),
  sourceType: z.enum(SOURCE_TYPES).default('raw'),
  title: z.string().max(200).optional(),
  compareContent: z
    .string()
    .max(MAX_CONTENT_LENGTH, `Comparison content must be under ${MAX_CONTENT_LENGTH} characters`)
    .optional(),
  category: z.enum(CASE_CATEGORIES).optional(),
})

export const compareRequestSchema = analyzeRequestSchema.extend({
  compareContent: z
    .string()
    .min(1, 'Comparison content is required')
    .max(MAX_CONTENT_LENGTH, `Comparison content must be under ${MAX_CONTENT_LENGTH} characters`),
})

export const urlAnalyzeRequestSchema = z.object({
  url: z.string().url('A valid URL is required').max(2048),
  title: z.string().max(200).optional(),
  category: z.enum(CASE_CATEGORIES).optional(),
})

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  category: z.enum(CASE_CATEGORIES).optional(),
  verdict: z.enum(['credible', 'mixed', 'misleading', 'unsupported']).optional(),
})

export const reportIdSchema = z.object({
  id: z.string().uuid('Invalid report ID'),
})

export const shareTokenSchema = z.object({
  token: z.string().min(8).max(128),
})

export type AnalyzeRequestInput = z.infer<typeof analyzeRequestSchema>
export type CompareRequestInput = z.infer<typeof compareRequestSchema>
export type UrlAnalyzeRequestInput = z.infer<typeof urlAnalyzeRequestSchema>
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>

export function sanitizeContent(content: string): string {
  return content.trim().replace(/\r\n/g, '\n')
}
