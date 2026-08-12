import { throttle, useQueryStates } from 'nuqs';

import {
  accountSearchParams,
  AccountTier,
  leadSearchParams,
  LeadStatus,
} from '@/features/sales/utils/search-params';

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
