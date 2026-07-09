export const colors = {
  gold: '#D4AF37',
  black: '#000000',
  background: '#D4AF37',
  surface: '#000000',
  surfaceSecondary: '#141414',
  border: '#0A0A0A',
  foreground: '#0A0A0A',
  onDark: '#D4AF37',
  muted: '#4A4A4A',
  mutedDark: '#2E2E2E',
  accent: '#D4AF37',
  accentSecondary: '#B8962E',
  success: '#5A8F5A',
  warning: '#D4AF37',
  danger: '#C45C5C',
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
  subtle: '0 1px 2px rgba(0, 0, 0, 0.5)',
  card: '0 4px 24px rgba(0, 0, 0, 0.45)',
  elevated: '0 8px 32px rgba(0, 0, 0, 0.55)',
} as const
