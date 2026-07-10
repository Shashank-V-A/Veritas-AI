import type { CredibilityReport } from '@veritas/shared'

/** Optional Neo4j sync — enable with NEO4J_URI + neo4j-driver installed */
export async function syncAnalysisToGraph(
  _analysisId: string,
  _report: CredibilityReport,
): Promise<void> {
  if (!process.env.NEO4J_URI) return
  // Graph sync: install `neo4j-driver` and implement MERGE nodes for claims/entities
}
