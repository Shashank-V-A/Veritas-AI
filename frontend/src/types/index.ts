export type {
  SourceType,
  ClaimStatus,
  Verdict,
  AnalysisCategory,
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
  UrlAnalyzeRequest,
  ShareLinkResponse,
  PublicReportResponse,
  HistoryResponse,
  ApiErrorBody,
  AuthUser,
  AuthMeResponse,
  ErrorCode,
} from '@veritas/shared'

/** @deprecated Use ApiErrorBody from @veritas/shared */
export type { ApiErrorBody as ApiError } from '@veritas/shared'
