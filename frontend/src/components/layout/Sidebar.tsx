import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, LayoutDashboard, Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { sidebarItem } from '@/animations/variants'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { label: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'History', href: ROUTES.history, icon: Clock },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const { setOpen } = useCommandPalette()

  const content = (
    <>
      <div className="flex h-16 items-center justify-between px-5">
        <Logo size="sm" />
        {onMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileClose}
            aria-label="Close navigation menu"
          >
            <X className="size-5" strokeWidth={1.75} />
          </Button>
        )}
      </div>

      <Separator className="bg-border" />

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Button
          className="mb-2 w-full justify-start gap-2 bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent"
          variant="ghost"
          asChild
          onClick={onMobileClose}
        >
          <Link to={ROUTES.dashboard}>
            <Plus className="size-4" />
            New Analysis
          </Link>
        </Button>

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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-surface-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-surface-secondary/60 hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            onMobileClose?.()
          }}
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface-secondary/50 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-border hover:bg-surface-secondary hover:text-foreground"
          aria-label="Open command palette"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1">Search</span>
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline-block">
            Ctrl K
          </kbd>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        {content}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
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
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
