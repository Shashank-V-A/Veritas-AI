import PDFDocument from 'pdfkit'
import { PDFDocument as PdfLib } from 'pdf-lib'
import type { AnalysisRecord, ClaimStatus, Verdict } from '@veritas/shared'

/**
 * Veritas case-dossier PDF — hard-capped at 2 pages.
 * Ink theme: dark ground, gold accent, Helvetica for readability.
 *
 * Critical: every doc.text() MUST pass `height` so PDFKit clips instead of
 * auto-inserting pages when content hits the bottom margin.
 */

const C = {
  bg: '#090909',
  surface: '#111111',
  elevated: '#171717',
  ink: '#F5F5F5',
  charcoal: '#D4D4D4',
  muted: '#B3B3B3',
  rule: '#2A2A2A',
  accent: '#C8A24A',
  accentSoft: '#5F7EA7',
  white: '#F5F5F5',
  onAccent: '#090909',
  success: '#3BA55D',
  warning: '#D9A441',
  danger: '#C94F4F',
} as const

const F = {
  sans: 'Helvetica',
  sansBold: 'Helvetica-Bold',
  sansOblique: 'Helvetica-Oblique',
} as const

const VERDICT_LABELS: Record<Verdict, string> = {
  credible: 'Credible',
  mixed: 'Mixed',
  misleading: 'Misleading',
  unsupported: 'Unsupported',
}

const CLAIM_LABELS: Record<ClaimStatus, string> = {
  verified: 'Verified',
  disputed: 'Disputed',
  unverified: 'Unverified',
  false: 'False',
}

const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 42
const CW = PAGE_W - M * 2
const TOP = 34
const BOTTOM = PAGE_H - 36
const MAX_PAGES = 2

type Doc = InstanceType<typeof PDFDocument>

function caseId(id: string): string {
  const hex = id.replace(/-/g, '').toUpperCase()
  return `VA-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

function trustColor(score: number): string {
  if (score >= 70) return C.success
  if (score >= 40) return C.warning
  return C.danger
}

function verdictColor(v: Verdict): string {
  if (v === 'credible') return C.success
  if (v === 'mixed') return C.warning
  return C.danger
}

function statusColor(s: ClaimStatus): string {
  if (s === 'verified') return C.success
  if (s === 'disputed') return C.warning
  if (s === 'false') return C.danger
  return C.muted
}

function trunc(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`
}

/** Cursor that never lets PDFKit auto-paginate. */
class Layout {
  doc: Doc
  y: number
  pageIndex: number
  private pagesCreated = 1

  constructor(doc: Doc) {
    this.doc = doc
    this.y = TOP
    this.pageIndex = 0
  }

  get remaining(): number {
    return BOTTOM - this.y
  }

  /** Draw ink shell + chrome for the current page. */
  paintShell(totalPages: number) {
    const d = this.doc
    d.save()
    d.rect(0, 0, PAGE_W, PAGE_H).fill(C.bg)
    d.rect(M, 20, CW, 2).fill(C.accent)
    d
      .moveTo(M, BOTTOM + 8)
      .lineTo(PAGE_W - M, BOTTOM + 8)
      .strokeColor(C.rule)
      .lineWidth(0.6)
      .stroke()
    d.restore()

    // Footer — absolute, no flow side-effects
    this.abs('VERITAS AI  ·  CASE DOSSIER', M, BOTTOM + 12, {
      font: F.sans,
      size: 6.5,
      color: C.muted,
      width: CW / 2,
    })
    this.abs(`PAGE ${this.pageIndex + 1} OF ${totalPages}`, M + CW / 2, BOTTOM + 12, {
      font: F.sans,
      size: 6.5,
      color: C.muted,
      width: CW / 2,
      align: 'right',
    })
  }

  /** Absolute text — restores x/y so flow cursor is untouched. */
  abs(
    text: string,
    x: number,
    y: number,
    opts: {
      font?: string
      size?: number
      color?: string
      width?: number
      align?: 'left' | 'center' | 'right'
      height?: number
      characterSpacing?: number
      link?: string
    } = {},
  ) {
    const d = this.doc
    const sx = d.x
    const sy = d.y
    d.font(opts.font ?? F.sans)
    d.fontSize(opts.size ?? 9)
    d.fillColor(opts.color ?? C.ink)
    d.text(text, x, y, {
      width: opts.width ?? CW,
      align: opts.align ?? 'left',
      height: opts.height ?? 14,
      ellipsis: true,
      lineBreak: (opts.height ?? 14) > 14,
      characterSpacing: opts.characterSpacing,
      link: opts.link,
    })
    d.x = sx
    d.y = sy
  }

