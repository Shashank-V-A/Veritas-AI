import type { AnalysisRecord, SourceType } from '@veritas/shared'

/** Static demo dossier — visible on landing without sign-in */

export interface AnalysisPrefill {
  content: string
  sourceType: SourceType
  title?: string
}

export const SAMPLE_REPORT: AnalysisRecord = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Viral health forward — lemon water cure',
  content:
    'BREAKING: Doctors are HIDING this! Drinking warm lemon water every morning cures ALL chronic diseases within 7 days. Big Pharma doesn\'t want you to know. Share before they delete this!!!',
  sourceType: 'forward',
  trustScore: 18,
  createdAt: new Date().toISOString(),
  report: {
    trustScore: 18,
    verdict: 'misleading',
    summary:
      'This forward uses urgency, conspiracy framing, and absolute medical claims without evidence. No credible source supports a universal 7-day cure for chronic disease via lemon water.',
    eli15:
      'It\'s like saying eating an apple fixes every problem in your body in one week — sounds nice, but real doctors need proof, not scary "they\'re hiding it" language.',
    neutralRewrite:
      'Some people believe warm lemon water may support hydration and vitamin C intake. There is no scientific evidence that it cures chronic diseases within seven days. Consult a healthcare provider for medical treatment.',
    claims: [
      {
        claim: 'Warm lemon water cures all chronic diseases within 7 days',
        status: 'false',
        confidence: 94,
        evidence: [
          'No peer-reviewed study supports universal cure timelines for chronic disease',
          'Major health authorities do not endorse single-food cures',
        ],
        explanation:
          'Absolute cure claims for diverse chronic conditions are medically implausible and characteristic of health misinformation.',
      },
      {
        claim: 'Doctors are deliberately hiding this treatment',
        status: 'unverified',
        confidence: 88,
        evidence: [
          'Conspiracy framing without identifiable sources or documentation',
        ],
        explanation:
          'Unfalsifiable conspiracy language is a common manipulation tactic in viral forwards.',
      },
      {
        claim: 'Big Pharma suppresses simple natural remedies',
        status: 'disputed',
        confidence: 76,
        evidence: [
          'General anti-institution trope; no specific evidence cited in source',
        ],
        explanation:
          'Broad institutional blame without evidence weakens credibility regardless of underlying policy debates.',
      },
    ],
    bias: {
      overall: 82,
      political: 35,
      commercial: 70,
      ideological: 78,
      explanation:
        'Strong anti-establishment and commercial suspicion framing designed to bypass critical evaluation.',
    },
    emotion: {
      fear: 72,
      urgency: 91,
      anger: 58,
      sensationalism: 95,
      loadedLanguage: 88,
      dominant: 'Urgency + sensationalism',
    },
    fallacies: [
      {
        type: 'False cause',
        excerpt: 'cures ALL chronic diseases within 7 days',
        explanation: 'Assumes a single habit causes a universal medical outcome without evidence.',
      },
      {
        type: 'Appeal to conspiracy',
        excerpt: 'Doctors are HIDING this',
        explanation: 'Replaces evidence with suspicion of institutions.',
      },
    ],
    missingContext: [
      'No citations to medical studies or clinical trials',
      'No definition of which "chronic diseases" are referenced',
      'No qualified medical source quoted',
    ],
    suggestedReading: [
      {
        title: 'WHO — Mythbusters: Health misinformation',
        reason: 'Framework for evaluating viral health claims',
      },
    ],
    reasoningTimeline: [
      {
        step: 'Claim extraction',
        description: 'Identified 3 testable assertions in the forward.',
      },
      {
        step: 'Evidence scan',
        description: 'No credible medical literature supports the 7-day cure claim.',
      },
      {
        step: 'Manipulation signals',
        description: 'Urgency caps, conspiracy framing, and absolute language detected.',
      },
      {
        step: 'Verdict synthesis',
        description: 'Composite trust score weighted toward misinformation patterns.',
      },
    ],
  },
}

export const SAMPLE_ORIGINAL_SNIPPET =
  'Drinking warm lemon water every morning cures ALL chronic diseases within 7 days. Doctors are HIDING this!'

export const EXAMPLE_PROMPTS = [
  {
    label: 'Viral health claim',
    sourceType: 'forward' as const,
    title: 'Health forward analysis',
    content:
      'BREAKING: Scientists urge immediate action on shocking new discovery that will change everything! Drinking warm water with lemon cures all chronic diseases within 7 days. Doctors are hiding this secret.',
  },
  {
    label: 'Political post',
    sourceType: 'social' as const,
    title: 'Social post analysis',
    content:
      'They don\'t want you to see this. Politicians on both sides are lying about the economy — here\'s the REAL truth the media won\'t report. Share before it\'s taken down.',
  },
  {
    label: 'News excerpt',
    sourceType: 'article' as const,
    title: 'Article analysis',
    content:
      'A new study suggests moderate coffee consumption may be linked to lower risk of certain heart conditions. Researchers analyzed data from 50,000 participants over 10 years, publishing findings in a peer-reviewed journal.',
  },
]
