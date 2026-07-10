import {
  FileText,
  Fingerprint,
  FolderOpen,
  Network,
  Search,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = [
  { icon: FolderOpen, label: 'Cases' },
  { icon: Fingerprint, label: 'Identity' },
  { icon: Search, label: 'Search' },
  { icon: Network, label: 'Graph' },
  { icon: FileText, label: 'Reports' },
  { icon: Shield, label: 'Trust' },
] as const

export function LandingIconRail({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-20 hidden h-svh w-12 flex-col items-center border-r border-white/[0.06] bg-[#0a0a0a]/95 py-24 lg:flex',
        className,
      )}
      aria-label="Quick tools"
    >
      <div className="flex flex-1 flex-col items-center gap-5">
        {ICONS.map(({ icon: Icon, label }) => (
          <a
            key={label}
            href="#live-investigation"
            className="text-accent/70 transition-colors hover:text-accent"
            aria-label={label}
            title={label}
          >
            <Icon className="size-[18px]" strokeWidth={1.25} />
          </a>
        ))}
      </div>
    </aside>
  )
}
