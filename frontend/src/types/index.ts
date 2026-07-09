export type SourceType =
  | 'article'
  | 'social'
  | 'transcript'
  | 'forward'
  | 'blog'
  | 'pdf'
  | 'raw'

export type ClaimStatus = 'verified' | 'disputed' | 'unverified' | 'false'

export type Verdict = 'credible' | 'mixed' | 'misleading' | 'unsupported'

export interface Claim {
  claim: string
  status: ClaimStatus
  confidence: number
  evidence: string[]
  explanation: string
}

export interface BiasAnalysis {
  overall: number
  political: number
  commercial: number
  ideological: number
  explanation: string
}

export interface EmotionAnalysis {
  fear: number
  urgency: number
  anger: number
  sensationalism: number
  loadedLanguage: number
  dominant: string
}

export interface Fallacy {
  type: string
  excerpt: string
  explanation: string
}

export interface TimelineEvent {
  step: string
  description: string
  timestamp?: string
}

export interface SuggestedSource {
  title: string
  url?: string
  reason: string
}

export interface CredibilityReport {
  trustScore: number
  claims: Claim[]
  bias: BiasAnalysis
  emotion: EmotionAnalysis
  fallacies: Fallacy[]
  missingContext: string[]
  neutralRewrite: string
  eli15: string
  summary: string
  verdict: Verdict
  suggestedReading: SuggestedSource[]
  reasoningTimeline: TimelineEvent[]
}

export interface AnalysisRecord {
  id: string
  title?: string
  content: string
  sourceType: SourceType
  trustScore: number
  report: CredibilityReport
  createdAt: string
}

export interface HistoryItem {
  id: string
  title?: string
  trustScore: number
  sourceType: SourceType
  createdAt: string
  preview: string
}

export interface AnalyzeRequest {
  content: string
  sourceType: SourceType
  title?: string
}

export interface AnalyzeResponse {
  id: string
  report: CredibilityReport
  createdAt: string
}

export interface HistoryResponse {
  items: HistoryItem[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
