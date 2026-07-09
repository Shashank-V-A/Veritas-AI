export const colors = {
  background: '#09090B',
  surface: '#111113',
  surfaceSecondary: '#18181B',
  border: '#27272A',
  foreground: '#FAFAFA',
  muted: '#A1A1AA',
  mutedDark: '#71717A',
  accent: '#10B981',
  accentSecondary: '#22D3EE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const

export const typography = {
  fontFamily: '"Inter", system-ui, sans-serif',
  heading: {
    xl: 'text-3xl font-semibold tracking-tight',
    lg: 'text-2xl font-semibold tracking-tight',
    md: 'text-xl font-medium tracking-tight',
    sm: 'text-lg font-medium',
  },
  body: {
    lg: 'text-base leading-relaxed',
    md: 'text-sm leading-relaxed',
    sm: 'text-xs leading-relaxed',
  },
} as const

export const spacing = {
  page: 'px-6 py-8 md:px-8 lg:px-12',
  section: 'py-16 md:py-24',
  card: 'p-6',
} as const

export const radii = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
} as const

export const shadows = {
  subtle: '0 1px 2px rgba(0, 0, 0, 0.4)',
  card: '0 4px 24px rgba(0, 0, 0, 0.24)',
  elevated: '0 8px 32px rgba(0, 0, 0, 0.32)',
} as const
