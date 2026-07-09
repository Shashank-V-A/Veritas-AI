import { useNavigate } from 'react-router-dom'
import {
  Clock,
  FileSearch,
  Home,
  LayoutDashboard,
  Plus,
} from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'
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
  const { data } = useHistory({ limit: 5 })

  function run(action: () => void) {
    action()
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette">
      <CommandInput placeholder="Search commands and analyses..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.dashboard))}
          >
            <Plus className="size-4" />
            New analysis
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.history))}
          >
            <Clock className="size-4" />
            View history
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => navigate(ROUTES.dashboard))}
          >
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
            <CommandGroup heading="Recent analyses">
              {data?.items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() =>
                    run(() => navigate(ROUTES.analysis(item.id)))
                  }
                >
                  <FileSearch className="size-4" />
                  <span className="truncate">
                    {item.title ?? item.preview}
                  </span>
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
            <span>Submit analysis</span>
            <CommandShortcut>Ctrl Enter</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
