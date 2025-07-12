import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import type { TRoutes } from '@/types/index.types'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  buttonText?: string
  path?: TRoutes
  description?: string
  content?: React.ReactNode
}

export default function PageHeader({
  title,
  path,
  description,
  buttonText,
  content,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold font-display">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {path && (
        <Button size="lg" asChild className="sm:w-max">
          <Link to={path} className="flex items-center gap-x-2">
            <Plus />
            <span>{buttonText || 'Create New'}</span>
          </Link>
        </Button>
      )}
      {content && content}
    </header>
  )
}
