import { Link } from 'react-router-dom'
import { VeritasMark } from '@/components/brand/VeritasMark'
import { cn } from '@/lib/utils'
import { APP_NAME, ROUTES } from '@/lib/constants'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  linkTo?: string
  /** on-light = mark on parchment; on-dark = mark on ink surface */
  variant?: 'on-light' | 'on-dark'
}

const sizeMap = {
  sm: { mark: 'size-7', text: 'text-sm' },
  md: { mark: 'size-8', text: 'text-base' },
  lg: { mark: 'size-10', text: 'text-xl' },
}

export function Logo({
  className,
  showText = true,
  size = 'md',
  linkTo = ROUTES.dashboard,
  variant = 'on-light',
}: LogoProps) {
  const sizes = sizeMap[size]
  const isOnLight = variant === 'on-light'

  return (
    <Link
      to={linkTo}
      className={cn(
        'group inline-flex items-center gap-3 transition-opacity hover:opacity-90',
        className,
      )}
      aria-label={`${APP_NAME} home`}
    >
      <div
        className={cn(
          sizes.mark,
          'shrink-0 overflow-hidden border transition-colors',
          isOnLight
            ? 'border-accent/30 group-hover:border-accent/50'
            : 'border-accent-secondary/40 group-hover:border-accent-secondary/60',
        )}
      >
        <VeritasMark variant={variant} bare />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              sizes.text,
              'font-semibold tracking-tight',
              isOnLight ? 'text-foreground' : 'text-card-foreground',
            )}
          >
            {APP_NAME}
          </span>
          <span
            className={cn(
              'mt-0.5 font-mono text-[10px] uppercase tracking-widest',
              isOnLight ? 'text-muted-foreground' : 'text-muted-foreground',
            )}
          >
            Investigate
          </span>
        </div>
      )}
    </Link>
  )
}
