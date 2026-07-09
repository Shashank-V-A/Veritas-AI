import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  FileSearch,
  Home,
  LayoutDashboard,
  Plus,
} from 'lucide-react'
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
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette">
      <CommandInput
        placeholder="Search case files and claims…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(focusIntake)}>
            <Plus className="size-4" />
            New analysis
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate(ROUTES.history))}>
            <Clock className="size-4" />
            View history
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate(ROUTES.dashboard))}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate(ROUTES.home))}>
            <Home className="size-4" />
            Home
          </CommandItem>
        </CommandGroup>

        {(data?.items.length ?? 0) > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={debouncedSearch ? 'Search results' : 'Recent case files'}>
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
        <CommandGroup heading="Shortcuts">
          <CommandItem disabled>
            <span>Open command palette</span>
            <CommandShortcut>Ctrl K</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <span>Focus case intake</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
