import { DropdownMenuContent } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export default function CustomDropdownContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <DropdownMenuContent
      className={cn(
        '[&>*]:cursor-pointer [&>*]:text-xs [&>*]:font-medium',
        className,
      )}
    >
      {children}
    </DropdownMenuContent>
  )
}
