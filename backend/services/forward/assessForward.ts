export interface ForwardRiskAssessment {
  score: number
  signals: string[]
  suggestedSourceType: 'forward'
}

const FORWARD_PATTERNS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  { pattern: /share before (it's |it is )?deleted/i, label: 'Urgency: share before deleted', weight: 18 },
  { pattern: /forward this to \d+/i, label: 'Chain forward request', weight: 15 },
  { pattern: /doctors are hiding/i, label: 'Anonymous authority: doctors hiding', weight: 16 },
  { pattern: /big pharma/i, label: 'Anti-institution: Big Pharma', weight: 12 },
  { pattern: /they don'?t want you to know/i, label: 'Conspiracy framing', weight: 14 },
  { pattern: /breaking[!:]/i, label: 'False urgency: BREAKING', weight: 10 },
  { pattern: /cures? all/i, label: 'Absolute cure claim', weight: 14 },
  { pattern: /within \d+ days?/i, label: 'Miracle timeline claim', weight: 10 },
  { pattern: /whatsapp|telegram/i, label: 'Messaging platform forward', weight: 8 },
  { pattern: /Jai Hind|forwarded as received/i, label: 'Classic forward footer', weight: 12 },
]

export function assessForwardRisk(content: string): ForwardRiskAssessment {
  const signals: string[] = []
  let score = 0

  const capsRatio = (content.match(/[A-Z]/g)?.length ?? 0) / Math.max(content.length, 1)
  if (capsRatio > 0.25) {
    signals.push('High ALL-CAPS ratio')
    score += 12
  }

  for (const { pattern, label, weight } of FORWARD_PATTERNS) {
    if (pattern.test(content)) {
      signals.push(label)
      score += weight
    }
  }

  const exclamationCount = (content.match(/!/g) ?? []).length
  if (exclamationCount >= 3) {
    signals.push(`Excessive exclamation marks (${exclamationCount})`)
    score += Math.min(exclamationCount * 2, 12)
  }

  return {
    score: Math.min(100, score),
    signals,
    suggestedSourceType: 'forward',
  }
}

export function shouldAutoDetectForward(content: string): boolean {
  const { score } = assessForwardRisk(content)
  return score >= 25
}
