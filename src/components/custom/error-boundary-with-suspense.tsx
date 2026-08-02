import type { PropsWithChildren } from 'react';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorNotification } from '@/components/custom/error-components';
import { ReportLoader } from '@/components/custom/loaders';
import { rethrowIfNextNotFoundError } from '@/lib/next-http-errors';

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
      fallbackRender={({ error }) => {
        rethrowIfNextNotFoundError(error);

        return (
          <ErrorNotification message={errorMessage || 'Something went wrong'} />
        );
      }}
    >
      <Suspense
        fallback={loader || <ReportLoader type={loaderType || 'full'} />}
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
