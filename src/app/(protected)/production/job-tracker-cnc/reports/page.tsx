import PageHeader from '@/components/custom/page-header';
import { Button } from '@/components/ui/button';
import { JobTrackerReport } from '@/features/production/cnc/components/job-tracker-report';
import { ReportFilters } from '@/features/production/cnc/components/report-filters';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CNC Tracker Report',
};

export default function CncTrackerReport() {
  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/production/job-tracker-cnc">&larr; Go Back</Link>
      </Button>
      <PageHeader
        title="Tracker Report"
        description="Define the parameters for your report."
      />
      <ReportFilters />
      <JobTrackerReport />
    </div>
  );
}
