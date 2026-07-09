import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Claim, Fallacy } from '@veritas/shared'

interface HighlightSegment {
  start: number
  end: number
  type: 'claim' | 'fallacy'
  index: number
  label: string
}

interface ClaimHighlightedSourceProps {
  content: string
  claims: Claim[]
  fallacies: Fallacy[]
  className?: string
}

function findMatchIndex(text: string, excerpt: string): number {
  const normalized = excerpt.trim()
  if (!normalized) return -1

  const direct = text.indexOf(normalized)
  if (direct >= 0) return direct

  const lowerText = text.toLowerCase()
  const lowerExcerpt = normalized.toLowerCase()
  return lowerText.indexOf(lowerExcerpt)
}

function buildSegments(
  content: string,
  claims: Claim[],
  fallacies: Fallacy[],
): HighlightSegment[] {
  const segments: HighlightSegment[] = []

  claims.forEach((claim, index) => {
    const start = findMatchIndex(content, claim.claim)
    if (start >= 0) {
      segments.push({
        start,
        end: start + claim.claim.length,
        type: 'claim',
        index,
        label: `Claim ${index + 1}`,
      })
    }
  })

  fallacies.forEach((fallacy, index) => {
    const start = findMatchIndex(content, fallacy.excerpt)
    if (start >= 0) {
      segments.push({
        start,
        end: start + fallacy.excerpt.length,
        type: 'fallacy',
        index,
        label: fallacy.type,
      })
    }
  })

  return segments
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .filter((seg, i, arr) => {
      if (i === 0) return true
      const prev = arr[i - 1]
      return seg.start >= prev.end
    })
}

function scrollToClaim(index: number) {
  const el = document.getElementById(`claim-card-${index}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

export function ClaimHighlightedSource({
  content,
  claims,
  fallacies,
  className,
}: ClaimHighlightedSourceProps) {
  const segments = useMemo(
    () => buildSegments(content, claims, fallacies),
    [content, claims, fallacies],
  )

  if (segments.length === 0) {
    return (
      <p className={cn('whitespace-pre-wrap text-sm leading-relaxed text-card-foreground/70', className)}>
        {content}
      </p>
    )
  }

  const nodes: React.ReactNode[] = []
  let cursor = 0

  segments.forEach((seg) => {
    if (seg.start > cursor) {
      nodes.push(content.slice(cursor, seg.start))
    }

    const highlighted = content.slice(seg.start, seg.end)
    const isClaim = seg.type === 'claim'

    nodes.push(
      <button
        key={`${seg.type}-${seg.index}-${seg.start}`}
        type="button"
        onClick={() => isClaim && scrollToClaim(seg.index)}
        title={seg.label}
        className={cn(
          'rounded-sm px-0.5 underline decoration-2 underline-offset-2 transition-colors',
          isClaim
            ? 'bg-accent/15 decoration-accent text-card-foreground hover:bg-accent/25'
            : 'bg-danger/10 decoration-danger/60 text-card-foreground/90',
          isClaim && 'cursor-pointer',
        )}
      >
        {highlighted}
      </button>,
    )

    cursor = seg.end
  })

  if (cursor < content.length) {
    nodes.push(content.slice(cursor))
  }

  return (
    <div className={cn('text-sm leading-relaxed text-card-foreground/70', className)}>
      <p className="mb-3 font-mono text-[10px] text-card-foreground/45">
        Highlighted claims (click to jump) · fallacy excerpts in red
      </p>
      <p className="whitespace-pre-wrap">{nodes}</p>
    </div>
  )
}
