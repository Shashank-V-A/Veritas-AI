import { VeritasMark } from '@/components/brand/VeritasMark'
import { cn } from '@/lib/utils'
import { APP_NAME, ROUTES } from '@/lib/constants'
import { Link } from 'react-router-dom'

const NAV = [
  { label: "How It's Different", href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
] as const

interface LandingHeaderProps {
  onStart: () => void
  className?: string
}

export function LandingHeader({ onStart, className }: LandingHeaderProps) {
  return (
    <header
      className={cn(
        'relative z-30 flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-8 lg:px-10',
        className,
      )}
    >
      <Link to={ROUTES.home} className="flex items-center gap-3" aria-label={`${APP_NAME} home`}>
        <div className="size-8 overflow-hidden border border-accent/40">
          <VeritasMark variant="on-dark" bare />
        </div>
        <span className="font-display text-lg font-semibold tracking-[0.04em] text-foreground md:text-xl">
          VERITAS AI
        </span>
      </Link>

      <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-accent"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <button
        type="button"
        onClick={onStart}
        className="pressable hidden h-9 items-center border border-accent/60 px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent hover:text-primary-foreground sm:inline-flex"
      >
        Start investigation
      </button>
    </header>
  )
}
