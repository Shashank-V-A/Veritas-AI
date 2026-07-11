import { SkipLink } from '@/components/layout/SkipLink'
import { HazardTapeFrame } from '@/components/brand/HazardTape'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <SkipLink />
      <HazardTapeFrame>{children}</HazardTapeFrame>
    </>
  )
}
