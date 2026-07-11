import type { LucideIcon } from 'lucide-react'
import {
  AlignLeft,
  BookOpen,
  FileText,
  Forward,
  MessageSquare,
  Mic,
  Newspaper,
} from 'lucide-react'
import i18n from '@/i18n'
import type { SourceType } from '@/types'

export const SOURCE_TYPE_OPTIONS: {
  value: SourceType
  labelKey: string
  icon: LucideIcon
}[] = [
  { value: 'article', labelKey: 'sourceTypes.article', icon: Newspaper },
  { value: 'social', labelKey: 'sourceTypes.social', icon: MessageSquare },
  { value: 'transcript', labelKey: 'sourceTypes.transcript', icon: Mic },
  { value: 'forward', labelKey: 'sourceTypes.forward', icon: Forward },
  { value: 'blog', labelKey: 'sourceTypes.blog', icon: BookOpen },
  { value: 'pdf', labelKey: 'sourceTypes.pdf', icon: FileText },
  { value: 'raw', labelKey: 'sourceTypes.raw', icon: AlignLeft },
]

export function getSourceTypeLabel(value: SourceType): string {
  const opt = SOURCE_TYPE_OPTIONS.find((o) => o.value === value)
  return opt ? i18n.t(opt.labelKey) : value
}

export function getSourceTypeIcon(value: SourceType): LucideIcon {
  return SOURCE_TYPE_OPTIONS.find((o) => o.value === value)?.icon ?? AlignLeft
}
