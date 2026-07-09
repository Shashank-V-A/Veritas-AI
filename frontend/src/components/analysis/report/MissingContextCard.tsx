import { AlertCircle } from 'lucide-react'

interface MissingContextCardProps {
  items: string[]
}

export function MissingContextCard({ items }: MissingContextCardProps) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-warning/20 bg-warning/5 p-5">
      <div className="flex items-center gap-2">
        <AlertCircle className="size-4 text-warning" strokeWidth={1.75} />
        <p className="text-sm font-medium text-foreground">Missing context</p>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
          >
            <span className="mt-2 size-1 shrink-0 rounded-full bg-warning" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
