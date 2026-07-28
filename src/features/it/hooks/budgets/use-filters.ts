import { parseAsString, useQueryStates } from 'nuqs';

export function useBudgetFilters(defaultFinancialYearStart: string) {
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    financialYearStart: parseAsString.withDefault(defaultFinancialYearStart),
  });

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onFinancialYearChange(financialYearStart: string) {
    setFilters({ financialYearStart });
  }

  function onReset() {
    setFilters({
      search: '',
      financialYearStart: defaultFinancialYearStart,
    });
  }

  return { filters, onHandleSearch, onFinancialYearChange, onReset };
}
