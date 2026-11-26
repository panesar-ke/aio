import type { Metadata } from 'next';
import type { SearchParams } from 'nuqs/server';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import { LeaveDatatable } from '@/features/human-resources/components/leave/leave-datatable';
import {
  getLeaveApplications,
  getLeaveBalanceHistory,
  getLeaveFilterEmployees,
  getLeaveTypes,
} from '@/features/human-resources/services/leave/data';
import { getNairobiToday } from '@/features/human-resources/utils/employees/tenure';
import {
  getDefaultLeaveDateRange,
  loadLeaveDateParams,
  resolveLeaveDateRange,
} from '@/features/human-resources/utils/leave/date-range';
import { requireAnyPermission } from '@/lib/permissions/guards';
import { hasPermission } from '@/lib/permissions/service';

export const metadata: Metadata = {
  title: 'Leave Applications',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default function LeaveManagementPage({ searchParams }: PageProps) {
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
        <SuspendedLeaveApplications searchParams={searchParams} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedLeaveApplications({ searchParams }: PageProps) {
  await requireAnyPermission(['hr:admin', 'hr:standard'], { mode: 'page' });
  const params = await loadLeaveDateParams(searchParams);
  const defaultDateRange = getDefaultLeaveDateRange(getNairobiToday());
  const [rows, leaveTypes, employees, canManage] = await Promise.all([
    getLeaveApplications(resolveLeaveDateRange(params, defaultDateRange)),
    getLeaveTypes(),
    getLeaveFilterEmployees(),
    hasPermission('hr:admin'),
  ]);
  const balanceHistory = await getLeaveBalanceHistory(rows);

  return (
    <LeaveDatatable
      rows={rows}
      balanceHistory={balanceHistory}
      defaultDateRange={defaultDateRange}
      leaveTypes={leaveTypes}
      employees={employees}
      canManage={canManage}
    />
  );
}
