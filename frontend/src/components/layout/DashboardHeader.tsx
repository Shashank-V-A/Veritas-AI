import { Menu } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" strokeWidth={1.75} />
      </Button>
      <Logo size="sm" showText={false} />
      <span className="text-sm font-medium text-foreground">Dashboard</span>
    </header>
  )
}
