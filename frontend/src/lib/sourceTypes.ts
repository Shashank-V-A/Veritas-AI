import type { SourceType } from '@/types'

export const SOURCE_TYPE_OPTIONS: {
  value: SourceType
  label: string
}[] = [
  { value: 'article', label: 'Article' },
  { value: 'social', label: 'Social post' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'forward', label: 'Forward' },
  { value: 'blog', label: 'Blog' },
  { value: 'pdf', label: 'PDF' },
  { value: 'raw', label: 'Raw text' },
]

export function getSourceTypeLabel(value: SourceType): string {
  return SOURCE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
}
