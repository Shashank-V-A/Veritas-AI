import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  ChevronDown,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  Radar,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/services/api'
import type { ClaimWatchHit, ClaimWatchItem } from '@/services/api'
import { ROUTES } from '@/lib/constants'
import { formatRelativeDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BROWSER_PERM_KEY = 'veritas-browser-alerts'

function requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('unsupported')
  }
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  if (Notification.permission === 'denied') return Promise.resolve('denied')
  return Notification.requestPermission()
}

function showBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, tag: 'veritas-watchlist' })
  } catch {
    /* ignore */
  }
}

function WatchHitList({ hits }: { hits: ClaimWatchHit[] }) {
  const { t } = useTranslation()
  if (hits.length === 0) {
    return (
      <p className="px-1 py-2 font-mono text-[11px] text-muted-foreground">
        {t('watchlist.noHitsYet')}
      </p>
    )
  }
  return (
    <ul className="mt-2 space-y-2 border-t border-border/60 pt-3">
      {hits.map((hit) => (
        <li key={hit.id} className="border border-border/70 bg-background/40 px-3 py-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {hit.source === 'web' ? (
              <Globe className="size-3 text-accent" />
            ) : (
              <Eye className="size-3 text-accent" />
            )}
            {hit.source === 'web' ? t('watchlist.sourceWeb') : t('watchlist.sourceCase')}
            <span className="ml-auto normal-case tracking-normal">
              {formatRelativeDate(hit.discoveredAt)}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground">{hit.title || t('watchlist.untitledHit')}</p>
          {hit.snippet && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hit.snippet}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3">
            {hit.url && (
              <a
                href={hit.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-accent hover:underline"
              >
                <ExternalLink className="size-3" />
                {t('watchlist.openSource')}
              </a>
            )}
            {hit.analysisId && (
              <Link
                to={ROUTES.analysis(hit.analysisId)}
                className="font-mono text-[10px] text-accent hover:underline"
              >
                {t('watchlist.viewHit')}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function WatchRow({
  item,
  emailConfigured,
}: {
  item: ClaimWatchItem
  emailConfigured: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const hitsQuery = useQuery({
    queryKey: ['watch-hits', item.id],
    queryFn: () => api.getWatchHits(item.id),
    enabled: open,
  })

  const patch = useMutation({
    mutationFn: (data: { emailAlerts?: boolean; browserAlerts?: boolean }) =>
      api.updateWatch(item.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  const scanOne = useMutation({
    mutationFn: () => api.scanWatch(item.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      queryClient.invalidateQueries({ queryKey: ['watch-hits', item.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if (result.newHits > 0 && item.browserAlerts !== false) {
        showBrowserNotification(
          t('watchlist.browserHitTitle'),
          t('watchlist.browserHitBody', { count: result.newHits }),
        )
      }
    },
  })

  const remove = useMutation({
    mutationFn: () => api.removeWatch(item.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  return (
    <li className="border border-border bg-elevated/30 px-4 py-3">
      <p className="text-sm leading-relaxed text-foreground">{item.claimText}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Eye className="size-3" />
          {t('watchlist.caseHits', { count: item.hitCount })}
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Globe className="size-3" />
          {t('watchlist.webHits', { count: item.webHitCount ?? 0 })}
        </span>
        {item.lastWebScanAt && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {t('watchlist.lastScan')} {formatRelativeDate(item.lastWebScanAt)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <input
            type="checkbox"
            className="accent-[var(--color-accent,#C8A24A)]"
            checked={item.emailAlerts !== false}
            disabled={!emailConfigured || patch.isPending}
            onChange={(e) => patch.mutate({ emailAlerts: e.target.checked })}
          />
          <Mail className="size-3" />
          {t('watchlist.emailAlerts')}
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <input
            type="checkbox"
            className="accent-[var(--color-accent,#C8A24A)]"
            checked={item.browserAlerts !== false}
            disabled={patch.isPending}
            onChange={async (e) => {
              if (e.target.checked) {
                const perm = await requestBrowserPermission()
                try {
                  localStorage.setItem(BROWSER_PERM_KEY, perm)
                } catch {
                  /* ignore */
                }
              }
              patch.mutate({ browserAlerts: e.target.checked })
            }}
          />
          <Bell className="size-3" />
          {t('watchlist.browserAlerts')}
        </label>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => scanOne.mutate()}
          disabled={scanOne.isPending}
        >
          <Radar className="size-3.5" />
          {scanOne.isPending ? t('watchlist.scanning') : t('watchlist.scanOne')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
          {t('watchlist.showHits')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1 text-muted-foreground"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
        >
          <Trash2 className="size-3.5" />
          {t('watchlist.remove')}
        </Button>
      </div>

      {open && (
        <div className="mt-2">
          {hitsQuery.isLoading && (
            <p className="font-mono text-[11px] text-muted-foreground">{t('watchlist.loadingHits')}</p>
          )}
          {hitsQuery.data && <WatchHitList hits={hitsQuery.data.hits} />}
        </div>
      )}
    </li>
  )
}

export function WatchlistPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const scannedOnce = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.getWatchlist(),
  })

  const scanAll = useMutation({
    mutationFn: () => api.scanWatchlist(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if (result.newHits > 0) {
        showBrowserNotification(
          t('watchlist.browserHitTitle'),
          t('watchlist.browserHitBody', { count: result.newHits }),
        )
      }
    },
  })

  useEffect(() => {
    void requestBrowserPermission().then((perm) => {
      try {
        localStorage.setItem(BROWSER_PERM_KEY, String(perm))
      } catch {
        /* ignore */
      }
    })
  }, [])

  const items = data?.items ?? []
  const emailConfigured = data?.emailConfigured ?? false

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label flex items-center gap-2 text-accent">
            <Eye className="size-3" strokeWidth={1.75} />
            {t('watchlist.eyebrow')}
          </p>
          <h1 className="mt-2 font-display text-3xl text-foreground">{t('watchlist.title')}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t('watchlist.bodyExtended')}</p>
          {!emailConfigured && (
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
              {t('watchlist.emailNotConfigured')}
            </p>
          )}
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            scannedOnce.current = true
            scanAll.mutate()
          }}
          disabled={scanAll.isPending || items.length === 0}
        >
          <Radar className="size-4" />
          {scanAll.isPending ? t('watchlist.scanning') : t('watchlist.scanWeb')}
        </Button>
      </header>

      {scanAll.isSuccess && (
        <p className="mb-4 border border-accent/25 bg-accent/5 px-3 py-2 font-mono text-[11px] text-accent">
          {t('watchlist.scanResult', {
            scanned: scanAll.data.scanned,
            hits: scanAll.data.newHits,
          })}
        </p>
      )}

      {isLoading && (
        <p className="font-mono text-sm text-muted-foreground">{t('watchlist.loading')}</p>
      )}

      {!isLoading && items.length === 0 && (
        <p className="border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t('watchlist.empty')}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <WatchRow key={item.id} item={item} emailConfigured={emailConfigured} />
        ))}
      </ul>
    </div>
  )
}
