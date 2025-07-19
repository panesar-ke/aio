import type { Option } from '@/types/index.types'
import { FormControl } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { cn } from '@/lib/utils'

interface BasicSelectProps {
  options: Array<Option>
  onChange?: (value: string) => void
  defaultValue?: string | undefined
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  value?: string
}

export function MiniSelect({
  options,
  defaultValue,
  onChange,
  placeholder = 'Select one...',
  disabled,
  hasError,
  value,
}: BasicSelectProps) {
  return (
    <Select
      onValueChange={onChange}
      defaultValue={defaultValue}
      disabled={disabled}
    >
      <FormControl>
        <SelectTrigger
          className={cn(
            'w-full overflow-hidden whitespace-nowrap truncate',
            hasError && 'border border-destructive',
          )}
          value={value}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem value={option.value} key={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
