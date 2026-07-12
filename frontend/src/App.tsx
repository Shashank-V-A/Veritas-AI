import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AnimatePresence } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import {
  DashboardRouteFallback,
  RouteFallback,
} from '@/components/RouteFallback'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { CommandPaletteProvider, useCommandPalette } from '@/contexts/CommandPaletteContext'
import { BootGate } from '@/components/brand/BootSplash'
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
const PublicReportPage = lazy(() =>
  import('@/pages/PublicReportPage').then((m) => ({ default: m.PublicReportPage })),
)
const JudgeModePage = lazy(() =>
  import('@/pages/JudgeModePage').then((m) => ({ default: m.JudgeModePage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const GraphPage = lazy(() =>
  import('@/pages/GraphPage').then((m) => ({ default: m.GraphPage })),
)
const WatchlistPage = lazy(() =>
  import('@/pages/WatchlistPage').then((m) => ({ default: m.WatchlistPage })),
)
const DomainDossierPage = lazy(() =>
  import('@/pages/DomainDossierPage').then((m) => ({
    default: m.DomainDossierPage,
  })),
)

const ProtectedRoute = lazy(() =>
  import('@/components/auth/ProtectedRoute').then((m) => ({
    default: m.ProtectedRoute,
  })),
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
          <Route element={<Suspense fallback={<DashboardRouteFallback />}><ProtectedRoute /></Suspense>}>
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
              path="graph"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <GraphPage />
                </Suspense>
              }
            />
            <Route
              path="watchlist"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <WatchlistPage />
                </Suspense>
              }
            />
            <Route
              path="domain/:domain"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <DomainDossierPage />
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
            <Route
              path="settings"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route
          path="/judge"
          element={
            <ErrorBoundary fallbackTitle="Failed to load judge mode">
              <Suspense fallback={<RouteFallback />}>
                <JudgeModePage />
              </Suspense>
            </ErrorBoundary>
          }
        />

        <Route
          path="/share/:token"
          element={
            <ErrorBoundary fallbackTitle="Failed to load shared report">
              <Suspense fallback={<RouteFallback />}>
                <PublicReportPage />
              </Suspense>
            </ErrorBoundary>
          }
        />

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
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            <CommandPaletteProvider>
              <BrowserRouter>
                <AuthProvider>
                  <BootGate>
                    <AppShell>
                      <AnimatedRoutes />
                    </AppShell>
                    <CommandPaletteLoader />
                  </BootGate>
                </AuthProvider>
              </BrowserRouter>
            </CommandPaletteProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}
