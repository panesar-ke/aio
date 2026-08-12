import {
  and,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  max,
  or,
  sql,
  type SQL,
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
  getAccountIdTag,
  getAccountsGlobalTag,
} from '@/features/sales/utils/cache';
import { saleUser } from '@/features/sales/utils/sale-helpers';
import { AccountTier } from '@/features/sales/utils/search-params';

type SearchParams = {
  search: string;
  tier: AccountTier;
  lastPurchase: string | null;
};

async function getAccountsInternal({
  isAdmin,
  userId,
  searchParams,
}: {
  isAdmin: boolean;
  userId: string;
  searchParams: SearchParams;
}) {
  'use cache';
  cacheTag(getAccountsGlobalTag());

  const filters: Array<SQL> = [];

  filters.push(eq(saleAccounts.state, 'account'));
  if (searchParams.search) {
    const searchFilters = or(
      ilike(saleAccounts.name, `%${searchParams.search}%`),
      ilike(saleAccounts.company, `%${searchParams.search}%`),
      ilike(saleAccounts.phone, `%${searchParams.search}%`),
    );
    if (searchFilters) filters.push(searchFilters);
  }

  if (!isAdmin) {
    filters.push(eq(saleAccounts.salesRepId, userId));
  }

  const havingFilters: Array<SQL> = [];

  const maxDateSql = max(salesOrdersHeader.dateRaised);
  const totalValueSql = sql`coalesce(sum(${salesOrdersHeader.amountInclusive}), 0)`;

  if (searchParams.tier && searchParams.tier !== AccountTier.all) {
    if (searchParams.tier === AccountTier.high) {
      havingFilters.push(gte(totalValueSql, 1000000));
    } else if (
      searchParams.tier === AccountTier.medium ||
      (searchParams.tier as string) === 'mid'
    ) {
      havingFilters.push(
        and(gte(totalValueSql, 100000), lt(totalValueSql, 1000000))!,
      );
    } else if (searchParams.tier === AccountTier.low) {
      havingFilters.push(lt(totalValueSql, 100000));
    }
  }

  if (searchParams.lastPurchase && searchParams.lastPurchase !== 'all') {
    if (searchParams.lastPurchase === '30') {
      havingFilters.push(
        gte(maxDateSql, sql`CURRENT_DATE - INTERVAL '30 days'`),
      );
    } else if (searchParams.lastPurchase === '90') {
      havingFilters.push(
        gte(maxDateSql, sql`CURRENT_DATE - INTERVAL '90 days'`),
      );
    } else if (searchParams.lastPurchase === 'dormant') {
      havingFilters.push(
        or(
          isNull(maxDateSql),
          lt(maxDateSql, sql`CURRENT_DATE - INTERVAL '12 months'`),
        )!,
      );
    } else if (!isNaN(Number(searchParams.lastPurchase))) {
      const days = Number(searchParams.lastPurchase);
      havingFilters.push(
        gte(
          maxDateSql,
          sql`CURRENT_DATE - INTERVAL '${sql.raw(String(days))} days'`,
        ),
      );
    }
  }

  const query = db
    .select({
      id: saleAccounts.id,
      company: saleAccounts.company,
      name: saleAccounts.name,
      phone: saleAccounts.phone,
      salesPerson: users.name,
      lastPurchaseDate: maxDateSql,
      totalPurchaseValue: sql<number>`cast(coalesce(sum(${salesOrdersHeader.amountInclusive}), 0) as numeric)`,
    })
    .from(saleAccounts)
    .innerJoin(users, eq(saleAccounts.salesRepId, users.id))
    .leftJoin(
      salesOrdersHeader,
      eq(saleAccounts.id, salesOrdersHeader.accountId),
    )
    .where(and(...filters))
    .groupBy(saleAccounts.id, users.name)
    .orderBy(sql`lower(${saleAccounts.company})`);

  if (havingFilters.length > 0) {
    return query.having(and(...havingFilters));
  }

  return await query;
}

export async function getAccounts(params: SearchParams) {
  const { isSalesAdmin, userId } = await saleUser();

  return getAccountsInternal({
    isAdmin: isSalesAdmin,
    userId,
    searchParams: params,
  });
}

async function getAccountInternal({
  accountId,
  isSalesAdmin,
  userId,
}: {
  accountId: string;
  isSalesAdmin: boolean;
  userId: string;
}) {
  'use cache';
  cacheTag(getAccountIdTag(accountId));

  const account = await db.query.saleAccounts.findFirst({
    where: and(
      eq(saleAccounts.id, accountId),
      eq(saleAccounts.state, 'account'),
      !isSalesAdmin ? eq(saleAccounts.salesRepId, userId) : undefined,
    ),
  });

  return account ?? null;
}

export async function getAccount(accountId: string) {
  const { isSalesAdmin, userId } = await saleUser();

  return getAccountInternal({ accountId, isSalesAdmin, userId });
}

async function getAccountDetailsInternal({
  accountId,
  isSalesAdmin,
  userId,
}: {
  accountId: string;
  isSalesAdmin: boolean;
  userId: string;
}) {
  'use cache';
  cacheTag(getAccountIdTag(accountId));

  const accountDetails = await db.query.saleAccounts.findFirst({
    where: and(
      eq(saleAccounts.id, accountId),
      eq(saleAccounts.state, 'account'),
      !isSalesAdmin ? eq(saleAccounts.salesRepId, userId) : undefined,
    ),
    columns: {
      id: true,
      name: true,
      company: true,
      email: true,
      phone: true,
      kraPin: true,
      createdAt: true,
      status: true,
      state: true,
    },
    with: {
      user: {
        columns: {
          name: true,
        },
      },
    },
  });

  if (!accountDetails) {
    return null;
  }

  const orders = await db
    .select({
      id: salesOrdersHeader.id,
      saleOrderNo: salesOrdersHeader.saleOrderNo,
      dateRaised: salesOrdersHeader.dateRaised,
      amountInclusive: salesOrdersHeader.amountInclusive,
      itemCount: sql<string>`cast(coalesce(sum(${salesOrdersDetails.qty}), 0) as numeric)`,
    })
    .from(salesOrdersHeader)
    .leftJoin(
      salesOrdersDetails,
      eq(salesOrdersHeader.id, salesOrdersDetails.headerId),
    )
    .where(eq(salesOrdersHeader.accountId, accountId))
    .groupBy(salesOrdersHeader.id)
    .orderBy(
      desc(salesOrdersHeader.dateRaised),
      desc(salesOrdersHeader.saleOrderNo),
    );

  return {
    account: {
      ...accountDetails,
      salesPerson: accountDetails.user?.name ?? null,
    },
    orders,
  };
}

export async function getAccountDetails(accountId: string) {
  const { isSalesAdmin, userId } = await saleUser();

  return getAccountDetailsInternal({ accountId, isSalesAdmin, userId });
}
