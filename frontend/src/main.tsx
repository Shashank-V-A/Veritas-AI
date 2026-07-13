import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from '@/App'
import '@/i18n'
import '@/index.css'

// Legacy SW used cache-first and caused blank first loads after deploy — remove it.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister()
    }
  })
}

// Recover from stale chunk URLs after a new Vercel deploy.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

window.addEventListener('unhandledrejection', (event) => {
  const message =
    event.reason instanceof Error
      ? event.reason.message
      : String(event.reason ?? '')
  if (
    /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      message,
    )
  ) {
    const key = 'veritas-chunk-reload'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Application error">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
