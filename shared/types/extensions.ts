/** Enriched report fields added post-pipeline (not always from Mesh) */

export interface ClaimRelation {
  from: number
  to: number
  type: 'supports' | 'contradicts' | 'related'
}

export interface SourceLineageItem {
  claim: string
  sources: Array<{ title: string; url: string; snippet?: string }>
}

export interface ConfidenceInterval {
  low: number
  high: number
  method: string
}

export interface ClaimTimelineEvent {
  claim: string
  appearedAt?: string
  debunkedAt?: string
  status: string
}

export interface ReportEnrichment {
  sourceLineage?: SourceLineageItem[]
  claimRelations?: ClaimRelation[]
  confidenceInterval?: ConfidenceInterval
  claimTimeline?: ClaimTimelineEvent[]
  searchQueryCount?: number
}
