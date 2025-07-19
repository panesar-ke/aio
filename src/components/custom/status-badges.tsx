import { CheckCircle2, CircleX, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

interface CustomStatusBadgeProps {
  text: string
  variant: 'success' | 'warning' | 'error' | 'info'
}

export function CustomStatusBadge({ text, variant }: CustomStatusBadgeProps) {
  return (
    <Badge
      variant={variant}
      className="inline-flex gap-1 px-0.5 capitalize rounded-full"
    >
      {variant === 'success' ? (
        <CheckCircle2 size={14} />
      ) : variant === 'error' ? (
        <CircleX size={14} />
      ) : (
        <TriangleAlert size={14} />
      )}
      <span>{text}</span>
    </Badge>
  )
}
