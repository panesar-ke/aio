import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { FormLoader } from '@/components/custom/loaders';
import PageHeader from '@/components/custom/page-header';
import { ButtonLink } from '@/components/ui/button';
import { PolicyExemptionForm } from '@/features/admin/components/users/policy-exemption-form';
import { getUser } from '@/features/admin/services/data';
import { titleCase } from '@/lib/helpers/formatters';
import { requirePermission } from '@/lib/permissions/guards';

export const metadata = {
  title: 'Grant policy exemption',
};

export default function PolicyExemptionPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  return (
    <div className='space-y-6'>
      <ButtonLink path='/admin/users' variant='secondary'>
        &larr; Back to users
      </ButtonLink>
      <ErrorBoundaryWithSuspense
        errorMessage='An error occurred while loading the exemption form'
        loader={<FormLoader />}
      >
        <PolicyExemptionContent params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function PolicyExemptionContent({
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
        title='Policy Exemption'
        description={`Let ${titleCase(user.name.split(' ')[0])} keep their current password past the deadline`}
      />
      <PolicyExemptionForm />
    </>
  );
}
