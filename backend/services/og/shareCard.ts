import type { PublicReportResponse } from '@veritas/shared'

function caseIdFromUuid(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `VA-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

export function buildShareOgSvg(report: PublicReportResponse): string {
  const caseId = caseIdFromUuid(report.id)
  const verdictColors: Record<string, string> = {
    credible: '#2D5A4A',
    mixed: '#B8860B',
    misleading: '#A63D3D',
    unsupported: '#5C5A55',
  }
  const accent = verdictColors[report.verdict] ?? '#8B2942'

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#1A1A1F"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="#9A7B4F" stroke-width="2" opacity="0.4"/>
  <rect x="72" y="72" width="1056" height="486" fill="none" stroke="#8B2942" stroke-width="1" opacity="0.35"/>
  <text x="96" y="140" fill="#9A7B4F" font-family="monospace" font-size="22">VERITAS AI · CASE DOSSIER</text>
  <text x="96" y="200" fill="#F0EDE6" font-family="Georgia, serif" font-size="48">${escapeXml(report.title ?? 'Credibility dossier')}</text>
  <text x="96" y="250" fill="#9A7B4F" font-family="monospace" font-size="20">${caseId}</text>
  <circle cx="1020" cy="320" r="88" fill="none" stroke="${accent}" stroke-width="6"/>
  <text x="1020" y="335" text-anchor="middle" fill="${accent}" font-family="Georgia, serif" font-size="52">${report.trustScore}</text>
  <text x="1020" y="375" text-anchor="middle" fill="#F0EDE6" font-family="monospace" font-size="16">TRUST</text>
  <rect x="96" y="420" width="200" height="44" fill="none" stroke="${accent}" stroke-width="3"/>
  <text x="196" y="450" text-anchor="middle" fill="${accent}" font-family="monospace" font-size="18" letter-spacing="4">${report.verdict.toUpperCase()}</text>
  <text x="96" y="540" fill="#F0EDE6" font-family="sans-serif" font-size="24" opacity="0.75">${escapeXml(report.report.summary.slice(0, 120))}…</text>
</svg>`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
