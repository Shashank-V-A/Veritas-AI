import type { CredibilityReport, SourceType } from '@veritas/shared'

interface StubInput {
  content: string
  sourceType: SourceType
  title?: string
}

/**
 * Development-only stub report generator.
 * Replaced by Mesh API pipeline in Step 4.
 */
export function createStubReport(input: StubInput): CredibilityReport {
  const excerpt = input.content.slice(0, 120).replace(/\s+/g, ' ').trim()
  const wordCount = input.content.split(/\s+/).filter(Boolean).length
  const hasUrgentLanguage = /urgent|immediately|shocking|breaking/i.test(input.content)
  const trustScore = hasUrgentLanguage ? 42 : 68

  return {
    trustScore,
    claims: [
      {
        claim: excerpt || 'Primary assertion from submitted content',
        status: hasUrgentLanguage ? 'disputed' : 'unverified',
        confidence: hasUrgentLanguage ? 38 : 55,
        evidence: [
          'Stub analyzer — no external evidence retrieved yet.',
          'Mesh API integration will verify claims in Step 4.',
        ],
        explanation:
          'This is a placeholder assessment generated without live AI analysis. Configure Mesh API for real claim verification.',
      },
    ],
    bias: {
      overall: hasUrgentLanguage ? 62 : 34,
      political: hasUrgentLanguage ? 45 : 20,
      commercial: 25,
      ideological: hasUrgentLanguage ? 40 : 18,
      explanation: hasUrgentLanguage
        ? 'Language patterns suggest elevated emotional framing and possible agenda-driven presentation.'
        : 'Content appears moderately neutral with limited detectable bias in stub mode.',
    },
    emotion: {
      fear: hasUrgentLanguage ? 72 : 28,
      urgency: hasUrgentLanguage ? 85 : 22,
      anger: hasUrgentLanguage ? 48 : 15,
      sensationalism: hasUrgentLanguage ? 78 : 20,
      loadedLanguage: hasUrgentLanguage ? 65 : 25,
      dominant: hasUrgentLanguage ? 'urgency' : 'neutral',
    },
    fallacies: hasUrgentLanguage
      ? [
          {
            type: 'Appeal to Emotion',
            excerpt: 'Emotionally charged phrasing detected in source text.',
            explanation:
              'The content may rely on urgency or fear rather than substantiated evidence.',
          },
        ]
      : [],
    missingContext: [
      'Stub mode cannot retrieve external sources or full article context.',
      `Only ${wordCount} words were evaluated locally.`,
    ],
    neutralRewrite: excerpt
      ? `A source shared the following information for review: "${excerpt}..." Further verification is recommended before accepting this as fact.`
      : 'The submitted content requires verification against independent sources.',
    eli15:
      'We read what you pasted and checked if it sounds trustworthy. Right now this is a practice report — the real AI brain connects in the next step.',
    summary: hasUrgentLanguage
      ? 'Content shows signs of emotional manipulation and unverified claims. Treat with caution until Mesh API analysis is enabled.'
      : 'Content appears moderately balanced but remains unverified. Enable Mesh API for a full credibility assessment.',
    verdict: hasUrgentLanguage ? 'misleading' : 'mixed',
    suggestedReading: [
      {
        title: 'How to evaluate source credibility',
        reason: 'Framework for assessing information before sharing.',
      },
    ],
    reasoningTimeline: [
      {
        step: 'Content received',
        description: `Parsed ${wordCount} words from ${input.sourceType} source.`,
      },
      {
        step: 'Stub analysis',
        description:
          'Generated placeholder report. Mesh API pipeline replaces this in Step 4.',
      },
      {
        step: 'Report assembled',
        description: 'Structured credibility report ready for review.',
      },
    ],
  }
}
