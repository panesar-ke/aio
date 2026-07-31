'use cache';

import { desc } from 'drizzle-orm';
import { cacheTag } from 'next/cache';

import db from '@/drizzle/db';
import { productDeactivationBatches } from '@/drizzle/schema';
import {
  getProductDeactivationBatchesGlobalTag,
  getProductDeactivationBatchIdTag,
} from '@/features/store/utils/cache';

export const getDeactivationBatches = async () => {
  cacheTag(getProductDeactivationBatchesGlobalTag());

  return db
    .select({
      id: productDeactivationBatches.id,
      deactivationDate: productDeactivationBatches.deactivationDate,
      thresholdDays: productDeactivationBatches.thresholdDays,
      totalCount: productDeactivationBatches.totalCount,
    })
    .from(productDeactivationBatches)
    .orderBy(desc(productDeactivationBatches.deactivationDate));
};

export const getDeactivationBatch = async (batchId: string) => {
  cacheTag(getProductDeactivationBatchIdTag(batchId));

  return db.query.productDeactivationBatches.findFirst({
    where: (batch, { eq }) => eq(batch.id, batchId),
    with: {
      items: {
        with: {
          product: {
            columns: { productName: true },
            with: {
              productCategory: { columns: { categoryName: true } },
            },
          },
        },
      },
    },
  });
};
