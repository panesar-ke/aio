import { throttle, useQueryStates } from 'nuqs';

import {
  accountSearchParams,
  AccountTier,
  leadSearchParams,
  LeadStatus,
  salesDashboardSearchParams,
  salesOrderSearchParams,
} from '@/features/sales/utils/search-params';
import { dateFormat } from '@/lib/helpers/formatters';

export function useLeadsFilters() {
  const [filters, setFilters] = useQueryStates(leadSearchParams, {
    shallow: false,
    limitUrlUpdates: throttle(120),
  });

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

export function useAccountsFilters() {
  const [filters, setFilters] = useQueryStates(accountSearchParams, {
    shallow: false,
    limitUrlUpdates: throttle(120),
  });

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onTierChange(tier: AccountTier) {
    setFilters({ tier });
  }

  function onLastPurchaseChange(lastPurchase: string) {
    setFilters({ lastPurchase });
  }

  function onReset() {
    setFilters({
      search: '',
      tier: AccountTier.all,
      // nuqs skips undefined entries entirely, so clearing a param means
      // writing its default ('' here) or null - never undefined.
      lastPurchase: null,
    });
  }

  return {
    filters,
    onHandleSearch,
    onTierChange,
    onReset,
    onLastPurchaseChange,
  };
}

export function useSalesOrdersFilters() {
  const [filters, setFilters] = useQueryStates(salesOrderSearchParams, {
    shallow: false,
    limitUrlUpdates: throttle(120),
  });

  function onHandleSearch(value: string) {
    setFilters({ search: value });
  }

  function onSalesPersonChange(salesPerson: string) {
    setFilters({ salesPerson });
  }

  function onAccountChange(account: string) {
    setFilters({ account });
  }

  function onDateChange(date: { from: Date | null; to: Date | null }) {
    setFilters({
      from: date.from ? dateFormat(date.from) : null,
      to: date.to ? dateFormat(date.to) : null,
    });
  }

  function onReset() {
    setFilters({
      search: '',
      // `salesPerson` and `account` carry withDefault(''), so '' clears them;
      // `from`/`to` have no default, so null removes them from the URL.
      // Passing undefined would make nuqs skip them and leave the filter on.
      salesPerson: '',
      account: '',
      from: null,
      to: null,
    });
  }

  return {
    filters,
    onHandleSearch,
    onSalesPersonChange,
    onReset,
    onAccountChange,
    onDateChange,
  };
}

export function useSalesDashboardFilters() {
  const [filters, setFilters] = useQueryStates(salesDashboardSearchParams, {
    shallow: false,
    limitUrlUpdates: throttle(120),
  });

  function onFinancialYearChange(financialYear: string) {
    setFilters({ financialYear });
  }

  function onSalesPersonChange(salesPerson: string) {
    setFilters({ salesPerson });
  }

  function onReset() {
    setFilters({
      financialYear: null,
      salesPerson: '',
    });
  }

  return {
    filters,
    onFinancialYearChange,
    onSalesPersonChange,
    onReset,
  };
}
