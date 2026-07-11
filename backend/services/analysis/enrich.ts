import type { CredibilityReport } from '@veritas/shared'
import type { WebSearchResult } from '../search/webSearch.js'

/**
 * Enrich reports with real web-search hits only.
 * Does NOT invent claim timelines, sequential "related" edges, or fake timestamps.
 */
export function enrichReportWithSearch(
  report: CredibilityReport,
  searchResults: WebSearchResult[],
): CredibilityReport {
  if (searchResults.length === 0) {
    return {
      ...report,
      confidenceInterval: {
        low: Math.max(0, report.trustScore - 12),
        high: Math.min(100, report.trustScore + 12),
        method: 'Heuristic estimate (±12) — not a statistical confidence interval',
      },
    }
  }

  const existingUrls = new Set(
    report.suggestedReading.map((s) => s.url).filter(Boolean),
  )

  const mergedReading = [...report.suggestedReading]
  for (const result of searchResults.slice(0, 4)) {
    if (!existingUrls.has(result.url)) {
      mergedReading.push({
        title: result.title,
        url: result.url,
        reason: result.snippet
          ? `Web search: ${result.snippet}`
          : 'Retrieved via live web search (supporting context, not a verified citation)',
      })
      existingUrls.add(result.url)
    }
  }

  // Attach the same verified search pool to each claim as supporting context —
  // labeled honestly as search hits, not claim-specific citations.
  const searchPool = searchResults.slice(0, 4).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet
      ? `${r.snippet} · Live web search context`
      : 'Live web search context (not a primary citation)',
  }))

  const sourceLineage = report.claims.slice(0, 5).map((claim) => ({
    claim: claim.claim,
    sources: searchPool,
  }))

  const confidenceInterval = {
    low: Math.max(0, report.trustScore - 12),
    high: Math.min(100, report.trustScore + 12),
    method: 'Heuristic estimate (±12) based on trust score — not a statistical CI',
  }

  // Keep Mesh-provided claimRelations only; do not synthesize sequential edges.
  return {
    ...report,
    suggestedReading: mergedReading,
    sourceLineage,
    confidenceInterval,
    searchQueryCount: searchResults.length,
    // Drop synthetic timelines — timestamps were previously fabricated as "now".
    claimTimeline: undefined,
  }
}
