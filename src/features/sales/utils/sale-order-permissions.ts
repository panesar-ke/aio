import type { SaleOrderStatus } from '@/features/sales/utils/sales.types';

import { SALE_ORDER_STATUS_LABELS } from '@/features/sales/utils/constants';

export function canEditDeleteSaleOrder(status: SaleOrderStatus) {
  return status !== 'cancelled';
}

export function saleOrderStatusLabel(status: SaleOrderStatus) {
  return SALE_ORDER_STATUS_LABELS[status];
}

export function saleOrderStatusVariant(status: SaleOrderStatus) {
  switch (status) {
    case 'draft':
      return 'warning' as const;
    case 'fulfilled':
      return 'success' as const;
    case 'cancelled':
      return 'destructive' as const;
    case 'partially fulfilled':
      return 'secondary' as const;
  }
}
