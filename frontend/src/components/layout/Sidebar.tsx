import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Eye,
  FileSearch,
  FolderOpen,
  LogOut,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { sidebarItem } from '@/animations/variants'
import { Logo } from '@/components/layout/Logo'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/AuthContext'

const STORAGE_KEY = 'veritas-sidebar-collapsed'

const navItems = [
  { labelKey: 'nav.workspace', href: ROUTES.dashboard, icon: FileSearch },
  { labelKey: 'nav.caseFiles', href: ROUTES.history, icon: FolderOpen },
  { labelKey: 'nav.watchlist', href: ROUTES.watchlist, icon: Eye },
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
    if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return (email?.slice(0, 2) ?? 'U').toUpperCase()
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

interface SidebarBodyProps {
  collapsed: boolean
  onToggleCollapse?: () => void
  onMobileClose?: () => void
  showMobileClose?: boolean
}

function SidebarBody({
  collapsed,
  onToggleCollapse,
  onMobileClose,
  showMobileClose,
}: SidebarBodyProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  function navLink(item: (typeof navItems)[number], index: number) {
    const isActive =
      location.pathname === item.href ||
      (item.href !== ROUTES.dashboard && location.pathname.startsWith(item.href))
    const label = t(item.labelKey)

    const link = (
      <Link
        to={item.href}
        onClick={onMobileClose}
        title={collapsed ? label : undefined}
        className={cn(
          'group relative flex items-center rounded-md text-sm transition-colors duration-200',
          collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'file-tab-active text-foreground'
            : 'text-muted-foreground hover:bg-elevated hover:text-foreground',
        )}
        aria-current={isActive ? 'page' : undefined}
        aria-label={collapsed ? label : undefined}
      >
        {isActive && (
          <motion.span
            layoutId="nav-active"
            className="absolute inset-0 rounded-md border border-accent/25 bg-accent/5"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
        <item.icon className="relative size-4 shrink-0" strokeWidth={1.5} />
        {!collapsed && <span className="relative truncate">{label}</span>}
      </Link>
    )

    return (
      <motion.div
        key={item.href}
        custom={index}
        variants={sidebarItem}
        initial="hidden"
        animate="visible"
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        ) : (
          link
        )}
      </motion.div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'flex shrink-0 border-b border-border',
          collapsed
            ? 'flex-col items-center gap-2 px-2 py-3'
            : 'h-16 items-center justify-between gap-2 px-4',
        )}
      >
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'min-w-0 flex-1')}>
          <Logo
            size="sm"
            linkTo={ROUTES.dashboard}
            variant="on-dark"
            showText={!collapsed}
          />
        </div>
        {showMobileClose && (
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
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-8 shrink-0 text-muted-foreground hover:text-accent md:inline-flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" strokeWidth={1.5} />
            ) : (
              <PanelLeftClose className="size-4" strokeWidth={1.5} />
            )}
          </Button>
        )}
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col overflow-y-auto',
          collapsed ? 'px-2 py-3' : 'p-4',
        )}
      >
        {!collapsed && (
          <p className="meta-label mb-2 px-2">{t('nav.operations')}</p>
        )}
        <nav
          className="flex flex-col gap-0.5"
          aria-label={t('nav.mainNav')}
          data-onboarding="sidebar-nav"
        >
          {navItems.map((item, index) => navLink(item, index))}
        </nav>
      </div>

      <div
        className={cn(
          'space-y-3 border-t border-border',
          collapsed ? 'px-2 py-3' : 'p-4',
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <NotificationBell collapsed />
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center justify-center py-1"
                  aria-label={t('nav.meshOnline')}
                >
                  <span className="size-1.5 rounded-full bg-success" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{t('nav.meshOnline')}</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" />
              <span className="font-mono text-[10px] text-muted-foreground">
                {t('nav.meshOnline')}
              </span>
            </div>
            <NotificationBell />
          </div>
        )}

        {user && (
          collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex size-9 items-center justify-center overflow-hidden rounded-sm border border-border bg-surface">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="size-9 object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-foreground">
                        {getInitials(user.name, user.email)}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user.name ?? t('nav.investigator')}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void logout()}
                    aria-label={t('nav.signOut')}
                    className="size-8"
                  >
                    <LogOut className="size-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t('nav.signOut')}</TooltipContent>
              </Tooltip>
            </div>
          ) : (
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
          )
        )}

        {!collapsed && (
          <div className="flex items-center gap-2 px-1 pt-1">
            <Shield className="size-3 text-accent/70" strokeWidth={1.5} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {t('nav.classifiedWorkspace')}
            </span>
            <Clock className="ml-auto size-3 text-muted-foreground/50" strokeWidth={1.5} />
          </div>
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center py-1" aria-label={t('nav.classifiedWorkspace')}>
                <Shield className="size-3.5 text-accent/70" strokeWidth={1.5} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{t('nav.classifiedWorkspace')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  )
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  function toggleCollapse() {
    setCollapsed((v) => !v)
  }

  return (
    <>
      <aside
        className={cn(
          'relative hidden h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-300 ease-out md:flex',
          collapsed ? 'w-[4.25rem]' : 'w-[17rem]',
        )}
        data-collapsed={collapsed ? 'true' : 'false'}
      >
        <SidebarBody
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
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
              <SidebarBody
                collapsed={false}
                showMobileClose
                onMobileClose={onMobileClose}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
