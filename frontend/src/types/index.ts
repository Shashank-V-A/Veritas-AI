export type {
  SourceType,
  ClaimStatus,
  Verdict,
  Claim,
  BiasAnalysis,
  EmotionAnalysis,
  Fallacy,
  TimelineEvent,
  SuggestedSource,
  CredibilityReport,
  AnalysisRecord,
  HistoryItem,
  AnalyzeRequest,
  AnalyzeResponse,
  HistoryResponse,
  ApiErrorBody,
  AuthUser,
  AuthMeResponse,
  ErrorCode,
} from '@veritas/shared'

/** @deprecated Use ApiErrorBody from @veritas/shared */
export type { ApiErrorBody as ApiError } from '@veritas/shared'
