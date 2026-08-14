import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  max,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { cacheTag } from 'next/cache';

import type { SaleOrderFilters } from '@/features/sales/utils/sales.types';

import db from '@/drizzle/db';
import {
  saleAccounts,
  salesOrdersDetails,
  salesOrdersHeader,
  users,
} from '@/drizzle/schema';
import {
  getSalesOrdersGlobalTag,
  getSalesOrdersIdTag,
  getSalesPersonsGlobalTag,
} from '@/features/sales/utils/cache';
import { saleUser } from '@/features/sales/utils/sale-helpers';
import { toSaleOrderFormValues } from '@/features/sales/utils/sale-order-mapper';
import { getFinancialYearRanges } from '@/lib/helpers/dates';
import { dateFormat, titleCase } from '@/lib/helpers/formatters';

async function salesOrderInternal({
  isSalesAdmin,
  userId,
  search,
  account,
  salesPerson,
  from,
  to,
}: SaleOrderFilters & { isSalesAdmin: boolean; userId: string }) {
  'use cache';
  cacheTag(getSalesOrdersGlobalTag());

  const filters: Array<SQL> = [];

  if (!isSalesAdmin) {
    filters.push(eq(salesOrdersHeader.salesRepId, userId));
  }
  if (salesPerson && salesPerson.trim().length > 0) {
    filters.push(eq(salesOrdersHeader.salesRepId, salesPerson));
  }
  if (account && account.trim().length > 0) {
    filters.push(eq(salesOrdersHeader.accountId, account));
  }
  if (search && search.trim().length > 0) {
    const searchFilters = or(
      ilike(saleAccounts.company, `%${search}%`),
      ilike(sql`cast(${salesOrdersHeader.saleOrderNo} as text)`, `%${search}%`),
    );
    if (searchFilters) {
      filters.push(searchFilters);
    }
  }

  if (from && to) {
    filters.push(
      gte(salesOrdersHeader.dateRaised, from),
      lte(salesOrdersHeader.dateRaised, to),
    );
  } else {
    const financialYearRanges = getFinancialYearRanges();
    filters.push(
      gte(
        salesOrdersHeader.dateRaised,
        dateFormat(financialYearRanges.currentYear.from),
      ),
      lte(
        salesOrdersHeader.dateRaised,
        dateFormat(financialYearRanges.currentYear.to),
      ),
    );
  }

  const orderItemsAgg = db
    .select({
      headerId: salesOrdersDetails.headerId,
      totalItems: sql<number>`
      cast(coalesce(sum(${salesOrdersDetails.qty}), 0) as numeric)
    `.as('total_items'),
    })
    .from(salesOrdersDetails)
    .groupBy(salesOrdersDetails.headerId)
    .as('order_items_agg');

  return db
    .select({
      id: salesOrdersHeader.id,
      saleOrderNo: salesOrdersHeader.saleOrderNo,
      dateRaised: salesOrdersHeader.dateRaised,
      company: saleAccounts.company,
      salesRepName: users.name,
      total: salesOrdersHeader.amountInclusive,
      currency: salesOrdersHeader.currency,
      totalItems: orderItemsAgg.totalItems,
      status: salesOrdersHeader.status,
    })
    .from(salesOrdersHeader)
    .innerJoin(saleAccounts, eq(salesOrdersHeader.accountId, saleAccounts.id))
    .innerJoin(orderItemsAgg, eq(salesOrdersHeader.id, orderItemsAgg.headerId))
    .innerJoin(users, eq(salesOrdersHeader.salesRepId, users.id))
    .where(and(...filters))
    .orderBy(desc(salesOrdersHeader.dateRaised));
}

export async function getNextSaleOrderNoPreview() {
  const [row] = await db
    .select({ maxSaleOrderNo: max(salesOrdersHeader.saleOrderNo) })
    .from(salesOrdersHeader);

  return Number(row?.maxSaleOrderNo ?? 0) + 1;
}

export async function getSalesPersonWithSales() {
  'use cache';
  cacheTag(getSalesPersonsGlobalTag());
  return db
    .select({
      value: users.id,
      label: users.name,
    })
    .from(salesOrdersHeader)
    .innerJoin(users, eq(salesOrdersHeader.salesRepId, users.id))
    .groupBy(users.id, users.name)
    .orderBy(asc(sql`lower(${users.name})`))
    .then((d) =>
      d.map((c) => ({
        value: c.value,
        label: titleCase(c.label.toLowerCase()),
      })),
    );
}

export async function getSalesOrders(searchParams: SaleOrderFilters) {
  const { isSalesAdmin, userId } = await saleUser();

  return salesOrderInternal({ isSalesAdmin, userId, ...searchParams });
}

