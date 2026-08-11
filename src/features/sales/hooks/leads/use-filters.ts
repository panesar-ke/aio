import { useQueryStates } from 'nuqs';

import { leadSearchParams, LeadStatus } from '../../utils/search-params';

export function useLeadsFilters() {
  const [filters, setFilters] = useQueryStates(leadSearchParams);

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onLeadStatusChange(status: LeadStatus) {
    setFilters({ status });
  }

  function onReset() {
    setFilters({
      search: '',
      status: LeadStatus.all,
    });
  }

  return { filters, onHandleSearch, onLeadStatusChange, onReset };
}
