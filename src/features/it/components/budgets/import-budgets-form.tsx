'use client';

import { useQueryClient } from '@tanstack/react-query';
import { UploadIcon } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { ButtonLoader } from '@/components/custom/loaders';
import { ToastContent } from '@/components/custom/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useModal } from '@/features/integrations/modal-provider';
import {
  importBudgetsFromExcel,
  type ImportBudgetsState,
} from '@/features/it/services/budgets/actions';
import { type Option } from '@/types/index.types';

const initialState: ImportBudgetsState = { error: null, summary: null };

export function ImportBudgetsForm({
  financialYearOptions,
  defaultFinancialYearStart,
}: {
  financialYearOptions: Array<Option>;
  defaultFinancialYearStart: string;
}) {
  const queryClient = useQueryClient();
  const { setClose } = useModal();
  const [financialYearStart, setFinancialYearStart] = useState(
    defaultFinancialYearStart,
  );
  const [state, action, pending] = useActionState(
    importBudgetsFromExcel,
    initialState,
  );

  useEffect(() => {
    if (state.error) {
      toast.error(() => (
        <ToastContent title="Import failed" message={state.error as string} />
      ));
      return;
    }

    if (!state.summary) return;

    queryClient.invalidateQueries({ queryKey: ['it-budgets'] });
    const { created, updated, failed } = state.summary;

    if (failed.length === 0) {
      toast.success(() => (
        <ToastContent
          title="✅ Import complete"
          message={`${created} created, ${updated} updated.`}
        />
      ));
      setClose();
      return;
    }

    if (created > 0 || updated > 0) {
      toast.success(() => (
        <ToastContent
          title="Partially imported"
          message={`${created} created, ${updated} updated, ${failed.length} failed. See details below.`}
        />
      ));
      return;
    }

    toast.error(() => (
      <ToastContent
        title="Import failed"
        message={`All ${failed.length} row(s) failed. See details below.`}
      />
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="financialYearStart">Financial Year</Label>
        <Select
          value={financialYearStart}
          onValueChange={setFinancialYearStart}
        >
          <SelectTrigger id="financialYearStart" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {financialYearOptions.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="hidden"
          name="financialYearStart"
          value={financialYearStart}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Excel File</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".xlsx"
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {!pending ? (
          <>
            <UploadIcon />
            <span>Import</span>
          </>
        ) : (
          <ButtonLoader loadingText="Importing..." />
        )}
      </Button>
      {state.summary && state.summary.failed.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm space-y-1 max-h-48 overflow-y-auto">
          <p className="font-medium text-destructive">
            {state.summary.failed.length} row(s) could not be imported:
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            {state.summary.failed.map(failure => (
              <li key={`${failure.row}-${failure.reason}`}>
                Row {failure.row} ({failure.subCategory || 'unknown'}):{' '}
                {failure.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
