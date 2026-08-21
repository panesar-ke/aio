import { createLoader, parseAsString, parseAsStringEnum } from 'nuqs/server';

import { getFinancialYearStart } from '@/lib/helpers/dates';

export enum LeadStatus {
  all = 'all',
  new = 'new',
  contacted = 'contacted',
  nurturing = 'nurturing',
  qualified = 'qualified',
  unqualified = 'unqualified',
  lost = 'lost',
}

export enum AccountTier {
  all = 'all',
  high = 'high',
  medium = 'medium',
  low = 'low',
}

// Describe your search params, and reuse this in useQueryStates / createSerializer:
export const leadSearchParams = {
  search: parseAsString.withDefault(''),
  status: parseAsStringEnum<LeadStatus>(Object.values(LeadStatus)).withDefault(
    LeadStatus.all,
  ),
};

export const accountSearchParams = {
  search: parseAsString.withDefault(''),
  tier: parseAsStringEnum<AccountTier>(Object.values(AccountTier)).withDefault(
    AccountTier.all,
  ),
  lastPurchase: parseAsString,
};

export const salesOrderSearchParams = {
  search: parseAsString.withDefault(''),
  account: parseAsString.withDefault(''),
  salesPerson: parseAsString.withDefault(''),
  from: parseAsString,
  to: parseAsString,
};

export const salesDashboardSearchParams = {
  financialYear: parseAsString.withDefault(getFinancialYearStart().toString()),
  salesPerson: parseAsString.withDefault(''),
};

export const newSalesOrderSearchParams = {
  account: parseAsString,
};

export const loadLeadSearchParams = createLoader(leadSearchParams);
export const loadAccountSearchParams = createLoader(accountSearchParams);
export const loadSalesOrderSearchParams = createLoader(salesOrderSearchParams);
export const loadSalesDashboardSearchParams = createLoader(
  salesDashboardSearchParams,
);
export const loadNewSalesOrderSearchParams = createLoader(
  newSalesOrderSearchParams,
);

export type SalesDashboardFilters = Awaited<
  ReturnType<typeof loadSalesDashboardSearchParams>
>;
