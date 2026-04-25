'use client';

import type { Route } from 'next';

import { SearchIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounceCallback } from 'usehooks-ts';

import { normalizeString } from '@/lib/string-normalizers';
import { cn } from '@/lib/utils';

interface SearchProps {
  placeholder: string;
  className?: string;
  allowOnlySearch?: boolean;
  parentClassName?: string;
  onHandleSearch?: (value: string) => void;
  defaultValue?: string;
}

export default function Search({
  placeholder,
  className,
  allowOnlySearch,
  parentClassName,
  onHandleSearch,
  defaultValue,
}: SearchProps) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleSearch = useDebounceCallback((term: string) => {
    if (onHandleSearch) {
      onHandleSearch(term);
      return;
    }
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', normalizeString(term));
    } else {
      params.delete('search');
    }

    if (allowOnlySearch) {
      params.forEach((_, key) => {
        if (key !== 'search') params.delete(key);
      });
    }

    replace(`${pathname}?${params.toString()}` as Route);
  }, 300);

  return (
    <div
      className={cn('relative flex flex-1 shrink-0 bg-card', parentClassName)}
    >
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className={cn(
          'border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-none transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 ',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          'pl-10',
          className,
        )}
        onChange={e => handleSearch(e.target.value)}
        placeholder={placeholder}
        defaultValue={defaultValue ?? searchParams.get('search')?.toString()}
        type="search"
      />
      <SearchIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
