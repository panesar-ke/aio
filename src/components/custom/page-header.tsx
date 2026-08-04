import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

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
      <div className="flex items-center gap-x-2">
        {path && (
          <Button size="lg" asChild className="sm:w-max">
            <Link
              href={path}
              prefetch={false}
              className="flex items-center gap-x-2"
            >
              {<Icon />}
              <span>{buttonText || "Create New"}</span>
            </Link>
          </Button>
        )}
        {content && content}
      </div>
    </header>
  );
}
