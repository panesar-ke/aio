'use client';

import type { Option } from '@/types/index.types';

import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox';

const ALL_STAFF: Option = { value: 'all', label: 'All Staff' };

export function LeaveStaffFilter({
  employees,
  value,
  onChange,
}: {
  employees: Array<{ id: number; name: string }>;
  value: number | null;
  onChange: (employeeId: number | null) => void;
}) {
  const items = [
    ALL_STAFF,
    ...employees.map((e) => ({ value: String(e.id), label: e.name })),
  ];
  const selected =
    items.find((item) => item.value === String(value)) ?? ALL_STAFF;

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(item: Option | null) =>
        onChange(
          !item || item.value === ALL_STAFF.value ? null : Number(item.value),
        )
      }
      itemToStringLabel={(item: Option) => item.label}
    >
      <ComboboxTrigger
        aria-label='Filter by staff member'
        render={
          <Button
            variant='outline'
            className='bg-card border-input h-10 w-full justify-between font-normal shadow-none sm:w-80'
          />
        }
      >
        <span className='min-w-0 flex-1 truncate text-left'>
          <ComboboxValue />
        </span>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput showTrigger={false} placeholder='Search staff…' />
        <ComboboxEmpty>No staff found.</ComboboxEmpty>
        <ComboboxList>
          {(item: Option) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
