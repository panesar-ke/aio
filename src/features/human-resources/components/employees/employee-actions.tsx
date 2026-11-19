'use client';

import {
  EyeIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
  UserMinusIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { CustomDropdownContent } from '@/components/custom/custom-dropdown-content';
import { CustomDropdownTrigger } from '@/components/custom/custom-dropdown-trigger';
import { notify } from '@/components/custom/toast';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSwap } from '@/components/ui/loading-swap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  deleteEmployee,
  exitEmployee,
  reinstateEmployee,
} from '@/features/human-resources/services/employees/actions';
import {
  type EmployeeRow,
  isExited,
} from '@/features/human-resources/utils/employees/employees.types';
import {
  EXIT_STATUS_OPTIONS,
  REINSTATABLE_STATUSES,
} from '@/features/human-resources/utils/employees/schema';

type ExitStatus = (typeof EXIT_STATUS_OPTIONS)[number]['value'];

// Date inputs work in the browser's local date; Kenya has no DST so this
// matches Nairobi for local users.
const today = () => new Date().toLocaleDateString('en-CA');

export function EmployeeActions({
  employee,
  canDelete,
}: {
  employee: EmployeeRow;
  canDelete: boolean;
}) {
  const [dialog, setDialog] = useState<'exit' | 'reinstate' | null>(null);
  const exited = isExited(employee.status);
  const canReinstate = (REINSTATABLE_STATUSES as ReadonlyArray<string>).includes(
    employee.status,
  );

  return (
    <>
      <DropdownMenu>
        <CustomDropdownTrigger />
        <CustomDropdownContent>
          <DropdownMenuItem asChild>
            <Link
              href={`/human-resources/employees/${employee.id}`}
              prefetch={false}
            >
              <EyeIcon className='size-3 text-muted-foreground' />
              View details
            </Link>
          </DropdownMenuItem>

          {!exited && (
            // TODO: wire up once the shared employee form/action exists.
            <DropdownMenuItem disabled>
              <PencilIcon className='size-3 text-muted-foreground' />
              Edit
            </DropdownMenuItem>
          )}

          {(!exited || canReinstate || canDelete) && <DropdownMenuSeparator />}

          {!exited && (
            <DropdownMenuItem onSelect={() => setDialog('exit')}>
              <UserMinusIcon className='size-3 text-muted-foreground' />
              Record exit…
            </DropdownMenuItem>
          )}
          {canReinstate && (
            <DropdownMenuItem onSelect={() => setDialog('reinstate')}>
              <RotateCcwIcon className='size-3 text-muted-foreground' />
              Reinstate…
            </DropdownMenuItem>
          )}

          {canDelete && (
            <ActionButton
              variant='ghost'
              className='hover:bg-destructive/20 flex h-auto w-full justify-start px-1.5 py-1.5 transition-colors focus:outline-0'
              action={() => deleteEmployee(employee.id)}
              requireAreYouSure
              areYouSureDescription={`${employee.name.toUpperCase()} will be removed from the employee list. Their portal access will also be disabled.`}
            >
              <Trash2Icon className='size-3 text-destructive' />
              <span className='text-xs text-destructive'>Delete</span>
            </ActionButton>
          )}
        </CustomDropdownContent>
      </DropdownMenu>

      {dialog === 'exit' && (
        <ExitDialog employee={employee} onClose={() => setDialog(null)} />
      )}
      {dialog === 'reinstate' && (
        <ReinstateDialog employee={employee} onClose={() => setDialog(null)} />
      )}
    </>
  );
}

function ExitDialog({
  employee,
  onClose,
}: {
  employee: EmployeeRow;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<ExitStatus>('TERMINATED');
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isPending, startTransition] = useTransition();

  const option = EXIT_STATUS_OPTIONS.find((o) => o.value === status)!;

  function submit() {
    startTransition(async () => {
      const result = await exitEmployee({
        employeeId: employee.id,
        status,
        effectiveDate,
        reason,
        remarks: remarks || undefined,
      });
      if (result.error) {
        notify.error('Could not record exit', result.message);
        return;
      }
      notify.success('Done', result.message);
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record exit</DialogTitle>
          <DialogDescription>
            {employee.name.toUpperCase()} will be marked as no longer employed
            and their portal access disabled.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Exit type</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ExitStatus)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='exit-date'>Effective date</Label>
              <Input
                id='exit-date'
                type='date'
                max={today()}
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='exit-reason'>{option.reasonLabel}</Label>
            <Textarea
              id='exit-reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='exit-remarks'>Remarks (optional)</Label>
            <Textarea
              id='exit-remarks'
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={submit}
            disabled={isPending || !reason.trim() || !effectiveDate}
          >
            <LoadingSwap isLoading={isPending}>Record exit</LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReinstateDialog({
  employee,
  onClose,
}: {
  employee: EmployeeRow;
  onClose: () => void;
}) {
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [resetJoiningDate, setResetJoiningDate] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await reinstateEmployee({
        employeeId: employee.id,
        effectiveDate,
        resetJoiningDate,
      });
      if (result.error) {
        notify.error('Could not reinstate', result.message);
        return;
      }
      notify.success('Done', result.message);
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reinstate employee</DialogTitle>
          <DialogDescription>
            {employee.name.toUpperCase()} will be marked as active again.
            Portal access is not restored automatically.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='reinstate-date'>Effective date</Label>
            <Input
              id='reinstate-date'
              type='date'
              max={today()}
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
          <label className='flex cursor-pointer items-start gap-2 text-sm'>
            <Checkbox
              className='mt-0.5'
              checked={resetJoiningDate}
              onCheckedChange={(c) => setResetJoiningDate(c === true)}
            />
            <span>
              Treat as a new hire
              <span className='text-muted-foreground block text-xs'>
                Sets the date joined to the effective date instead of keeping the
                original.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || !effectiveDate}>
            <LoadingSwap isLoading={isPending}>Reinstate</LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
