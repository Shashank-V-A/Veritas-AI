import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getClaimStatusColor,
  getClaimStatusLabel,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Claim } from '@veritas/shared'

interface ClaimCardProps {
  claim: Claim
  index: number
  variant?: 'default' | 'dossier'
}

export function ClaimCard({ claim, index, variant = 'default' }: ClaimCardProps) {
  const [expanded, setExpanded] = useState(index === 0)
  const isDossier = variant === 'dossier'

  return (
    <motion.div
      id={`claim-card-${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-md',
        isDossier
          ? 'border border-accent/20 bg-surface-secondary/80'
          : 'border border-accent/20 bg-accent/5 hover:border-accent/40',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'flex w-full items-start gap-4 p-4 text-left transition-colors',
          !isDossier && 'hover:bg-accent/10',
        )}
        aria-expanded={expanded}
      >
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border border-accent/30 font-mono text-[10px] text-accent">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-card-foreground">{claim.claim}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'stamp border-current text-[9px]',
                getClaimStatusColor(claim.status),
              )}
            >
              {getClaimStatusLabel(claim.status)}
            </span>
            <span className="font-mono text-[10px] text-card-foreground/50">
              {claim.confidence}% confidence
            </span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-card-foreground/40 transition-transform',
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
            <div className="border-t border-accent/15 px-4 pb-4 pt-3 pl-[3.25rem]">
              <p className="text-sm leading-relaxed text-card-foreground/70">
                {claim.explanation}
              </p>
              {claim.evidence.length > 0 && (
                <div className="mt-3">
                  <p className="font-mono text-[10px] text-card-foreground/45">
                    Supporting notes
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {claim.evidence.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-xs leading-relaxed text-card-foreground/60"
                      >
                        <Check className="mt-0.5 size-3 shrink-0 text-accent" />
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
    </motion.div>
  )
}
