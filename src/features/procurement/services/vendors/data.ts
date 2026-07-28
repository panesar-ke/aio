'use cache';

import { subYears } from 'date-fns';
import { and, asc, count, desc, eq, gte, lte, or, sql, sum } from 'drizzle-orm';
import { cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';

import db from '@/drizzle/db';
import { ordersDetails, ordersHeader, vendors } from '@/drizzle/schema';
import { getRollingThirtyDayWindow } from '@/features/procurement/services/date-windows';
import {
  getPurchaseOrdersGlobalTag,
  getVendorIdTag,
  getVendorsGlobalTag,
  getVendorStatsGlobalTag,
} from '@/features/procurement/utils/cache';

const getTotalVendors = async () => {
  return await db.$count(vendors);
};

const getActiveVendorsYear = async (referenceDate: Date) => {
  const today = getRollingThirtyDayWindow(referenceDate).today;
  return await db
    .select({
      value: count(vendors.id),
    })
    .from(vendors)
    .innerJoin(ordersHeader, eq(vendors.id, ordersHeader.vendorId))
    .where(gte(ordersHeader.documentDate, subYears(new Date(today), 1).toDateString()))
    .then(res => res[0]?.value ?? 0);
};

const revenueValues = async (referenceDate: Date) => {
  const range = getRollingThirtyDayWindow(referenceDate);

  const currentPeriodRevenue = await db
    .select({
      total: sum(ordersDetails.amountInclusive),
    })
    .from(ordersHeader)
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(ordersHeader.documentDate, range.last30DaysStart),
          lte(ordersHeader.documentDate, range.today),
      ),
    )
    .then(res => Number(res[0]?.total) || 0);

  const previousPeriodRevenue = await db
    .select({
      total: sum(ordersDetails.amountInclusive),
    })
    .from(ordersHeader)
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(ordersHeader.documentDate, range.previous30DaysStart),
          lte(ordersHeader.documentDate, range.previous30DaysEnd),
      ),
    )
    .then(res => Number(res[0]?.total) || 0);

  const percentageChange =
    previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - previousPeriodRevenue) /
          previousPeriodRevenue) *
        100
      : currentPeriodRevenue > 0
        ? 100
        : 0;

  return {
    currentPeriod: currentPeriodRevenue,
    previousPeriod: previousPeriodRevenue,
    percentageChange: Math.round(percentageChange * 100) / 100,
    trend:
      percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable',
  };
};

const topVendorStats = async (referenceDate: Date) => {
  const range = getRollingThirtyDayWindow(referenceDate);
  const result = await db
    .select({
      vendorId: vendors.id,
      vendorName: vendors.vendorName,
      totalSpent: sum(ordersDetails.amountInclusive),
    })
    .from(vendors)
    .innerJoin(ordersHeader, eq(vendors.id, ordersHeader.vendorId))
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .where(
      and(
        gte(ordersHeader.documentDate, range.last30DaysStart),
        lte(ordersHeader.documentDate, range.today),
      ),
    )
    .groupBy(vendors.id)
    .orderBy(desc(sum(ordersDetails.amountInclusive)))
    .limit(1)
    .then(res => res[0] ?? null);
  return result
    ? {
        vendorName: result.vendorName,
        totalSpent: Number(result.totalSpent) || 0,
      }
    : null;
};

export const getVendorStats = async (referenceDate: Date) => {
  cacheTag(getVendorStatsGlobalTag());
  const [totalVendors, activeVendors, revenue, topVendor] = await Promise.all([
    getTotalVendors(),
    getActiveVendorsYear(referenceDate),
    revenueValues(referenceDate),
    topVendorStats(referenceDate),
  ]);

  return {
    totalVendors,
    activeVendors,
    revenue,
    topVendor,
  };
};

export const getVendors = async (search?: string) => {
  cacheTag(getVendorsGlobalTag());
  return await db
    .select({
      id: vendors.id,
      vendorName: sql<string>`lower(${vendors.vendorName})`,
      contact: vendors.contact,
      email: vendors.email,
      active: vendors.active,
      totalOrderSum: sql<number>`cast(sum(${ordersDetails.amountInclusive}) as integer)`,
      totalOrders: count(ordersHeader.id),
      lastOrderDate: sql`max(${ordersHeader.documentDate})`,
    })
    .from(vendors)
    .where(
      search
        ? or(
            sql`lower(${
              vendors.vendorName
            }) like ${`%${search.toLowerCase()}%`}`,
            sql`lower(${vendors.contact}) like ${`%${search.toLowerCase()}%`}`,
            sql`lower(${vendors.email}) like ${`%${search.toLowerCase()}%`}`,
          )
        : undefined,
    )
    .leftJoin(ordersHeader, eq(vendors.id, ordersHeader.vendorId))
    .leftJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .groupBy(vendors.id, vendors.vendorName, vendors.contact, vendors.email)
    .orderBy(asc(sql`lower(${vendors.vendorName})`));
};

export const getVendor = async (id: string) => {
  cacheTag(getVendorIdTag(id));
  const vendor = await db.query.vendors.findFirst({
    where: (model, { eq: equal }) => equal(model.id, id),
  });
  if (!vendor) {
    notFound();
  }
  return vendor;
};

export const getVendorOrders = async (id: string) => {
  cacheTag(getVendorIdTag(id));
  cacheTag(getPurchaseOrdersGlobalTag());
  return db
    .select({
      id: ordersHeader.id,
      documentDate: ordersHeader.documentDate,
      invoiceNo: ordersHeader.billNo,
      invoiceDate: ordersHeader.billDate,
      orderValue: sql<number>`cast(sum(${ordersDetails.amountInclusive}) as numeric)`,
      discountedTotal: sql<number>`cast(coalesce(sum(${ordersDetails.discountedAmount}), 0) as numeric)`,
    })
    .from(ordersHeader)
    .innerJoin(vendors, eq(ordersHeader.vendorId, vendors.id))
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .where(eq(ordersHeader.vendorId, id))
    .groupBy(
      ordersHeader.id,
      ordersHeader.documentDate,
      ordersHeader.billNo,
      ordersHeader.billDate,
    );
};
