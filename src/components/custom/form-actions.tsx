import { CircleCheckBigIcon, CircleXIcon } from 'lucide-react'
import type { IsEdit, IsPending } from '@/types/index.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ButtonLoader } from '@/components/custom/loaders'

interface FormActionsProps extends IsPending, IsEdit {
  resetFn: () => void
  className?: string
  defaultButtonNames?: boolean
  actionButtonText?: string
  cancelButtonText?: string
}

export default function FormActions({
  isEdit,
  isPending,
  resetFn,
  className,
  defaultButtonNames = true,
  actionButtonText = 'Save',
  cancelButtonText = 'Cancel',
}: FormActionsProps) {
  return (
    <div className={cn('flex items-center gap-x-2 justify-end', className)}>
      <Button type="submit" disabled={isPending}>
        {!isPending ? (
          <ButtonLoader loadingText="Processing..." />
        ) : (
          <>
            <CircleCheckBigIcon />
            <span>
              {defaultButtonNames
                ? isEdit
                  ? 'Update'
                  : 'Save'
                : actionButtonText}
            </span>
          </>
        )}
      </Button>
      <Button
        type="reset"
        variant="outline"
        disabled={isPending}
        onClick={resetFn}
      >
        <CircleXIcon />
        <span>{defaultButtonNames ? 'Cancel' : cancelButtonText}</span>
      </Button>
    </div>
  )
}
