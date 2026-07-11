import neo4j, { type Driver } from 'neo4j-driver'
import type { CredibilityReport } from '@veritas/shared'

let driver: Driver | null = null
let verified = false

function neo4jConfig() {
  const uri = process.env.NEO4J_URI?.trim()
  const user = (process.env.NEO4J_USERNAME ?? process.env.NEO4J_USER ?? 'neo4j').trim()
  const password = process.env.NEO4J_PASSWORD?.trim() ?? ''
  const database = process.env.NEO4J_DATABASE?.trim() || 'neo4j'
  return { uri, user, password, database }
}

function getDriver(): Driver | null {
  const { uri, user, password } = neo4jConfig()
  if (!uri || !password) return null

  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      connectionTimeout: 15_000,
      maxConnectionLifetime: 60 * 60 * 1000,
    })
  }

  return driver
}

async function ensureConnected(db: Driver): Promise<string> {
  const { database } = neo4jConfig()
  if (!verified) {
    await db.verifyConnectivity({ database })
    verified = true
    console.info(`[neo4j] Connected to ${neo4jConfig().uri} (db=${database})`)
  }
  return database
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
  if (!db) {
    if (process.env.NEO4J_URI?.trim() && !process.env.NEO4J_PASSWORD?.trim()) {
      console.warn('[neo4j] NEO4J_URI set but NEO4J_PASSWORD missing — skipping graph sync')
    }
    return
  }

  let database: string
  try {
    database = await ensureConnected(db)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      `[neo4j] Connection failed: ${message}. ` +
        'Reset the password in Neo4j Aura Console → instance → … → Reset password, ' +
        'then update NEO4J_PASSWORD (and NEO4J_USERNAME if shown) in backend/.env and restart the backend.',
    )
    // Drop cached driver so the next attempt reloads credentials after .env change
    await closeNeo4jDriver()
    return
  }

  const session = db.session({ database })

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
    verified = false
  }
}
