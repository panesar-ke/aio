'use client';
import { useSearchParams } from 'next/navigation';
import { reportFilterSchema } from '@/features/production/cnc/utils/schema';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { CustomAlert } from '@/components/custom/custom-alert';
import type { ReportFilterSchema } from '@/features/production/cnc/utils/cnc.types';

async function fetchJobTrackerReport(data: unknown) {
  if (!data) {
    return null;
  }
  const {
    data: parsedData,
    success,
    error,
  } = reportFilterSchema.safeParse(data);
  if (error) throw new Error('Please check your filters and try again!');
  return null;
  const response = await fetch('/api/job-tracker-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch job tracker report');
  }
  return response.json();
}

export function JobTrackerReport() {
  const searchParams = useSearchParams();
  const hasFilters =
    searchParams.has('status') ||
    searchParams.has('from') ||
    searchParams.has('to');

  const params = {
    status: searchParams.get('status'),
    dateRange: {
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    },
  };

  const { data: reportData } = useQuery({
    queryKey: ['job-tracker-report', params],
    queryFn: () => fetchJobTrackerReport(params),
    enabled: hasFilters,
  });

  if (!hasFilters) return null;

  return (
    <div>
      <h1>Job Tracker Report</h1>
    </div>
  );
}
