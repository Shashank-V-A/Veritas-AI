import type { AnalysisCategory } from '@veritas/shared'

export const CATEGORY_OPTIONS: {
  value: AnalysisCategory
  label: string
}[] = [
  { value: 'health', label: 'Health' },
  { value: 'politics', label: 'Politics' },
  { value: 'news', label: 'News' },
  { value: 'other', label: 'Other' },
]

export function getCategoryLabel(category?: AnalysisCategory | string): string {
  return CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? 'General'
}
