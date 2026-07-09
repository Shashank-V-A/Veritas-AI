export const CASE_CATEGORIES = [
  'health',
  'politics',
  'finance',
  'science',
  'technology',
  'social',
  'news',
  'other',
] as const

export type CaseCategory = (typeof CASE_CATEGORIES)[number]
