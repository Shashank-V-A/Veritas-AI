import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface HazardTapeRailProps {
  /** Edge placement */
  side?: 'left' | 'right' | 'top' | 'bottom'
  className?: string
}

/** Sliding yellow/black caution tape strip for page edges. */
export function HazardTapeRail({ side = 'left', className }: HazardTapeRailProps) {
  const isVertical = side === 'left' || side === 'right'

  return (
    <div
      className={cn(
        'hazard-tape pointer-events-none select-none',
        isVertical ? 'hazard-tape--vertical' : 'hazard-tape--horizontal',
        side === 'left' && 'hazard-tape--left',
        side === 'right' && 'hazard-tape--right',
        side === 'top' && 'hazard-tape--top',
        side === 'bottom' && 'hazard-tape--bottom',
        className,
      )}
      aria-hidden
    />
  )
}

interface RibbonSpec {
  rotate: number
  width: string
  top?: string
  bottom?: string
  left?: string
  right?: string
}

interface HazardTapeCrossProps {
  className?: string
  /** Compact corner cluster vs fuller overlay */
  density?: 'corners' | 'full'
}

/**
 * Crisscrossing caution ribbons (matches brand hazard graphic).
 * Decorative only — does not block interaction.
 */
export function HazardTapeCross({ className, density = 'corners' }: HazardTapeCrossProps) {
  const ribbons: RibbonSpec[] =
    density === 'full'
      ? [
          { rotate: -18, top: '6%', left: '-8%', width: '70%' },
          { rotate: 22, top: '10%', right: '-10%', width: '65%' },
          { rotate: -32, top: '58%', left: '-12%', width: '75%' },
          { rotate: 14, top: '72%', left: '20%', width: '80%' },
          { rotate: -8, top: '42%', left: '35%', width: '55%' },
        ]
      : [
          { rotate: -22, top: '-2%', left: '-6%', width: '42%' },
          { rotate: 18, top: '-1%', right: '-8%', width: '38%' },
          { rotate: -28, bottom: '4%', left: '-10%', width: '48%' },
          { rotate: 16, bottom: '2%', right: '-6%', width: '44%' },
        ]

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-[1] overflow-hidden',
        className,
      )}
      aria-hidden
    >
      {ribbons.map((r, i) => {
        const style: CSSProperties = {
          width: r.width,
          transform: `rotate(${r.rotate}deg)`,
          animationDelay: `${i * -0.35}s`,
          ...(r.top !== undefined ? { top: r.top } : {}),
          ...(r.bottom !== undefined ? { bottom: r.bottom } : {}),
          ...(r.left !== undefined ? { left: r.left } : {}),
          ...(r.right !== undefined ? { right: r.right } : {}),
        }

        return <div key={i} className="hazard-ribbon" style={style} />
      })}
    </div>
  )
}

/** Site-wide frame: left rail + thin top strip on small screens. */
export function HazardTapeFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh">
      <HazardTapeRail
        side="left"
        className="sticky top-0 z-50 hidden h-svh shrink-0 md:block"
      />
      <div className="relative min-w-0 flex-1">
        <HazardTapeRail side="top" className="sticky top-0 z-40 md:hidden" />
        {children}
      </div>
    </div>
  )
}
