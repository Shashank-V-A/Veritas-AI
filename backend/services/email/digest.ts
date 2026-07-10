import { Resend } from 'resend'

interface DigestCase {
  id: string
  title: string | null
  trustScore: number | null
  verdict: string | null
}

interface DigestRecipient {
  email: string
  name: string | null
  caseCount: number
  cases: DigestCase[]
}

function buildDigestHtml(recipient: DigestRecipient, appUrl: string): string {
  const rows = recipient.cases
    .map(
      (c) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e4dc;">${escapeHtml(c.title ?? 'Untitled case')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e4dc;text-align:center;">${c.trustScore ?? '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e8e4dc;text-align:center;">${escapeHtml(c.verdict ?? '—')}</td>
        </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;background:#f5f0e6;color:#1a1510;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid #1a1510;padding:24px;">
    <h1 style="margin:0 0 8px;font-size:20px;">Veritas weekly dossier</h1>
    <p style="margin:0 0 20px;color:#5c5348;">Hi ${escapeHtml(recipient.name ?? 'investigator')}, you closed <strong>${recipient.caseCount}</strong> case${recipient.caseCount === 1 ? '' : 's'} this week.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#1a1510;color:#f5f0e6;">
          <th style="padding:8px 12px;text-align:left;">Case</th>
          <th style="padding:8px 12px;">Trust</th>
          <th style="padding:8px 12px;">Verdict</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:24px 0 0;">
      <a href="${escapeHtml(appUrl)}/app" style="display:inline-block;background:#7a1f1f;color:#fff;padding:10px 18px;text-decoration:none;">Open workspace</a>
    </p>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendWeeklyDigests(recipients: DigestRecipient[]): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { sent: 0, failed: recipients.length, errors: ['RESEND_API_KEY not set'] }
  }

  const resend = new Resend(apiKey)
  const from = process.env.RESEND_FROM ?? 'Veritas AI <onboarding@resend.dev>'
  const appUrl = process.env.PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:5173'

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const recipient of recipients) {
    if (!recipient.email || recipient.caseCount === 0) continue

    const { error } = await resend.emails.send({
      from,
      to: recipient.email,
      subject: `Your Veritas weekly dossier — ${recipient.caseCount} case${recipient.caseCount === 1 ? '' : 's'}`,
      html: buildDigestHtml(recipient, appUrl),
    })

    if (error) {
      failed++
      errors.push(`${recipient.email}: ${error.message}`)
    } else {
      sent++
    }
  }

  return { sent, failed, errors }
}
