import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Network, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { slideUp, staggerContainer } from '@/animations/variants'
import { Button } from '@/components/ui/button'
import { api, type GraphSnapshot } from '@/services/api'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

type GraphNode = GraphSnapshot['nodes'][number]

const TYPE_COLOR: Record<string, string> = {
  Analysis: '#C8A24A',
  Claim: '#5F7EA7',
  Source: '#3BA55D',
  Domain: '#D9A441',
}

const TYPE_RING: Record<string, string> = {
  Analysis: 'rgba(200,162,74,0.2)',
  Claim: 'rgba(95,126,167,0.18)',
  Source: 'rgba(59,165,93,0.16)',
  Domain: 'rgba(217,164,65,0.16)',
}

function wrapLabel(text: string, maxChars: number, maxLines = 2): string[] {
  const clean = text.trim()
  if (clean.length <= maxChars) return [clean]

  const words = clean.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length >= maxLines) break
  }

  if (lines.length < maxLines && current) lines.push(current)

  const last = lines[lines.length - 1] ?? ''
  if (clean.length > lines.join(' ').length || last.length > maxChars) {
    lines[lines.length - 1] = `${last.slice(0, Math.max(maxChars - 1, 4))}…`
  }
  return lines.slice(0, maxLines)
}

function displayLabel(node: GraphNode, t: (key: string) => string): string {
  if (node.type === 'Analysis') {
    const verdict = String(node.meta?.verdict ?? node.label ?? 'case')
    const score = node.meta?.trustScore
    const scoreBit =
      typeof score === 'number' && Number.isFinite(score) ? ` · ${Math.round(score)}` : ''
    return `${t('graph.typeAnalysis')}: ${verdict}${scoreBit}`
  }
  return node.label
}

function layoutNodes(snapshot: GraphSnapshot) {
  const analysisCount = snapshot.nodes.filter((n) => n.type === 'Analysis').length
  const claimCount = snapshot.nodes.filter((n) => n.type === 'Claim').length
  const sourceCount = snapshot.nodes.filter((n) => n.type === 'Source').length
  const domainCount = snapshot.nodes.filter((n) => n.type === 'Domain').length

  const width = Math.max(960, 720 + analysisCount * 40)
  const height = Math.max(620, 520 + Math.max(claimCount, sourceCount, domainCount) * 4)
  const cx = width / 2
  const cy = height / 2 + 8

  const byType = {
    Analysis: snapshot.nodes.filter((n) => n.type === 'Analysis'),
    Claim: snapshot.nodes.filter((n) => n.type === 'Claim'),
    Source: snapshot.nodes.filter((n) => n.type === 'Source'),
    Domain: snapshot.nodes.filter((n) => n.type === 'Domain'),
  }

  const positioned = new Map<
    string,
    { x: number; y: number; node: GraphNode; labelLines: string[] }
  >()

  function placeRing(
    nodes: GraphNode[],
    radius: number,
    startAngle = -Math.PI / 2,
    maxChars: number,
  ) {
    const n = Math.max(nodes.length, 1)
    // Leave a gap so first/last labels don't collide on the circle seam
    const sweep = nodes.length <= 1 ? 0 : Math.PI * 2 * (1 - 0.04)
    nodes.forEach((node, i) => {
      const angle = startAngle + (nodes.length <= 1 ? 0 : (i / n) * sweep)
      positioned.set(node.id, {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        node,
        labelLines: wrapLabel(node.label, maxChars),
      })
    })
  }

  // Spread analyses across the center so verdict labels never stack
  const analysisGap = Math.max(160, Math.min(220, width / Math.max(analysisCount, 1) - 40))
  byType.Analysis.forEach((node, i) => {
    const offset =
      byType.Analysis.length === 1
        ? 0
        : (i - (byType.Analysis.length - 1) / 2) * analysisGap
    positioned.set(node.id, {
      x: cx + offset,
      y: cy,
      node,
      labelLines: wrapLabel(
        `${String(node.meta?.verdict ?? node.label)}`,
        16,
        1,
      ),
    })
  })

  const claimR = 155 + Math.min(claimCount, 12) * 4
  const sourceR = claimR + 95
  const domainR = sourceR + 90

  placeRing(byType.Claim, claimR, -Math.PI / 2, 18)
  placeRing(byType.Source, sourceR, Math.PI / 11, 16)
  placeRing(byType.Domain, domainR, -Math.PI / 7, 14)

  return { width, height, positioned, cx, cy }
}

