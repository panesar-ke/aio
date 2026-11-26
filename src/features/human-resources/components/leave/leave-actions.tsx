'use client';

import {
  BanIcon,
  EyeIcon,
  PencilIcon,
  PrinterIcon,
  Trash2Icon,
} from 'lucide-react';
import Link from 'next/link';

import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  getLeaveActions,
  type LeaveDecision,
  type LeaveRow,
} from '@/features/human-resources/utils/leave/leave.types';

export function LeaveActions({
  leave,
  canManage,
  onView,
  onPrint,
  onDecide,
}: {
  leave: LeaveRow;
  canManage: boolean;
  onView: () => void;
  onPrint: () => void;
  onDecide: (decision: LeaveDecision) => void;
}) {
  const can = getLeaveActions(leave.status, canManage);

  return (
    <DropdownMenu>
      <CustomDropdownTrigger />
      <CustomDropdownContent>
        <DropdownMenuItem onSelect={onView}>
          <EyeIcon className='text-muted-foreground size-3' />
          View leave
        </DropdownMenuItem>
        {can.edit && (
          <DropdownMenuItem asChild>
            <Link
              href={`/human-resources/leave-management/${leave.leaveNo}/edit`}
              prefetch={false}
            >
              <PencilIcon className='text-muted-foreground size-3' />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can.print && (
          <DropdownMenuItem onSelect={onPrint}>
            <PrinterIcon className='text-muted-foreground size-3' />
            Print
          </DropdownMenuItem>
        )}
        {(can.cancel || can.delete) && <DropdownMenuSeparator />}
        {can.cancel && (
          <DropdownMenuItem onSelect={() => onDecide('cancel')}>
            <BanIcon className='text-muted-foreground size-3' />
            Cancel leave
          </DropdownMenuItem>
        )}
        {can.delete && (
          <DropdownMenuItem
            variant='destructive'
            onSelect={() => onDecide('delete')}
          >
            <Trash2Icon className='size-3' />
            Delete
          </DropdownMenuItem>
        )}
      </CustomDropdownContent>
    </DropdownMenu>
  );
}
