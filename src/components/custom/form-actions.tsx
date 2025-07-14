import type { IsEdit, IsPending } from '@/types/index.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
        {defaultButtonNames ? (isEdit ? 'Update' : 'Save') : actionButtonText}
      </Button>
      <Button
        type="reset"
        variant="outline"
        disabled={isPending}
        onClick={resetFn}
      >
        {defaultButtonNames ? 'Cancel' : cancelButtonText}
      </Button>
    </div>
  )
}
