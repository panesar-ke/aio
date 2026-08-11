import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import FormHeader from '@/components/custom/form-header';
import { FormLoader } from '@/components/custom/loaders';
import { LeadForm } from '@/features/sales/components/leads/leads-form';
import { getLead } from '@/features/sales/services/leads/data';

export const metadata: Metadata = {
  title: 'Edit Lead',
};

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  return (
    <div className='space-y-6'>
      <FormHeader
        title='Edit Lead'
        description='Update prospect details to continue qualifying them.'
      />
      <ErrorBoundaryWithSuspense
        errorMessage='Unable to load lead!'
        loader={<FormLoader />}
      >
        <SuspendedLeadPage params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedLeadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const lead = await getLead(leadId);

  if (!lead) notFound();

  return <LeadForm lead={lead} />;
}
