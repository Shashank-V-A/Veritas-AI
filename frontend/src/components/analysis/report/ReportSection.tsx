import { cn } from '@/lib/utils'

interface ReportSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  id?: string
}

export function ReportSection({
  title,
  description,
  children,
  className,
  id,
}: ReportSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-8', className)}>
      <div className="mb-4">
        <h2 className="text-sm font-medium tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
