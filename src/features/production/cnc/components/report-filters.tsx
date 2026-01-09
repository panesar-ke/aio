'use client';

import { DatePicker } from '@/components/custom/date-range';
import { MiniSelect } from '@/components/custom/mini-select';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function ReportFilters() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="grid gap-2">
        <Label>Date Range</Label>
        <DatePicker />
      </div>
    </div>
  );
}
