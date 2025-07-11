import { Loader2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function LoadingSwap({
  isLoading,
  children,
  className,
  loadingText,
}: {
  isLoading: boolean
  children: ReactNode
  className?: string
  loadingText?: string
}) {
  return (
    <div className="grid grid-cols-1 items-center justify-items-center">
      <div
        className={cn(
          'col-start-1 col-end-2 row-start-1 row-end-2 w-full',
          isLoading ? 'invisible' : 'visible',
          className,
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          'col-start-1 col-end-2 row-start-1 row-end-2 flex items-center gap-2',
          isLoading ? 'visible' : 'invisible',
          className,
        )}
      >
        {loadingText && <span className="text-sm">{loadingText}</span>}
        <Loader2Icon className="animate-spin" />
      </div>
    </div>
  )
}
