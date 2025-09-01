'use cache';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { and, eq, ilike, max, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  getMaterialIssueNo,
  getMaterialIssuesGlobalTag,
  getMaterialIssuesIdTag,
} from '@/features/store/utils/cache';
import { materialIssuesHeader, stores } from '@/drizzle/schema';
import db from '@/drizzle/db';

export const getMaterialIssueNumber = async () => {
  cacheTag(getMaterialIssueNo());
  return db
    .select({ id: max(materialIssuesHeader.issueNo) })
    .from(materialIssuesHeader)
    .where(eq(materialIssuesHeader.isDeleted, false))
    .then(d => (d[0].id === null ? 1 : d[0].id + 1));
};

export const getMaterialIssues = async (q?: string) => {
  cacheTag(getMaterialIssuesGlobalTag());

  const filters: Array<SQL> = [];

  filters.push(eq(materialIssuesHeader.isDeleted, false));

  if (q) {
    const searchFilter = or(
      ilike(sql`CAST(${materialIssuesHeader.issueNo} AS TEXT)`, `%${q}%`),
      ilike(stores.storeName, `%${q}%`),
      ilike(materialIssuesHeader.jobcardNo, `%${q}%`),
      ilike(materialIssuesHeader.staffName, `%${q}%`)
    );
    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  return db
    .select({
      id: materialIssuesHeader.id,
      issueNo: materialIssuesHeader.issueNo,
      issueDate: materialIssuesHeader.issueDate,
      staffName: materialIssuesHeader.staffName,
      jobcardNo: materialIssuesHeader.jobcardNo,
      store: stores.storeName,
    })
    .from(materialIssuesHeader)
    .innerJoin(stores, eq(materialIssuesHeader.storeId, stores.id))
    .where(and(...filters))
    .limit(100);
};

export const getMaterialIssue = async (id: string) => {
  cacheTag(getMaterialIssuesIdTag(id));

  const [issue, items] = await Promise.all([
    db.query.materialIssuesHeader.findFirst({
      columns: { createdOn: false, issuedBy: false, isDeleted: false },
      where: (model, { eq, and }) =>
        and(eq(model.isDeleted, false), eq(model.id, id)),
    }),
    db.query.stockMovements.findMany({
      columns: {
        createdBy: false,
        createdOn: false,
        isDeleted: false,
        transactionType: false,
        transactionId: false,
        transactionDate: false,
      },
      where: (model, { eq, and }) =>
        and(
          eq(model.transactionType, 'ISSUE'),
          eq(model.transactionId, id),
          eq(model.isDeleted, false)
        ),
    }),
  ]);

  if (!issue) return undefined;

  return {
    ...issue,
    items: items.map(({ id, itemId, qty, remarks }) => ({
      id,
      itemId,
      issuedQty: Number(qty),
      remarks: remarks?.toUpperCase() || undefined,
    })),
  };
};
