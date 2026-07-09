import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  DashboardRouteFallback,
  RouteFallback,
} from '@/components/RouteFallback'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { CommandPaletteProvider, useCommandPalette } from '@/contexts/CommandPaletteContext'
import { queryClient } from '@/lib/queryClient'

const LandingLayout = lazy(() =>
  import('@/layouts/LandingLayout').then((m) => ({ default: m.LandingLayout })),
)
const DashboardLayout = lazy(() =>
  import('@/layouts/DashboardLayout').then((m) => ({
    default: m.DashboardLayout,
  })),
)
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const HistoryPage = lazy(() =>
  import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
)
const ReportPage = lazy(() =>
  import('@/pages/ReportPage').then((m) => ({ default: m.ReportPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const CommandPalette = lazy(() =>
  import('@/components/command/CommandPalette').then((m) => ({
    default: m.CommandPalette,
  })),
)

function CommandPaletteLoader() {
  const { open } = useCommandPalette()
  if (!open) return null

  return (
    <Suspense fallback={null}>
      <CommandPalette />
    </Suspense>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/app')

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          element={
            <Suspense fallback={<RouteFallback />}>
              <LandingLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <ErrorBoundary fallbackTitle="Failed to load page">
                <Suspense fallback={<RouteFallback />}>
                  <LandingPage />
                </Suspense>
              </ErrorBoundary>
            }
          />
        </Route>

        <Route
          path="/app"
          element={
            <ErrorBoundary fallbackTitle="Dashboard error">
              <Suspense
                fallback={
                  isDashboard ? <DashboardRouteFallback /> : <RouteFallback />
                }
              >
                <DashboardLayout />
              </Suspense>
            </ErrorBoundary>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<RouteFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="history"
            element={
              <Suspense fallback={<RouteFallback />}>
                <HistoryPage />
              </Suspense>
            }
          />
          <Route
            path="analysis/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ReportPage />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={300}>
          <CommandPaletteProvider>
            <BrowserRouter>
              <AnimatedRoutes />
              <CommandPaletteLoader />
            </BrowserRouter>
          </CommandPaletteProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
