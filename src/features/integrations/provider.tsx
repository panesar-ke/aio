'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { ModalProvider } from '@/features/integrations/modal-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 60 * 1000, // 1 hour
            gcTime: 2 * 60 * 60 * 1000, // 2 hours
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>{children}</ModalProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      {/* Toasts style themselves — see the `notify` helper in
          src/components/custom/toast.tsx */}
      <Toaster position="top-center" gutter={10} />
    </QueryClientProvider>
  );
}
