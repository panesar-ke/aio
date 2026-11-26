import type { Metadata } from 'next';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import { LeaveForm } from '@/features/human-resources/components/leave/leave-form';
import {
  getLeaveForEdit,
  getLeaveFormOptions,
} from '@/features/human-resources/services/leave/data';
import { requireAnyPermission } from '@/lib/permissions/guards';

export const metadata: Metadata = {
  title: 'Edit Leave Application',
};

type Params = Promise<{ leaveNo: string }>;

export default function EditLeaveApplicationPage({
  params,
}: {
  params: Params;
}) {
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
          <span className='text-foreground'>Edit Application</span>
        </nav>
        <h1 className='font-display text-primary text-2xl font-semibold'>
          Edit Leave Application
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Only pending applications can be edited.
        </p>
      </header>
      <ErrorBoundaryWithSuspense
        loaderType='full'
        errorMessage='There was a problem loading the leave application'
      >
        <SuspendedEditLeave params={params} />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedEditLeave({ params }: { params: Params }) {
  await requireAnyPermission(['hr:admin', 'hr:standard'], { mode: 'page' });

  const leaveNo = Number((await params).leaveNo);
  if (!Number.isInteger(leaveNo) || leaveNo <= 0) notFound();

  const leave = await getLeaveForEdit(leaveNo);
  if (!leave) notFound();
  if (leave.status !== 'PENDING') redirect('/human-resources/leave-management');

  const options = await getLeaveFormOptions(leave.employeeId);

  return (
    <LeaveForm
      // Remounts when the saved record changes, discarding any preserved draft.
      key={`${leaveNo}:${JSON.stringify(leave.values)}`}
      options={options}
      leaveNo={leaveNo}
      initialValues={leave.values}
      recorded={{
        employeeId: leave.employeeId,
        category: leave.employeeCategory,
      }}
    />
  );
}
