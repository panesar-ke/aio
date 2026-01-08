import { ErrorBoundaryWithSuspense } from '@/components/custom/error-boundary-with-suspense';
import PageHeader from '@/components/custom/page-header';
import Search from '@/components/custom/search';
import { Button } from '@/components/ui/button';
import { JobTrackerTable } from '@/features/production/cnc/components/job-tracker-table';
import { NewJobTrackerButton } from '@/features/production/cnc/components/new-job-tracker';
import { getJobTrackerEntries } from '@/features/production/cnc/services/data';
import { FileIcon, PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Tracker - CNC',
};
export default function JobTrackerCNC() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CNC Job Tracker"
        description="Manage and view CNC jobs."
        content={
          <div className="flex items-center gap-x-2">
            <NewJobTrackerButton />
            <Button variant="tertiary" className="ml-auto">
              <FileIcon />
              Generate Report
            </Button>
          </div>
        }
      />
      <Search placeholder="Search CNC jobs..." />
      <ErrorBoundaryWithSuspense
        errorMessage="An error occurred while fetching CNC jobs."
        loaderType="tableOnly"
      >
        <SuspendedJobTrackerTable />
      </ErrorBoundaryWithSuspense>
    </div>
  );
}

async function SuspendedJobTrackerTable() {
  const data = await getJobTrackerEntries();
  return (
    <JobTrackerTable
      data={data.map(item => ({
        ...item,
        dateReceived: new Date(item.dateReceived),
        endDate: item?.endDate ?? undefined,
      }))}
    />
  );
}
