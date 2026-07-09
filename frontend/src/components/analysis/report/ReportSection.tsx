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
    <section id={id} className={cn('scroll-mt-24', className)}>
      <div className="mb-5 border-b border-accent/15 pb-3">
        <h2 className="font-display text-xl text-card-foreground">{title}</h2>
        {description && (
          <p className="mt-1 font-mono text-[10px] text-card-foreground/50">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}
