import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: (...args: Array<unknown>) => void;
  className?: string;
}

interface ErrorNotificationProps {
  className?: string;
  message?: string;
}

export function ErrorNotification({
  className,
  message,
}: ErrorNotificationProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-[calc(100dvh-10rem)] bg-background text-foreground p-4',
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h1 className="text-4xl font-bold mb-2 font-display">
        Something went wrong
      </h1>
      <p className="text-sm mb-4 text-muted-foreground">
        We&apos;re sorry, but an error occurred while processing your request.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="text-sm bg-orange-100 px-1 py-0.5 rounded mt-1 inline-block">
          {message || 'Unknown error'}
        </pre>
      )}
    </div>
  );
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
  );
};
