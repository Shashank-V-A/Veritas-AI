import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageTransition } from '@/animations/variants'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { DashboardShortcuts } from '@/components/layout/DashboardShortcuts'
import { Sidebar } from '@/components/layout/Sidebar'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function DashboardLayout() {
  const reducedMotion = useReducedMotion()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="grain intel-grid flex h-svh overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden bg-background text-foreground">
        <DashboardHeader onMenuClick={() => setMobileNavOpen(true)} />

        <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
          <motion.div
            className="flex-1 overflow-y-auto"
            variants={reducedMotion ? undefined : pageTransition}
            initial={reducedMotion ? false : 'initial'}
            animate={reducedMotion ? false : 'animate'}
            exit={reducedMotion ? undefined : 'exit'}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <OnboardingTour />
      <DashboardShortcuts />
    </div>
  )
}
