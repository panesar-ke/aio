import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Route } from 'next';

interface PageHeaderProps {
  title: string;
  buttonText?: string;
  path?: Route;
  description?: string;
  content?: React.ReactNode;
  Icon?: LucideIcon;
}

export default function PageHeader({
  title,
  path,
  description,
  buttonText,
  content,
  Icon = Plus, // Default icon if none is provided
}: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold font-display text-primary">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {path && (
        <Button size="lg" asChild className="sm:w-max">
          <Link href={path} className="flex items-center gap-x-2">
            {<Icon />}
            <span>{buttonText || 'Create New'}</span>
          </Link>
        </Button>
      )}
      {content && content}
    </header>
  );
}
