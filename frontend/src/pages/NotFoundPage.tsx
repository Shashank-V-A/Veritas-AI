import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { HazardTapeCross } from '@/components/brand/HazardTape'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <HazardTapeCross density="corners" className="opacity-60" />
      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button className="mt-8 gap-2" asChild>
          <Link to={ROUTES.home}>
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  )
}
