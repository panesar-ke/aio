'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { JobTrackerFormValues } from '@/features/production/cnc/utils/cnc.types';
import { DataTable } from '@/components/custom/datatable';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { ActionButton } from '@/components/ui/action-button';
import { DeleteAction, EditAction } from '@/components/custom/custom-button';
import { deleteJobTrackerEntry } from '@/features/production/cnc/services/action';
import { titleCase } from '@/lib/helpers/formatters';
import { useModal } from '@/features/integrations/modal-provider';
import CustomModal from '@/components/custom/custom-modal';
import { JobTrackerForm } from './job-tracker-form';

export function JobTrackerTable({ data }: { data: JobTrackerFormValues[] }) {
  const { setOpen } = useModal();
  const handleDelete = async (id: string) => {
    const response = await deleteJobTrackerEntry(id);
    if (response.error) {
      return {
        error: true,
        message: response.message,
      };
    }

    return { error: false, message: 'Entry deleted successfully' };
  };

  const handleEdit = async (row: JobTrackerFormValues) => {
    setOpen(
      <CustomModal title="Edit Job" className="lg:max-w-3xl w-2xl">
        <JobTrackerForm data={row} />
      </CustomModal>
    );

    return { error: false, message: 'Entry edited successfully' };
  };

  const columns: Array<ColumnDef<JobTrackerFormValues>> = [
    {
      accessorKey: 'jobCardNo',
      header: 'Job Card#',
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
      }) => (
        <Badge
          variant={
            status === 'completed'
              ? 'success'
              : status === 'in progress'
              ? 'info'
              : 'warning'
          }
          className="capitalize"
        >
          {status}
        </Badge>
      ),
    },
    {
      id: 'action',
      cell: ({ row: { original } }) => (
        <DropdownMenu>
          <CustomDropdownTrigger />
          <CustomDropdownContent>
            <DropdownMenuItem onClick={() => handleEdit(original)}>
              <EditAction />
            </DropdownMenuItem>
            <ActionButton
              variant="ghost"
              className="px-1.5 py-1.5 justify-start h-auto w-full flex transition-colors hover:bg-destructive/20 focus:outline-0"
              action={handleDelete.bind(null, original.id!)}
              requireAreYouSure={true}
            >
              <DeleteAction />
            </ActionButton>
          </CustomDropdownContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
