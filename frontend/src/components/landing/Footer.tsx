import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { Logo } from '@/components/layout/Logo'

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Why Veritas', href: '#why' },
  { label: 'Dashboard', href: ROUTES.dashboard },
]

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Don&apos;t consume information. Verify it.
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-8 gap-y-3"
            aria-label="Footer navigation"
          >
            {footerLinks.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Veritas AI. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Built for people who think before they share.
          </p>
        </div>
      </div>
    </footer>
  )
}
