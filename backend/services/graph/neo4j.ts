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

export interface GraphNode {
  id: string
  label: string
  type: 'Analysis' | 'Claim' | 'Source' | 'Domain'
  meta?: Record<string, string | number | null>
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  type: string
}

export interface GraphSnapshot {
  configured: boolean
  connected: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
  error?: string
}

/** Read a limited constellation of recent analyses, claims, sources, and domains. */
export async function getGraphSnapshot(limit = 40): Promise<GraphSnapshot> {
  const db = getDriver()
  if (!db) {
    return { configured: false, connected: false, nodes: [], edges: [] }
  }

  let database: string
  try {
    database = await ensureConnected(db)
  } catch (error) {
    return {
      configured: true,
      connected: false,
      nodes: [],
      edges: [],
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }

  const session = db.session({ database })
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []

  try {
    const result = await session.run(
      `
      MATCH (a:Analysis)
      WITH a ORDER BY coalesce(a.updatedAt, datetime({epochMillis: 0})) DESC
      LIMIT $limit
      OPTIONAL MATCH (a)-[:HAS_CLAIM]->(c:Claim)
      OPTIONAL MATCH (a)-[:SUGGESTS_SOURCE]->(s:Source)
      OPTIONAL MATCH (c)-[:CITED_BY]->(cs:Source)
      OPTIONAL MATCH (s)-[:FROM_DOMAIN]->(d:Domain)
      OPTIONAL MATCH (cs)-[:FROM_DOMAIN]->(cd:Domain)
      OPTIONAL MATCH (c1:Claim)-[r:RELATED_TO|SUPPORTS|CONTRADICTS]->(c2:Claim)
      WHERE (a)-[:HAS_CLAIM]->(c1) AND (a)-[:HAS_CLAIM]->(c2)
      RETURN a, collect(DISTINCT c) AS claims,
             collect(DISTINCT s) + collect(DISTINCT cs) AS sources,
             collect(DISTINCT d) + collect(DISTINCT cd) AS domains,
             collect(DISTINCT {from: c1.id, to: c2.id, type: type(r)}) AS rels
      `,
      { limit: Math.min(Math.max(limit, 5), 80) },
    )

    for (const record of result.records) {
      const analysis = record.get('a')
      if (analysis?.properties?.id) {
        const id = String(analysis.properties.id)
        nodes.set(id, {
          id,
          label: String(analysis.properties.verdict ?? 'case').slice(0, 24),
          type: 'Analysis',
          meta: {
            trustScore: Number(analysis.properties.trustScore ?? 0),
            verdict: String(analysis.properties.verdict ?? ''),
          },
        })
      }

      for (const claim of record.get('claims') ?? []) {
        if (!claim?.properties?.id) continue
        const id = String(claim.properties.id)
        nodes.set(id, {
          id,
          label: String(claim.properties.text ?? 'claim').slice(0, 42),
          type: 'Claim',
          meta: {
            status: String(claim.properties.status ?? ''),
            confidence: Number(claim.properties.confidence ?? 0),
          },
        })
        if (analysis?.properties?.id) {
          edges.push({
            id: `${analysis.properties.id}->${id}`,
            from: String(analysis.properties.id),
            to: id,
            type: 'HAS_CLAIM',
          })
        }
      }

      for (const source of record.get('sources') ?? []) {
        if (!source?.properties?.url) continue
        const id = `source:${source.properties.url}`
        nodes.set(id, {
          id,
          label: String(source.properties.title ?? source.properties.domain ?? source.properties.url).slice(0, 36),
          type: 'Source',
          meta: { url: String(source.properties.url) },
        })
      }

      for (const domain of record.get('domains') ?? []) {
        if (!domain?.properties?.name) continue
        const id = `domain:${domain.properties.name}`
        nodes.set(id, {
          id,
          label: String(domain.properties.name).slice(0, 28),
          type: 'Domain',
        })
      }

      for (const rel of record.get('rels') ?? []) {
        if (!rel?.from || !rel?.to || !rel?.type) continue
        edges.push({
          id: `${rel.from}-${rel.type}-${rel.to}`,
          from: String(rel.from),
          to: String(rel.to),
          type: String(rel.type),
        })
      }
    }

    // Link sources to analyses / claims via a second lightweight pass if needed
    const linkResult = await session.run(
      `
      MATCH (a:Analysis)-[:SUGGESTS_SOURCE]->(s:Source)
      WITH a, s ORDER BY coalesce(a.updatedAt, datetime({epochMillis: 0})) DESC
      LIMIT $limit
      RETURN a.id AS aid, s.url AS url
      `,
      { limit: Math.min(Math.max(limit * 2, 10), 120) },
    )
    for (const record of linkResult.records) {
      const aid = record.get('aid')
      const url = record.get('url')
      if (!aid || !url) continue
      const sid = `source:${url}`
      if (nodes.has(String(aid)) && nodes.has(sid)) {
        edges.push({
          id: `${aid}->${sid}`,
          from: String(aid),
          to: sid,
          type: 'SUGGESTS_SOURCE',
        })
      }
    }

    // Link sources to domains for constellation completeness
    const domainLinkResult = await session.run(
      `
      MATCH (s:Source)-[:FROM_DOMAIN]->(d:Domain)
      RETURN s.url AS url, d.name AS name
      LIMIT $limit
      `,
      { limit: Math.min(Math.max(limit * 3, 20), 200) },
    )
    for (const record of domainLinkResult.records) {
      const url = record.get('url')
      const name = record.get('name')
      if (!url || !name) continue
      const sid = `source:${url}`
      const did = `domain:${name}`
      if (nodes.has(sid) && nodes.has(did)) {
        edges.push({
          id: `${sid}->${did}`,
          from: sid,
          to: did,
          type: 'FROM_DOMAIN',
        })
      }
    }

    return {
      configured: true,
      connected: true,
      nodes: [...nodes.values()],
      edges,
    }
  } catch (error) {
    return {
      configured: true,
      connected: true,
      nodes: [],
      edges: [],
      error: error instanceof Error ? error.message : 'Graph query failed',
    }
  } finally {
    await session.close()
  }
}
