import type { AnalysisCategory } from '@veritas/shared'
import i18n from '@/i18n'

export const CATEGORY_OPTIONS: {
  value: AnalysisCategory
  labelKey: string
}[] = [
  { value: 'health', labelKey: 'categories.health' },
  { value: 'politics', labelKey: 'categories.politics' },
  { value: 'news', labelKey: 'categories.news' },
  { value: 'other', labelKey: 'categories.other' },
]

export function getCategoryLabel(category?: AnalysisCategory | string): string {
  const opt = CATEGORY_OPTIONS.find((o) => o.value === category)
  if (!opt) return i18n.t('categories.general')
  return i18n.t(opt.labelKey)
}
