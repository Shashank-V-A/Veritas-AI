import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/services/api'
import { formatRelativeDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  collapsed?: boolean
  className?: string
}

export function NotificationBell({ collapsed, className }: NotificationBellProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(20),
    refetchInterval: 60_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = data?.unreadCount ?? 0
  const items = data?.items ?? []

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', collapsed ? 'size-8' : 'size-9')}
        aria-label={t('notifications.title')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-4" strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent font-mono text-[9px] text-background">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label={t('notifications.close')}
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'absolute z-50 w-80 border border-border bg-surface shadow-xl',
              collapsed ? 'bottom-0 left-full ml-2' : 'bottom-full left-0 mb-2',
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                {t('notifications.title')}
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={() => markAll.mutate()}
                >
                  {t('notifications.markAll')}
                </button>
              )}
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {items.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {t('notifications.empty')}
                </li>
              )}
              {items.map((n) => {
                const inner = (
                  <div className="px-3 py-2.5">
                    <p
                      className={cn(
                        'text-sm',
                        n.readAt ? 'text-muted-foreground' : 'text-foreground',
                      )}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                      {formatRelativeDate(n.createdAt)}
                    </p>
                  </div>
                )
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'border-b border-border/50',
                      !n.readAt && 'bg-accent/5',
                    )}
                  >
                    {n.href ? (
                      <Link
                        to={n.href}
                        onClick={() => {
                          if (!n.readAt) markRead.mutate(n.id)
                          setOpen(false)
                        }}
                        className="block hover:bg-elevated"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="w-full text-left hover:bg-elevated"
                        onClick={() => {
                          if (!n.readAt) markRead.mutate(n.id)
                        }}
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
