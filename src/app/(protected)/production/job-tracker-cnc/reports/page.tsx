import PageHeader from '@/components/custom/page-header';
import { ReportFilters } from '@/features/production/cnc/components/report-filters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CNC Tracker Report',
};

export default function CncTrackerReport() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracker Report"
        description="Define the parameters for your report."
      />
      <ReportFilters />
    </div>
  );
}
