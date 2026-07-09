interface RewriteComparisonProps {
  original: string
  neutral: string
}

export function RewriteComparison({ original, neutral }: RewriteComparisonProps) {
  const originalSnippet = original.slice(0, 320) + (original.length > 320 ? '…' : '')

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="dossier-panel p-5">
        <p className="font-mono text-[10px] text-card-foreground/50">Original excerpt</p>
        <p className="mt-3 text-sm leading-relaxed text-card-foreground/70 line-through decoration-danger/40">
          {originalSnippet}
        </p>
      </div>
      <div className="border border-accent/25 bg-accent/5 p-5">
        <p className="font-mono text-[10px] text-accent/70">Neutral rewrite</p>
        <p className="mt-3 text-sm leading-relaxed text-card-foreground/90">
          {neutral}
        </p>
      </div>
    </div>
  )
}
