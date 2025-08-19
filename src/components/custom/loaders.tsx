import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/custom/table-skeleton';
import Image from 'next/image';
import { generateRandomId } from '@/lib/utils';

export function FullPageLoader() {
  return (
    <div className="h-full flex flex-col gap-2 items-center justify-center">
      <Image
        className="animate-ping w-8 h-8"
        src="/logos/favicon-black.svg"
        alt="Panesar Logo"
        width={32}
        height={32}
      />
      <p className="text-muted-foreground text-sm mt-4 animate-pulse">
        Loading....
      </p>
    </div>
  );
}

export function AuthedPageLoader() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-0.5">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-10 w-72" />
      <TableSkeleton
        rowCount={10}
        columnWidths={['w-36', 'w-24', 'w-56', 'w-44', 'w-24', 'w-1']}
      />
    </div>
  );
}

export function FormLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function ReportLoader({
  type = 'full',
}: {
  type?: 'full' | 'tableOnly';
}) {
  if (type === 'tableOnly') {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="w-56 h-10" />
          <Skeleton className="w-56 h-10" />
        </div>
        <TableSkeleton
          rowCount={10}
          columnWidths={[
            'w-48',
            'w-32',
            'w-64',
            'w-40',
            'w-56',
            'w-24',
            'w-32',
          ]}
        />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map(() => (
            <Skeleton
              key={generateRandomId('loading-skeleton')}
              className="h-10 w-full"
            />
          ))}
        </div>
        <Skeleton className="w-56 h-10" />
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="w-56 h-10" />
          <Skeleton className="w-56 h-10" />
        </div>
        <TableSkeleton
          rowCount={10}
          columnWidths={[
            'w-48',
            'w-32',
            'w-64',
            'w-40',
            'w-56',
            'w-24',
            'w-32',
          ]}
        />
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex justify-center mt-56">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );
}

export function ButtonLoader({
  loadingText = 'Loading...',
}: {
  loadingText?: string;
}) {
  return (
    <>
      <Loader2 className="animate-spin" />
      <span className="text-muted-foreground">{loadingText}</span>
    </>
  );
}
