import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { AccountForm } from '@/features/sales/components/accounts/account-form';
import { getAccount } from '@/features/sales/services/accounts/data';

export const metadata: Metadata = {
  title: 'Edit Account',
};

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  return (
    <div className='space-y-6'>
      <FormHeader
        title='Edit Account'
        description='Update customer details and internal sales notes.'
      />
      <ErrorBoundaryWithSuspense
        errorMessage='Unable to load account!'
        loader={<FormLoader />}
      >
        <SuspendedAccountPage params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedAccountPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const account = await getAccount(accountId);

  if (!account) {
    notFound();
  }

  return <AccountForm account={account} />;
}
