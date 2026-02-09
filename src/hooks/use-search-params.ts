'use client';

import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

type SearchParamsValue = string | number | Date | boolean;

interface UseSearchParamsReturn {
  setSearchParams: (params: Record<string, SearchParamsValue>) => void;
  updateSearchParam: (key: string, value: SearchParamsValue) => void;
  clearSearchParams: () => void;
  removeSearchParam: (key: string) => void;
}

export function useSearchParams(): UseSearchParamsReturn {
  const { replace } = useRouter();
  const pathname = usePathname();

  const formatValue = useCallback((value: SearchParamsValue): string => {
    if (value instanceof Date) {
      // Format date as YYYY-MM-DD for consistency
      return value.toISOString().split('T')[0];
    }
    return String(value);
  }, []);

  const setSearchParams = useCallback(
    (params: Record<string, SearchParamsValue>) => {
      const urlParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          urlParams.set(key, formatValue(value));
        }
      });

      replace(`${pathname}?${urlParams.toString()}` as Route);
    },
    [replace, pathname, formatValue]
  );

  const updateSearchParam = useCallback(
    (key: string, value: SearchParamsValue) => {
      const currentParams = new URLSearchParams(window.location.search);

      if (value !== undefined && value !== null && value !== '') {
        currentParams.set(key, formatValue(value));
      } else {
        currentParams.delete(key);
      }

      replace(`${pathname}?${currentParams.toString()}` as Route);
    },
    [replace, pathname, formatValue]
  );

  const removeSearchParam = useCallback(
    (key: string) => {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.delete(key);
      replace(`${pathname}?${currentParams.toString()}` as Route);
    },
    [replace, pathname]
  );

  const clearSearchParams = useCallback(() => {
    replace(pathname as Route);
  }, [replace, pathname]);

  return {
    setSearchParams,
    updateSearchParam,
    removeSearchParam,
    clearSearchParams,
  };
}
