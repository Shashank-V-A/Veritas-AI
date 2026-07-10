import { useTranslation } from 'react-i18next'

export function SkipLink() {
  const { t } = useTranslation()

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-accent focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-card-foreground"
    >
      {t('nav.skipToContent')}
    </a>
  )
}
