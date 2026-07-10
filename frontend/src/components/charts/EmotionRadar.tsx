import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { CHART_COLORS } from '@/lib/chartColors'
import type { EmotionAnalysis } from '@/types'

interface EmotionRadarProps {
  emotion: EmotionAnalysis
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { metric: string; value: number } }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-sm border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{item.metric}</p>
      <p className="tabular-nums text-accent">{item.value}/100</p>
    </div>
  )
}

export function EmotionRadar({ emotion }: EmotionRadarProps) {
  const data = [
    { metric: 'Fear', value: emotion.fear },
    { metric: 'Urgency', value: emotion.urgency },
    { metric: 'Anger', value: emotion.anger },
    { metric: 'Sensationalism', value: emotion.sensationalism },
    { metric: 'Loaded language', value: emotion.loadedLanguage },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Dominant emotion
        </p>
        <span className="border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-sans text-[11px] font-medium capitalize tracking-wide text-accent">
          {emotion.dominant}
        </span>
      </div>

      <div className="h-56 w-full" aria-label="Emotion analysis radar chart">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="52%" outerRadius="68%">
            <PolarGrid
              stroke={CHART_COLORS.grid}
              strokeOpacity={0.9}
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="metric"
              tick={{
                fill: CHART_COLORS.muted,
                fontSize: 11,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              tickLine={false}
            />
            <Radar
              name="Intensity"
              dataKey="value"
              stroke={CHART_COLORS.accent}
              fill={CHART_COLORS.accent}
              fillOpacity={0.18}
              strokeWidth={1.75}
              isAnimationActive
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {data.map((item) => (
          <li key={item.metric} className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[11px] text-muted-foreground">{item.metric}</span>
            <span className="font-sans text-[12px] font-medium tabular-nums text-foreground">
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
