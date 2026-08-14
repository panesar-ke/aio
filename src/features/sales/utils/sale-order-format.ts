import { numberFormat } from '@/lib/helpers/formatters';

/**
 * Formats an amount against the currency the order was raised in.
 *
 * Sale orders are raised in either KES or USD, so no amount should ever be
 * rendered without the currency it belongs to - a USD total shown as `Ksh`
 * misstates the value by roughly two orders of magnitude.
 */
export const formatSaleOrderAmount = (
  currency: string,
  amount: number | string,
) => `${currency} ${numberFormat(amount)}`;

/**
 * Formats the human-readable sale order reference, e.g. `SO/2026/1098`.
 *
 * Lives outside the page components so both server and client renders can
 * call it - importing it from a `'use client'` module would turn it into a
 * client reference that throws when a server component calls it.
 */
export const formatSaleOrderNo = (
  orderNo: number,
  orderDate?: Date | string,
) => {
  const year = orderDate
    ? new Date(orderDate).getFullYear()
    : new Date().getFullYear();
  return `SO/${year}/${orderNo.toString().padStart(4, '0')}`;
};
