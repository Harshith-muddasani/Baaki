import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time errors below it so one broken component takes down its
 * section, not the whole app. React error boundaries only catch errors during
 * render/lifecycle - async errors (failed fetches) are handled separately by
 * TanStack Query's own error states, not this.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="size-8 text-negative" />
          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.assign('/')}>
            Reload app
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
