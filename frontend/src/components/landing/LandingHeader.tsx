import { useTranslation } from 'react-i18next'
import { VeritasMark } from '@/components/brand/VeritasMark'
import { cn } from '@/lib/utils'
import { APP_NAME, ROUTES } from '@/lib/constants'
import { Link } from 'react-router-dom'

const NAV = [
  { labelKey: 'nav.howItsDifferent', href: '#product' },
  { labelKey: 'nav.howItWorks', href: '#how-it-works' },
  { labelKey: 'nav.features', href: '#features' },
  { labelKey: 'nav.about', href: '#about' },
] as const

interface LandingHeaderProps {
  onStart: () => void
  className?: string
}

export function LandingHeader({ onStart, className }: LandingHeaderProps) {
  const { t, i18n } = useTranslation()

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
          {t('app.name').toUpperCase()}
        </span>
      </Link>

      <nav className="hidden items-center gap-7 lg:flex" aria-label={t('nav.primary')}>
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-accent"
          >
            {t(item.labelKey)}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center border border-border" role="group" aria-label={t('settings.language')}>
          {(['en', 'hi'] as const).map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => void i18n.changeLanguage(lng)}
              aria-pressed={i18n.language === lng}
              className={cn(
                'px-2.5 py-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.12em] transition-colors',
                i18n.language === lng
                  ? 'bg-accent text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {lng === 'en' ? 'EN' : 'हि'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onStart}
          className="pressable hidden h-9 items-center border border-accent/60 px-4 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent hover:text-primary-foreground sm:inline-flex"
        >
          {t('nav.startInvestigation')}
        </button>
      </div>
    </header>
  )
}
