import { useState } from 'react'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import type { Option } from '@/types/index.types'
import { Button } from '@/components/ui/button'
import { FormControl } from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface SearchSelectProps {
  emptyText: string
  searchText: string
  options: Array<Option>
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
}

export function SearchSelect({
  value,
  placeholder,
  emptyText,
  searchText,
  options,
  onChange,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            type="button"
            className={cn(
              'w-full justify-between rounded-md shadow-none h-10 transition-colors hover:bg-transparent border-input overflow-hidden whitespace-nowrap truncate',
              !value && 'text-muted-foreground',
            )}
          >
            {value
              ? options.find((opt) => opt.value === value)?.label
              : placeholder}
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchText} className="h-10" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  value={opt.label}
                  key={opt.value}
                  onSelect={() => {
                    onChange?.(opt.value)
                    setOpen(false)
                  }}
                  className="max-w-xl truncate"
                >
                  {opt.label}
                  <CheckIcon
                    className={cn(
                      'ml-auto',
                      opt.value === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
