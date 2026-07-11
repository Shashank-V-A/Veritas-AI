import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface TaglineMarqueeProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
  /** Repeats of the phrase per loop segment */
  repeats?: number
}

export function TaglineMarquee({
  orientation = 'horizontal',
  className,
  repeats = 4,
}: TaglineMarqueeProps) {
  const { t } = useTranslation()
  const phrase = `${t('app.name')} · ${t('app.tagline')}`
  const isVertical = orientation === 'vertical'

  return (
    <div
      className={cn(
        isVertical ? 'side-marquee' : 'footer-marquee',
        className,
      )}
      aria-label={t('landing.footerAria')}
    >
      <div
        className={cn(
          isVertical ? 'side-marquee__track' : 'footer-marquee__track',
        )}
      >
        {Array.from({ length: 2 }).map((_, loop) => (
          <p
            key={loop}
            className={cn(
              isVertical ? 'side-marquee__item' : 'footer-marquee__item',
              'font-mono text-[11px] tracking-[0.04em] text-muted-foreground',
            )}
            aria-hidden={loop > 0}
          >
            {Array.from({ length: repeats }).map((_, i) => (
              <span key={i}>
                {phrase}
                <span
                  className={cn(
                    'text-accent/70',
                    isVertical ? 'mx-6' : 'mx-8',
                  )}
                  aria-hidden
                >
                  ◆
                </span>
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  )
}
