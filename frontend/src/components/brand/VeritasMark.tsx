import { cn } from '@/lib/utils'

interface VeritasMarkProps {
  className?: string
  /** on-light = parchment surfaces; on-dark = ink surfaces */
  variant?: 'on-light' | 'on-dark'
  /** Render without outer container styling (for embedding in Logo, etc.) */
  bare?: boolean
}

/**
 * Veritas seal — forensic case-stamp mark.
 * Double frame, corner registration ticks, crosshair, and truth-point V.
 */
export function VeritasMark({
  className,
  variant = 'on-light',
  bare = false,
}: VeritasMarkProps) {
  const isOnDark = variant === 'on-dark'

  const ink = isOnDark ? '#F5F5F5' : '#C8A24A'
  const brass = '#C8A24A'
  const frame = isOnDark ? 'rgba(200, 162, 74, 0.45)' : 'rgba(200, 162, 74, 0.4)'
  const innerFrame = isOnDark ? 'rgba(200, 162, 74, 0.3)' : 'rgba(200, 162, 74, 0.5)'
  const crosshair = isOnDark ? 'rgba(245, 245, 245, 0.22)' : 'rgba(200, 162, 74, 0.35)'
  const bg = isOnDark ? 'rgba(200, 162, 74, 0.1)' : 'rgba(200, 162, 74, 0.08)'

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={bare ? true : undefined}
      aria-label={bare ? undefined : 'Veritas AI mark'}
      className={cn('size-full', className)}
    >
      {!bare && (
        <rect width="32" height="32" rx="2" fill={bg} />
      )}

      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="1"
        stroke={frame}
        strokeWidth="1.25"
      />

      <rect
        x="5.5"
        y="5.5"
        width="21"
        height="21"
        rx="0.5"
        stroke={innerFrame}
        strokeWidth="0.75"
      />

      <path d="M7 7h2.5M7 7v2.5" stroke={brass} strokeWidth="0.75" strokeLinecap="square" />
      <path d="M25 7h-2.5M25 7v2.5" stroke={brass} strokeWidth="0.75" strokeLinecap="square" />
      <path d="M7 25h2.5M7 25v-2.5" stroke={brass} strokeWidth="0.75" strokeLinecap="square" />
      <path d="M25 25h-2.5M25 25v-2.5" stroke={brass} strokeWidth="0.75" strokeLinecap="square" />

      <line x1="9" y1="16" x2="23" y2="16" stroke={crosshair} strokeWidth="1" />

      <path
        d="M11 21.5 L16 11.5 L21 21.5"
        stroke={ink}
        strokeWidth="2.25"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      <circle cx="16" cy="16" r="1.25" fill={brass} />
    </svg>
  )
}
