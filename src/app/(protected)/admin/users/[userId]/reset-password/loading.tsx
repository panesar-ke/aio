import PageHeader from '@/components/custom/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { generateRandomId } from '@/lib/utils';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-60 h-8" />
      <PageHeader
        title="Reset Password"
        description="Reset the password for user"
      />
      <div className="space-y-4 p-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={generateRandomId(`skeleton-${index}`)}
            className="flex gap-2"
          >
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-56 rounded" />
      </div>
    </div>
  );
}
