import type { saleAccounts } from '@/drizzle/schema';
import type { getAccounts } from '@/features/sales/services/accounts/data';
import type {
  getSaleOrderDetails,
  getSalesOrders,
} from '@/features/sales/services/orders/data';
import type { SALE_ORDER_STATUS } from '@/features/sales/utils/constants';
import type { loadSalesOrderSearchParams } from '@/features/sales/utils/search-params';

export type SalesCacheTag =
  | 'leads'
  | 'accounts'
  | 'sales-orders'
  | 'sales-persons';

export type Lead = typeof saleAccounts.$inferSelect;
export type Account = typeof saleAccounts.$inferSelect;

export type AccountWithValueAndLastDateOfPurchase = Awaited<
  ReturnType<typeof getAccounts>
>[number];

export type SaleOrderFilters = Awaited<
  ReturnType<typeof loadSalesOrderSearchParams>
>;
export type SaleOrder = Awaited<ReturnType<typeof getSalesOrders>>[number];
export type SaleOrderStatus = (typeof SALE_ORDER_STATUS)[number];

export type SaleOrderDetails = NonNullable<
  Awaited<ReturnType<typeof getSaleOrderDetails>>
>;
export type SaleOrderDetailLine = SaleOrderDetails['lines'][number];
