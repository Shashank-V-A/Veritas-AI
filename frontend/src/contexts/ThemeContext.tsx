import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'

/** Product is ink-only — parchment / light desk is retired. */
export type Theme = 'dark'

const STORAGE_KEY = 'veritas-theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyInkTheme() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.add('dark')
  root.dataset.theme = 'intel'
  try {
    localStorage.setItem(STORAGE_KEY, 'dark')
  } catch {
    /* ignore */
  }
}

// Lock ink before first paint when the module loads
applyInkTheme()

export function ThemeProvider({ children }: { children: ReactNode }) {
  applyInkTheme()

  const setTheme = useCallback((_next: Theme) => {
    applyInkTheme()
  }, [])

  const toggleTheme = useCallback(() => {
    applyInkTheme()
  }, [])

  const value = useMemo(
    () => ({ theme: 'dark' as const, setTheme, toggleTheme }),
    [setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
