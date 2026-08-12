import type { saleAccounts } from '@/drizzle/schema';

import { type getAccounts } from '@/features/sales/services/accounts/data';

export type SalesCacheTag = 'leads' | 'accounts';

export type Lead = typeof saleAccounts.$inferSelect;
export type Account = typeof saleAccounts.$inferSelect;

export type AccountWithValueAndLastDateOfPurchase = Awaited<
  ReturnType<typeof getAccounts>
>[number];
