'use cache';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import {
  getTransfersGlobalTag,
  getTransfersIdTag,
} from '@/features/store/utils/cache';
import db from '@/drizzle/db';

export const getTransfers = async () => {
  cacheTag(getTransfersGlobalTag());
  const transfers = await db.query.materialTransferHeader.findMany({
    columns: { id: true, transferDate: true },
    with: {
      fromStore: { columns: { storeName: true } },
      toStore: { columns: { storeName: true } },
    },

    limit: 100,
  });
  return transfers.map(t => ({
    id: t.id,
    transferDate: t.transferDate,
    fromStore: t.fromStore.storeName.toUpperCase(),
    toStore: t.toStore.storeName.toUpperCase(),
  }));
};

export const getTransfer = async (id: string) => {
  cacheTag(getTransfersIdTag(id));
  return db.query.materialTransferHeader.findFirst({
    where: (model, { eq }) => eq(model.id, id),
    with: { materials: { columns: { headerId: false } } },
  });
};
