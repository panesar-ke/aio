import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

export enum Status {
  all = 'all',
  active = 'active',
  cancelled = 'cancelled',
  expired = 'expired',
  suspended = 'suspended',
}

export const licenseParsers = {
  search: parseAsString.withDefault(''),
  status: parseAsStringEnum<Status>(Object.values(Status)),
};

export function useLicenseFilters() {
  const [filters, setFilters] = useQueryStates(licenseParsers);

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onStatusChange(status: Status) {
    setFilters({ status: status === 'all' ? null : status });
  }

  function onReset() {
    setFilters({ search: '', status: null });
  }

  return { filters, onHandleSearch, onStatusChange, onReset };
}
