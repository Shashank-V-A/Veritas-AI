import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getClaimStatusColor,
  getClaimStatusLabel,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Claim } from '@/types'

interface ClaimCardProps {
  claim: Claim
  index: number
}

export function ClaimCard({ claim, index }: ClaimCardProps) {
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-surface-secondary/40"
        aria-expanded={expanded}
      >
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-xs font-medium text-muted-foreground">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-foreground">{claim.claim}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium',
                getClaimStatusColor(claim.status),
              )}
            >
              {getClaimStatusLabel(claim.status)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {claim.confidence}% confidence
            </span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted transition-transform',
            expanded && 'rotate-180',
          )}
          strokeWidth={1.75}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3 pl-14">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {claim.explanation}
              </p>
              {claim.evidence.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
                    Evidence
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {claim.evidence.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
