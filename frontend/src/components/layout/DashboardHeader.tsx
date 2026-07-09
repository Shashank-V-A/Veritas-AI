import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.dashboard]: 'Workspace',
  [ROUTES.history]: 'Case files',
}

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const location = useLocation()

  let title = 'Workspace'
  if (location.pathname.startsWith('/app/analysis/')) {
    title = 'Report'
  } else {
    title = PAGE_TITLES[location.pathname] ?? 'Workspace'
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-accent/20 bg-surface px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="text-card-foreground hover:text-accent"
      >
        <Menu className="size-5" strokeWidth={1.5} />
      </Button>
      <span className="font-mono text-xs text-card-foreground/60">{title}</span>
      <span className="w-9" aria-hidden="true" />
    </header>
  )
}
