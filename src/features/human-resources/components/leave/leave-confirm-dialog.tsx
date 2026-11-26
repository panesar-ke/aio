'use client';

import { useTransition } from 'react';

import { notify } from '@/components/custom/toast';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LoadingSwap } from '@/components/ui/loading-swap';
import {
  approveLeave,
  cancelLeave,
  deleteLeaveApplication,
  rejectLeave,
} from '@/features/human-resources/services/leave/actions';
import {
  type LeaveDecision,
  type LeaveRow,
} from '@/features/human-resources/utils/leave/leave.types';

const DECISIONS = {
  approve: {
    action: approveLeave,
    title: 'Approve leave?',
    outcome: 'will be approved.',
    confirm: 'Approve',
    destructive: false,
  },
  reject: {
    action: rejectLeave,
    title: 'Reject leave?',
    outcome: 'will be rejected.',
    confirm: 'Reject',
    destructive: true,
  },
  cancel: {
    action: cancelLeave,
    title: 'Cancel leave?',
    outcome: 'will be marked as cancelled.',
    confirm: 'Cancel leave',
    destructive: true,
  },
  delete: {
    action: deleteLeaveApplication,
    title: 'Delete application?',
    outcome: 'will be removed from the list.',
    confirm: 'Delete',
    destructive: true,
  },
} satisfies Record<LeaveDecision, unknown>;

export function LeaveConfirmDialog({
  decision,
  leave,
  onClose,
  onDone,
}: {
  decision: LeaveDecision;
  leave: LeaveRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const config = DECISIONS[decision];

  function submit() {
    startTransition(async () => {
      try {
        const result = await config.action(leave.leaveNo);
        if (result.error) {
          notify.error('Could not update leave', result.message);
          return;
        }
        notify.success('Done', result.message);
        onDone();
      } catch {
        notify.error('Could not update leave', 'Something went wrong.');
      }
    });
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>
            Leave #{leave.leaveNo} for {leave.employeeName} {config.outcome}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Go back</AlertDialogCancel>
          <Button
            variant={config.destructive ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={submit}
          >
            <LoadingSwap isLoading={isPending}>{config.confirm}</LoadingSwap>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
