import { parseAsString, useQueryStates } from 'nuqs';

import { dateFormat } from '@/lib/helpers/formatters';

export const assetFiltersParsers = {
  search: parseAsString.withDefault(''),
  from: parseAsString,
  to: parseAsString,
  status: parseAsString,
  condition: parseAsString,
  categoryId: parseAsString,
  departmentId: parseAsString,
};

export const assignmentFiltersParsers = {
  search: parseAsString.withDefault(''),
  from: parseAsString,
  to: parseAsString,
  assetId: parseAsString,
  custodyType: parseAsString,
  userId: parseAsString,
  departmentId: parseAsString,
};

export function useAssetFilters() {
  const [filters, setFilters] = useQueryStates(assetFiltersParsers);

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onDateChange(date: { from: Date | null; to: Date | null }) {
    setFilters({
      from: date.from ? dateFormat(date.from) : null,
      to: date.to ? dateFormat(date.to) : null,
    });
  }

  function onFilterChange(
    key: keyof typeof assetFiltersParsers,
    value?: string,
  ) {
    setFilters({ [key]: value && value !== '__all__' ? value : null });
  }

  function onReset() {
    setFilters({
      search: '',
      from: null,
      to: null,
      status: null,
      condition: null,
      categoryId: null,
      departmentId: null,
    });
  }

  return { filters, onDateChange, onHandleSearch, onFilterChange, onReset };
}

export function useAssetAssignmentFilters() {
  const [filters, setFilters] = useQueryStates(assignmentFiltersParsers);

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onDateChange(date: { from: Date | null; to: Date | null }) {
    setFilters({
      from: date.from ? dateFormat(date.from) : null,
      to: date.to ? dateFormat(date.to) : null,
    });
  }

  function onFilterChange(
    key: keyof typeof assignmentFiltersParsers,
    value?: string,
  ) {
    setFilters({ [key]: value && value !== '__all__' ? value : null });
  }

  function onReset() {
    setFilters({
      search: '',
      from: null,
      to: null,
      assetId: null,
      custodyType: null,
      userId: null,
      departmentId: null,
    });
  }

  return { filters, onDateChange, onHandleSearch, onFilterChange, onReset };
}
