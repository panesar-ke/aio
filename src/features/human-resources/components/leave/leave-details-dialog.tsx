'use client';

import { BanIcon, CheckIcon, CircleXIcon, PrinterIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LeaveStatusPill } from '@/features/human-resources/components/leave/leave-status';
import {
  CATEGORY_LABELS,
  formatLeaveDate,
  formatLeaveReason,
  formatLeaveType,
  getLeaveActions,
  type LeaveDecision,
  type LeaveRow,
} from '@/features/human-resources/utils/leave/leave.types';
import { getInitials } from '@/lib/helpers/formatters';

export function LeaveDetailsDialog({
  leave,
  canManage,
  onClose,
  onPrint,
  onDecide,
}: {
  leave: LeaveRow;
  canManage: boolean;
  onClose: () => void;
  onPrint: () => void;
  onDecide: (decision: LeaveDecision) => void;
}) {
  const can = getLeaveActions(leave.status, canManage);

  const details = [
    ['Leave No', `#${leave.leaveNo}`],
    ['Employee Category', CATEGORY_LABELS[leave.employeeCategory]],
    ['Leave Type', formatLeaveType(leave.leaveType)],
    ['# of Days', leave.daysTaken],
    ['Start Date', formatLeaveDate(leave.startDate)],
    ['End Date', formatLeaveDate(leave.endDate)],
    ['Resume Date', formatLeaveDate(leave.resumeDate)],
    ['Pay', leave.isUnpaid ? 'Unpaid' : 'Paid'],
    ...(leave.approvedBy ? [['Approved By', leave.approvedBy]] : []),
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='flex-row items-center gap-3 text-left'>
          <span
            aria-hidden
            className='bg-secondary text-secondary-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold'
          >
            {getInitials(leave.employeeName)}
          </span>
          <div className='min-w-0 space-y-1.5'>
            <DialogTitle className='text-base'>
              {leave.employeeName}
            </DialogTitle>
            <DialogDescription className='text-xs'>
              Applied on {formatLeaveDate(leave.applicationDate)}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div>
          <LeaveStatusPill status={leave.status} />
        </div>

        <dl className='grid grid-cols-2 gap-x-5 gap-y-3.5'>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className='text-muted-foreground text-[0.6875rem] font-semibold tracking-wider uppercase'>
                {label}
              </dt>
              <dd className='text-sm font-medium'>{value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className='text-muted-foreground mb-1.5 text-[0.6875rem] font-semibold tracking-wider uppercase'>
            Reason
          </p>
          <p className='bg-muted rounded-md px-3.5 py-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap'>
            {formatLeaveReason(leave.reason) || '—'}
          </p>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
          {can.print && (
            <Button variant='outline' onClick={onPrint}>
              <PrinterIcon />
              Print
            </Button>
          )}
          {can.cancel && (
            <Button variant='outline' onClick={() => onDecide('cancel')}>
              <BanIcon />
              Cancel leave
            </Button>
          )}
          {can.reject && (
            <Button variant='destructive' onClick={() => onDecide('reject')}>
              <CircleXIcon />
              Reject
            </Button>
          )}
          {can.approve && (
            <Button onClick={() => onDecide('approve')}>
              <CheckIcon />
              Approve
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
