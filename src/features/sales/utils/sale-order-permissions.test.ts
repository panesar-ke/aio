import { describe, expect, it } from 'vitest';

import type { SaleOrderStatus } from '@/features/sales/utils/sales.types';

import { SALE_ORDER_STATUS } from '@/features/sales/utils/constants';
import {
  canEditDeleteSaleOrder,
  saleOrderStatusLabel,
  saleOrderStatusVariant,
} from '@/features/sales/utils/sale-order-permissions';

describe('canEditSaleOrder', () => {
  it('allows editing every status except cancelled', () => {
    expect(canEditDeleteSaleOrder('draft')).toBe(true);
    expect(canEditDeleteSaleOrder('partially fulfilled')).toBe(true);
    expect(canEditDeleteSaleOrder('fulfilled')).toBe(true);
    expect(canEditDeleteSaleOrder('cancelled')).toBe(false);
  });
});

describe('canCancelSaleOrder', () => {
  it('allows cancelling only orders that are neither fulfilled nor cancelled', () => {
    expect(canEditDeleteSaleOrder('draft')).toBe(true);
    expect(canEditDeleteSaleOrder('partially fulfilled')).toBe(true);
    expect(canEditDeleteSaleOrder('fulfilled')).toBe(true);
    expect(canEditDeleteSaleOrder('cancelled')).toBe(false);
  });
});

describe('saleOrderStatusLabel', () => {
  it('presents the draft status as Pending', () => {
    expect(saleOrderStatusLabel('draft')).toBe('Pending');
  });

  it('labels every status the database can hold', () => {
    for (const status of SALE_ORDER_STATUS) {
      expect(saleOrderStatusLabel(status)).toBeTruthy();
    }
  });
});

describe('saleOrderStatusVariant', () => {
  it('maps every status to a badge variant', () => {
    for (const status of SALE_ORDER_STATUS) {
      expect(saleOrderStatusVariant(status as SaleOrderStatus)).toBeTruthy();
    }
  });

  it('flags cancelled orders as destructive', () => {
    expect(saleOrderStatusVariant('cancelled')).toBe('destructive');
  });
});
