'use client';

import { DownloadIcon } from 'lucide-react';
import { useState } from 'react';

import { notify } from '@/components/custom/toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DEFAULT_EXPORT_COLUMNS,
  EXPORT_COLUMN_KEYS,
  EXPORT_COLUMNS,
  EXPORT_GROUPS,
  type ExportColumnKey,
  isSensitiveColumn,
} from '@/features/human-resources/utils/employees/export-columns';

type Props = {
  /** Ids of the employees currently shown (after search / filters). */
  employeeIds: Array<number>;
  canExportSensitive: boolean;
};

export function ExportEmployeesDialog({ employeeIds, canExportSensitive }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<ExportColumnKey>>(
    () => new Set(DEFAULT_EXPORT_COLUMNS),
  );
  const [isExporting, setIsExporting] = useState(false);

  const available = EXPORT_COLUMN_KEYS.filter(
    key => canExportSensitive || !isSensitiveColumn(key),
  );

  function toggle(key: ExportColumnKey, checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleGroup(keys: Array<ExportColumnKey>, checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev);
      for (const key of keys) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch('/api/human-resources/employees/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: employeeIds,
          // keep the sheet in the canonical column order
          columns: available.filter(key => selected.has(key)),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Export failed');
      }
      const blob = await res.blob();
      const filename =
        /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ??
        'employees.xlsx';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (error) {
      notify.error('Export failed', error instanceof Error ? error.message : undefined);
    } finally {
      setIsExporting(false);
    }
  }

  const selectedCount = available.filter(key => selected.has(key)).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='lg' disabled={employeeIds.length === 0}>
          <DownloadIcon />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Export employees</DialogTitle>
          <DialogDescription>
            Choose the columns to include. {employeeIds.length} employee
            {employeeIds.length === 1 ? '' : 's'} from the current view will be exported to Excel.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-5 sm:grid-cols-2'>
          {EXPORT_GROUPS.map(group => {
            const keys = available.filter(key => EXPORT_COLUMNS[key].group === group.key);
            if (keys.length === 0) return null;
            const allSelected = keys.every(key => selected.has(key));
            return (
              <fieldset key={group.key} className='space-y-2'>
                <legend className='mb-1 flex w-full items-center justify-between text-sm font-semibold'>
                  {group.label}
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-foreground text-xs font-normal underline-offset-2 hover:underline'
                    onClick={() => toggleGroup(keys, !allSelected)}
                  >
                    {allSelected ? 'Clear' : 'Select all'}
                  </button>
                </legend>
                {keys.map(key => (
                  <label key={key} className='flex cursor-pointer items-center gap-2 text-sm'>
                    <Checkbox
                      checked={selected.has(key)}
                      onCheckedChange={checked => toggle(key, checked === true)}
                    />
                    {EXPORT_COLUMNS[key].label}
                  </label>
                ))}
              </fieldset>
            );
          })}
        </div>

        <DialogFooter className='items-center sm:justify-between'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => setSelected(new Set(DEFAULT_EXPORT_COLUMNS))}
          >
            Reset to default
          </Button>
          <Button onClick={handleExport} disabled={selectedCount === 0 || isExporting}>
            <DownloadIcon />
            {isExporting ? 'Exporting…' : `Export ${selectedCount} column${selectedCount === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
