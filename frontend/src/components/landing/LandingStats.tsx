import { useTranslation } from 'react-i18next'
import { FolderOpen, Search, Shield, Users } from 'lucide-react'

export function LandingStats() {
  const { t } = useTranslation()

  const stats = [
    { icon: Search, value: '12M+', label: t('landing.statClaims') },
    { icon: Shield, value: '4.8M+', label: t('landing.statSources') },
    { icon: FolderOpen, value: '250K+', label: t('landing.statInvestigations') },
    { icon: Users, value: '78K+', label: t('landing.statResearchers') },
  ] as const

  return (
    <section
      className="border-y border-white/[0.08] bg-[#111111]"
      aria-label={t('landing.statsAria')}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/[0.06] lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-start gap-3 bg-[#111111] px-6 py-8 md:px-8 md:py-10"
          >
            <Icon className="size-5 text-accent" strokeWidth={1.25} />
            <p className="font-display text-3xl font-semibold tracking-tight text-accent md:text-4xl">
              {value}
            </p>
            <p className="font-sans text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
