import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
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
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{item.metric}</p>
      <p className="text-muted-foreground">{item.value}/100</p>
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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Dominant emotion</p>
        <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-xs capitalize text-foreground">
          {emotion.dominant}
        </span>
      </div>

      <div className="h-64 w-full" aria-label="Emotion analysis radar chart">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke={CHART_COLORS.grid} />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: CHART_COLORS.muted, fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name="Intensity"
              dataKey="value"
              stroke={CHART_COLORS.cyan}
              fill={CHART_COLORS.cyan}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
