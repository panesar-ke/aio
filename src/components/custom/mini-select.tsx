import type { Option } from '@/types/index.types';

import { FormControl } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface BasicSelectProps {
  options: Array<Option>;
  onChange?: (value: string) => void;
  defaultValue?: string | undefined;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  value?: string;
  className?: string;
  withForm?: boolean;
}

export function MiniSelect({
  options,
  defaultValue,
  onChange,
  placeholder = 'Select one...',
  disabled,
  hasError,
  value,
  className,
  withForm = true,
}: BasicSelectProps) {
  return (
    <Select
      onValueChange={onChange}
      defaultValue={defaultValue}
      disabled={disabled}
    >
      {withForm ? (
        <FormControl>
          <SelectTrigger
            className={cn(
              'w-full overflow-hidden whitespace-nowrap truncate',
              hasError && 'border border-destructive',
              className,
            )}
            value={value}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </FormControl>
      ) : (
        <SelectTrigger
          className={cn(
            'w-full overflow-hidden whitespace-nowrap truncate',
            hasError && 'border border-destructive',
            className,
          )}
          value={value}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      )}
      <SelectContent>
        {options.map(option => (
          <SelectItem value={option.value} key={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
