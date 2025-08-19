'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
// import { Toaster } from '@/components/ui/sonner';

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
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
      {/* <Toaster /> */}
      <Toaster
        position="top-center"
        toastOptions={{
          // Define default options
          className: 'p-0',
          duration: 5000,
          removeDelay: 1000,
          style: {
            background: '#FDF9E4',
            color: '#3E240F',
            maxWidth: '600px',
            // width: '100%',
          },

          // Default options for specific types
          success: {
            duration: 3000,
            style: {
              background: '#a3dfb3',
              color: '#3E240F',
            },
            icon: '',
          },
          error: {
            duration: 5000,
            style: {
              background: '#f8d7da',
              color: '#3E240F',
            },
            icon: '',
          },
        }}
      />
    </QueryClientProvider>
  );
}
