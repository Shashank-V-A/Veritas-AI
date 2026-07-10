import { FolderOpen, Search, Shield, Users } from 'lucide-react'

const STATS = [
  { icon: Search, value: '12M+', label: 'Claims Analyzed' },
  { icon: Shield, value: '4.8M+', label: 'Sources Verified' },
  { icon: FolderOpen, value: '250K+', label: 'Investigations Completed' },
  { icon: Users, value: '78K+', label: 'Researchers & Analysts' },
] as const

export function LandingStats() {
  return (
    <section
      id="product"
      className="border-y border-white/[0.08] bg-[#111111]"
      aria-label="Platform statistics"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-white/[0.06] lg:grid-cols-4">
        {STATS.map(({ icon: Icon, value, label }) => (
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
