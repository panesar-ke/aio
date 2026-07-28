import type { DateRange } from 'react-day-picker';

import { format, isEqual, startOfDay, subDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/re-ui-btn';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { getFinancialYearRanges } from '@/lib/helpers/dates';
import { cn } from '@/lib/utils';

type DateRangePickerProps = {
  initialDateRange?: DateRange;
  onDateChange?: (dateRange: DateRange) => void;
  onReset?: () => void;
  className?: string;
  disabled?: boolean;
};

function normalizeDateRange(selected: DateRange | undefined) {
  return {
    from: selected?.from || undefined,
    to: selected?.to || undefined,
  } satisfies DateRange;
}

export function DatePicker({
  onDateChange,
  initialDateRange,
  onReset,
  className,
  disabled,
}: DateRangePickerProps) {
  const today = useMemo(() => new Date(), []);
  const presets = useMemo(
    () => [
      { label: 'Today', range: { from: today, to: today } },
      {
        label: 'Yesterday',
        range: { from: subDays(today, 1), to: subDays(today, 1) },
      },
      { label: 'Last 7 days', range: { from: subDays(today, 6), to: today } },
      { label: 'Last 30 days', range: { from: subDays(today, 29), to: today } },
      {
        label: 'Year to date',
        range: getFinancialYearRanges(today).currentYear,
      },
      {
        label: 'Previous year',
        range: getFinancialYearRanges(today).previousYear,
      },
    ],
    [today],
  );

  const [month, setMonth] = useState(today);
  const defaultPreset = presets[2];
  const [appliedDate, setAppliedDate] = useState<DateRange | undefined>(
    initialDateRange || defaultPreset.range,
  );
  const [draftDate, setDraftDate] = useState<DateRange | undefined>(
    initialDateRange || defaultPreset.range,
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isMobile = useIsMobile();
  const date = isPopoverOpen ? draftDate : (initialDateRange ?? appliedDate);
  const selectedPreset = useMemo(() => {
    const currentDate = date;
    const matchedPreset = presets.find(
      preset =>
        isEqual(
          startOfDay(preset.range.from),
          startOfDay(currentDate?.from || new Date(0)),
        ) &&
        isEqual(
          startOfDay(preset.range.to),
          startOfDay(currentDate?.to || new Date(0)),
        ),
    );
    return matchedPreset?.label || null;
  }, [date, presets]);

  const handleApply = () => {
    if (draftDate) {
      setAppliedDate(draftDate);
      onDateChange?.(draftDate);
    }

    setIsPopoverOpen(false);
  };

  const handleReset = () => {
    setDraftDate(undefined);
    setAppliedDate(undefined);
    setIsPopoverOpen(false);
    onReset?.();
  };

  const handleSelect = (selected: DateRange | undefined) => {
    setDraftDate(normalizeDateRange(selected));
  };
  const handleOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (!open) {
      return;
    }

    const nextDate = initialDateRange ?? appliedDate;
    setDraftDate(nextDate);
    setMonth(nextDate?.from || today);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          mode="input"
          placeholder={!date?.from && !date?.to}
          className={cn('w-full md:max-w-lg', className)}
          size="lg"
          disabled={disabled}
        >
          <CalendarIcon />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, 'LLL dd, y')} -{' '}
                {format(date.to, 'LLL dd, y')}
              </>
            ) : (
              format(date.from, 'LLL dd, y')
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <div className="flex max-sm:flex-col">
          <div className="relative border-border max-sm:order-1 max-sm:border-t sm:w-32">
            {isMobile ? (
              <div className="p-2">
                <Select
                  value={selectedPreset || undefined}
                  onValueChange={val => {
                    const label = val || '';
                    const preset = presets.find(p => p.label === label) || null;
                    if (preset) {
                      setDraftDate(preset.range);
                      setMonth(preset.range.from || today);
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {presets.map(preset => (
                        <SelectItem key={preset.label} value={preset.label}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              // Desktop: button list
              <div className="h-full border-border sm:border-e py-2">
                <div className="flex flex-col px-2 gap-0.5">
                  {presets.map(preset => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="ghost"
                      className={cn(
                        'h-8 w-full justify-start text-foreground',
                        selectedPreset === preset.label && 'bg-accent',
                      )}
                      onClick={() => {
                        setDraftDate(preset.range);
                        setMonth(preset.range.from || today);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}{' '}
                </div>
              </div>
            )}
          </div>
          <Calendar
            autoFocus
            mode="range"
            month={month}
            onMonthChange={setMonth}
            showOutsideDays={false}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </div>
        <div className="flex items-center justify-end gap-1.5 border-t border-border p-3">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
