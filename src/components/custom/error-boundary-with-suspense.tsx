import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { PropsWithChildren } from 'react';
import { ErrorNotification } from '@/components/custom/error-components';
import { ReportLoader } from '@/components/custom/loaders';

type Props = {
  errorMessage?: string;
  loader?: React.ReactNode;
  loaderType?: 'tableOnly' | 'full';
};

export function ErrorBoundaryWithSuspense({
  errorMessage,
  children,
  loader,
  loaderType,
}: PropsWithChildren<Props>) {
  return (
    <ErrorBoundary
      fallback={
        <ErrorNotification message={errorMessage || 'Something went wrong'} />
      }
    >
      <Suspense
        fallback={loader || <ReportLoader type={loaderType || 'full'} />}
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
