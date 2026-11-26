import type { Metadata } from 'next';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { LeaveDatatable } from '@/features/human-resources/components/leave/leave-datatable';
import {
  getLeaveApplications,
  getLeaveFilterEmployees,
  getLeaveTypes,
} from '@/features/human-resources/services/leave/data';
import { requireAnyPermission } from '@/lib/permissions/guards';
import { hasPermission } from '@/lib/permissions/service';

export const metadata: Metadata = {
  title: 'Leave Applications',
};

export default function LeaveManagementPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Leave Applications'
        buttonText='New Application'
        description='Leave submitted through the employee portal.'
        path='/human-resources/leave-management/new'
      />
      <ErrorBoundaryWithSuspense
        loaderType='tableOnly'
        errorMessage='There was a problem rendering the leave applications'
      >
        <SuspendedLeaveApplications />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedLeaveApplications() {
  await requireAnyPermission(['hr:admin', 'hr:standard'], { mode: 'page' });
  const [rows, leaveTypes, employees, canManage] = await Promise.all([
    getLeaveApplications(),
    getLeaveTypes(),
    getLeaveFilterEmployees(),
    hasPermission('hr:admin'),
  ]);

  return (
    <LeaveDatatable
      rows={rows}
      leaveTypes={leaveTypes}
      employees={employees}
      canManage={canManage}
    />
  );
}
