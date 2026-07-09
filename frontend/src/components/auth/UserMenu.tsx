import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return (email?.slice(0, 2) ?? 'U').toUpperCase()
}

export function UserMenu() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary/50 px-3 py-2">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt=""
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-8 items-center justify-center rounded-full bg-accent/15 text-xs font-medium text-accent">
          {getInitials(user.name, user.email)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user.name ?? 'Signed in'}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => void logout()}
        aria-label="Sign out"
        className="shrink-0"
      >
        <LogOut className="size-4" strokeWidth={1.75} />
      </Button>
    </div>
  )
}
