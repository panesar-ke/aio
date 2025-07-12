import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CircleGauge,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorProps {
  title?: string
  message?: string
  action?: {
    label?: string
    onClick: () => void
  }
  className?: string
}

export function ErrorComponent({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again later.',
  action,
  className,
}: ErrorProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4',
        className,
      )}
    >
      <AlertCircle
        className="w-16 h-16 text-destructive mb-4"
        aria-hidden="true"
      />
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      <p className="text-xl mb-4">
        We're sorry, but an error occurred while processing your request.
      </p>
      <p className="text-muted-foreground mb-6">
        Error: {message || 'Unknown error'}
      </p>
      <div className="flex items-center gap-4">
        <Button asChild variant="default">
          <Link to="..">Go Back</Link>
        </Button>
        {action && (
          <Button onClick={action.onClick} variant="destructive">
            {action.label || 'Retry'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="animate-slide-up">
        <div className="mb-8 text-center animate-fade-in animation-delay-100">
          <h1 className="text-xl sm:text-4xl lg:text-8xl font-bold text-slate-200 select-none animate-float leading-none">
            404
          </h1>
        </div>

        <div className="mb-8 animate-fade-in animation-delay-200 text-center">
          <h2 className="text-xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Oops! Page not found
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The page you're looking for doesn't exist. It might have been moved,
            deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in animation-delay-600">
          <Button asChild size="lg">
            <Link to="/dashboard">
              <CircleGauge className="w-5 h-5" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant={'outline'} size="lg">
            <Link to="..">
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ResourceNotFound() {
  return (
    <div className="flex flex-col gap-y-6 items-center justify-center px-4 sm:px-6 lg:px-8 h-[calc(100dvh-10rem)]">
      <img src="/empty.svg" alt="empty state vector" />
      <div className="text-center">
        <h4 className="text-2xl font-semibold text-accent-foreground">
          Resource not found!!
        </h4>
        <p className="text-muted-foreground text-sm">
          The resource you are looking for does not exist or has been removed.
        </p>
      </div>
      <Button asChild variant="default" size={'lg'}>
        <Link to="..">
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </Link>
      </Button>
    </div>
  )
}

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: (...args: Array<unknown>) => void
  className?: string
}

interface ErrorNotificationProps {
  className?: string
  message?: string
}

export function ErrorNotification({
  className,
  message,
}: ErrorNotificationProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-[calc(100dvh-10rem)] bg-background text-foreground p-4',
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h1 className="text-4xl font-bold mb-2 font-display">
        Something went wrong
      </h1>
      <p className="text-sm mb-4 text-muted-foreground">
        We're sorry, but an error occurred while processing your request.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="text-sm bg-orange-100 px-1 py-0.5 rounded mt-1 inline-block">
          {message || 'Unknown error'}
        </pre>
      )}
    </div>
  )
}

export const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) => {
  return (
    <div role="alert" className="error-fallback">
      <p className="text-bold">Something went wrong:</p>
      <pre className="text-destructive">{error.message}</pre>
      <Button size="sm" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  )
}
