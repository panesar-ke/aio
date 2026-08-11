import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  or,
  type SQL,
} from 'drizzle-orm';
import { cacheTag } from 'next/cache';

import db from '@/drizzle/db';
import { saleAccounts, users } from '@/drizzle/schema';
import { getLeadIdTag, getLeadsGlobalTag } from '@/features/sales/utils/cache';
import { LeadStatus } from '@/features/sales/utils/search-params';
import { requireAnyPermission } from '@/lib/permissions/guards';
import { getCurrentUser } from '@/lib/session';

import { isSaleAdmin } from '../../utils/sale-helpers';

async function getLeadsInternal({
  userId,
  isAdmin,
  search,
  status,
}: {
  userId: string;
  isAdmin: boolean;
  search: string;
  status: LeadStatus;
}) {
  'use cache';
  cacheTag(getLeadsGlobalTag());

  const filters: Array<SQL> = [];
  if (status !== LeadStatus.all) {
    filters.push(eq(saleAccounts.status, status));
  }

  if (search) {
    const searchFilters = or(
      ilike(saleAccounts.name, `%${search}%`),
      ilike(saleAccounts.company, `%${search}%`),
      ilike(saleAccounts.description, `%${search}%`),
      ilike(saleAccounts.kraPin, `%${search}%`),
    );
    if (searchFilters) {
      filters.push(searchFilters);
    }
  }

  if (!isAdmin) {
    filters.push(eq(saleAccounts.salesRepId, userId));
  }

  return db
    .select({
      ...getTableColumns(saleAccounts),
      salesPerson: users.name,
    })
    .from(saleAccounts)
    .innerJoin(users, eq(saleAccounts.salesRepId, users.id))
    .where(and(...filters, eq(saleAccounts.state, 'lead')))
    .orderBy(desc(saleAccounts.createdAt));
}

export const getLeads = async ({
  search,
  status,
}: {
  search: string;
  status: LeadStatus;
}) => {
  requireAnyPermission(['sales:admin', 'sales:standard'], { mode: 'page' });
  const user = await getCurrentUser('action');
  const isAdmin = await isSaleAdmin();

  return getLeadsInternal({
    userId: user.id,
    isAdmin,
    search,
    status,
  });
};

async function getLeadInternal(
  leadId: string,
  isAdmin: boolean,
  userId: string,
) {
  'use cache';
  cacheTag(getLeadIdTag(leadId));
  const lead = await db.query.saleAccounts.findFirst({
    where: and(
      eq(saleAccounts.id, leadId),
      eq(saleAccounts.state, 'lead'),
      !isAdmin ? eq(saleAccounts.salesRepId, userId) : undefined,
    ),
  });

  return lead ?? null;
}

export const getLead = async (leadId: string) => {
  requireAnyPermission(['sales:admin', 'sales:standard'], { mode: 'page' });
  const user = await getCurrentUser('action');
  const isAdmin = await isSaleAdmin();
  return getLeadInternal(leadId, isAdmin, user.id);
};
