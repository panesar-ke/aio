import type { Metadata } from 'next';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { EmployeeForm } from '@/features/human-resources/components/employees/employee-form';
import {
  getEmployeeForEdit,
  getEmployeeFormOptions,
} from '@/features/human-resources/services/employees/data';
import { requirePermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Edit Employee',
};

type Params = Promise<{ employeeId: string }>;

export default function EditEmployeePage({ params }: { params: Params }) {
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
          <span className='text-foreground'>Edit Employee</span>
        </nav>
        <h1 className='font-display text-primary text-2xl font-semibold'>
          Edit Employee
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Update this employee&apos;s record. Fields marked{' '}
          <span className='text-destructive font-semibold'>*</span> are
          required.
        </p>
      </header>
      <ErrorBoundaryWithSuspense
        loaderType='full'
        errorMessage='There was a problem loading the employee'
      >
        <SuspendedEditEmployee params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedEditEmployee({ params }: { params: Params }) {
  // Editing reveals statutory and bank details, so it is admin-only.
  await requirePermission('hr:admin', { mode: 'page' });

  const id = Number((await params).employeeId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const employee = await getEmployeeForEdit(id);
  if (!employee) notFound();
  // Only active employees can be edited; send everyone else to the profile.
  if (employee.status !== 'ACTIVE')
    redirect(`/human-resources/employees/${id}`);

  const options = await getEmployeeFormOptions(
    Number(employee.values.designation),
  );

  return (
    <EmployeeForm
      key={id}
      options={options}
      employeeId={id}
      initialValues={employee.values}
    />
  );
}