type SaleOrderNoAllocatorTx = {
  execute: (query: SQL) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

/**
 * Allocates the next sale order number.
 *
 * Must be called with the transaction that inserts the header - the advisory
 * lock is held until that transaction commits, so concurrent callers queue up
 * instead of reading the same max value.
 */
export async function getSaleOrderNo(tx: SaleOrderNoAllocatorTx) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('sales_orders_header_no_allocation'))`,
  );

  const result = await tx.execute(
    sql`select coalesce(max(${salesOrdersHeader.saleOrderNo}), 0) + 1 as "saleOrderNo" from ${salesOrdersHeader}`,
  );

  const rawSaleOrderNo = result.rows[0]?.saleOrderNo;
  const saleOrderNo =
    typeof rawSaleOrderNo === 'number'
      ? rawSaleOrderNo
      : Number(rawSaleOrderNo);

  if (!Number.isFinite(saleOrderNo) || saleOrderNo < 1) {
    throw new Error('Unable to allocate sale order number');
  }

  return saleOrderNo;
}

async function getSaleOrderInternal({
  orderId,
  isSalesAdmin,
  userId,
}: {
  orderId: number;
  isSalesAdmin: boolean;
  userId: string;
}) {
  'use cache';
  cacheTag(getSalesOrdersIdTag(orderId.toString()));

  const [header] = await db
    .select({
      id: salesOrdersHeader.id,
      saleOrderNo: salesOrdersHeader.saleOrderNo,
      dateRaised: salesOrdersHeader.dateRaised,
      accountId: salesOrdersHeader.accountId,
      vatType: salesOrdersHeader.vatType,
      vatRate: salesOrdersHeader.vatRate,
      currency: salesOrdersHeader.currency,
      conversionRate: salesOrdersHeader.conversionRate,
      status: salesOrdersHeader.status,
    })
    .from(salesOrdersHeader)
    .where(
      and(
        eq(salesOrdersHeader.id, orderId),
        isSalesAdmin ? undefined : eq(salesOrdersHeader.salesRepId, userId),
      ),
    )
    .limit(1);

  if (!header) {
    return null;
  }

  const lines = await db
    .select({
      id: salesOrdersDetails.id,
      item: salesOrdersDetails.item,
      qty: salesOrdersDetails.qty,
      rate: salesOrdersDetails.rate,
      category: salesOrdersDetails.category,
    })
    .from(salesOrdersDetails)
    .where(eq(salesOrdersDetails.headerId, orderId))
    .orderBy(asc(salesOrdersDetails.id));

  return {
    saleOrderNo: header.saleOrderNo,
    status: header.status,
    values: toSaleOrderFormValues(header, lines),
  };
}

/**
 * Loads a sale order in the shape the create/edit form expects. Returns null
 * when the order does not exist or the current user is not allowed to see it.
 */
export async function getSaleOrder(orderId: number) {
  const { isSalesAdmin, userId } = await saleUser();

  return getSaleOrderInternal({ orderId, isSalesAdmin, userId });
}

async function getSaleOrderDetailsInternal({
  orderId,
  isSalesAdmin,
  userId,
}: {
  orderId: number;
  isSalesAdmin: boolean;
  userId: string;
}) {
  'use cache';
  cacheTag(getSalesOrdersIdTag(orderId.toString()));

  const cancelledByUser = alias(users, 'cancelled_by_user');

  const [order] = await db
    .select({
      id: salesOrdersHeader.id,
      saleOrderNo: salesOrdersHeader.saleOrderNo,
      dateRaised: salesOrdersHeader.dateRaised,
      vatType: salesOrdersHeader.vatType,
      vatRate: salesOrdersHeader.vatRate,
      currency: salesOrdersHeader.currency,
      conversionRate: salesOrdersHeader.conversionRate,
      amountExclusive: salesOrdersHeader.amountExclusive,
      vatAmount: salesOrdersHeader.vatAmount,
      amountInclusive: salesOrdersHeader.amountInclusive,
      status: salesOrdersHeader.status,
      cancelledAt: salesOrdersHeader.cancelledAt,
      cancelledByName: cancelledByUser.name,
      createdAt: salesOrdersHeader.createdAt,
      updatedAt: salesOrdersHeader.updatedAt,
      salesRepName: users.name,
      accountId: saleAccounts.id,
      company: saleAccounts.company,
      kraPin: saleAccounts.kraPin,
      phone: saleAccounts.phone,
      email: saleAccounts.email,
    })
    .from(salesOrdersHeader)
    .innerJoin(users, eq(salesOrdersHeader.salesRepId, users.id))
    .leftJoin(saleAccounts, eq(salesOrdersHeader.accountId, saleAccounts.id))
    .leftJoin(
      cancelledByUser,
      eq(salesOrdersHeader.cancelledBy, cancelledByUser.id),
    )
    .where(
      and(
        eq(salesOrdersHeader.id, orderId),
        isSalesAdmin ? undefined : eq(salesOrdersHeader.salesRepId, userId),
      ),
    )
    .limit(1);

  if (!order) {
    return null;
  }

  const lines = await db
    .select({
      id: salesOrdersDetails.id,
      item: salesOrdersDetails.item,
      qty: salesOrdersDetails.qty,
      rate: salesOrdersDetails.rate,
      amount: salesOrdersDetails.amount,
      category: salesOrdersDetails.category,
    })
    .from(salesOrdersDetails)
    .where(eq(salesOrdersDetails.headerId, orderId))
    .orderBy(asc(salesOrdersDetails.id));

  return { order, lines };
}

/**
 * Loads everything the sale order detail page renders - header, account
 * context, audit trail and lines. Returns null when the order does not exist
 * or the current user is not allowed to see it.
 */
export async function getSaleOrderDetails(orderId: number) {
  const { isSalesAdmin, userId } = await saleUser();

  return getSaleOrderDetailsInternal({ orderId, isSalesAdmin, userId });
}
