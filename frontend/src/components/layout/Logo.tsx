import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { icon: 'size-4', text: 'text-sm' },
  md: { icon: 'size-5', text: 'text-base' },
  lg: { icon: 'size-6', text: 'text-lg' },
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = sizeMap[size]

  return (
    <Link
      to="/"
      className={cn(
        'group inline-flex items-center gap-2.5 transition-opacity hover:opacity-80',
        className,
      )}
      aria-label={`${APP_NAME} home`}
    >
      <div className="relative flex size-8 items-center justify-center rounded-lg border border-border bg-surface-secondary">
        <ShieldCheck
          className={cn(sizes.icon, 'text-accent')}
          strokeWidth={1.75}
        />
        <div className="absolute inset-0 rounded-lg bg-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {showText && (
        <span
          className={cn(
            sizes.text,
            'font-semibold tracking-tight text-foreground',
          )}
        >
          {APP_NAME}
        </span>
      )}
    </Link>
  )
}
