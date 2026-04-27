'use client';
import type { VariantProps } from 'class-variance-authority';
import type { Route } from 'next';

import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button, type buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BackButton({
  children,
  className,
  variant = 'outline',
  size,
  href,
  noLeftPadding = true,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  href?: Route;
  noLeftPadding?: boolean;
}) {
  const router = useRouter();
  if (href) {
    return (
      <Button
        variant={variant}
        size={size || 'sm'}
        type="button"
        className={cn(
          '[&_svg]:transition-transform [&:hover_svg.arrow]:-translate-x-0.5',
          noLeftPadding && 'pl-0!',
          className,
        )}
        asChild
      >
        <Link href={href}>
          <ArrowLeftIcon className="arrow shrink-0" />
          {children}
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant={variant}
      size={size || 'sm'}
      type="button"
      className={cn(
        '[&_svg]:transition-transform [&:hover_svg.arrow]:-translate-x-0.5',
        noLeftPadding && 'pl-0!',
        className,
      )}
      onClick={() => router.back()}
    >
      <ArrowLeftIcon className="arrow shrink-0" />
      {children}
    </Button>
  );
}
