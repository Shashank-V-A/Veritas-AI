import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center border border-accent/20 bg-accent/5">
        <Icon className="size-5 text-card-foreground/60" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-card-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-card-foreground/60">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
