import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Card className="max-w-md border-border bg-surface">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-surface-secondary">
                <AlertTriangle
                  className="size-5 text-warning"
                  strokeWidth={1.75}
                />
              </div>
              <p className="text-sm font-medium text-foreground">
                {this.props.fallbackTitle ?? 'Something went wrong'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                An unexpected error occurred. Try refreshing the page.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={this.handleReset}
                >
                  <RefreshCw className="size-3.5" />
                  Try again
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Reload page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
