import neo4j, { type Driver } from 'neo4j-driver'
import type { CredibilityReport } from '@veritas/shared'

let driver: Driver | null = null

function getDriver(): Driver | null {
  const uri = process.env.NEO4J_URI
  if (!uri) return null

  if (!driver) {
    const user = process.env.NEO4J_USER ?? 'neo4j'
    const password = process.env.NEO4J_PASSWORD ?? ''
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  }

  return driver
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Sync analysis claims, sources, and relations into Neo4j Aura */
export async function syncAnalysisToGraph(
  analysisId: string,
  report: CredibilityReport,
): Promise<void> {
  const db = getDriver()
  if (!db) return

  const session = db.session()

  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (a:Analysis {id: $id})
         SET a.trustScore = $trustScore,
             a.verdict = $verdict,
             a.summary = $summary,
             a.updatedAt = datetime()`,
        {
          id: analysisId,
          trustScore: report.trustScore,
          verdict: report.verdict,
          summary: report.summary.slice(0, 500),
        },
      )

      for (let i = 0; i < report.claims.length; i++) {
        const claim = report.claims[i]
        const claimId = `${analysisId}:claim:${i}`

        await tx.run(
          `MERGE (c:Claim {id: $claimId})
           SET c.text = $text,
               c.status = $status,
               c.confidence = $confidence
           WITH c
           MATCH (a:Analysis {id: $analysisId})
           MERGE (a)-[:HAS_CLAIM]->(c)`,
          {
            claimId,
            text: claim.claim.slice(0, 1000),
            status: claim.status,
            confidence: claim.confidence,
            analysisId,
          },
        )

        for (const evidenceUrl of claim.evidence) {
          if (!evidenceUrl.startsWith('http')) continue
          const domain = domainFromUrl(evidenceUrl)
          if (!domain) continue

          await tx.run(
            `MERGE (s:Source {url: $url})
             SET s.domain = $domain
             WITH s
             MATCH (c:Claim {id: $claimId})
             MERGE (c)-[:CITED_BY]->(s)
             MERGE (d:Domain {name: $domain})
             MERGE (s)-[:FROM_DOMAIN]->(d)`,
            { url: evidenceUrl, domain, claimId },
          )
        }
      }

      for (const source of report.suggestedReading) {
        if (!source.url) continue
        const domain = domainFromUrl(source.url)
        if (!domain) continue

        await tx.run(
          `MERGE (s:Source {url: $url})
           SET s.title = $title
           MERGE (d:Domain {name: $domain})
           MERGE (s)-[:FROM_DOMAIN]->(d)
           WITH s
           MATCH (a:Analysis {id: $analysisId})
           MERGE (a)-[:SUGGESTS_SOURCE]->(s)`,
          {
            url: source.url,
            title: source.title.slice(0, 200),
            domain,
            analysisId,
          },
        )
      }

      for (const rel of report.claimRelations ?? []) {
        const fromId = `${analysisId}:claim:${rel.from}`
        const toId = `${analysisId}:claim:${rel.to}`
        const relType =
          rel.type === 'contradicts'
            ? 'CONTRADICTS'
            : rel.type === 'supports'
              ? 'SUPPORTS'
              : 'RELATED_TO'

        await tx.run(
          `MATCH (a:Claim {id: $fromId}), (b:Claim {id: $toId})
           MERGE (a)-[r:${relType}]->(b)`,
          { fromId, toId },
        )
      }
    })
  } catch (error) {
    console.error('[neo4j] sync failed:', error instanceof Error ? error.message : error)
  } finally {
    await session.close()
  }
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close()
    driver = null
  }
}
