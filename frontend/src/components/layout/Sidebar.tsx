import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  FileSearch,
  FolderOpen,
  LogOut,
  Network,
  Plus,
  Settings,
  Shield,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { sidebarItem } from '@/animations/variants'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { labelKey: 'nav.workspace', href: ROUTES.dashboard, icon: FileSearch },
  { labelKey: 'nav.caseFiles', href: ROUTES.history, icon: FolderOpen },
  { labelKey: 'nav.graph', href: ROUTES.graph, icon: Network },
  { labelKey: 'nav.settings', href: ROUTES.settings, icon: Settings },
] as const

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return (email?.slice(0, 2) ?? 'U').toUpperCase()
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  const content = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Logo size="sm" linkTo={ROUTES.dashboard} variant="on-dark" />
        {onMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileClose}
            aria-label={t('nav.closeMenu')}
          >
            <X className="size-5" strokeWidth={1.5} />
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Button
          className="mb-6 h-10 w-full justify-start gap-2.5"
          asChild
          onClick={onMobileClose}
        >
          <Link to={ROUTES.dashboard}>
            <Plus className="size-4" />
            {t('nav.newInvestigation')}
          </Link>
        </Button>

        <p className="meta-label mb-2 px-2">{t('nav.operations')}</p>
        <nav
          className="flex flex-col gap-0.5"
          aria-label={t('nav.mainNav')}
          data-onboarding="sidebar-nav"
        >
          {navItems.map((item, index) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== ROUTES.dashboard &&
                location.pathname.startsWith(item.href))

            return (
              <motion.div
                key={item.href}
                custom={index}
                variants={sidebarItem}
                initial="hidden"
                animate="visible"
              >
                <Link
                  to={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-200',
                    isActive
                      ? 'file-tab-active text-foreground'
                      : 'text-muted-foreground hover:bg-elevated hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-md border border-accent/25 bg-accent/5"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.icon
                    className="relative size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="relative">{t(item.labelKey)}</span>
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-border p-4">
        <div className="flex items-center gap-2 px-1">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="font-mono text-[10px] text-muted-foreground">
            {t('nav.meshOnline')}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="size-9 rounded-sm object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-sm border border-border bg-elevated text-xs font-medium text-foreground">
                {getInitials(user.name, user.email)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">
                {user.name ?? t('nav.investigator')}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void logout()}
              aria-label={t('nav.signOut')}
              className="shrink-0"
            >
              <LogOut className="size-4" strokeWidth={1.5} />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 px-1 pt-1">
          <Shield className="size-3 text-accent/70" strokeWidth={1.5} />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            {t('nav.classifiedWorkspace')}
          </span>
          <Clock className="ml-auto size-3 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden h-full w-[17rem] shrink-0 flex-col border-r border-border bg-surface md:flex">
        {content}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
