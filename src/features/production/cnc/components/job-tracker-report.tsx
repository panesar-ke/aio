'use client';
import { useSearchParams } from 'next/navigation';
import { reportFilterSchema } from '@/features/production/cnc/utils/schema';
import { useQuery } from '@tanstack/react-query';
import { CustomAlert } from '@/components/custom/custom-alert';
import type { JobTrackerFormValues } from '@/features/production/cnc/utils/cnc.types';
import { ReportLoader } from '@/components/custom/loaders';
import type { ColumnDef } from '@tanstack/react-table';
import { numberFormat, titleCase } from '@/lib/helpers/formatters';
import { format } from 'date-fns';
import { ReportDataTable } from '@/components/custom/report-datatable';
import { TableCell } from '@/components/ui/table';

const columns: Array<ColumnDef<JobTrackerFormValues>> = [
  {
    accessorKey: 'jobCardNo',
    header: 'Job Card#',
  },
  {
    accessorKey: 'dateReceived',
    header: 'Date Received',
    cell: ({
      row: {
        original: { dateReceived },
      },
    }) => format(dateReceived, 'dd-MMM-yyyy'),
  },
  {
    accessorKey: 'jobDescription',
    header: 'Job Description',
    cell: ({
      row: {
        original: { jobDescription },
      },
    }) => titleCase(jobDescription),
  },
  {
    accessorKey: 'jobType',
    header: 'Job Type',
    cell: ({
      row: {
        original: { jobType },
      },
    }) => titleCase(jobType),
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({
      row: {
        original: { startDate },
      },
    }) => format(startDate, 'dd-MMM-yyyy HH:mm'),
  },
  {
    accessorKey: 'endDate',
    header: 'End Date',
    cell: ({
      row: {
        original: { endDate },
      },
    }) => (endDate ? format(endDate, 'dd-MMM-yyyy HH:mm') : ''),
  },
  {
    accessorKey: 'timeTaken',
    header: 'Time Taken',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({
      row: {
        original: { status },
      },
    }) => titleCase(status),
  },
];

async function fetchJobTrackerReport(
  data: unknown
): Promise<Array<JobTrackerFormValues>> {
  const { data: parsedData, error } = reportFilterSchema.safeParse(data);
  if (error) throw new Error('Please check your filters and try again!');

  const params = new URLSearchParams();
  if (parsedData.status) {
    params.append('status', parsedData.status);
  }
  if (parsedData.dateRange.from) {
    params.append('from', parsedData.dateRange.from.toString());
  }
  if (parsedData.dateRange.to) {
    params.append('to', parsedData.dateRange.to.toString());
  }

  const response = await fetch(
    `/api/production/cnc/job-tracker-report?${params}`
  );
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

  const {
    data: reportData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['job-tracker-report', params],
    queryFn: () => fetchJobTrackerReport(params),
    enabled: hasFilters,
  });

  if (!hasFilters) return null;

  if (error)
    return (
      <CustomAlert variant="error" title="Error" description={error.message} />
    );

  if (isLoading) return <ReportLoader />;

  const totalTimeTaken =
    reportData?.reduce((total, item) => total + Number(item.timeTaken), 0) || 0;

  return (
    <ReportDataTable
      columns={columns}
      data={reportData ?? []}
      excelData={
        reportData?.map(item => ({
          'Jobcard #': item.jobCardNo,
          'Date Received': format(item.dateReceived, 'dd-MMM-yyyy'),
          'Job Description': titleCase(item.jobDescription),
          'Job Type': titleCase(item.jobType),
          'Start Date': format(item.startDate, 'dd-MMM-yyyy HH:mm'),
          'End Date': item.endDate
            ? format(item.endDate, 'dd-MMM-yyyy HH:mm')
            : '',
          'Time Taken': item.timeTaken,
          Status: titleCase(item.status),
        })) || []
      }
      reportTitle="Job Tracker Report"
      defaultPageSize={25}
      orientation="landscape"
      customFooter={
        <>
          <TableCell colSpan={6} className="font-semibold text-center">
            Total
          </TableCell>
          <TableCell className="font-semibold text-right">
            {numberFormat(totalTimeTaken)}
          </TableCell>
          <TableCell />
        </>
      }
    />
  );
}
