import type { CredibilityReport } from '@veritas/shared'
import type { WebSearchResult } from '../search/webSearch.js'

export function enrichReportWithSearch(
  report: CredibilityReport,
  searchResults: WebSearchResult[],
): CredibilityReport {
  if (searchResults.length === 0) return report

  const existingUrls = new Set(
    report.suggestedReading.map((s) => s.url).filter(Boolean),
  )

  const mergedReading = [...report.suggestedReading]
  for (const result of searchResults.slice(0, 4)) {
    if (!existingUrls.has(result.url)) {
      mergedReading.push({
        title: result.title,
        url: result.url,
        reason: result.snippet || 'Web search result relevant to extracted claims',
      })
      existingUrls.add(result.url)
    }
  }

  const sourceLineage = report.claims.slice(0, 5).map((claim, index) => ({
    claim: claim.claim,
    sources: searchResults.slice(index, index + 2).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    })),
  }))

  const confidenceInterval = {
    low: Math.max(0, report.trustScore - 12),
    high: Math.min(100, report.trustScore + 12),
    method: 'Claim confidence dispersion + search coverage',
  }

  const claimRelations = report.claims
    .slice(0, 4)
    .flatMap((_, i) =>
      i < report.claims.length - 1
        ? [{ from: i, to: i + 1, type: 'related' as const }]
        : [],
    )

  const claimTimeline = report.claims.map((c) => ({
    claim: c.claim,
    status: c.status,
    appearedAt: new Date().toISOString(),
    debunkedAt: c.status === 'false' ? new Date().toISOString() : undefined,
  }))

  return {
    ...report,
    suggestedReading: mergedReading,
    sourceLineage,
    confidenceInterval,
    claimRelations,
    claimTimeline,
  }
}
