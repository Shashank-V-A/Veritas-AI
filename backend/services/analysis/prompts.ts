import type { SourceType } from '@veritas/shared'

export const CREDIBILITY_REPORT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    trustScore: { type: 'number', minimum: 0, maximum: 100 },
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          status: {
            type: 'string',
            enum: ['verified', 'disputed', 'unverified', 'false'],
          },
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          evidence: { type: 'array', items: { type: 'string' } },
          explanation: { type: 'string' },
        },
        required: ['claim', 'status', 'confidence', 'evidence', 'explanation'],
        additionalProperties: false,
      },
    },
    bias: {
      type: 'object',
      properties: {
        overall: { type: 'number', minimum: 0, maximum: 100 },
        political: { type: 'number', minimum: 0, maximum: 100 },
        commercial: { type: 'number', minimum: 0, maximum: 100 },
        ideological: { type: 'number', minimum: 0, maximum: 100 },
        explanation: { type: 'string' },
      },
      required: ['overall', 'political', 'commercial', 'ideological', 'explanation'],
      additionalProperties: false,
    },
    emotion: {
      type: 'object',
      properties: {
        fear: { type: 'number', minimum: 0, maximum: 100 },
        urgency: { type: 'number', minimum: 0, maximum: 100 },
        anger: { type: 'number', minimum: 0, maximum: 100 },
        sensationalism: { type: 'number', minimum: 0, maximum: 100 },
        loadedLanguage: { type: 'number', minimum: 0, maximum: 100 },
        dominant: { type: 'string' },
      },
      required: [
        'fear',
        'urgency',
        'anger',
        'sensationalism',
        'loadedLanguage',
        'dominant',
      ],
      additionalProperties: false,
    },
    fallacies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          excerpt: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['type', 'excerpt', 'explanation'],
        additionalProperties: false,
      },
    },
    missingContext: { type: 'array', items: { type: 'string' } },
    neutralRewrite: { type: 'string' },
    eli15: { type: 'string' },
    summary: { type: 'string' },
    verdict: {
      type: 'string',
      enum: ['credible', 'mixed', 'misleading', 'unsupported'],
    },
    suggestedReading: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['title', 'reason'],
        additionalProperties: false,
      },
    },
    reasoningTimeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step: { type: 'string' },
          description: { type: 'string' },
          timestamp: { type: 'string' },
        },
        required: ['step', 'description'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'trustScore',
    'claims',
    'bias',
    'emotion',
    'fallacies',
    'missingContext',
    'neutralRewrite',
    'eli15',
    'summary',
    'verdict',
    'suggestedReading',
    'reasoningTimeline',
  ],
  additionalProperties: false,
} as const

const SOURCE_LABELS: Record<SourceType, string> = {
  article: 'news article',
  social: 'social media post',
  transcript: 'video or audio transcript',
  forward: 'messaging forward or chain message',
  blog: 'blog post',
  pdf: 'PDF document text',
  raw: 'raw text',
}

export const SYSTEM_PROMPT = `You are Veritas AI, a professional credibility analysis engine.

Your job is to analyze information and produce a structured credibility report. You do NOT chat. You do NOT use markdown. You return ONLY valid JSON matching the provided schema.

Analysis steps you MUST perform:
1. Claim Extraction — identify distinct factual claims
2. Evidence Summary — note supporting or contradicting evidence for each claim
3. Credibility Score — overall trustScore from 0 (untrustworthy) to 100 (highly credible)
4. Emotional Manipulation Detection — score fear, urgency, anger, sensationalism, loaded language
5. Bias Detection — political, commercial, ideological bias scores
6. Logical Fallacies — cherry picking, false dilemma, appeal to emotion, ad hominem, false cause, etc.
7. Missing Context — what crucial context is absent
8. Neutral Rewrite — rewrite loaded text in neutral factual language
9. Explain Like I'm 15 — simple plain-language summary
10. Overall Verdict — credible, mixed, misleading, or unsupported

Rules:
- Base assessments on reasoning and evidence, not political opinion
- Flag uncertainty via confidence scores
- If evidence is insufficient, mark claims as unverified rather than false
- Never invent URLs; omit url field in suggestedReading if none applies
- Return empty arrays when no fallacies or missing context found
- reasoningTimeline should document your analysis steps in order`

export function buildUserPrompt(input: {
  content: string
  sourceType: SourceType
  title?: string
  compareContent?: string
  searchContext?: string
}) {
  const sourceLabel = SOURCE_LABELS[input.sourceType]
  const titleLine = input.title ? `Title: ${input.title}\n` : ''

  const forwardInstructions =
    input.sourceType === 'forward'
      ? `
Forward-specific instructions:
- Treat this as a viral messaging forward or chain message
- Watch for urgency hooks, conspiracy framing, and "share before deleted" language
- Identify anonymous authority claims ("doctors say", "they don't want you to know")
- Flag health or financial promises that lack named credible sources
`
      : ''

  const compareInstructions = input.compareContent
    ? `
Compare mode:
- Analyze the PRIMARY content below for credibility
- Use the COMPARISON content as a reference point — note agreements, contradictions, and framing differences
- Highlight what each version adds, omits, or distorts relative to the other
- Include comparison insights in summary, claims, and missingContext where relevant
`
    : ''

  const comparisonBlock = input.compareContent
    ? `

---
COMPARISON CONTENT (reference only):
${input.compareContent}
---`
    : ''

  const searchBlock = input.searchContext
    ? `

WEB SEARCH RESULTS (use for suggestedReading URLs and evidence — prefer these real sources):
${input.searchContext}
`
    : ''

  return `${titleLine}Source type: ${sourceLabel}
${forwardInstructions}${compareInstructions}${searchBlock}
Analyze the following content and return a complete credibility report as JSON:

---
${input.content}
---${comparisonBlock}`
}

export function buildRepairPrompt(invalidJson: string, validationError: string) {
  return `Your previous response was invalid JSON or did not match the schema.

Validation error: ${validationError}

Invalid output:
${invalidJson.slice(0, 4000)}

Return ONLY corrected JSON matching the schema. No markdown fences. No commentary.`
}