export function GraphPage() {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['graph-constellation'],
    queryFn: () => api.getGraph(40),
    staleTime: 30_000,
  })

  const layout = useMemo(() => (data ? layoutNodes(data) : null), [data])

  const activeId = hoveredId ?? selectedId
  const activeNode = activeId && data ? data.nodes.find((n) => n.id === activeId) : null
  const relatedEdgeCount =
    activeId && data
      ? data.edges.filter((e) => e.from === activeId || e.to === activeId).length
      : 0

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
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="dossier-panel overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3">
                  {(['Analysis', 'Claim', 'Source', 'Domain'] as const).map((type) => {
                    const count = data.nodes.filter((n) => n.type === type).length
                    return (
                      <span
                        key={type}
                        className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        <span
                          className="size-2.5 rounded-full"
                          style={{
                            backgroundColor: TYPE_COLOR[type],
                            boxShadow: `0 0 0 2px #111, 0 0 0 3px ${TYPE_COLOR[type]}`,
                          }}
                        />
                        {t(`graph.type${type}`)}
                        <span className="tabular-nums text-foreground/70">{count}</span>
                      </span>
                    )
                  })}
                </div>

                <div className="relative bg-[#0c0c0c]">
                  <svg
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label={t('graph.title')}
                  >
                    <defs>
                      <radialGradient id="graph-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(200,162,74,0.08)" />
                        <stop offset="100%" stopColor="rgba(200,162,74,0)" />
                      </radialGradient>
                    </defs>
                    <circle
                      cx={layout.cx}
                      cy={layout.cy}
                      r={210}
                      fill="url(#graph-glow)"
                    />

                    {data.edges.map((edge) => {
                      const from = layout.positioned.get(edge.from)
                      const to = layout.positioned.get(edge.to)
                      if (!from || !to) return null
                      const isActive =
                        activeId != null &&
                        (edge.from === activeId || edge.to === activeId)
                      const isDimmed = activeId != null && !isActive
                      return (
                        <line
                          key={edge.id}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={isActive ? '#C8A24A' : '#3A3A3A'}
                          strokeWidth={isActive ? 1.75 : 1.15}
                          strokeOpacity={isDimmed ? 0.2 : 0.85}
                        />
                      )
                    })}

                    {[...layout.positioned.values()].map(({ x, y, node, labelLines }) => {
                      const color = TYPE_COLOR[node.type] ?? '#B3B3B3'
                      const isAnalysis = node.type === 'Analysis'
                      const isActive = activeId === node.id
                      const isDimmed = activeId != null && !isActive
                      const r = isAnalysis ? 18 : node.type === 'Claim' ? 11 : 9
                      const labelY = isAnalysis ? r + 16 : r + 14

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${x}, ${y})`}
                          opacity={isDimmed ? 0.28 : 1}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredId(node.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onClick={() =>
                            setSelectedId((prev) => (prev === node.id ? null : node.id))
                          }
                        >
                          {(isActive || isAnalysis) && (
                            <circle
                              r={r + 8}
                              fill={TYPE_RING[node.type] ?? 'transparent'}
                              stroke={isActive ? color : 'transparent'}
                              strokeWidth={1}
                            />
                          )}
                          <circle
                            r={r}
                            fill="#141414"
                            stroke={color}
                            strokeWidth={isActive ? 2.5 : 1.75}
                          />
                          {isAnalysis && (
                            <circle r={4} fill={color} />
                          )}
                          <title>{displayLabel(node, t)}</title>
                          {labelLines.map((line, i) => (
                            <text
                              key={`${node.id}-l${i}`}
                              y={labelY + i * 12}
                              textAnchor="middle"
                              fill={isActive ? '#F5F5F5' : '#C8C8C8'}
                              fontSize={isAnalysis ? 11 : 10}
                              fontWeight={isAnalysis || isActive ? 600 : 400}
                              fontFamily="IBM Plex Sans, system-ui, sans-serif"
                              style={{ pointerEvents: 'none' }}
                            >
                              {line}
                            </text>
                          ))}
                          {isAnalysis && (
                            <text
                              y={labelY + 14}
                              textAnchor="middle"
                              fill="#8A8A8A"
                              fontSize={9}
                              fontFamily="IBM Plex Mono, ui-monospace, monospace"
                              style={{ pointerEvents: 'none' }}
                            >
                              {t('graph.typeAnalysis')}
                              {typeof node.meta?.trustScore === 'number'
                                ? ` · ${Math.round(Number(node.meta.trustScore))}`
                                : ''}
                            </text>
                          )}
                        </g>
                      )
                    })}
                  </svg>
                </div>

                <p className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
                  {t('graph.stats', {
                    nodes: data.nodes.length,
                    edges: data.edges.length,
                  })}
                  {' · '}
                  {t('graph.hint')}
                </p>
              </div>

              <aside className="dossier-panel flex flex-col p-4">
                <p className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                  {t('graph.inspector')}
                </p>
                {activeNode ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <span
                        className="inline-flex items-center gap-1.5 border px-2 py-1 font-sans text-[10px] uppercase tracking-[0.14em]"
                        style={{
                          borderColor: `${TYPE_COLOR[activeNode.type]}66`,
                          color: TYPE_COLOR[activeNode.type],
                        }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: TYPE_COLOR[activeNode.type] }}
                        />
                        {t(`graph.type${activeNode.type}`)}
                      </span>
                      <p className="mt-3 font-display text-lg leading-snug text-foreground">
                        {displayLabel(activeNode, t)}
                      </p>
                    </div>

                    {activeNode.type === 'Analysis' && (
                      <dl className="space-y-2 border-t border-border pt-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t('graph.verdict')}</dt>
                          <dd className="font-medium capitalize text-foreground">
                            {String(activeNode.meta?.verdict ?? activeNode.label)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t('graph.trustScore')}</dt>
                          <dd className="font-mono tabular-nums text-foreground">
                            {typeof activeNode.meta?.trustScore === 'number'
                              ? Math.round(Number(activeNode.meta.trustScore))
                              : '—'}
                          </dd>
                        </div>
                      </dl>
                    )}

                    {activeNode.type === 'Claim' && (
                      <dl className="space-y-2 border-t border-border pt-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t('graph.status')}</dt>
                          <dd className="font-medium capitalize text-foreground">
                            {String(activeNode.meta?.status ?? '—')}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t('graph.confidence')}</dt>
                          <dd className="font-mono tabular-nums text-foreground">
                            {typeof activeNode.meta?.confidence === 'number'
                              ? Math.round(Number(activeNode.meta.confidence))
                              : '—'}
                          </dd>
                        </div>
                        <p className="pt-1 text-[13px] leading-relaxed text-muted-foreground">
                          {activeNode.label}
                        </p>
                      </dl>
                    )}

                    {(activeNode.type === 'Source' || activeNode.type === 'Domain') && (
                      <p className="border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground break-all">
                        {activeNode.type === 'Source'
                          ? String(activeNode.meta?.url ?? activeNode.label)
                          : activeNode.label}
                      </p>
                    )}

                    <p className="text-[11px] text-muted-foreground">
                      {t('graph.connections', { count: relatedEdgeCount })}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {t('graph.inspectorEmpty')}
                  </p>
                )}
              </aside>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
