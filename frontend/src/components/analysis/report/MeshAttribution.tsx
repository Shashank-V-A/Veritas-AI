import { Cpu, Timer } from 'lucide-react'

interface MeshAttributionProps {
  model?: string
  latencyMs?: number
}

export function MeshAttribution({ model, latencyMs }: MeshAttributionProps) {
  if (!model && latencyMs == null) return null

  return (
    <div className="dossier-panel flex flex-wrap items-center gap-4 px-4 py-3">
      <p className="font-mono text-[10px] text-card-foreground/45">Analysis engine</p>
      {model && (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-card-foreground/70">
          <Cpu className="size-3.5 text-accent-secondary" strokeWidth={1.5} />
          {model}
        </span>
      )}
      {latencyMs != null && (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-card-foreground/70">
          <Timer className="size-3.5 text-accent-secondary" strokeWidth={1.5} />
          {(latencyMs / 1000).toFixed(1)}s latency
        </span>
      )}
    </div>
  )
}
