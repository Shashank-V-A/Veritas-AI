import type { AnalysisCategory, CredibilityReport, SourceType } from '@veritas/shared'

export type SampleCaseId = 'health' | 'political' | 'news'

export interface SampleCaseDefinition {
  id: SampleCaseId
  title: string
  content: string
  sourceType: SourceType
  category: AnalysisCategory
  report: CredibilityReport
}

const SAMPLE_CASES: Record<SampleCaseId, SampleCaseDefinition> = {
  health: {
    id: 'health',
    title: 'Health forward analysis',
    content:
      'BREAKING: Scientists urge immediate action on shocking new discovery that will change everything! Drinking warm water with lemon cures all chronic diseases within 7 days. Doctors are hiding this secret.',
    sourceType: 'forward',
    category: 'health',
    report: {
      trustScore: 22,
      verdict: 'misleading',
      summary:
        'Viral health forward using urgency and conspiracy framing. The claim that lemon water cures all chronic diseases in seven days is not supported by medical evidence.',
      eli15:
        'It sounds scary and urgent, but no single drink can fix every long-term illness in a week. Real medicine needs proof, not “they are hiding it” headlines.',
      neutralRewrite:
        'Some people drink warm lemon water for hydration or vitamin C. There is no reliable evidence that it cures chronic diseases within seven days.',
      claims: [
        {
          claim: 'Warm lemon water cures all chronic diseases within 7 days',
          status: 'false',
          confidence: 92,
          evidence: [
            'No peer-reviewed evidence supports universal cure timelines for chronic disease',
          ],
          explanation: 'Absolute medical cure claims across all chronic conditions are implausible.',
        },
        {
          claim: 'Doctors are hiding this secret treatment',
          status: 'unverified',
          confidence: 85,
          evidence: ['Conspiracy framing without identifiable sources'],
          explanation: 'Unfalsifiable secrecy claims are a common misinformation tactic.',
        },
      ],
      bias: {
        overall: 78,
        political: 30,
        commercial: 65,
        ideological: 70,
        explanation: 'Anti-establishment and sensational framing dominates the message.',
      },
      emotion: {
        fear: 68,
        urgency: 88,
        anger: 45,
        sensationalism: 90,
        loadedLanguage: 82,
        dominant: 'urgency',
      },
      fallacies: [
        {
          type: 'Appeal to emotion',
          excerpt: 'BREAKING: shocking new discovery',
          explanation: 'Uses alarm language instead of evidence.',
        },
      ],
      missingContext: ['No clinical trials or medical sources cited'],
      suggestedReading: [
        {
          title: 'Evaluating viral health claims',
          reason: 'Framework for spotting medical misinformation',
        },
      ],
      reasoningTimeline: [
        { step: 'Claim extraction', description: 'Identified testable health assertions.' },
        { step: 'Evidence scan', description: 'No credible medical support for universal cure.' },
        { step: 'Verdict', description: 'Misleading forward patterns with false medical claim.' },
      ],
    },
  },
  political: {
    id: 'political',
    title: 'Social post analysis',
    content:
      "They don't want you to see this. Politicians on both sides are lying about the economy — here's the REAL truth the media won't report. Share before it's taken down.",
    sourceType: 'social',
    category: 'politics',
    report: {
      trustScore: 31,
      verdict: 'misleading',
      summary:
        'Highly manipulative social post with secrecy framing and vague accusations. No specific evidence is provided for economy claims.',
      eli15:
        'It tells you someone is lying but does not show receipts — that is a trick to make you angry before you think.',
      neutralRewrite:
        'The post alleges bipartisan dishonesty on economic policy without citing data, sources, or specific false statements.',
      claims: [
        {
          claim: 'Politicians on both sides are lying about the economy',
          status: 'unverified',
          confidence: 70,
          evidence: ['No data, quotes, or policy specifics provided'],
          explanation: 'Broad accusation without verifiable evidence.',
        },
        {
          claim: 'The media will not report the real truth',
          status: 'disputed',
          confidence: 62,
          evidence: ['General anti-media trope without examples'],
          explanation: 'Unfalsifiable media conspiracy framing.',
        },
      ],
      bias: {
        overall: 85,
        political: 88,
        commercial: 20,
        ideological: 80,
        explanation: 'Strong partisan outrage and anti-media framing.',
      },
      emotion: {
        fear: 55,
        urgency: 80,
        anger: 75,
        sensationalism: 85,
        loadedLanguage: 88,
        dominant: 'anger',
      },
      fallacies: [
        {
          type: 'False dilemma',
          excerpt: 'both sides are lying',
          explanation: 'Paints complex policy debate as universal deceit.',
        },
      ],
      missingContext: ['Which policies, which politicians, which data'],
      suggestedReading: [],
      reasoningTimeline: [
        { step: 'Claim extraction', description: 'Parsed vague political accusations.' },
        { step: 'Manipulation scan', description: 'Secrecy and takedown urgency detected.' },
        { step: 'Verdict', description: 'Misleading due to evidence-free outrage framing.' },
      ],
    },
  },
  news: {
    id: 'news',
    title: 'Article analysis',
    content:
      'A new study suggests moderate coffee consumption may be linked to lower risk of certain heart conditions. Researchers analyzed data from 50,000 participants over 10 years, publishing findings in a peer-reviewed journal.',
    sourceType: 'article',
    category: 'news',
    report: {
      trustScore: 78,
      verdict: 'mixed',
      summary:
        'Balanced science-reporting tone with study size and peer review mentioned. Specific journal and effect size are not named in the excerpt.',
      eli15:
        'It sounds like a careful study, but we would still want the journal name and how big the benefit really was.',
      neutralRewrite:
        'Researchers report an association between moderate coffee intake and lower heart-condition risk in a large long-term cohort; findings were published in a peer-reviewed outlet.',
      claims: [
        {
          claim: 'Moderate coffee consumption may lower risk of certain heart conditions',
          status: 'verified',
          confidence: 72,
          evidence: ['Described as peer-reviewed cohort study with 50,000 participants'],
          explanation: 'Wording is cautious (“may be linked”) and cites study design.',
        },
      ],
      bias: {
        overall: 22,
        political: 10,
        commercial: 15,
        ideological: 8,
        explanation: 'Neutral science-reporting style with hedged language.',
      },
      emotion: {
        fear: 8,
        urgency: 5,
        anger: 3,
        sensationalism: 12,
        loadedLanguage: 10,
        dominant: 'neutral',
      },
      fallacies: [],
      missingContext: ['Journal name, effect size, and funding sources not stated'],
      suggestedReading: [],
      reasoningTimeline: [
        { step: 'Claim extraction', description: 'Single main epidemiological claim.' },
        { step: 'Tone scan', description: 'Hedged, non-sensational phrasing.' },
        { step: 'Verdict', description: 'Generally credible tone; some context missing.' },
      ],
    },
  },
}

export function getSampleCase(id: string): SampleCaseDefinition | null {
  if (id in SAMPLE_CASES) {
    return SAMPLE_CASES[id as SampleCaseId]
  }
  return null
}
