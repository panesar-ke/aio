import { parseAsString, useQueryStates } from 'nuqs';

import { getFinancialYearStart } from '@/lib/helpers/dates';

export const budgetsParsers = {
  search: parseAsString.withDefault(''),
  financialYearStart: parseAsString.withDefault(
    getFinancialYearStart().toString(),
  ),
};

export function useBudgetFilters() {
  const [filters, setFilters] = useQueryStates(budgetsParsers);

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onFinancialYearChange(financialYearStart: string) {
    setFilters({ financialYearStart });
  }

  function onReset() {
    setFilters({
      search: '',
      financialYearStart: getFinancialYearStart().toString(),
    });
  }

  return { filters, onHandleSearch, onFinancialYearChange, onReset };
}