  /**
   * Flowing paragraph clipped to remaining page space.
   * Returns false if nothing fit (caller should stop or newPage).
   */
  text(
    text: string,
    opts: {
      font?: string
      size?: number
      color?: string
      gap?: number
    } = {},
  ): boolean {
    const size = opts.size ?? 8
    const gap = opts.gap ?? 3
    if (this.remaining < size + 2) return false

    const d = this.doc
    d.font(opts.font ?? F.sans)
    d.fontSize(size)
    d.fillColor(opts.color ?? C.charcoal)

    const h = this.remaining
    d.text(text, M, this.y, {
      width: CW,
      height: h,
      ellipsis: true,
      lineGap: 1.5,
      // height is set → PDFKit will NOT create a new page
    })

    const used = Math.min(
      h,
      d.heightOfString(text, { width: CW, lineGap: 1.5 }) || size + 2,
    )
    this.y = Math.min(this.y + used + gap, BOTTOM)
    d.x = M
    d.y = this.y
    return true
  }

  rule(color: string = C.rule, w = 0.6) {
    if (this.remaining < 10) return
    const d = this.doc
    d.save()
    d
      .moveTo(M, this.y)
      .lineTo(PAGE_W - M, this.y)
      .strokeColor(color)
      .lineWidth(w)
      .stroke()
    d.restore()
    this.y += 7
  }

  heading(title: string): boolean {
    if (this.remaining < 22) return false
    this.text(title.toUpperCase(), {
      font: F.sansBold,
      size: 8,
      color: C.accent,
      gap: 1,
    })
    this.rule(C.rule, 0.8)
    return true
  }

  /** Start page 2 once. Returns false if already on last page. */
  newPage(totalPages: number): boolean {
    if (this.pagesCreated >= MAX_PAGES) return false
    this.doc.addPage()
    this.pagesCreated++
    this.pageIndex++
    this.y = TOP
    this.doc.x = M
    this.doc.y = TOP
    this.paintShell(totalPages)
    return true
  }

  /** Ensure `need` points of space; break to page 2 if needed. */
  ensure(need: number, totalPages: number): boolean {
    if (this.remaining >= need) return true
    return this.newPage(totalPages)
  }

  meter(label: string, value: number, x: number, y: number, barW: number) {
    const v = Math.max(0, Math.min(100, value))
    this.abs(label, x, y, { font: F.sans, size: 6.5, color: C.muted, width: 68, height: 10 })
    this.abs(String(v), x + barW - 16, y, {
      font: F.sansBold,
      size: 6.5,
      color: C.ink,
      width: 16,
      align: 'right',
      height: 10,
    })
    const d = this.doc
    d.save()
    d.rect(x, y + 10, barW, 3.5).fill(C.rule)
    if (v > 0) d.rect(x, y + 10, (barW * v) / 100, 3.5).fill(C.accent)
    d.restore()
  }
}

export async function generateReportPdf(record: AnalysisRecord): Promise<Buffer> {
  const raw = await buildReportPdf(record)
  return trimToMaxPages(raw, MAX_PAGES)
}

/** Hard guarantee: drop any leaked pages beyond the cap. */
async function trimToMaxPages(pdfBytes: Buffer, maxPages: number): Promise<Buffer> {
  const src = await PdfLib.load(pdfBytes)
  if (src.getPageCount() <= maxPages) {
    return pdfBytes
  }

  console.warn(
    `[pdf] Trimming ${src.getPageCount()} pages → ${maxPages} (PDFKit leaked empty pages)`,
  )

  const out = await PdfLib.create()
  const pages = await out.copyPages(
    src,
    Array.from({ length: maxPages }, (_, i) => i),
  )
  for (const page of pages) out.addPage(page)
  const trimmed = await out.save()
  return Buffer.from(trimmed)
}

