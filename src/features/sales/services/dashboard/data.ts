import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  lt,
  lte,
  sql,
} from 'drizzle-orm';
import { cacheTag } from 'next/cache';

import db from '@/drizzle/db';
import {
  saleAccounts,
  salesOrdersDetails,
  salesOrdersHeader,
  users,
} from '@/drizzle/schema';
import {
  getAccountsGlobalTag,
  getLeadsGlobalTag,
  getSalesOrdersGlobalTag,
} from '@/features/sales/utils/cache';
import { buildSalesOrderLabel } from '@/features/sales/utils/account-helpers';
import type { SalesDashboardFilters } from '@/features/sales/utils/search-params';
import { saleUser } from '@/features/sales/utils/sale-helpers';
import {
  getFinancialYearLabel,
  getFinancialYearMonths,
  getFinancialYearOptions,
  getFinancialYearStart,
  getMonthsElapsedInFinancialYear,
} from '@/lib/helpers/dates';
import { dateFormat, titleCase } from '@/lib/helpers/formatters';
import { toNumber } from '@/lib/helpers/numbers';

const ACCOUNT_TIERS = ['high', 'medium', 'low'] as const;
const SALES_DASHBOARD_FINANCIAL_YEAR_BACK = 4;
const SALES_DASHBOARD_FINANCIAL_YEAR_FORWARD = 0;

type AccountTier = (typeof ACCOUNT_TIERS)[number];

type DashboardDateRange = {
  from: Date;
  to: Date;
  comparisonFrom: Date;
  comparisonTo: Date;
  financialYearStart: number;
  financialYearLabel: string;
};

type DashboardTrend = {
  deltaPct: number | null;
  trend: 'up' | 'down' | 'stable';
};

function parseFinancialYearStart(financialYear: string) {
  const parsed = Number(financialYear);
  const validFinancialYears = new Set(
    getFinancialYearOptions(
      SALES_DASHBOARD_FINANCIAL_YEAR_BACK,
      SALES_DASHBOARD_FINANCIAL_YEAR_FORWARD,
    ).map(option => Number(option.value)),
  );

  if (!Number.isInteger(parsed) || !validFinancialYears.has(parsed)) {
    return getFinancialYearStart();
  }

  return parsed;
}

function getDashboardDateRange(
  financialYear: string,
  referenceDate: Date,
): DashboardDateRange {
  const financialYearStart = parseFinancialYearStart(financialYear);
  const currentFinancialYearStart = getFinancialYearStart(referenceDate);
  const isCurrentFinancialYear = financialYearStart === currentFinancialYearStart;

  const from = new Date(financialYearStart, 4, 1);
  const to = isCurrentFinancialYear
    ? referenceDate
    : new Date(financialYearStart + 1, 3, 30);

  const comparisonFrom = new Date(financialYearStart - 1, 4, 1);
  const comparisonTo = isCurrentFinancialYear
    ? new Date(
        referenceDate.getFullYear() - 1,
        referenceDate.getMonth(),
        referenceDate.getDate(),
      )
    : new Date(financialYearStart, 3, 30);

  return {
    from,
    to,
    comparisonFrom,
    comparisonTo,
    financialYearStart,
    financialYearLabel: getFinancialYearLabel(financialYearStart),
  };
}

function getTrend(current: number, previous: number): DashboardTrend {
  if (previous === 0) {
    return {
      deltaPct: null,
      trend: current === 0 ? 'stable' : 'up',
    };
  }

  const deltaPct = ((current - previous) / previous) * 100;

  return {
    deltaPct: Math.round(deltaPct * 100) / 100,
    trend: deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'stable',
  };
}

function getAccountTier(totalRevenue: number): AccountTier {
  if (totalRevenue >= 1000000) return 'high';
  if (totalRevenue >= 100000) return 'medium';
  return 'low';
}

function getLocalTimestampRange(from: Date, to: Date) {
  const start = `${dateFormat(from)} 00:00:00`;
  const nextDay = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
  const endExclusive = `${dateFormat(nextDay)} 00:00:00`;

  return { start, endExclusive };
}

