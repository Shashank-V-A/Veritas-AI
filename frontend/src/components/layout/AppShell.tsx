import { SkipLink } from '@/components/layout/SkipLink'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <SkipLink />
      {children}
    </>
  )
}
