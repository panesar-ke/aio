import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { EmployeesDatatable } from '@/features/human-resources/components/employees/employees-datatable';
import { getEmployees } from '@/features/human-resources/services/employees/data';
import { requireAnyPermission } from '@/lib/permissions/guards';
import { hasPermission } from '@/lib/permissions/service';

export const metadata: Metadata = {
  title: 'Employees',
};

export default function EmployeesPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Employees'
        buttonText='Create New Employee'
        description='Manage staff records and see who is active, on leave, or has exited.'
        path='/human-resources/employees/new'
      />
      <ErrorBoundaryWithSuspense
        loaderType='tableOnly'
        errorMessage='There was a problem rendering the list of employees'
      >
        <SuspendedEmployees />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedEmployees() {
  await requireAnyPermission(['hr:admin', 'hr:standard'], { mode: 'page' });
  const [{ rows, stats }, isHrAdmin] = await Promise.all([
    getEmployees(),
    hasPermission('hr:admin'),
  ]);

  return (
    <EmployeesDatatable
      rows={rows}
      stats={stats}
      canExportSensitive={isHrAdmin}
      canDelete={isHrAdmin}
    />
  );
}