async function getSalesDashboardInternal({
  isSalesAdmin,
  userId,
  financialYear,
  salesPerson,
  todayBucket,
}: SalesDashboardFilters & {
  isSalesAdmin: boolean;
  userId: string;
  todayBucket: string;
}) {
  'use cache';
  cacheTag(getSalesOrdersGlobalTag());
  cacheTag(getAccountsGlobalTag());
  cacheTag(getLeadsGlobalTag());

  const salesRepId = isSalesAdmin ? salesPerson.trim() : userId;
  const shouldScopeToRep = !isSalesAdmin || salesRepId.length > 0;
  const referenceDate = new Date(`${todayBucket}T00:00:00`);
  const {
    from,
    to,
    comparisonFrom,
    comparisonTo,
    financialYearStart,
    financialYearLabel,
  } = getDashboardDateRange(financialYear, referenceDate);
  const currentLeadRange = getLocalTimestampRange(from, to);
  const comparisonLeadRange = getLocalTimestampRange(
    comparisonFrom,
    comparisonTo,
  );

  const orderFilters = [
    gte(salesOrdersHeader.dateRaised, dateFormat(from)),
    lte(salesOrdersHeader.dateRaised, dateFormat(to)),
    shouldScopeToRep ? eq(salesOrdersHeader.salesRepId, salesRepId) : undefined,
  ];

  const comparisonOrderFilters = [
    gte(salesOrdersHeader.dateRaised, dateFormat(comparisonFrom)),
    lte(salesOrdersHeader.dateRaised, dateFormat(comparisonTo)),
    shouldScopeToRep ? eq(salesOrdersHeader.salesRepId, salesRepId) : undefined,
  ];

  const leadFilters = [
    eq(saleAccounts.state, 'lead'),
    gte(saleAccounts.createdAt, currentLeadRange.start),
    lt(saleAccounts.createdAt, currentLeadRange.endExclusive),
    shouldScopeToRep ? eq(saleAccounts.salesRepId, salesRepId) : undefined,
  ];

  const comparisonLeadFilters = [
    eq(saleAccounts.state, 'lead'),
    gte(saleAccounts.createdAt, comparisonLeadRange.start),
    lt(saleAccounts.createdAt, comparisonLeadRange.endExclusive),
    shouldScopeToRep ? eq(saleAccounts.salesRepId, salesRepId) : undefined,
  ];

  const [
    currentTotals,
    previousTotals,
    currentLeads,
    previousLeads,
    monthlySalesRows,
    previousMonthlySalesRows,
    accountRevenueRows,
    accountLifetimeRevenueRows,
    topCategoryRows,
    recentOrders,
    recentLeads,
  ] = await Promise.all([
    db
      .select({
        revenue:
          sql<number>`cast(coalesce(sum(${salesOrdersHeader.totalAmountInLocalCurrency}), 0) as numeric)`,
        orders: countDistinct(salesOrdersHeader.id),
        activeAccounts: countDistinct(salesOrdersHeader.accountId),
      })
      .from(salesOrdersHeader)
      .where(and(...orderFilters)),
    db
      .select({
        revenue:
          sql<number>`cast(coalesce(sum(${salesOrdersHeader.totalAmountInLocalCurrency}), 0) as numeric)`,
        orders: countDistinct(salesOrdersHeader.id),
        activeAccounts: countDistinct(salesOrdersHeader.accountId),
      })
      .from(salesOrdersHeader)
      .where(and(...comparisonOrderFilters)),
    db
      .select({
        total: count(),
      })
      .from(saleAccounts)
      .where(and(...leadFilters)),
    db
      .select({
        total: count(),
      })
      .from(saleAccounts)
      .where(and(...comparisonLeadFilters)),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${salesOrdersHeader.dateRaised}::date), 'YYYY-MM-01')`,
        revenue:
          sql<number>`cast(coalesce(sum(${salesOrdersHeader.totalAmountInLocalCurrency}), 0) as numeric)`,
      })
      .from(salesOrdersHeader)
      .where(and(...orderFilters))
      .groupBy(sql`date_trunc('month', ${salesOrdersHeader.dateRaised}::date)`)
      .orderBy(sql`date_trunc('month', ${salesOrdersHeader.dateRaised}::date)`),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${salesOrdersHeader.dateRaised}::date), 'YYYY-MM-01')`,
        revenue:
          sql<number>`cast(coalesce(sum(${salesOrdersHeader.totalAmountInLocalCurrency}), 0) as numeric)`,
      })
      .from(salesOrdersHeader)
      .where(and(...comparisonOrderFilters))
      .groupBy(sql`date_trunc('month', ${salesOrdersHeader.dateRaised}::date)`)
      .orderBy(sql`date_trunc('month', ${salesOrdersHeader.dateRaised}::date)`),
    db
      .select({
        accountId: salesOrdersHeader.accountId,
        revenue:
          sql<number>`cast(coalesce(sum(${salesOrdersHeader.totalAmountInLocalCurrency}), 0) as numeric)`,
      })
      .from(salesOrdersHeader)
      .where(and(...orderFilters))
      .groupBy(salesOrdersHeader.accountId),
    db
      .select({
        accountId: salesOrdersHeader.accountId,
        revenue:
          sql<number>`cast(coalesce(sum(${salesOrdersHeader.totalAmountInLocalCurrency}), 0) as numeric)`,
      })
      .from(salesOrdersHeader)
      .where(
        and(
          shouldScopeToRep
            ? eq(salesOrdersHeader.salesRepId, salesRepId)
            : undefined,
        ),
      )
      .groupBy(salesOrdersHeader.accountId),
    db
      .select({
        category: salesOrdersDetails.category,
        revenue:
          sql<number>`cast(coalesce(sum(${salesOrdersDetails.amount} * ${salesOrdersHeader.conversionRate}), 0) as numeric)`,
      })
      .from(salesOrdersDetails)
      .innerJoin(
        salesOrdersHeader,
        eq(salesOrdersDetails.headerId, salesOrdersHeader.id),
      )
      .where(and(...orderFilters))
      .groupBy(salesOrdersDetails.category)
      .orderBy(
        desc(
          sql`sum(${salesOrdersDetails.amount} * ${salesOrdersHeader.conversionRate})`,
        ),
      )
      .limit(5),
    db
      .select({
        id: salesOrdersHeader.id,
        date: salesOrdersHeader.dateRaised,
        saleOrderNo: salesOrdersHeader.saleOrderNo,
        company: saleAccounts.company,
        amount: salesOrdersHeader.totalAmountInLocalCurrency,
      })
      .from(salesOrdersHeader)
      .leftJoin(saleAccounts, eq(salesOrdersHeader.accountId, saleAccounts.id))
      .where(and(...orderFilters))
      .orderBy(desc(salesOrdersHeader.dateRaised), desc(salesOrdersHeader.id))
      .limit(5),
    db
      .select({
        id: saleAccounts.id,
        date: saleAccounts.createdAt,
        company: saleAccounts.company,
        contactName: saleAccounts.name,
        salesPerson: users.name,
      })
      .from(saleAccounts)
      .innerJoin(users, eq(saleAccounts.salesRepId, users.id))
      .where(and(...leadFilters))
      .orderBy(desc(saleAccounts.createdAt))
      .limit(5),
  ]);

  const monthCount =
    financialYearStart === getFinancialYearStart()
      ? getMonthsElapsedInFinancialYear()
      : 12;
  const currentTotalsRow = currentTotals[0] ?? {
    revenue: 0,
    orders: 0,
    activeAccounts: 0,
  };
  const previousTotalsRow = previousTotals[0] ?? {
    revenue: 0,
    orders: 0,
    activeAccounts: 0,
  };
  const currentLeadsTotal = Number(currentLeads[0]?.total ?? 0);
  const previousLeadsTotal = Number(previousLeads[0]?.total ?? 0);
  const months = getFinancialYearMonths(financialYearStart).slice(0, monthCount);
  const currentRevenueByMonth = new Map(
    monthlySalesRows.map(row => [row.month, toNumber(row.revenue)]),
  );
  const previousRevenueByMonth = new Map(
    previousMonthlySalesRows.map(row => [row.month, toNumber(row.revenue)]),
  );
  const lifetimeRevenueByAccountId = new Map(
    accountLifetimeRevenueRows
      .filter(row => row.accountId)
      .map(row => [row.accountId, toNumber(row.revenue)]),
  );

  const monthlySales = months.map(({ date, label }, index) => {
    const currentKey = dateFormat(date);
    const comparisonKey = dateFormat(
      new Date(financialYearStart - 1 + (index >= 8 ? 1 : 0), date.getMonth(), 1),
    );

    return {
      label,
      current: currentRevenueByMonth.get(currentKey) ?? 0,
      previous: previousRevenueByMonth.get(comparisonKey) ?? 0,
    };
  });

  const tierRevenue = ACCOUNT_TIERS.reduce<Record<AccountTier, number>>(
    (acc, tier) => {
      acc[tier] = 0;
      return acc;
    },
    {
      high: 0,
      medium: 0,
      low: 0,
    },
  );

  for (const row of accountRevenueRows) {
    const revenue = toNumber(row.revenue);
    const lifetimeRevenue = row.accountId
      ? lifetimeRevenueByAccountId.get(row.accountId) ?? revenue
      : revenue;
    tierRevenue[getAccountTier(lifetimeRevenue)] += revenue;
  }

  const recentActivity = [
    ...recentOrders.map(order => ({
      id: `order-${order.id}`,
      type: 'order' as const,
      date: order.date,
      title: `Sale order ${buildSalesOrderLabel(order.saleOrderNo, order.date)}`,
      description: order.company
        ? `${order.company.toUpperCase()} • KES ${toNumber(order.amount).toLocaleString('en-KE')}`
        : `KES ${toNumber(order.amount).toLocaleString('en-KE')}`,
    })),
    ...recentLeads.map(lead => ({
      id: `lead-${lead.id}`,
      type: 'lead' as const,
      date: lead.date,
      title: `New lead: ${lead.company.toUpperCase()}`,
      description: `${titleCase(lead.contactName.toLowerCase())} • ${titleCase(
        lead.salesPerson.toLowerCase(),
      )}`,
    })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 5);

  return {
    filters: {
      financialYear: financialYearStart.toString(),
      financialYearLabel,
      salesPerson: isSalesAdmin ? salesRepId : '',
    },
    kpis: {
      revenue: {
        value: toNumber(currentTotalsRow.revenue),
        previousValue: toNumber(previousTotalsRow.revenue),
        ...getTrend(
          toNumber(currentTotalsRow.revenue),
          toNumber(previousTotalsRow.revenue),
        ),
      },
      orders: {
        value: Number(currentTotalsRow.orders ?? 0),
        previousValue: Number(previousTotalsRow.orders ?? 0),
        ...getTrend(
          Number(currentTotalsRow.orders ?? 0),
          Number(previousTotalsRow.orders ?? 0),
        ),
      },
      newLeads: {
        value: currentLeadsTotal,
        previousValue: previousLeadsTotal,
        ...getTrend(currentLeadsTotal, previousLeadsTotal),
      },
      activeAccounts: {
        value: Number(currentTotalsRow.activeAccounts ?? 0),
        previousValue: Number(previousTotalsRow.activeAccounts ?? 0),
        ...getTrend(
          Number(currentTotalsRow.activeAccounts ?? 0),
          Number(previousTotalsRow.activeAccounts ?? 0),
        ),
      },
    },
    monthlySales,
    revenueByAccountTier: ACCOUNT_TIERS.map(tier => ({
      tier,
      label: titleCase(tier),
      revenue: tierRevenue[tier],
    })),
    topCategories: topCategoryRows.map(row => ({
      category:
        row.category && row.category.trim().length > 0
          ? titleCase(row.category.toLowerCase())
          : 'Uncategorised',
      revenue: toNumber(row.revenue),
    })),
    recentActivity,
  };
}

export async function getSalesDashboard(searchParams: SalesDashboardFilters) {
  const { isSalesAdmin, userId } = await saleUser();

  return getSalesDashboardInternal({
    isSalesAdmin,
    userId,
    todayBucket: dateFormat(new Date()),
    ...searchParams,
  });
}
