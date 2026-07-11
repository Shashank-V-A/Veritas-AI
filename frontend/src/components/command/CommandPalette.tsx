import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  FileSearch,
  Home,
  LayoutDashboard,
  Network,
  Plus,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES, FOCUS_INTAKE_EVENT } from '@/lib/constants'
import { formatCaseId } from '@/lib/caseId'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'
import { useDebounce } from '@/hooks/useDebounce'
import { useHistory } from '@/hooks/useHistory'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

export function CommandPalette() {
  const { t } = useTranslation()
  const { open, setOpen } = useCommandPalette()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const { data } = useHistory({
    limit: 10,
    search: debouncedSearch || undefined,
  })

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  function run(action: () => void) {
    action()
    setOpen(false)
  }

  function focusIntake() {
    navigate(ROUTES.dashboard)
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(FOCUS_INTAKE_EVENT))
    }, 100)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title={t('command.title')}>
      <CommandInput
        placeholder={t('command.searchPlaceholder')}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{t('command.noResults')}</CommandEmpty>

        <CommandGroup heading={t('command.actions')}>
          <CommandItem onSelect={() => run(focusIntake)}>
            <Plus className="size-4" />
            {t('command.newAnalysis')}
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate(ROUTES.history))}>
            <Clock className="size-4" />
            {t('command.viewHistory')}
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate(ROUTES.graph))}>
            <Network className="size-4" />
            {t('nav.graph')}
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate(ROUTES.dashboard))}>
            <LayoutDashboard className="size-4" />
            {t('command.dashboard')}
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate(ROUTES.home))}>
            <Home className="size-4" />
            {t('command.home')}
          </CommandItem>
        </CommandGroup>

        {(data?.items.length ?? 0) > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup
              heading={
                debouncedSearch ? t('command.searchResults') : t('command.recentCases')
              }
            >
              {data?.items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => run(() => navigate(ROUTES.analysis(item.id)))}
                >
                  <FileSearch className="size-4" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">
                      {item.title ?? item.preview}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatCaseId(item.id)}
                    </span>
                  </div>
                  <CommandShortcut>{item.trustScore}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading={t('command.shortcuts')}>
          <CommandItem disabled>
            <span>{t('command.openPalette')}</span>
            <CommandShortcut>Ctrl K</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <span>{t('command.focusIntake')}</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
