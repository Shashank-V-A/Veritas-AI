import { motion } from 'framer-motion'
import { FileText, Link2, ShieldCheck } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const NODES = [
  { id: 'a', label: 'Claim A', x: 18, y: 28, status: 'disputed' as const },
  { id: 'b', label: 'Source', x: 52, y: 18, status: 'verified' as const },
  { id: 'c', label: 'Bias', x: 78, y: 42, status: 'warning' as const },
  { id: 'd', label: 'Fallacy', x: 34, y: 68, status: 'danger' as const },
  { id: 'e', label: 'Evidence', x: 68, y: 72, status: 'verified' as const },
]

const EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 4],
  [1, 4],
]

const statusColor = {
  verified: 'bg-success',
  disputed: 'bg-warning',
  warning: 'bg-accent',
  danger: 'bg-danger',
}

export function InvestigationBoardHero({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'intel-panel relative aspect-[4/3] w-full overflow-hidden intel-grid-fine md:aspect-[5/4]',
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] via-transparent to-accent-secondary/[0.05]" />

      {/* Connection lines */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {EDGES.map(([from, to], i) => {
          const a = NODES[from]
          const b = NODES[to]
          return (
            <motion.line
              key={`${from}-${to}`}
              x1={`${a.x}%`}
              y1={`${a.y}%`}
              x2={`${b.x}%`}
              y2={`${b.y}%`}
              stroke="rgba(200,162,74,0.28)"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
            />
          )
        })}
      </svg>

      {NODES.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
        >
          <div className="rounded-md border border-border bg-elevated px-2.5 py-1.5 shadow-[var(--shadow-panel)]">
            <div className="flex items-center gap-1.5">
              <span className={cn('size-1.5 rounded-full', statusColor[node.status])} />
              <span className="font-mono text-[10px] text-foreground">{node.label}</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Floating case folders */}
      <motion.div
        className="absolute bottom-4 left-4 right-4 flex gap-2 sm:bottom-5 sm:left-5 sm:right-auto sm:w-[70%]"
        initial={reducedMotion ? false : { y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="evidence-folder flex flex-1 items-center gap-2 px-3 py-2.5">
          <FileText className="size-3.5 text-accent" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="truncate font-mono text-[9px] text-muted-foreground">CASE · VA-4F2A</p>
            <p className="truncate text-xs text-foreground">Health forward</p>
          </div>
          <span className="ml-auto font-mono text-xs text-danger">05</span>
        </div>
        <div className="hidden flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 sm:flex">
          <Link2 className="size-3.5 text-accent-secondary" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="truncate font-mono text-[9px] text-muted-foreground">EVIDENCE CHAIN</p>
            <p className="truncate text-xs text-foreground">3 sources linked</p>
          </div>
        </div>
      </motion.div>

      <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-1">
        <ShieldCheck className="size-3 text-accent" strokeWidth={1.75} />
        <span className="font-mono text-[9px] uppercase tracking-widest text-accent">Live board</span>
      </div>

      {/* Trust gauge */}
      <motion.div
        className="absolute right-4 top-14 hidden w-24 rounded-md border border-border bg-elevated p-3 sm:block"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="meta-label mb-2">Trust</p>
        <p className="font-display text-2xl tabular-nums text-danger">12</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full bg-danger"
            initial={reducedMotion ? false : { width: 0 }}
            animate={{ width: '12%' }}
            transition={{ duration: 0.8, delay: 0.7 }}
          />
        </div>
      </motion.div>
    </div>
  )
}
