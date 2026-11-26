import type { Metadata } from 'next';

import Link from 'next/link';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { LeaveForm } from '@/features/human-resources/components/leave/leave-form';
import {
  getLeaveFormOptions,
  getNextLeaveNo,
} from '@/features/human-resources/services/leave/data';
import { getNairobiToday } from '@/features/human-resources/utils/employees/tenure';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'New Leave Application',
};

export default function NewLeaveApplicationPage() {
  return (
    <div className='space-y-6'>
      <header>
        <nav
          aria-label='Breadcrumb'
          className='text-muted-foreground mb-2 text-xs'
        >
          <Link
            href='/human-resources/leave-management'
            prefetch={false}
            className='hover:underline'
          >
            Leave Applications
          </Link>
          <span className='mx-1'>/</span>
          <span className='text-foreground'>New Application</span>
        </nav>
        <h1 className='font-display text-primary text-2xl font-semibold'>
          New Leave Application
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Apply for leave on behalf of an employee without portal access.
        </p>
      </header>
      <ErrorBoundaryWithSuspense
        loaderType='full'
        errorMessage='There was a problem loading the leave form'
      >
        <SuspendedNewLeave />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedNewLeave() {
  await requireAnyPermission(['hr:admin', 'hr:standard'], { mode: 'page' });
  const [options, leaveNo] = await Promise.all([
    getLeaveFormOptions(),
    getNextLeaveNo(),
  ]);

  return (
    <LeaveForm
      key={leaveNo}
      options={options}
      leaveNo={leaveNo}
      initialValues={{
        applicationDate: getNairobiToday(),
        employeeCategory: '',
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        resumeDate: '',
        halfDay: false,
        reason: '',
      }}
    />
  );
}
