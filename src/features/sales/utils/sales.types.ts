import type { saleAccounts } from '@/drizzle/schema';

export type SalesCacheTag = 'leads';

export type Lead = typeof saleAccounts.$inferSelect;
