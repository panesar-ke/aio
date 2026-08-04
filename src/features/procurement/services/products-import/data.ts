'use cache';

import { and, desc, eq } from 'drizzle-orm';
import { cacheTag } from 'next/cache';

import db from '@/drizzle/db';
import {
  productImportBatches,
  productImportBatchRows,
  stores,
  users,
} from '@/drizzle/schema';
import {
  getProductImportBatchesGlobalTag,
  getProductImportBatchIdTag,
} from '@/features/procurement/utils/cache';

export const getRecentImportBatches = async (limit = 20) => {
  cacheTag(getProductImportBatchesGlobalTag());
  return db
    .select({
      id: productImportBatches.id,
      fileName: productImportBatches.fileName,
      storeName: stores.storeName,
      asOfDate: productImportBatches.asOfDate,
      status: productImportBatches.status,
      totalRows: productImportBatches.totalRows,
      successRows: productImportBatches.successRows,
      failedRows: productImportBatches.failedRows,
      uploadedByName: users.name,
      createdAt: productImportBatches.createdAt,
    })
    .from(productImportBatches)
    .innerJoin(stores, eq(productImportBatches.storeId, stores.id))
    .innerJoin(users, eq(productImportBatches.uploadedBy, users.id))
    .orderBy(desc(productImportBatches.createdAt))
    .limit(limit);
};

export const getImportBatch = async (batchId: string) => {
  cacheTag(getProductImportBatchIdTag(batchId));
  return db.query.productImportBatches.findFirst({
    where: (model, { eq: eqOp }) => eqOp(model.id, batchId),
  });
};

export const getImportBatchErrorRows = async (batchId: string) => {
  cacheTag(getProductImportBatchIdTag(batchId));
  return db
    .select()
    .from(productImportBatchRows)
    .where(
      and(
        eq(productImportBatchRows.batchId, batchId),
        eq(productImportBatchRows.status, 'error'),
      ),
    )
    .orderBy(productImportBatchRows.rowNumber);
};