function buildReportPdf(record: AnalysisRecord): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      // Huge bottom margin trick is NOT used — we clip with height instead.
      // Keep margins small; Layout owns the safe content box.
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      autoFirstPage: true,
      bufferPages: true,
      info: {
        Title: record.title ?? 'Veritas Credibility Report',
        Author: 'Veritas AI',
        Subject: 'Credibility analysis dossier',
      },
    })

    // Hard stop: if anything still triggers auto page-add, abort further writes
    // by tracking count (we only ever call addPage once ourselves).
    let autoPagesBlocked = false
    doc.on('pageAdded', () => {
      // First addPage is ours (page 2). Any further = PDFKit auto-pagination leak.
      const count = doc.bufferedPageRange().count
      if (count > MAX_PAGES) {
        autoPagesBlocked = true
        console.error('[pdf] Blocked auto page-add — layout exceeded 2 pages')
      }
    })

    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { report } = record
    const id = caseId(record.id)
    // We always reserve chrome for up to 2 pages; final chrome pass rewrites footers.
    const totalPages = 2
    const L = new Layout(doc)
    L.paintShell(totalPages)
    L.y = TOP

    const go = () => !autoPagesBlocked

    // ── Brand ──────────────────────────────────────────────
    L.abs('VERITAS', M, L.y, {
      font: F.sansBold,
      size: 14,
      color: C.ink,
      width: 78,
      height: 18,
      characterSpacing: 1.4,
    })
    L.abs('AI', M + 76, L.y, {
      font: F.sansBold,
      size: 14,
      color: C.accent,
      width: 30,
      height: 18,
    })
    L.y += 16
    L.abs("Don't consume information. Verify it.", M, L.y, {
      font: F.sansOblique,
      size: 7.5,
      color: C.accent,
      height: 10,
    })
    L.y += 12
    L.rule(C.accent, 1)

    const date = new Date(record.createdAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    L.abs(`CASE FILE  ·  ${id}`, M, L.y, {
      font: F.sansBold,
      size: 7,
      color: C.accent,
      width: CW * 0.55,
      height: 10,
      characterSpacing: 0.6,
    })
    L.abs(date, M + CW * 0.4, L.y, {
      font: F.sans,
      size: 7,
      color: C.muted,
      width: CW * 0.6,
      align: 'right',
      height: 10,
    })
    L.y += 12

    if (go()) {
      L.text(trunc(record.title ?? 'Untitled analysis', 100), {
        font: F.sansBold,
        size: 14,
        color: C.ink,
        gap: 2,
      })
      L.text(
        `${record.sourceType.toUpperCase()}${record.category ? `  ·  ${record.category.toUpperCase()}` : ''}`,
        { size: 7, color: C.muted, gap: 6 },
      )
    }

    // ── Score panel ────────────────────────────────────────
    if (go() && L.ensure(78, totalPages)) {
      const py = L.y
      const ph = 68
      doc.save()
      doc.roundedRect(M, py, CW, ph, 2).fill(C.surface)
      doc.roundedRect(M, py, CW, ph, 2).strokeColor(C.rule).lineWidth(0.8).stroke()
      doc.rect(M, py, 3, ph).fill(C.accent)
      doc
        .moveTo(M + 86, py + 10)
        .lineTo(M + 86, py + ph - 10)
        .strokeColor(C.rule)
        .lineWidth(0.6)
        .stroke()
      doc.restore()

      L.abs(String(report.trustScore), M + 8, py + 10, {
        font: F.sansBold,
        size: 28,
        color: trustColor(report.trustScore),
        width: 70,
        align: 'center',
        height: 34,
      })
      L.abs('TRUST / 100', M + 8, py + 46, {
        font: F.sans,
        size: 6,
        color: C.muted,
        width: 70,
        align: 'center',
        height: 10,
        characterSpacing: 1,
      })

      const verdict = (VERDICT_LABELS[report.verdict] ?? report.verdict).toUpperCase()
      L.abs('VERDICT', M + 98, py + 10, {
        font: F.sans,
        size: 6.5,
        color: C.muted,
        height: 10,
        characterSpacing: 1.2,
      })
      L.abs(verdict, M + 98, py + 22, {
        font: F.sansBold,
        size: 12,
        color: verdictColor(report.verdict),
        width: CW - 110,
        height: 16,
      })
      L.abs(trunc(report.summary, 240), M + 98, py + 40, {
        font: F.sans,
        size: 7.5,
        color: C.charcoal,
        width: CW - 110,
        height: 22,
      })
      L.y = py + ph + 8
    }

    // ── Summary / ELI15 ────────────────────────────────────
    if (go() && L.ensure(50, totalPages) && L.heading('Summary')) {
      L.text(trunc(report.summary, 480), { size: 8, gap: 5 })
    }
    if (go() && L.ensure(45, totalPages) && L.heading("Explain Like I'm 15")) {
      L.text(trunc(report.eli15, 380), { size: 8, gap: 5 })
    }

    // ── Claims (max 4) ─────────────────────────────────────
    const claims = report.claims.slice(0, 4)
    if (go() && claims.length > 0 && L.ensure(40, totalPages) && L.heading('Claims')) {
      for (let i = 0; i < claims.length; i++) {
        if (!go()) break
        if (!L.ensure(32, totalPages)) break
        const claim = claims[i]
        const status = (CLAIM_LABELS[claim.status] ?? claim.status).toUpperCase()
        const sc = statusColor(claim.status)
        const rowY = L.y

        L.abs(String(i + 1).padStart(2, '0'), M, rowY, {
          font: F.sansBold,
          size: 7,
          color: C.accent,
          width: 16,
          height: 10,
        })
        const bw = Math.max(50, status.length * 5 + 8)
        doc.save()
        doc.roundedRect(M + 18, rowY - 1, bw, 10, 2).fill(sc)
        doc.restore()
        L.abs(status, M + 18, rowY + 0.5, {
          font: F.sansBold,
          size: 5.5,
          color: C.onAccent,
          width: bw,
          align: 'center',
          height: 10,
        })
        L.abs(`${claim.confidence}%`, M + 22 + bw, rowY, {
          font: F.sans,
          size: 6.5,
          color: C.muted,
          height: 10,
        })
        L.y = rowY + 12
        L.text(trunc(claim.claim, 160), { size: 8, color: C.ink, gap: 1 })
        if (claim.explanation) {
          L.text(trunc(claim.explanation, 140), { size: 7, color: C.muted, gap: 4 })
        } else {
          L.y += 3
        }
      }
    }

    // ── Bias & emotion ─────────────────────────────────────
    if (go() && L.ensure(88, totalPages) && L.heading('Bias & Emotion')) {
      const colW = (CW - 14) / 2
      const leftX = M
      const rightX = M + colW + 14
      const sy = L.y

      L.abs('BIAS VECTORS', leftX, sy, {
        font: F.sansBold,
        size: 7,
        color: C.ink,
        width: colW,
        height: 10,
      })
      L.abs(`Overall ${report.bias.overall}`, leftX + colW - 48, sy, {
        font: F.sans,
        size: 6.5,
        color: C.muted,
        width: 48,
        align: 'right',
        height: 10,
      })

      let my = sy + 12
      L.meter('Political', report.bias.political, leftX, my, colW)
      my += 18
      L.meter('Commercial', report.bias.commercial, leftX, my, colW)
      my += 18
      L.meter('Ideological', report.bias.ideological, leftX, my, colW)

      L.abs('EMOTION PROFILE', rightX, sy, {
        font: F.sansBold,
        size: 7,
        color: C.ink,
        width: colW * 0.55,
        height: 10,
      })
      L.abs(report.emotion.dominant.toUpperCase(), rightX + colW - 72, sy, {
        font: F.sansBold,
        size: 6.5,
        color: C.accent,
        width: 72,
        align: 'right',
        height: 10,
      })

      my = sy + 12
      for (const [label, value] of [
        ['Fear', report.emotion.fear],
        ['Urgency', report.emotion.urgency],
        ['Anger', report.emotion.anger],
        ['Sensationalism', report.emotion.sensationalism],
        ['Loaded lang.', report.emotion.loadedLanguage],
      ] as Array<[string, number]>) {
        L.meter(label, value, rightX, my, colW)
        my += 15
      }

      L.y = Math.max(sy + 72, my) + 3
      L.text(trunc(report.bias.explanation, 200), { size: 6.5, color: C.muted, gap: 4 })
    }

    // ── Fallacies (max 3) ──────────────────────────────────
    const fallacies = report.fallacies.slice(0, 3)
    if (go() && fallacies.length > 0 && L.ensure(36, totalPages) && L.heading('Fallacies')) {
      for (const f of fallacies) {
        if (!go() || !L.ensure(20, totalPages)) break
        L.text(f.type, { font: F.sansBold, size: 7.5, color: C.accent, gap: 1 })
        L.text(
          trunc(f.excerpt ? `“${f.excerpt}” — ${f.explanation}` : f.explanation, 180),
          { size: 7, color: C.muted, gap: 3 },
        )
      }
    }

    // ── Missing context ────────────────────────────────────
    const missing = report.missingContext.slice(0, 3)
    if (go() && missing.length > 0 && L.ensure(30, totalPages) && L.heading('Missing Context')) {
      for (const item of missing) {
        if (!go() || L.remaining < 12) break
        L.text(`• ${trunc(item, 150)}`, { size: 7, gap: 2 })
      }
    }

    // ── Neutral rewrite ────────────────────────────────────
    if (go() && L.ensure(36, totalPages) && L.heading('Neutral Rewrite')) {
      L.text(trunc(report.neutralRewrite, 320), { size: 7, gap: 4 })
    }

    // ── Further reading ────────────────────────────────────
    const reading = report.suggestedReading.slice(0, 3)
    if (go() && reading.length > 0 && L.ensure(28, totalPages) && L.heading('Further Reading')) {
      for (const s of reading) {
        if (!go() || L.remaining < 14) break
        L.text(trunc(s.title, 85), { font: F.sansBold, size: 7.5, color: C.ink, gap: 0 })
        if (s.url) {
          L.text(trunc(s.url, 95), { size: 6.5, color: C.accentSoft, gap: 3 })
        } else {
          L.y += 3
        }
      }
    }

    // ── Closing ────────────────────────────────────────────
    if (go() && L.remaining >= 30) {
      L.y += 2
      L.rule(C.accent, 1)
      L.abs("Don't consume information. Verify it.", M, L.y, {
        font: F.sansOblique,
        size: 8,
        color: C.accent,
        width: CW,
        align: 'center',
        height: 12,
      })
      L.y += 12
      L.abs(
        `Generated by Veritas AI${record.meshModel ? `  ·  ${record.meshModel}` : ''}  ·  ${id}`,
        M,
        L.y,
        {
          font: F.sans,
          size: 6.5,
          color: C.muted,
          width: CW,
          align: 'center',
          height: 10,
        },
      )
    }

    // If we never needed page 2, still fine — footer says "OF 2" only if 2 exist.
    // Rewrite footers with actual page count.
    const range = doc.bufferedPageRange()
    const actual = Math.min(range.count, MAX_PAGES)

    // If PDFKit leaked extra pages, we cannot delete them from PDFKit easily.
    // Prevent by never writing without height. Assert for logs:
    if (range.count > MAX_PAGES) {
      console.error(`[pdf] WARNING: ${range.count} pages generated (cap ${MAX_PAGES})`)
    }

    for (let i = 0; i < actual; i++) {
      doc.switchToPage(range.start + i)
      // Re-stamp footer with correct total (absolute only)
      const sx = doc.x
      const sy = doc.y
      doc.save()
      // Cover any stray marks in footer band
      doc.rect(M, BOTTOM + 6, CW, 20).fill(C.bg)
      doc
        .moveTo(M, BOTTOM + 8)
        .lineTo(PAGE_W - M, BOTTOM + 8)
        .strokeColor(C.rule)
        .lineWidth(0.6)
        .stroke()
      doc.restore()
      doc.font(F.sans).fontSize(6.5).fillColor(C.muted)
      doc.text('VERITAS AI  ·  CASE DOSSIER', M, BOTTOM + 12, {
        width: CW / 2,
        height: 10,
        lineBreak: false,
      })
      doc.text(`PAGE ${i + 1} OF ${actual}`, M + CW / 2, BOTTOM + 12, {
        width: CW / 2,
        align: 'right',
        height: 10,
        lineBreak: false,
      })
      doc.x = sx
      doc.y = sy
    }

    // Drop leaked pages by rebuilding buffer from first N pages only —
    // PDFKit can't delete pages, so if count > 2 we must not have leaked.
    // Final safety: end document as-is; layout above must keep count ≤ 2.

    doc.end()
  })
}
