import { useMemo } from 'react'
import type { Claim, ClaimRelation } from '@veritas/shared'
import { cn } from '@/lib/utils'

interface ClaimGraphProps {
  claims: Claim[]
  relations: ClaimRelation[]
  className?: string
}

const STATUS_COLORS: Record<string, string> = {
  verified: '#2d5a4a',
  disputed: '#b8860b',
  unverified: '#5c5a55',
  false: '#a63d3d',
}

const RELATION_COLORS: Record<ClaimRelation['type'], string> = {
  supports: '#2d5a4a',
  contradicts: '#a63d3d',
  related: '#9a7b4f',
}

export function ClaimGraph({ claims, relations, className }: ClaimGraphProps) {
  const layout = useMemo(() => {
    const width = 480
    const height = Math.max(200, claims.length * 72 + 40)
    const cx = width / 2
    const radius = Math.min(140, height / 2 - 36)

    const nodes = claims.map((claim, i) => {
      const angle = (i / Math.max(claims.length, 1)) * Math.PI * 2 - Math.PI / 2
      return {
        index: i,
        claim,
        x: cx + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
      }
    })

    return { width, height, nodes }
  }, [claims])

  if (claims.length === 0) return null

  return (
    <div className={cn('overflow-x-auto', className)}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="mx-auto w-full max-w-lg"
        role="img"
        aria-label="Claim relationship graph"
      >
        <defs>
          <marker
            id="arrow-supports"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill={RELATION_COLORS.supports} />
          </marker>
          <marker
            id="arrow-contradicts"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill={RELATION_COLORS.contradicts} />
          </marker>
          <marker
            id="arrow-related"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill={RELATION_COLORS.related} />
          </marker>
        </defs>

        {relations.map((rel, i) => {
          const from = layout.nodes[rel.from]
          const to = layout.nodes[rel.to]
          if (!from || !to) return null
          return (
            <line
              key={`${rel.from}-${rel.to}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={RELATION_COLORS[rel.type]}
              strokeWidth={1.5}
              strokeDasharray={rel.type === 'related' ? '4 3' : undefined}
              markerEnd={`url(#arrow-${rel.type})`}
              opacity={0.75}
            />
          )
        })}

        {layout.nodes.map((node) => (
          <g key={node.index}>
            <circle
              cx={node.x}
              cy={node.y}
              r={18}
              fill={STATUS_COLORS[node.claim.status] ?? '#5c5a55'}
              opacity={0.9}
            />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              fill="#fafaf8"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              {node.index + 1}
            </text>
            <title>{node.claim.claim}</title>
          </g>
        ))}
      </svg>

      <ul className="mt-3 space-y-1">
        {layout.nodes.map((node) => (
          <li
            key={node.index}
            className="flex gap-2 font-mono text-[10px] text-card-foreground/65"
          >
            <span
              className="size-2 shrink-0 self-center rounded-full"
              style={{ background: STATUS_COLORS[node.claim.status] }}
            />
            <span className="tabular-nums text-card-foreground/45">{node.index + 1}.</span>
            <span className="line-clamp-1">{node.claim.claim}</span>
          </li>
        ))}
      </ul>

      {relations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-card-foreground/50">
          {(Object.keys(RELATION_COLORS) as ClaimRelation['type'][]).map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block h-px w-4"
                style={{ background: RELATION_COLORS[type] }}
              />
              {type}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
