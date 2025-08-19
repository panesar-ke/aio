import {
  and,
  eq,
  gte,
  lte,
  sum,
  count,
  desc,
  countDistinct,
  sql,
} from 'drizzle-orm';
import { subDays } from 'date-fns';
import db from '@/drizzle/db';
import {
  ordersDetails,
  ordersHeader,
  productCategories,
  products,
  vendors,
} from '@/drizzle/schema';
import { dateFormat } from '@/lib/helpers/formatters';

export interface DashboardStats {
  revenue: {
    last30Days: number;
    previous30Days: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
  };
  orders: {
    last30Days: number;
    previous30Days: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
  };
  discountedAmount: {
    last30Days: number;
    previous30Days: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
  };
  averageOrder: {
    last30Days: number;
    previous30Days: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
  };
  lastUpdated: string;
}

export interface DateRangeStats {
  totalRevenue: number;
  totalOrders: number;
  period: {
    start: string;
    end: string;
  };
}

const today = new Date();
const last30DaysStart = subDays(today, 30);
const previous30DaysStart = subDays(today, 60);
const previous30DaysEnd = subDays(today, 30);

export const getRevenueStats = async () => {
  try {
    const last30DaysRevenue = await db
      .select({
        total: sum(ordersDetails.amountInclusive),
      })
      .from(ordersHeader)
      .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            last30DaysStart.toISOString().split('T')[0]
          ),
          lte(ordersHeader.documentDate, today.toISOString().split('T')[0]),
          eq(ordersHeader.isDeleted, false)
        )
      );

    const previous30DaysRevenue = await db
      .select({
        total: sum(ordersDetails.amountInclusive),
      })
      .from(ordersHeader)
      .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            previous30DaysStart.toISOString().split('T')[0]
          ),
          lte(
            ordersHeader.documentDate,
            previous30DaysEnd.toISOString().split('T')[0]
          ),
          eq(ordersHeader.isDeleted, false)
        )
      );

    const last30DaysTotal = Number(last30DaysRevenue[0]?.total) || 0;
    const previous30DaysTotal = Number(previous30DaysRevenue[0]?.total) || 0;

    const percentageChange =
      previous30DaysTotal > 0
        ? ((last30DaysTotal - previous30DaysTotal) / previous30DaysTotal) * 100
        : 0;

    return {
      last30Days: last30DaysTotal,
      previous30Days: previous30DaysTotal,
      percentageChange: Math.round(percentageChange * 100) / 100,
      trend:
        percentageChange > 0
          ? 'up'
          : percentageChange < 0
          ? 'down'
          : ('stable' as DashboardStats['revenue']['trend']),
    };
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    return {
      last30Days: 0,
      previous30Days: 0,
      percentageChange: 0,
      trend: 'stable' as const,
    };
  }
};

const getOrderStats = async () => {
  try {
    const last30DaysOrders = await db
      .select({
        total: count(),
      })
      .from(ordersHeader)
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            last30DaysStart.toISOString().split('T')[0]
          ),
          lte(ordersHeader.documentDate, today.toISOString().split('T')[0]),
          eq(ordersHeader.isDeleted, false)
        )
      );

    const previous30DaysOrders = await db
      .select({
        total: count(),
      })
      .from(ordersHeader)
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            previous30DaysStart.toISOString().split('T')[0]
          ),
          lte(
            ordersHeader.documentDate,
            previous30DaysEnd.toISOString().split('T')[0]
          ),
          eq(ordersHeader.isDeleted, false)
        )
      );

    const last30DaysTotal = Number(last30DaysOrders[0]?.total) || 0;
    const previous30DaysTotal = Number(previous30DaysOrders[0]?.total) || 0;

    const percentageChange =
      previous30DaysTotal > 0
        ? ((last30DaysTotal - previous30DaysTotal) / previous30DaysTotal) * 100
        : 0;

    return {
      last30Days: last30DaysTotal,
      previous30Days: previous30DaysTotal,
      percentageChange: Math.round(percentageChange * 100) / 100,
      trend:
        percentageChange > 0
          ? 'up'
          : percentageChange < 0
          ? 'down'
          : ('stable' as DashboardStats['orders']['trend']),
    };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return {
      last30Days: 0,
      previous30Days: 0,
      percentageChange: 0,
      trend: 'stable' as const,
    };
  }
};

