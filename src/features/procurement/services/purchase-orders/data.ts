'use cache';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import db from '@/drizzle/db';
import {
  ordersHeader,
  users,
  vendors,
  ordersDetails,
  mrqDetails,
  products,
  services,
} from '@/drizzle/schema';
import {
  getPendingRequestsGlobalTag,
  getPurchaseOrderIdTag,
  getPurchaseOrderNoGlobalTag,
  getPurchaseOrdersGlobalTag,
  getVendorsGlobalTag,
} from '@/features/procurement/utils/cache';
import { transformOptions } from '@/lib/helpers/formatters';
import { notFound } from 'next/navigation';

export const getPurchaseOrderNo = async () => {
  cacheTag(getPurchaseOrderNoGlobalTag());
  const lastOrder = await db
    .select({
      documentNo: ordersHeader.id,
    })
    .from(ordersHeader)
    .orderBy(desc(ordersHeader.id))
    .limit(1);

  if (!lastOrder.length) return 1;
  return lastOrder[0].documentNo + 1;
};

export const getPurchaseOrders = async (q?: string) => {
  cacheTag(getPurchaseOrdersGlobalTag());
  const orders = await db
    .select({
      id: ordersHeader.id,
      reference: ordersHeader.reference,
      orderDate: ordersHeader.documentDate,
      createdBy: users.name,
      vendor: vendors.vendorName,
      billNo: ordersHeader.billNo,
      totalAmount: sql<number>`SUM(${ordersDetails.amountInclusive})`,
      createdAt: ordersHeader.createdOn,
    })
    .from(ordersHeader)
    .where(
      and(
        eq(ordersHeader.isDeleted, false),
        q
          ? or(
              ilike(ordersHeader.billNo, `%${q}%`),
              sql`${ordersHeader.documentDate}::text ILIKE ${`%${q}%`}`,
              ilike(users.name, `%${q}%`),
              ilike(vendors.vendorName, `%${q}%`),
              sql`${ordersHeader.id}::text ILIKE ${`%${q}%`}`
            )
          : undefined
      )
    )
    .innerJoin(users, eq(ordersHeader.createdBy, users.id))
    .innerJoin(vendors, eq(ordersHeader.vendorId, vendors.id))
    .innerJoin(ordersDetails, eq(ordersHeader.id, ordersDetails.headerId))
    .groupBy(
      ordersHeader.id,
      ordersHeader.documentDate,
      users.name,
      vendors.vendorName,
      ordersHeader.billNo,
      ordersHeader.createdOn
    )
    .orderBy(desc(ordersHeader.createdOn))
    .limit(100);

  return orders;
};

export const getPurchaseOrder = async (orderId: string) => {
  cacheTag(getPurchaseOrderIdTag(orderId));
  const order = await db.query.ordersHeader.findFirst({
    where: (model, { eq: equal }) => equal(model.reference, orderId),
    columns: {
      vendorId: false,
      vehicleId: false,
      mrqId: false,
      isDeleted: false,
      createdBy: false,
    },
    with: {
      vendor: { columns: { active: false } },
      user: { columns: { name: true } },
      ordersDetails: {
        with: {
          product: {
            columns: { id: true, productName: true },
            with: { uom: { columns: { abbreviation: true } } },
          },
          service: { columns: { id: true, serviceName: true } },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return order;
};

export const getPendingRequests = async () => {
  cacheTag(getPendingRequestsGlobalTag());
  const requests = await db
    .select({
      id: mrqDetails.id,
      itemName: products.productName,
      serviceName: services.serviceName,
      requestId: mrqDetails.requestId,
      itemRate: products.buyingPrice,
      serviceRate: services.serviceFee,
      qty: mrqDetails.qty,
      projectId: mrqDetails.projectId,
      itemId: mrqDetails.itemId,
      serviceId: mrqDetails.serviceId,
    })
    .from(mrqDetails)
    .where(eq(mrqDetails.linked, false))
    .leftJoin(products, eq(mrqDetails.itemId, products.id))
    .leftJoin(services, eq(mrqDetails.serviceId, services.id));

  return requests.map(req => ({
    id: req.id,
    type: req.itemName ? 'item' : ('service' as 'item' | 'service'),
    itemName: req.itemName || req.serviceName,
    requestId: req.requestId.toString(),
    qty: req.qty,
    rate: req.itemName ? req.itemRate : req.serviceRate,
    projectId: req.projectId,
    itemId: req.itemId,
    serviceId: req.serviceId,
  }));
};

export const getActiveVendors = async () => {
  cacheTag(getVendorsGlobalTag());
  const activeVendors = await db
    .select({
      id: vendors.id,
      name: vendors.vendorName,
    })
    .from(vendors)
    .where(eq(vendors.active, true))
    .orderBy(asc(vendors.vendorName));

  return transformOptions(activeVendors);
};
