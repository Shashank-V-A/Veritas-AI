import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, FlaskConical } from 'lucide-react'
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading'
import { TrustScoreRing } from '@/components/analysis/report/TrustScoreRing'
import { VerdictBanner } from '@/components/analysis/report/VerdictBanner'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { getFriendlyErrorMessage } from '@/lib/errorMessages'
import { SAMPLE_REPORT } from '@/lib/sampleReport'
import { useGuestAnalyze } from '@/hooks/useAnalyze'

const GUEST_USED_KEY = 'veritas_guest_used'

function hasUsedGuestAnalysis(): boolean {
  try {
    return localStorage.getItem(GUEST_USED_KEY) === '1'
  } catch {
    return false
  }
}

function markGuestUsed() {
  try {
    localStorage.setItem(GUEST_USED_KEY, '1')
  } catch {
    // storage unavailable
  }
}

export function LiveInvestigationSection() {
  const navigate = useNavigate()
  const [guestUsed, setGuestUsed] = useState(hasUsedGuestAnalysis)
  const [showMiniReport, setShowMiniReport] = useState(false)
  const [guestShareToken, setGuestShareToken] = useState<string | null>(null)
  const guestAnalyze = useGuestAnalyze({
    onSuccess: (data) => {
      markGuestUsed()
      setGuestUsed(true)
      setShowMiniReport(true)
      if (data.shareToken) setGuestShareToken(data.shareToken)
    },
  })

  function handleRunInvestigation() {
    if (guestUsed) return

    guestAnalyze.mutate({
      content: SAMPLE_REPORT.content,
      sourceType: SAMPLE_REPORT.sourceType,
      title: SAMPLE_REPORT.title,
      category: 'health',
    })
  }

  const report = guestAnalyze.data?.report ?? SAMPLE_REPORT.report

  return (
    <section className="border-t border-accent/20 bg-surface px-6 py-16 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-accent-secondary/80">Live demo</p>
            <h2 className="mt-2 font-display text-2xl text-card-foreground md:text-3xl">
              Run a live investigation
            </h2>
            <p className="mt-2 max-w-xl text-sm text-card-foreground/65">
              Analyze the sample health forward once — no sign-in required. See how Veritas
              builds a credibility dossier in real time.
            </p>
          </div>
          <span className="stamp border-accent-secondary text-accent-secondary">
            Guest access
          </span>
        </div>

        <div className="mt-8">
          {guestAnalyze.isPending ? (
            <AnalysisLoading />
          ) : showMiniReport ? (
            <div className="case-intake-panel grain relative overflow-hidden">
              <div className="relative z-10 space-y-6 p-6 md:p-8">
                <VerdictBanner verdict={report.verdict} caseId="VA-DEMO" />
                <div className="grid gap-6 md:grid-cols-[200px_1fr]">
                  <div className="flex justify-center">
                    <TrustScoreRing score={report.trustScore} variant="seal" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-card-foreground/50">
                      Investigation complete
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-card-foreground/85">
                      {report.summary}
                    </p>
                    <p className="mt-3 font-mono text-[10px] text-card-foreground/45">
                      {report.claims.length} claims · {report.fallacies.length} fallacies detected
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      if (guestShareToken) {
                        navigate(ROUTES.share(guestShareToken))
                      } else {
                        navigate(ROUTES.demo)
                      }
                    }}
                  >
                    View full dossier
                    <ArrowRight className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const el = document.getElementById('sign-in-section')
                      el?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Sign in for unlimited analyses
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="case-intake-panel grain relative overflow-hidden p-6 md:p-8">
              <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center border border-accent/30 bg-accent/10">
                    <FlaskConical className="size-5 text-accent-secondary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {SAMPLE_REPORT.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-card-foreground/60">
                      {SAMPLE_REPORT.content.slice(0, 120)}…
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleRunInvestigation}
                  disabled={guestUsed}
                  className="gap-2 shrink-0"
                >
                  {guestUsed ? 'Guest analysis used' : 'Run live investigation'}
                  {!guestUsed && <ArrowRight className="size-4" />}
                </Button>
              </div>
              {guestUsed && !showMiniReport && (
                <p className="relative z-10 mt-4 text-xs text-card-foreground/55">
                  You&apos;ve used your free guest analysis.{' '}
                  <a href="#sign-in-section" className="text-accent-secondary underline">
                    Sign in
                  </a>{' '}
                  to run unlimited investigations, or{' '}
                  <button
                    type="button"
                    className="text-accent-secondary underline"
                    onClick={() => navigate(ROUTES.demo)}
                  >
                    view the sample dossier
                  </button>
                  .
                </p>
              )}
              {guestAnalyze.isError && (
                <p className="relative z-10 mt-4 text-xs text-danger" role="alert">
                  {getFriendlyErrorMessage(guestAnalyze.error)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
