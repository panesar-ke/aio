import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import { Button } from '@/components/ui/button';
import { UserForm } from '@/features/admin/components/users/user-form';
import { requirePermission } from '@/lib/permissions/guards';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'New User',
};
export default function NewUser() {
  return (
    <div className="space-y-6">
      <Button variant="secondary" size="sm" asChild>
        <Link href="/admin/users" prefetch={false}>
          &larr; Back to users
        </Link>
      </Button>
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading the user form"
        loader={<FormLoader />}
      >
        <NewUserContent />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function NewUserContent() {
  await requirePermission('admin:admin', { mode: 'page' });

  return <UserForm />;
}
