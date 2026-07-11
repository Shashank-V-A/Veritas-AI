import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const location = useLocation()
  const { t } = useTranslation()

  const pageTitles: Record<string, string> = {
    [ROUTES.dashboard]: t('nav.workspace'),
    [ROUTES.history]: t('nav.caseFiles'),
    [ROUTES.graph]: t('nav.graph'),
    [ROUTES.settings]: t('nav.settings'),
  }

  let title = t('nav.workspace')
  if (location.pathname.startsWith('/app/analysis/')) {
    title = t('nav.report')
  } else {
    title = pageTitles[location.pathname] ?? t('nav.workspace')
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label={t('nav.openMenu')}
      >
        <Menu className="size-5" strokeWidth={1.5} />
      </Button>
      <span className="meta-label">{title}</span>
      <span className="w-9" aria-hidden="true" />
    </header>
  )
}
