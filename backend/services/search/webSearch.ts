export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

/** Search the web via Tavily (optional) or DuckDuckGo lite fallback */
export async function searchWeb(query: string, limit = 5): Promise<WebSearchResult[]> {
  const tavilyKey = process.env.TAVILY_API_KEY
  if (tavilyKey) {
    return searchTavily(query, limit, tavilyKey)
  }
  return searchDuckDuckGo(query, limit)
}

async function searchTavily(
  query: string,
  limit: number,
  apiKey: string,
): Promise<WebSearchResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: limit,
      include_answer: false,
    }),
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) return []

  const data = (await response.json()) as {
    results?: Array<{ title: string; url: string; content: string }>
  }

  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content?.slice(0, 280) ?? '',
  }))
}

async function searchDuckDuckGo(query: string, limit: number): Promise<WebSearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VeritasAI/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return []
    const html = await response.text()
    const results: WebSearchResult[] = []
    const linkRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    let match: RegExpExecArray | null
    while ((match = linkRegex.exec(html)) && results.length < limit) {
      results.push({
        title: decodeHtml(match[2]),
        url: match[1],
        snippet: '',
      })
    }
    return results
  } catch {
    return []
  }
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export function buildSearchContext(results: WebSearchResult[]): string {
  if (results.length === 0) return ''
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
    .join('\n\n')
}
