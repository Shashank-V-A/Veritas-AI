import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { APP_NAME, ROUTES } from '@/lib/constants'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  linkTo?: string
  /** on-gold = black mark on gold bg; on-dark = gold mark on black bg */
  variant?: 'on-gold' | 'on-dark'
}

const sizeMap = {
  sm: { mark: 'size-7 text-sm', text: 'text-sm' },
  md: { mark: 'size-8 text-base', text: 'text-base' },
  lg: { mark: 'size-10 text-lg', text: 'text-xl' },
}

export function Logo({
  className,
  showText = true,
  size = 'md',
  linkTo = ROUTES.dashboard,
  variant = 'on-gold',
}: LogoProps) {
  const sizes = sizeMap[size]
  const isOnGold = variant === 'on-gold'

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
          'flex items-center justify-center border font-semibold transition-colors',
          isOnGold
            ? 'border-black/25 bg-black/5 text-foreground group-hover:border-black/40 group-hover:bg-black/10'
            : 'border-accent/40 bg-accent/10 text-accent group-hover:border-accent/60 group-hover:bg-accent/15',
        )}
      >
        V
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              sizes.text,
              'font-semibold tracking-tight',
              isOnGold ? 'text-foreground' : 'text-accent',
            )}
          >
            {APP_NAME}
          </span>
          <span
            className={cn(
              'mt-0.5 text-[10px] font-medium uppercase tracking-wide',
              isOnGold ? 'text-foreground/60' : 'text-accent/60',
            )}
          >
            Verify
          </span>
        </div>
      )}
    </Link>
  )
}