const getDiscountedAmountStats = async () => {
  try {
    const last30DaysDiscounted = await db
      .select({
        total: sum(ordersDetails.discountedAmount),
      })
      .from(ordersHeader)
      .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            last30DaysStart.toISOString().split('T')[0]
          ),
          lte(ordersHeader.documentDate, today.toISOString().split('T')[0]),
          eq(ordersHeader.isDeleted, false)
        )
      );

    const previous30DaysDiscounted = await db
      .select({
        total: sum(ordersDetails.discountedAmount),
      })
      .from(ordersHeader)
      .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            previous30DaysStart.toISOString().split('T')[0]
          ),
          lte(
            ordersHeader.documentDate,
            previous30DaysEnd.toISOString().split('T')[0]
          ),
          eq(ordersHeader.isDeleted, false)
        )
      );

    const last30DaysTotal = Number(last30DaysDiscounted[0]?.total) || 0;
    const previous30DaysTotal = Number(previous30DaysDiscounted[0]?.total) || 0;

    const percentageChange =
      previous30DaysTotal > 0
        ? ((last30DaysTotal - previous30DaysTotal) / previous30DaysTotal) * 100
        : 0;

    return {
      last30Days: last30DaysTotal,
      previous30Days: previous30DaysTotal,
      percentageChange: Math.round(percentageChange * 100) / 100,
      trend:
        percentageChange > 0
          ? 'up'
          : percentageChange < 0
          ? 'down'
          : ('stable' as DashboardStats['discountedAmount']['trend']),
    };
  } catch (error) {
    console.error('Error fetching discounted amount stats:', error);
    return {
      last30Days: 0,
      previous30Days: 0,
      percentageChange: 0,
      trend: 'stable' as const,
    };
  }
};

