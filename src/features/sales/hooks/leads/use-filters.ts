import { throttle, useQueryStates } from 'nuqs';

import {
  accountSearchParams,
  AccountTier,
  leadSearchParams,
  LeadStatus,
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
      lastPurchase: undefined,
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
      salesPerson: undefined,
      account: undefined,
      from: undefined,
      to: undefined,
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
