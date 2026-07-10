import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  variant?: 'icon' | 'labeled'
}

export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size={variant === 'icon' ? 'icon' : 'sm'}
      onClick={toggleTheme}
      className={cn('text-card-foreground/70 hover:text-card-foreground', className)}
      aria-label={t('theme.toggle')}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.5} />
      ) : (
        <Moon className="size-4" strokeWidth={1.5} />
      )}
      {variant === 'labeled' && (
        <span className="ml-2">{isDark ? t('theme.light') : t('theme.dark')}</span>
      )}
    </Button>
  )
}
