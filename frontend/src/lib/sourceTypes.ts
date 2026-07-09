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
import type { SourceType } from '@/types'

export const SOURCE_TYPE_OPTIONS: {
  value: SourceType
  label: string
  icon: LucideIcon
}[] = [
  { value: 'article', label: 'Article', icon: Newspaper },
  { value: 'social', label: 'Social post', icon: MessageSquare },
  { value: 'transcript', label: 'Transcript', icon: Mic },
  { value: 'forward', label: 'Forward', icon: Forward },
  { value: 'blog', label: 'Blog', icon: BookOpen },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'raw', label: 'Raw text', icon: AlignLeft },
]

export function getSourceTypeLabel(value: SourceType): string {
  return SOURCE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function getSourceTypeIcon(value: SourceType): LucideIcon {
  return SOURCE_TYPE_OPTIONS.find((o) => o.value === value)?.icon ?? AlignLeft
}
