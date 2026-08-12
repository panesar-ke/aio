import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { AccountDetailsPageContent } from '@/features/sales/components/accounts/account-details-page';
import { getAccountDetails } from '@/features/sales/services/accounts/data';

export const metadata: Metadata = {
  title: 'Account Details',
};

export default async function AccountDetailsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  return (
    <ErrorBoundaryWithSuspense
      errorMessage='Unable to load account details.'
      loaderType='tableOnly'
    >
      <SuspendedAccountDetailsPage params={params} />
    </ErrorBoundaryWithSuspense>
  );
}

async function SuspendedAccountDetailsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const details = await getAccountDetails(accountId);

  if (!details) {
    notFound();
  }

  return <AccountDetailsPageContent details={details} />;
}
