'use cache';

import { and, desc, eq, ilike, max, or, sql } from 'drizzle-orm';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import {
  getGrnsGlobalTag,
  getGrnsIdTag,
  getGrnsNoTag,
  getUnreceivedGrnsGlobal,
} from '@/features/store/utils/cache';
import {
  grnsDetails,
  grnsHeader,
  ordersHeader,
  vendors,
  stores,
} from '@/drizzle/schema';
import db from '@/drizzle/db';

export const getGrns = async (q?: string) => {
  cacheTag(getGrnsGlobalTag());
  return db
    .select({
      id: grnsHeader.id,
      grnDate: grnsHeader.receiptDate,
      invoiceNo: grnsHeader.invoiceNo,
      vendorName: vendors.vendorName,
      orderId: ordersHeader.id,
      store: stores.storeName,
    })
    .from(grnsHeader)
    .leftJoin(stores, eq(grnsHeader.storeId, stores.id))
    .leftJoin(vendors, eq(grnsHeader.vendorId, vendors.id))
    .leftJoin(grnsDetails, eq(grnsHeader.id, grnsDetails.headerId))
    .leftJoin(ordersHeader, eq(grnsHeader.orderId, ordersHeader.id))
    .where(
      and(
        eq(grnsHeader.isDeleted, false),
        q
          ? or(
              ilike(grnsHeader.invoiceNo, `%${q}%`),
              ilike(vendors.vendorName, `%${q}%`),
              ilike(stores.storeName, `%${q}%`),
              sql`${grnsHeader.id}::text LIKE ${`%${q}%`}`,
              sql`${ordersHeader.id}::text LIKE ${`%${q}%`}`
            )
          : undefined
      )
    )
    .orderBy(desc(grnsHeader.id));
};

export const getPendingReceiptOrders = async () => {
  cacheTag(getUnreceivedGrnsGlobal());
  return db.query.ordersHeader
    .findMany({
      columns: { id: true },
      with: {
        vendor: { columns: { vendorName: true } },
        ordersDetails: {
          columns: { id: true },
          where: (model, { and, eq, isNotNull }) =>
            and(eq(model.received, false), isNotNull(model.itemId)),
        },
      },
      where: (model, { and, eq }) =>
        and(eq(model.grnReceipt, false), eq(model.isDeleted, false)),
    })
    .then(dt =>
      dt
        .filter(d => d.ordersDetails.length > 0)
        .map(i => ({
          id: i.id,
          name: `${i.id}-${i.vendor?.vendorName.toUpperCase()}`,
        }))
    );
};

export const getGrn = (id: string) => {
  cacheTag(getGrnsIdTag(id));
  return db.query.grnsHeader.findFirst({
    with: {
      vendor: { columns: { vendorName: true } },
      store: { columns: { storeName: true } },
      grnsDetails: {
        columns: { headerId: false },
        with: { product: { columns: { productName: true } } },
      },
    },
    where: (grn, { eq }) => eq(grn.id, Number(id)),
  });
};

export const getGrnNumber = async () => {
  cacheTag(getGrnsNoTag());
  return db
    .select({ id: max(grnsHeader.id) })
    .from(grnsHeader)
    .where(eq(grnsHeader.isDeleted, false))
    .then(d => (d[0].id === null ? 1 : d[0].id + 1));
};
