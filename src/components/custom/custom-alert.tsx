import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorVariant } from '@/types/index.types';

interface CustomAlertProps {
  title?: string;
  description: string | Array<string>;
  variant: ColorVariant;
}

export function CustomAlert({ variant, description, title }: CustomAlertProps) {
  return (
    <div
      className={cn('rounded-md bg-warning p-4  text-warning-foreground', {
        'bg-info text-info-foreground': variant === 'info',
        'bg-success text-success-foreground': variant === 'success',
        'bg-warning text-warning-foreground': variant === 'warning',
        'bg-error text-error-foreground': variant === 'error',
      })}
    >
      {!Array.isArray(description) ? (
        <div className="flex items-center gap-2">
          <InfoIcon size={24} className="shrink-0" />
          <span className="text-sm">
            <strong>
              {title
                ? title
                : variant === 'error'
                ? 'Error!!'
                : variant === 'success'
                ? 'Success🥳🥳'
                : 'Important'}
              :
            </strong>{' '}
            {description}
          </span>{' '}
        </div>
      ) : (
        <ul className="list-disc pl-4">
          {description.map(desc => (
            <li key={desc} className="text-sm">
              {desc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
