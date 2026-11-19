import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { BackButton } from '@/components/ui/back-button';
import { EmployeeDetails } from '@/features/human-resources/components/employees/employee-details';
import { getEmployeeDetails } from '@/features/human-resources/services/employees/data';
import { requireAnyPermission } from '@/lib/permissions/guards';
import { hasPermission } from '@/lib/permissions/service';

export const metadata: Metadata = {
  title: 'Employee Details',
};

type Params = Promise<{ employeeId: string }>;

export default function EmployeeDetailsPage({ params }: { params: Params }) {
  return (
    <div className='flex flex-col gap-4'>
      <BackButton variant='link' className='self-start'>
        Go Back
      </BackButton>
      <PageHeader
        title='Employee Details'
        description='Personal and employment information.'
      />
      <ErrorBoundaryWithSuspense
        loaderType='full'
        errorMessage='There was a problem loading the employee'
      >
        <SuspendedEmployeeDetails params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedEmployeeDetails({ params }: { params: Params }) {
  await requireAnyPermission(['hr:admin', 'hr:standard'], { mode: 'page' });

  const id = Number((await params).employeeId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const employee = await getEmployeeDetails(id, await hasPermission('hr:admin'));
  if (!employee) notFound();

  return <EmployeeDetails employee={employee} status={employee.status} />;
}