const getAverageOrderStats = async () => {
  try {
    const last30DaysData = await db
      .select({
        totalAmount: sum(ordersDetails.amountInclusive),
        orderCount: count(),
      })
      .from(ordersHeader)
      .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            last30DaysStart.toISOString().split('T')[0]
          ),
          lte(ordersHeader.documentDate, today.toISOString().split('T')[0]),
          eq(ordersHeader.isDeleted, false)
        )
      );

    const previous30DaysData = await db
      .select({
        totalAmount: sum(ordersDetails.amountInclusive),
        orderCount: count(),
      })
      .from(ordersHeader)
      .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            previous30DaysStart.toISOString().split('T')[0]
          ),
          lte(
            ordersHeader.documentDate,
            previous30DaysEnd.toISOString().split('T')[0]
          ),
          eq(ordersHeader.isDeleted, false)
        )
      );

    const last30DaysAmount = Number(last30DaysData[0]?.totalAmount) || 0;
    const last30DaysCount = Number(last30DaysData[0]?.orderCount) || 0;
    const last30DaysAverage =
      last30DaysCount > 0 ? last30DaysAmount / last30DaysCount : 0;

    const previous30DaysAmount =
      Number(previous30DaysData[0]?.totalAmount) || 0;
    const previous30DaysCount = Number(previous30DaysData[0]?.orderCount) || 0;
    const previous30DaysAverage =
      previous30DaysCount > 0 ? previous30DaysAmount / previous30DaysCount : 0;

    const percentageChange =
      previous30DaysAverage > 0
        ? ((last30DaysAverage - previous30DaysAverage) /
            previous30DaysAverage) *
          100
        : 0;

    return {
      last30Days: Math.round(last30DaysAverage * 100) / 100,
      previous30Days: Math.round(previous30DaysAverage * 100) / 100,
      percentageChange: Math.round(percentageChange * 100) / 100,
      trend:
        percentageChange > 0
          ? ('up' as const)
          : percentageChange < 0
          ? ('down' as const)
          : ('stable' as const),
    };
  } catch (error) {
    console.error('Error fetching average order stats:', error);
    return {
      last30Days: 0,
      previous30Days: 0,
      percentageChange: 0,
      trend: 'stable' as const,
    };
  }
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [revenueStats, orderStats, discountedAmountStats, averageOrderStats] =
      await Promise.all([
        getRevenueStats(),
        getOrderStats(),
        getDiscountedAmountStats(),
        getAverageOrderStats(),
      ]);

    return {
      revenue: revenueStats,
      orders: orderStats,
      discountedAmount: discountedAmountStats,
      averageOrder: averageOrderStats,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      revenue: {
        last30Days: 0,
        previous30Days: 0,
        percentageChange: 0,
        trend: 'stable' as const,
      },
      orders: {
        last30Days: 0,
        previous30Days: 0,
        percentageChange: 0,
        trend: 'stable' as const,
      },
      discountedAmount: {
        last30Days: 0,
        previous30Days: 0,
        percentageChange: 0,
        trend: 'stable' as const,
      },
      averageOrder: {
        last30Days: 0,
        previous30Days: 0,
        percentageChange: 0,
        trend: 'stable' as const,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
};

export const getTopVendorsDetails = async () => {
  const topVendorDetails = await db
    .select({
      vendorName: vendors.vendorName,
      totalOrders: countDistinct(ordersHeader.id),
      totalAmount: sum(ordersDetails.amountInclusive),
    })
    .from(ordersHeader)
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .innerJoin(vendors, eq(ordersHeader.vendorId, vendors.id))
    .where(
      and(
        gte(
          ordersHeader.documentDate,
          last30DaysStart.toISOString().split('T')[0]
        ),
        lte(ordersHeader.documentDate, today.toISOString().split('T')[0]),
        eq(ordersHeader.isDeleted, false)
      )
    )
    .groupBy(vendors.vendorName)
    .orderBy(desc(sum(ordersDetails.amountInclusive)))
    .limit(5);

  return topVendorDetails;
};

export const getSpendingByProductCategory = async () => {
  const spendingByProductCategory = await db
    .select({
      productCategory: productCategories.categoryName,
      totalAmount: sum(ordersDetails.amountInclusive),
    })
    .from(ordersHeader)
    .leftJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .leftJoin(products, eq(ordersDetails.itemId, products.id))
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(
      and(
        gte(
          ordersHeader.documentDate,
          last30DaysStart.toISOString().split('T')[0]
        ),
        lte(ordersHeader.documentDate, today.toISOString().split('T')[0]),
        eq(ordersHeader.isDeleted, false)
      )
    )
    .groupBy(productCategories.categoryName);

  return spendingByProductCategory.filter(
    cat => cat.productCategory !== null && cat.productCategory !== undefined
  );
};

export const getPurchasesByDate = async () => {
  try {
    const last30Days = subDays(new Date(), 30);

    const purchasesByDate = await db
      .select({
        date: sql<string>`DATE(${ordersHeader.documentDate})`,
        itemTotal: sql<number>`SUM(CASE WHEN ${ordersDetails.itemId} IS NOT NULL THEN ${ordersDetails.amountInclusive} ELSE 0 END)`,
        serviceTotal: sql<number>`SUM(CASE WHEN ${ordersDetails.itemId} IS NULL THEN ${ordersDetails.amountInclusive} ELSE 0 END)`,
      })
      .from(ordersHeader)
      .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
      .where(
        and(
          gte(
            ordersHeader.documentDate,
            last30Days.toISOString().split('T')[0]
          ),
          lte(
            ordersHeader.documentDate,
            new Date().toISOString().split('T')[0]
          ),
          eq(ordersHeader.isDeleted, false)
        )
      )
      .groupBy(sql`DATE(${ordersHeader.documentDate})`)
      .orderBy(sql`DATE(${ordersHeader.documentDate}) ASC`);

    const result = purchasesByDate.map(row => ({
      date: row.date,
      item: Number(row.itemTotal) || 0,
      service: Number(row.serviceTotal) || 0,
    }));

    const completeResult = [];
    const startDate = last30Days;

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = dateFormat(currentDate);

      const existingData = result.find(item => item.date === dateString);

      completeResult.push({
        date: dateString,
        item: existingData?.item || 0,
        service: existingData?.service || 0,
      });
    }

    return completeResult;
  } catch (error) {
    console.error('Error fetching purchases by date:', error);
    return [];
  }
};
