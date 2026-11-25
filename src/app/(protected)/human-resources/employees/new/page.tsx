import type { Metadata } from 'next';

import Link from 'next/link';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { EmployeeForm } from '@/features/human-resources/components/employees/employee-form';
import { getEmployeeFormOptions } from '@/features/human-resources/services/employees/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'New Employee',
};

export default function NewEmployeePage() {
  return (
    <div className='space-y-6'>
      <header>
        <nav
          aria-label='Breadcrumb'
          className='text-muted-foreground mb-2 text-xs'
        >
          <Link
            href='/human-resources/employees'
            prefetch={false}
            className='hover:underline'
          >
            Employees
          </Link>
          <span className='mx-1'>/</span>
          <span className='text-foreground'>New Employee</span>
        </nav>
        <h1 className='font-display text-primary text-2xl font-semibold'>
          New Employee
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Only the fields marked{' '}
          <span className='text-destructive font-semibold'>*</span> are needed
          to create the record. Everything else can be completed later by
          editing the employee.
        </p>
      </header>
      <ErrorBoundaryWithSuspense
        loaderType='full'
        errorMessage='There was a problem loading the employee form'
      >
        <SuspendedNewEmployee />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedNewEmployee() {
  await requireAnyPermission(['hr:admin', 'hr:standard'], { mode: 'page' });
  const options = await getEmployeeFormOptions();

  return <EmployeeForm options={options} />;
}
