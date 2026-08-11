import type { Metadata } from 'next';

import FormHeader from '@/components/custom/form-header';
import { LeadForm } from '@/features/sales/components/leads/leads-form';

export const metadata: Metadata = {
  title: 'New Lead',
};

export default function LeadsNewPage() {
  return (
    <div className='space-y-6'>
      <FormHeader
        title='New Lead'
        description='Capture prospect details to begin qualifying them.'
      />
      <LeadForm />
    </div>
  );
}
