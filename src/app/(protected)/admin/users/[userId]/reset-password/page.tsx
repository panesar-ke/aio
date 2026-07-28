import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { ButtonLink } from '@/components/ui/button';
import { ResetPasswordForm } from '@/features/admin/components/users/reset-password-form';
import { getUser } from '@/features/admin/services/data';
import { titleCase } from '@/lib/helpers/formatters';
import { requirePermission } from '@/lib/permissions/guards';

export const metadata = {
  title: 'Reset user password',
};

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  return (
    <div className="space-y-6">
      <ButtonLink path="/admin/users" variant="secondary">
        &larr; Back to users
      </ButtonLink>
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while loading the reset-password form"
        loader={<FormLoader />}
      >
        <ResetPasswordContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function ResetPasswordContent({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requirePermission('admin:admin', { mode: 'page' });

  const { userId } = await params;
  const user = await getUser(userId);

  return (
    <>
      <PageHeader
        title="Reset Password"
        description={`Reset ${titleCase(user.name.split(' ')[0])}'s password`}
      />
      <ResetPasswordForm />
    </>
  );
}
