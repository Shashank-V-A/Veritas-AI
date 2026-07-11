import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Network, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { slideUp, staggerContainer } from '@/animations/variants'
import { Button } from '@/components/ui/button'
import { api, type GraphSnapshot } from '@/services/api'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const TYPE_COLOR: Record<string, string> = {
  Analysis: '#C8A24A',
  Claim: '#5F7EA7',
  Source: '#3BA55D',
  Domain: '#D9A441',
}

function layoutNodes(snapshot: GraphSnapshot) {
  const width = 720
  const height = 440
  const cx = width / 2
  const cy = height / 2
  const byType = {
    Analysis: snapshot.nodes.filter((n) => n.type === 'Analysis'),
    Claim: snapshot.nodes.filter((n) => n.type === 'Claim'),
    Source: snapshot.nodes.filter((n) => n.type === 'Source'),
    Domain: snapshot.nodes.filter((n) => n.type === 'Domain'),
  }

  const positioned = new Map<string, { x: number; y: number; node: (typeof snapshot.nodes)[0] }>()

  function placeRing(
    nodes: typeof snapshot.nodes,
    radius: number,
    startAngle = -Math.PI / 2,
  ) {
    const n = Math.max(nodes.length, 1)
    nodes.forEach((node, i) => {
      const angle = startAngle + (i / n) * Math.PI * 2
      positioned.set(node.id, {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        node,
      })
    })
  }

  placeRing(byType.Analysis, 0)
  // Center analyses slightly spread if multiple
  byType.Analysis.forEach((node, i) => {
    const offset = byType.Analysis.length === 1 ? 0 : (i - (byType.Analysis.length - 1) / 2) * 48
    positioned.set(node.id, { x: cx + offset, y: cy, node })
  })
  placeRing(byType.Claim, 130)
  placeRing(byType.Source, 200, Math.PI / 10)
  placeRing(byType.Domain, 260, -Math.PI / 8)

  return { width, height, positioned }
}

export function GraphPage() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['graph-constellation'],
    queryFn: () => api.getGraph(40),
    staleTime: 30_000,
  })

  const layout = useMemo(() => (data ? layoutNodes(data) : null), [data])

  return (
    <div className="intel-grid mx-auto max-w-6xl px-4 py-8 md:px-10 md:py-10">
      <motion.div
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'visible'}
      >
        <motion.header variants={reducedMotion ? undefined : slideUp} className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="meta-label flex items-center gap-2 text-accent">
                <Network className="size-3" strokeWidth={1.75} />
                {t('graph.eyebrow')}
              </p>
              <h1 className="mt-3 font-display text-3xl leading-tight text-foreground md:text-4xl">
                {t('graph.title')}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                {t('graph.body')}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
              {t('graph.refresh')}
            </Button>
          </div>
        </motion.header>

        <motion.div variants={reducedMotion ? undefined : slideUp}>
          {isLoading && (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          )}
          {isError && (
            <p className="text-sm text-danger">{t('graph.loadFailed')}</p>
          )}
          {data && !data.configured && (
            <div className="dossier-panel p-6 text-sm text-muted-foreground">
              {t('graph.notConfigured')}
            </div>
          )}
          {data?.error && (
            <div className="mb-4 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground">
              {t('graph.error')}: {data.error}
            </div>
          )}
          {data?.configured && data.connected && data.nodes.length === 0 && !data.error && (
            <div className="dossier-panel p-6 text-sm text-muted-foreground">
              {t('graph.empty')}
            </div>
          )}
          {layout && data && data.nodes.length > 0 && (
            <div className="dossier-panel overflow-hidden p-2 md:p-4">
              <div className="mb-3 flex flex-wrap gap-3 px-2 pt-2">
                {(['Analysis', 'Claim', 'Source', 'Domain'] as const).map((type) => (
                  <span key={type} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLOR[type] }}
                    />
                    {t(`graph.type${type}`)}
                  </span>
                ))}
              </div>
              <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                className="h-auto w-full"
                role="img"
                aria-label={t('graph.title')}
              >
                {data.edges.map((edge) => {
                  const from = layout.positioned.get(edge.from)
                  const to = layout.positioned.get(edge.to)
                  if (!from || !to) return null
                  return (
                    <line
                      key={edge.id}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#2A2A2A"
                      strokeWidth={1}
                    />
                  )
                })}
                {[...layout.positioned.values()].map(({ x, y, node }) => (
                  <g key={node.id} transform={`translate(${x}, ${y})`}>
                    <circle
                      r={node.type === 'Analysis' ? 14 : 9}
                      fill="#111111"
                      stroke={TYPE_COLOR[node.type] ?? '#B3B3B3'}
                      strokeWidth={1.5}
                    />
                    <title>{node.label}</title>
                    <text
                      y={node.type === 'Analysis' ? 28 : 22}
                      textAnchor="middle"
                      fill="#B3B3B3"
                      fontSize={9}
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
                    </text>
                  </g>
                ))}
              </svg>
              <p className="px-2 pb-2 text-[11px] text-muted-foreground">
                {t('graph.stats', { nodes: data.nodes.length, edges: data.edges.length })}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
