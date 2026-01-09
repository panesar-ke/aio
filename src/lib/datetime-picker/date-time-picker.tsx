'use client';

import * as React from 'react';
import { add, format, getHours, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TimePicker } from '@/lib/datetime-picker/time-picker';

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: string | undefined) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleSelect = (newDay: Date | undefined) => {
    if (!newDay) return;
    if (!date) {
      setDate(newDay);
      return;
    }
    const diff = newDay.getTime() - date.getTime();
    const diffInDays = diff / (1000 * 60 * 60 * 24);
    const newDateFull = add(date, { days: Math.ceil(diffInDays) });

    setDate(newDateFull);

    const hours = getHours(date);
    const hasTimeSelected = hours !== 0; // Adjust logic as needed

    // If no time selected, default to 8AM to avoid date shift
    const dateWithTime = hasTimeSelected
      ? date
      : setHours(setMinutes(date, 0), 8);

    const utcDate = fromZonedTime(dateWithTime, timeZone);
    onChange(utcDate.toISOString());
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal shadow-none border-input',
            !date && 'text-muted-foreground'
          )}
          size="lg"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP HH:mm:ss') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={d => handleSelect(d)}
        />
        <div className="p-3 border-t border-border">
          <TimePicker setDate={setDate} date={date} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
