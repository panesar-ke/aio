import { parseAsString, useQueryStates } from 'nuqs';

import { dateFormat } from '@/lib/helpers/formatters';

export const expensesParsers = {
  search: parseAsString.withDefault(''),
  from: parseAsString,
  to: parseAsString,
};

export function useExpenseFilters() {
  const [filters, setFilters] = useQueryStates(expensesParsers);

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onDateChange(date: { from: Date | null; to: Date | null }) {
    setFilters({
      from: date.from ? dateFormat(date.from) : null,
      to: date.to ? dateFormat(date.to) : null,
    });
  }

  function onReset() {
    setFilters({ search: '', from: null, to: null });
  }

  return { filters, onHandleSearch, onDateChange, onReset };
}
