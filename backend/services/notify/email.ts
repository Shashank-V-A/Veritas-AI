/**
 * Optional email via Resend (https://resend.com).
 * Set RESEND_API_KEY + EMAIL_FROM. Without them, email is a no-op.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendWatchHitEmail(input: {
  to: string
  claimText: string
  source: 'web' | 'analysis'
  hitCount: number
  details: Array<{ title?: string | null; url?: string | null }>
  watchlistUrl: string
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    return { sent: false, error: 'Email not configured' }
  }

  const label = input.source === 'web' ? 'on the web' : 'in a new Veritas case'
  const lines = input.details
    .slice(0, 5)
    .map((d) => {
      if (d.url) return `• ${d.title ?? d.url}\n  ${d.url}`
      return `• ${d.title ?? 'Related case'}`
    })
    .join('\n')

  const subject = `Veritas watchlist: claim resurfaced ${label}`
  const text = [
    `A watched claim matched ${input.hitCount} new result(s) ${label}.`,
    '',
    `Claim: "${input.claimText.slice(0, 280)}"`,
    '',
    lines || '(see watchlist for details)',
    '',
    `Open watchlist: ${input.watchlistUrl}`,
    '',
    '— Veritas AI',
  ].join('\n')

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject,
        text,
      }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { sent: false, error: body.slice(0, 200) || `HTTP ${res.status}` }
    }
    return { sent: true }
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'send failed',
    }
  }
}
