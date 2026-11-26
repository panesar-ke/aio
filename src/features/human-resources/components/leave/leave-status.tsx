import {
  LEAVE_STATUS_LABELS,
  type LeaveStatus,
} from '@/features/human-resources/utils/leave/leave.types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<LeaveStatus, string> = {
  PENDING: 'bg-warning text-warning-foreground',
  APPROVED: 'bg-success text-success-foreground',
  REJECTED: 'bg-destructive/10 text-destructive',
  CANCELED: 'bg-muted text-muted-foreground',
};

export function LeaveStatusPill({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold whitespace-nowrap',
        STATUS_STYLES[status],
      )}
    >
      <span aria-hidden className='size-1.5 rounded-full bg-current' />
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
}
