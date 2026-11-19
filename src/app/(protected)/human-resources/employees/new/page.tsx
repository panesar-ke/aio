import { type Metadata } from 'next';

import PageHeader from '@/components/custom/page-header';
import { BackButton } from '@/components/ui/back-button';

export const metadata: Metadata = {
  title: 'Create New Employee',
};

export default function NewEmployeesPage() {
  return (
    <div className='flex flex-col gap-4'>
      <BackButton variant='link' className='self-start'>
        Go Back
      </BackButton>
      <PageHeader title='Create New Employee' />
    </div>
  );
}
