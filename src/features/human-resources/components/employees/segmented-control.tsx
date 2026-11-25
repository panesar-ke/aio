import { cn } from '@/lib/utils';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  name: string;
  labelledBy: string;
  value: string;
  options: ReadonlyArray<Option<T>>;
  onChange: (value: T) => void;
  onBlur?: () => void;
  invalid?: boolean;
};

/** Single-choice pill group (native radios, so keyboard and screen readers work). */
export function SegmentedControl<T extends string>({
  name,
  labelledBy,
  value,
  options,
  onChange,
  onBlur,
  invalid,
}: SegmentedControlProps<T>) {
  return (
    <div
      role='radiogroup'
      aria-labelledby={labelledBy}
      aria-invalid={invalid}
      className={cn(
        'bg-muted inline-flex flex-wrap gap-0.5 rounded-lg border border-transparent p-0.5',
        invalid && 'border-destructive',
      )}
    >
      {options.map((option) => (
        <label key={option.value} className='relative cursor-pointer'>
          <input
            type='radio'
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            onBlur={onBlur}
            className='peer absolute inset-0 cursor-pointer opacity-0'
          />
          <span className='text-muted-foreground hover:text-foreground peer-checked:bg-card peer-checked:text-foreground peer-focus-visible:outline-ring inline-flex items-center rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1'>
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
