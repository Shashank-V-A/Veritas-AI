import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, LayoutDashboard, LogOut, Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { sidebarItem } from '@/animations/variants'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { label: 'Workspace', href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Case files', href: ROUTES.history, icon: Clock },
]

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
  const { setOpen } = useCommandPalette()
  const { user, logout } = useAuth()

  const content = (
    <>
      <div className="flex h-[4.5rem] items-center justify-between border-b border-foreground/10 px-5">
        <Logo size="sm" linkTo={ROUTES.dashboard} variant="on-light" />
        {onMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileClose}
            aria-label="Close navigation menu"
          >
            <X className="size-5" strokeWidth={1.5} />
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Button
          className="mb-6 h-10 w-full justify-start gap-2.5 border border-foreground/15 bg-foreground/5 text-foreground hover:bg-foreground/10 hover:text-foreground"
          variant="ghost"
          asChild
          onClick={onMobileClose}
        >
          <Link to={ROUTES.dashboard}>
            <Plus className="size-4" />
            New investigation
          </Link>
        </Button>

        <p className="mb-2 px-2 font-mono text-[10px] text-foreground/50">
          Navigate
        </p>
        <nav
          className="flex flex-col gap-0.5"
          aria-label="Main navigation"
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
                    'group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-foreground/55 hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 border border-foreground/15 bg-foreground/5"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.icon
                    className="relative size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="relative">{item.label}</span>
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-foreground/10 p-4">
        <div className="flex items-center gap-2 px-2">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="font-mono text-[10px] text-foreground/55">Mesh API · Online</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            onMobileClose?.()
          }}
          className="flex w-full items-center gap-3 border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-left text-sm text-foreground/60 transition-colors hover:border-foreground/20 hover:text-foreground"
          aria-label="Open command palette"
        >
          <Search className="size-4 shrink-0" strokeWidth={1.5} />
          <span className="flex-1">Quick search</span>
          <kbd className="hidden border border-foreground/15 px-1.5 py-0.5 text-[10px] text-foreground/50 sm:inline-block">
            ⌘K
          </kbd>
        </button>

        {user && (
          <div className="flex items-center gap-3 border border-foreground/10 p-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="size-9 object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center border border-foreground/20 bg-foreground/5 text-xs font-medium text-foreground">
                {getInitials(user.name, user.email)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">
                {user.name ?? 'Member'}
              </p>
              <p className="truncate text-[11px] text-foreground/55">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void logout()}
              aria-label="Sign out"
              className="shrink-0 text-foreground/55 hover:text-foreground"
            >
              <LogOut className="size-4" strokeWidth={1.5} />
            </Button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden h-full w-[17.5rem] shrink-0 flex-col border-r border-foreground/10 bg-background md:flex">
        {content}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/70 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-foreground/10 bg-background md:hidden"
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
