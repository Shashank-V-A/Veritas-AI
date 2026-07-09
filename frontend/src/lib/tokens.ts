export const colors = {
  background: '#2B2D42',
  surface: '#363856',
  surfaceSecondary: '#4A4E69',
  border: '#5C6078',
  foreground: '#F8F6F2',
  muted: '#B8BCCF',
  mutedDark: '#8B8FA8',
  accent: '#F6BD60',
  accentSecondary: '#E8A84A',
  success: '#8FBC8F',
  warning: '#F6BD60',
  danger: '#E07A5F',
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
  subtle: '0 1px 2px rgba(43, 45, 66, 0.4)',
  card: '0 4px 24px rgba(43, 45, 66, 0.35)',
  elevated: '0 8px 32px rgba(43, 45, 66, 0.45)',
} as const
