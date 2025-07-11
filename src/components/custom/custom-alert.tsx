import { InfoIcon } from 'lucide-react'
import type { ColorVariant } from '@/types/index.types'
import { cn } from '@/lib/utils'

interface CustomAlertProps {
  title?: string
  description: string | Array<string>
  variant: ColorVariant
}

export function CustomAlert({ variant, description, title }: CustomAlertProps) {
  return (
    <div
      className={cn('bg-warning p-2 rounded-full text-warning-foreground', {
        'bg-info text-info-foreground': variant === 'info',
        'bg-success text-success-foreground': variant === 'success',
        'bg-warning text-warning-foreground': variant === 'warning',
        'bg-error text-error-foreground': variant === 'error',
      })}
    >
      {!Array.isArray(description) ? (
        <div className="flex items-center gap-2">
          <div className="bg-background flex gap-1 items-center rounded-full p-1 px-2">
            <InfoIcon className="shrink-0 size-4" />
            <span className="text-sm">
              <strong>
                {title
                  ? title
                  : variant === 'error'
                    ? 'Error'
                    : variant === 'success'
                      ? 'Success🥳🥳'
                      : 'Important'}
              </strong>
            </span>
          </div>
          {description}
        </div>
      ) : (
        <ul className="list-disc pl-4">
          {description.map((desc) => (
            <li key={desc} className="text-sm">
              {desc}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
