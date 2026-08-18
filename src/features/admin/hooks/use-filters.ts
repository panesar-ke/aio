import { useQueryStates, throttle } from 'nuqs';
import { activeSessionsSearchParams } from '@/features/admin/utils/search-params';

export function useActiveSessionsFilters() {
  const [filters, setFilters] = useQueryStates(activeSessionsSearchParams, {
    shallow: false,
    limitUrlUpdates: throttle(120),
  });

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onReset() {
    setFilters({
      search: '',
    });
  }

  return { filters, onHandleSearch, onReset };
}
